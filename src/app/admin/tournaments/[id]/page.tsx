"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import PlayerAvatar from "@/components/ui/PlayerAvatar";
import { Player, Tournament, TournamentEntry, TournamentMatch } from "@/types/admin";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLapTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = (secs % 60).toFixed(3);
  return m > 0 ? `${m}:${s.padStart(6, "0")}` : `${s}s`;
}

function formatGap(leader: number, t: number): string {
  if (t === leader) return "LEADER";
  return `+${(t - leader).toFixed(3)}s`;
}

const STATUS_BADGE: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ongoing:   "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const FORMAT_LABEL: Record<string, string> = {
  knockout:           "Knockout",
  points_league:      "League",
  fastest_lap:        "Time Trial",
  swiss:              "Swiss",
  double_elimination: "Double Elimination",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminTournamentDetailPage() {
  const params = useParams();
  const tournamentId = params?.id as string;
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players,    setPlayers]    = useState<Player[]>([]);
  const [entries,    setEntries]    = useState<TournamentEntry[]>([]);
  const [matches,    setMatches]    = useState<TournamentMatch[]>([]);
  const [loading,  setLoading]  = useState(false);
  // Player search for entry registration
  const [entrySearch,     setEntrySearch]     = useState("");
  const [entrySearchOpen, setEntrySearchOpen] = useState(false);
  const [entryMember,     setEntryMember]     = useState<Player | null>(null);
  const [guestEntryName,  setGuestEntryName]  = useState("");
  const [entryIsGuest,    setEntryIsGuest]    = useState(false);
  const [message,  setMessage]  = useState<string | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { a: string; b: string }>>({});
  const [lapInputs,   setLapInputs]   = useState<Record<string, string>>({});

  const availablePlayers = useMemo(
    () => players.filter((p) => !entries.some((e) => e.playerId === p.id)),
    [players, entries]
  );

  const entrySearchResults = useMemo(() => {
    if (!entrySearch) return [];
    const q = entrySearch.toLowerCase();
    return availablePlayers
      .filter((p) => p.name.toLowerCase().includes(q) || p.gamerTag.toLowerCase().includes(q))
      .slice(0, 8);
  }, [availablePlayers, entrySearch]);

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (!tournamentId) return;
    const [tRes, pRes, eRes, mRes] = await Promise.all([
      fetch(`/api/tournaments/${tournamentId}`),
      fetch("/api/players"),
      fetch(`/api/tournaments/${tournamentId}/entries`),
      fetch(`/api/tournaments/${tournamentId}/matches`),
    ]);
    if (tRes.ok) setTournament(await tRes.json());
    if (pRes.ok) setPlayers(await pRes.json());
    if (eRes.ok) setEntries(await eRes.json());
    if (mRes.ok) setMatches(await mRes.json());
  }, [tournamentId]);

  useEffect(() => { loadAll(); }, [loadAll]);


  // ── Actions ──────────────────────────────────────────────────────────────

  const handleAddEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = entryIsGuest
      ? { guestName: guestEntryName.trim() }
      : entryMember
        ? { playerId: entryMember.id }
        : null;
    if (!payload) return;
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/tournaments/${tournamentId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to register player.");
    } else {
      setEntries((prev) => [...prev, data]);
      setEntryMember(null);
      setEntrySearch("");
      setGuestEntryName("");
      setEntryIsGuest(false);
    }
    setLoading(false);
  };

  const handleRemoveEntry = async (entryId: string) => {
    setLoading(true);
    await fetch(`/api/tournaments/${tournamentId}/entries/${entryId}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    setLoading(false);
  };

  const handleGenerateMatches = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to generate fixtures.");
    } else {
      await loadAll();
    }
    setLoading(false);
  };

  const handleSaveScore = async (match: TournamentMatch) => {
    const inp = scoreInputs[match.id] ?? { a: "", b: "" };
    if (inp.a === "" || inp.b === "") {
      setMessage("Enter both scores before saving.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/tournaments/${tournamentId}/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoreA: Number(inp.a), scoreB: Number(inp.b), status: "completed" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to save result.");
    } else {
      setScoreInputs((prev) => { const c = { ...prev }; delete c[match.id]; return c; });
      await loadAll();
    }
    setLoading(false);
  };

  const handleSaveLap = async (entry: TournamentEntry) => {
    const val = lapInputs[entry.id];
    const secs = parseFloat(val ?? "");
    if (!val || !Number.isFinite(secs) || secs <= 0) {
      setMessage("Enter a valid lap time in seconds (e.g. 83.456).");
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/tournaments/${tournamentId}/entries/${entry.id}/laptime`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bestLapTime: secs }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Unable to save lap time.");
    } else {
      setEntries((prev) => prev.map((e) => (e.id === data.id ? data : e)));
      setLapInputs((prev) => { const c = { ...prev }; delete c[entry.id]; return c; });
    }
    setLoading(false);
  };

  const handleCompleteRace = async () => {
    setLoading(true);
    const res = await fetch(`/api/tournaments/${tournamentId}/complete`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setTournament(data);
    } else {
      setMessage(data.error ?? "Unable to complete tournament.");
    }
    setLoading(false);
  };

  const handleStatusChange = async (status: string) => {
    setLoading(true);
    const res = await fetch(`/api/tournaments/${tournamentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setTournament(await res.json());
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this tournament? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/tournaments/${tournamentId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/tournaments");
    } else {
      const d = await res.json();
      setMessage(d.error ?? "Unable to delete tournament.");
      setLoading(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  if (!tournament) {
    return <div className="p-10 text-zinc-400">Loading tournament...</div>;
  }

  const fmt = tournament.format;
  const isCompleted = tournament.status === "completed";
  const hasMatches = matches.length > 0;

  const matchesByRound: Record<number, TournamentMatch[]> = {};
  matches.forEach((m) => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  const leagueStandings = [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });

  const goalStats: Record<string, { gf: number; ga: number; draws: number }> = {};
  entries.forEach((e) => { goalStats[e.playerId] = { gf: 0, ga: 0, draws: 0 }; });
  matches
    .filter((m) => m.status === "completed" && typeof m.scoreA === "number" && typeof m.scoreB === "number")
    .forEach((m) => {
      const sA = m.scoreA as number;
      const sB = m.scoreB as number;
      if (goalStats[m.playerAId]) {
        goalStats[m.playerAId].gf += sA;
        goalStats[m.playerAId].ga += sB;
        if (sA === sB) goalStats[m.playerAId].draws++;
      }
      if (goalStats[m.playerBId]) {
        goalStats[m.playerBId].gf += sB;
        goalStats[m.playerBId].ga += sA;
        if (sA === sB) goalStats[m.playerBId].draws++;
      }
    });

  const lapBoard = [...entries]
    .filter((e) => typeof e.bestLapTime === "number" && (e.bestLapTime ?? 0) > 0)
    .sort((a, b) => (a.bestLapTime ?? 0) - (b.bestLapTime ?? 0));
  const leaderTime = lapBoard[0]?.bestLapTime;

  const avatarMap: Record<string, string | null> = {};
  entries.forEach((e) => { avatarMap[e.playerId] = e.playerAvatarUrl ?? null; });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-8">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <AdminPageHeader
          title={tournament.name}
          description={`${tournament.game} • ${tournament.category} • ${FORMAT_LABEL[fmt] ?? fmt}`}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/admin/betting"
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-1.5 text-sm font-bold text-amber-400 transition">
            🔮 Oracle Pool
          </Link>
          <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-bold ${STATUS_BADGE[tournament.status] ?? "bg-white/5 text-white border-white/10"}`}>
            {tournament.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* WINNER BANNER */}
      {isCompleted && tournament.winnerName && (
        <div className="rounded-[2rem] border border-yellow-500/40 bg-yellow-500/10 p-8 text-center space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-400">Tournament Complete</p>
          <div className="flex justify-center">
            <PlayerAvatar
              name={tournament.winnerName}
              avatarUrl={tournament.winnerId ? avatarMap[tournament.winnerId] ?? null : null}
              size="lg"
              className="ring-4 ring-yellow-400/60"
            />
          </div>
          <h2 className="text-4xl font-black text-white">🏆 {tournament.winnerName}</h2>
          {tournament.runnerUpName && (
            <div className="flex items-center justify-center gap-2">
              <PlayerAvatar
                name={tournament.runnerUpName}
                avatarUrl={tournament.runnerUpId ? avatarMap[tournament.runnerUpId] ?? null : null}
                size="sm"
              />
              <p className="text-slate-300">Runner-up: <span className="font-semibold text-white">{tournament.runnerUpName}</span></p>
            </div>
          )}
          <p className="text-yellow-300 font-semibold">Prize: ${tournament.prizeUsd}</p>
        </div>
      )}

      {/* INFO ROW */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Start",   value: new Date(tournament.startAt).toLocaleDateString() },
          { label: "End",     value: new Date(tournament.endAt).toLocaleDateString() },
          { label: "Prize",   value: `$${tournament.prizeUsd}` },
          { label: "Players", value: `${entries.length} registered` },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl bg-zinc-950 border border-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-xl font-black text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* STATUS CONTROLS */}
      <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-400 mb-4">Status Controls</p>
        <div className="flex flex-wrap gap-3">
          {(["scheduled", "ongoing", "completed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={loading}
              className={`rounded-3xl px-5 py-2.5 text-sm font-semibold transition ${
                s === tournament.status
                  ? "bg-cyan-500 text-black"
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="ml-auto rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            Delete Tournament
          </button>
        </div>
        {message && <p className="mt-4 text-sm text-red-400">{message}</p>}
      </div>

      {/* MAIN CONTENT */}
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">

        {/* LEFT: PLAYER REGISTRATION */}
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 space-y-5 h-fit">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Players</p>
            <h2 className="mt-2 text-2xl font-black text-white">{entries.length} registered</h2>
          </div>

          {!isCompleted && (
            <form onSubmit={handleAddEntry} className="space-y-3">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEntryIsGuest(false); setGuestEntryName(""); }}
                  className={`flex-1 rounded-2xl py-2 text-xs font-semibold transition ${!entryIsGuest ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300" : "bg-white/5 border border-white/10 text-slate-400"}`}>
                  Member
                </button>
                <button type="button" onClick={() => { setEntryIsGuest(true); setEntryMember(null); setEntrySearch(""); }}
                  className={`flex-1 rounded-2xl py-2 text-xs font-semibold transition ${entryIsGuest ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300" : "bg-white/5 border border-white/10 text-slate-400"}`}>
                  Guest
                </button>
              </div>

              {entryIsGuest ? (
                <input
                  required
                  placeholder="Guest player name"
                  value={guestEntryName}
                  onChange={(e) => setGuestEntryName(e.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-400"
                />
              ) : entryMember ? (
                <div className="flex items-center justify-between rounded-3xl border border-cyan-400/50 bg-black/40 px-4 py-3">
                  <span className="text-white text-sm font-semibold">{entryMember.name}
                    <span className="text-slate-400 font-normal ml-2">@{entryMember.gamerTag}</span>
                  </span>
                  <button type="button" onClick={() => { setEntryMember(null); setEntrySearch(""); }}
                    className="text-slate-500 hover:text-red-400 transition ml-2 text-lg leading-none">×</button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    placeholder="Search by name or @gamerTag…"
                    value={entrySearch}
                    onChange={(e) => { setEntrySearch(e.target.value); setEntrySearchOpen(true); }}
                    onFocus={() => setEntrySearchOpen(true)}
                    onBlur={() => setTimeout(() => setEntrySearchOpen(false), 150)}
                    className="w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-cyan-400"
                  />
                  {entrySearchOpen && entrySearch.length > 0 && (
                    <div className="absolute z-20 mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
                      {entrySearchResults.length > 0 ? (
                        entrySearchResults.map((p) => (
                          <button key={p.id} type="button"
                            onMouseDown={() => { setEntryMember(p); setEntrySearch(""); setEntrySearchOpen(false); }}
                            className="w-full px-4 py-3 text-left hover:bg-white/5 transition border-b border-white/5 last:border-0">
                            <span className="text-white font-semibold text-sm">{p.name}</span>
                            <span className="text-slate-400 text-xs ml-2">@{p.gamerTag}</span>
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-3 text-xs text-slate-500">No available members found.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!entryIsGuest && !entryMember) || (entryIsGuest && !guestEntryName.trim())}
                className="w-full rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-bold uppercase text-black hover:bg-cyan-400 transition disabled:opacity-50"
              >
                Register {entryIsGuest ? "Guest" : "Player"}
              </button>
            </form>
          )}

          {!hasMatches && entries.length >= 2 && fmt !== "fastest_lap" && (
            <button
              onClick={handleGenerateMatches}
              disabled={loading}
              className="w-full rounded-3xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-bold uppercase text-white hover:bg-white/10 transition"
            >
              Generate Fixtures
            </button>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {entries.length === 0 && (
              <p className="text-sm text-slate-500">No players registered yet.</p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/40 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <PlayerAvatar name={entry.playerName} avatarUrl={entry.playerAvatarUrl} size="xs" />
                  <span className="text-sm font-semibold text-white truncate">{entry.playerName}</span>
                  {!entry.playerId && (
                    <span className="shrink-0 text-xs text-slate-500 border border-white/10 rounded-full px-2 py-0.5">Guest</span>
                  )}
                </div>
                {!isCompleted && !hasMatches && (
                  <button
                    onClick={() => handleRemoveEntry(entry.id)}
                    disabled={loading}
                    className="shrink-0 text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: RESULTS + STANDINGS */}
        <div className="space-y-6">

          {/* ═══ FASTEST LAP ═══ */}
          {fmt === "fastest_lap" && (
            <>
              <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Time Entry</p>
                <h2 className="mt-2 text-2xl font-black text-white">Driver Lap Times</h2>
                <p className="mt-1 text-sm text-slate-400">Enter time in seconds (e.g. 83.456 = 1:23.456). Lower is better.</p>
                <div className="mt-5 space-y-3">
                  {entries.length === 0 && <p className="text-sm text-slate-500">Register drivers to begin.</p>}
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 rounded-3xl border border-white/5 bg-black/40 p-4">
                      <span className="flex-1 font-semibold text-white text-sm truncate">{entry.playerName}</span>
                      {typeof entry.bestLapTime === "number" && entry.bestLapTime > 0 && (
                        <span className="font-mono text-cyan-400 text-sm font-bold shrink-0">
                          {formatLapTime(entry.bestLapTime)}
                        </span>
                      )}
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder={entry.bestLapTime ? String(entry.bestLapTime) : "Seconds"}
                        value={lapInputs[entry.id] ?? ""}
                        onChange={(e) => setLapInputs((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                        className="w-28 rounded-2xl border border-white/10 bg-black/60 px-3 py-2 text-white text-sm outline-none focus:border-cyan-400"
                      />
                      <button
                        onClick={() => handleSaveLap(entry)}
                        disabled={loading}
                        className="shrink-0 rounded-2xl bg-cyan-500 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-400 transition"
                      >
                        Save
                      </button>
                    </div>
                  ))}
                </div>
                {!isCompleted && lapBoard.length > 0 && lapBoard.length === entries.length && (
                  <button
                    onClick={handleCompleteRace}
                    disabled={loading}
                    className="mt-5 w-full rounded-3xl bg-yellow-500 px-5 py-3 text-sm font-bold uppercase text-black hover:bg-yellow-400 transition"
                  >
                    Crown Winner & Complete Race
                  </button>
                )}
              </div>

              {/* F1-style classification board */}
              <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Classification</p>
                <h2 className="mt-2 text-2xl font-black text-white">Race Order</h2>
                <div className="mt-5 space-y-2">
                  {lapBoard.length === 0 && (
                    <p className="text-sm text-slate-500">No times recorded yet.</p>
                  )}
                  {lapBoard.map((entry, i) => (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 rounded-2xl px-5 py-3 ${
                        i === 0
                          ? "bg-yellow-500/10 border border-yellow-500/30"
                          : i === 1
                          ? "bg-slate-400/5 border border-slate-400/10"
                          : i === 2
                          ? "bg-orange-500/5 border border-orange-500/10"
                          : "bg-black/30"
                      }`}
                    >
                      <span className={`w-8 text-center font-black ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-200" : i === 2 ? "text-orange-400" : "text-slate-500"}`}>
                        P{i + 1}
                      </span>
                      <span className="flex-1 font-semibold text-white text-sm">{entry.playerName}</span>
                      <span className="font-mono text-cyan-400 text-sm font-bold">
                        {formatLapTime(entry.bestLapTime!)}
                      </span>
                      <span className="font-mono text-slate-400 text-xs w-24 text-right">
                        {leaderTime !== undefined ? formatGap(leaderTime, entry.bestLapTime!) : ""}
                      </span>
                    </div>
                  ))}
                  {entries.filter((e) => !e.bestLapTime).map((entry) => (
                    <div key={entry.id} className="flex items-center gap-4 rounded-2xl bg-black/20 px-5 py-3 opacity-40">
                      <span className="w-8 text-center text-slate-500 font-bold">—</span>
                      <span className="flex-1 font-semibold text-white text-sm">{entry.playerName}</span>
                      <span className="text-slate-500 text-xs">No time set</span>
                      <span className="w-24 text-right text-slate-500 text-xs">DNF</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══ POINTS LEAGUE ═══ */}
          {fmt === "points_league" && (
            <>
              {/* Fixtures with score entry */}
              {hasMatches && (
                <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Match Results</p>
                  <h2 className="mt-2 text-2xl font-black text-white">All Fixtures</h2>
                  <div className="mt-5 space-y-3">
                    {matches.map((match) =>
                      match.status === "completed" ? (
                        <div key={match.id} className="flex items-center gap-3 rounded-3xl border border-white/5 bg-black/30 px-5 py-4">
                          <span className={`flex-1 text-right text-sm font-semibold ${match.winnerId === match.playerAId ? "text-white" : match.scoreA === match.scoreB ? "text-slate-300" : "text-slate-500"}`}>
                            {match.playerAName}
                          </span>
                          <span className="text-xl font-black text-white px-4 tabular-nums">
                            {match.scoreA} — {match.scoreB}
                          </span>
                          <span className={`flex-1 text-sm font-semibold ${match.winnerId === match.playerBId ? "text-white" : match.scoreA === match.scoreB ? "text-slate-300" : "text-slate-500"}`}>
                            {match.playerBName}
                          </span>
                          <span className="text-xs text-green-400 shrink-0 w-16 text-right">
                            {match.winnerId ? "Win" : "Draw"}
                          </span>
                        </div>
                      ) : (
                        <div key={match.id} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-black/40 px-5 py-4">
                          <span className="flex-1 text-right text-sm font-semibold text-white">{match.playerAName}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={scoreInputs[match.id]?.a ?? ""}
                              onChange={(e) => setScoreInputs((prev) => ({
                                ...prev,
                                [match.id]: { ...prev[match.id] ?? { a: "", b: "" }, a: e.target.value },
                              }))}
                              className="w-14 rounded-xl border border-white/10 bg-black/60 px-2 py-2 text-white text-center text-sm outline-none focus:border-cyan-400"
                            />
                            <span className="text-slate-400 text-xs">vs</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={scoreInputs[match.id]?.b ?? ""}
                              onChange={(e) => setScoreInputs((prev) => ({
                                ...prev,
                                [match.id]: { ...prev[match.id] ?? { a: "", b: "" }, b: e.target.value },
                              }))}
                              className="w-14 rounded-xl border border-white/10 bg-black/60 px-2 py-2 text-white text-center text-sm outline-none focus:border-cyan-400"
                            />
                          </div>
                          <span className="flex-1 text-sm font-semibold text-white">{match.playerBName}</span>
                          <button
                            onClick={() => handleSaveScore(match)}
                            disabled={loading}
                            className="shrink-0 rounded-2xl bg-cyan-500 px-4 py-2 text-xs font-bold uppercase text-black hover:bg-cyan-400 transition"
                          >
                            Save
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* League Table */}
              <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">League Table</p>
                <h2 className="mt-2 text-2xl font-black text-white">Standings</h2>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-white/5">
                        <th className="pb-3 text-left w-8">#</th>
                        <th className="pb-3 text-left">Player</th>
                        <th className="pb-3 text-center w-10">P</th>
                        <th className="pb-3 text-center w-10">W</th>
                        <th className="pb-3 text-center w-10">D</th>
                        <th className="pb-3 text-center w-10">L</th>
                        <th className="pb-3 text-center w-10">GF</th>
                        <th className="pb-3 text-center w-10">GA</th>
                        <th className="pb-3 text-center w-10">GD</th>
                        <th className="pb-3 text-center w-12 text-cyan-400 font-bold">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leagueStandings.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-500 text-sm">
                            No standings yet — save match results to populate the table.
                          </td>
                        </tr>
                      )}
                      {leagueStandings.map((entry, i) => {
                        const gs = goalStats[entry.playerId] ?? { gf: 0, ga: 0, draws: 0 };
                        const played = entry.wins + entry.losses + gs.draws;
                        const gd = gs.gf - gs.ga;
                        return (
                          <tr key={entry.id} className="border-b border-white/5">
                            <td className="py-3 pr-3 font-bold text-slate-500">{i + 1}</td>
                            <td className="py-3 font-semibold text-white">{entry.playerName}</td>
                            <td className="py-3 text-center text-slate-300">{played}</td>
                            <td className="py-3 text-center text-green-400 font-semibold">{entry.wins}</td>
                            <td className="py-3 text-center text-slate-400">{gs.draws}</td>
                            <td className="py-3 text-center text-red-400">{entry.losses}</td>
                            <td className="py-3 text-center text-slate-300">{gs.gf}</td>
                            <td className="py-3 text-center text-slate-300">{gs.ga}</td>
                            <td className={`py-3 text-center font-semibold ${gd > 0 ? "text-green-400" : gd < 0 ? "text-red-400" : "text-slate-400"}`}>
                              {gd > 0 ? "+" : ""}{gd}
                            </td>
                            <td className="py-3 text-center font-black text-cyan-400 text-base">{entry.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ═══ KNOCKOUT / SWISS / DOUBLE ELIMINATION ═══ */}
          {(fmt === "knockout" || fmt === "swiss" || fmt === "double_elimination") && (
            <div className="space-y-5">
              {!hasMatches && entries.length >= 2 && (
                <p className="text-sm text-slate-400">Click "Generate Fixtures" to create the bracket.</p>
              )}
              {!hasMatches && entries.length < 2 && (
                <p className="text-sm text-slate-400">Register at least 2 players to generate fixtures.</p>
              )}

              {rounds.map((round) => {
                const roundMatches = matchesByRound[round];
                const stageLabel = roundMatches.find((m) => !m.isBye)?.stage ?? `Round ${round}`;
                return (
                  <div key={round} className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Round {round}</p>
                    <h2 className="mt-2 text-2xl font-black text-white">{stageLabel}</h2>
                    <div className="mt-5 space-y-3">
                      {roundMatches.map((match) => {
                        if (match.isBye) {
                          const advancer = match.playerAName !== "BYE" ? match.playerAName : match.playerBName;
                          return (
                            <div key={match.id} className="flex items-center gap-3 rounded-3xl border border-white/5 bg-black/20 px-5 py-4 opacity-60">
                              <span className="flex-1 text-sm font-semibold text-white">{advancer}</span>
                              <span className="text-slate-400 text-xs">— BYE — advances automatically</span>
                            </div>
                          );
                        }

                        if (match.status === "completed") {
                          return (
                            <div key={match.id} className="flex items-center gap-3 rounded-3xl border border-white/5 bg-black/30 px-5 py-4">
                              <span className={`flex-1 text-right text-sm font-semibold ${match.winnerId === match.playerAId ? "text-white" : "text-slate-500 line-through"}`}>
                                {match.playerAName}
                              </span>
                              <span className="text-xl font-black text-white px-4 tabular-nums shrink-0">
                                {match.scoreA} — {match.scoreB}
                              </span>
                              <span className={`flex-1 text-sm font-semibold ${match.winnerId === match.playerBId ? "text-white" : "text-slate-500 line-through"}`}>
                                {match.playerBName}
                              </span>
                              {match.winnerName && (
                                <span className="text-xs text-green-400 font-bold shrink-0">✓ advances</span>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div key={match.id} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-black/40 px-5 py-4">
                            <span className="flex-1 text-right text-sm font-semibold text-white">{match.playerAName}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={scoreInputs[match.id]?.a ?? ""}
                                onChange={(e) => setScoreInputs((prev) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id] ?? { a: "", b: "" }, a: e.target.value },
                                }))}
                                className="w-14 rounded-xl border border-white/10 bg-black/60 px-2 py-2 text-white text-center text-sm outline-none focus:border-cyan-400"
                              />
                              <span className="text-slate-400 text-xs font-bold">VS</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={scoreInputs[match.id]?.b ?? ""}
                                onChange={(e) => setScoreInputs((prev) => ({
                                  ...prev,
                                  [match.id]: { ...prev[match.id] ?? { a: "", b: "" }, b: e.target.value },
                                }))}
                                className="w-14 rounded-xl border border-white/10 bg-black/60 px-2 py-2 text-white text-center text-sm outline-none focus:border-cyan-400"
                              />
                            </div>
                            <span className="flex-1 text-sm font-semibold text-white">{match.playerBName}</span>
                            <button
                              onClick={() => handleSaveScore(match)}
                              disabled={loading}
                              className="shrink-0 rounded-2xl bg-cyan-500 px-4 py-2 text-xs font-bold uppercase text-black hover:bg-cyan-400 transition"
                            >
                              Save
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
