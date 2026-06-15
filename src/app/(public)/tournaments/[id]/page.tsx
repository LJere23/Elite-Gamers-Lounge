"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Tournament, TournamentEntry, TournamentMatch } from "@/types/admin";
import PlayerAvatar from "@/components/ui/PlayerAvatar";

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

const FORMAT_LABEL: Record<string, string> = {
  knockout:           "Knockout",
  points_league:      "League",
  fastest_lap:        "Time Trial",
  swiss:              "Swiss",
  double_elimination: "Double Elimination",
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: "text-blue-400",
  ongoing:   "text-green-400",
  completed: "text-yellow-400",
  cancelled: "text-red-400",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params?.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [entries,    setEntries]    = useState<TournamentEntry[]>([]);
  const [matches,    setMatches]    = useState<TournamentMatch[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!tournamentId) return;
    Promise.all([
      fetch(`/api/tournaments/${tournamentId}`),
      fetch(`/api/tournaments/${tournamentId}/entries`),
      fetch(`/api/tournaments/${tournamentId}/matches`),
    ]).then(async ([tRes, eRes, mRes]) => {
      if (tRes.ok) setTournament(await tRes.json());
      if (eRes.ok) setEntries(await eRes.json());
      if (mRes.ok) setMatches(await mRes.json());
    }).finally(() => setLoading(false));
  }, [tournamentId]);

  // ── Derived data ────────────────────────────────────────────────────────

  const avatarMap = useMemo<Record<string, string | null>>(() => {
    const m: Record<string, string | null> = {};
    entries.forEach((e) => { m[e.playerId] = e.playerAvatarUrl ?? null; });
    return m;
  }, [entries]);

  const fmt = tournament?.format ?? "";
  const isCompleted = tournament?.status === "completed";

  const matchesByRound = useMemo(() => {
    const grouped: Record<number, TournamentMatch[]> = {};
    matches.forEach((m) => {
      if (!grouped[m.round]) grouped[m.round] = [];
      grouped[m.round].push(m);
    });
    return grouped;
  }, [matches]);
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  const leagueStandings = useMemo(
    () => [...entries].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    }),
    [entries]
  );

  const goalStats = useMemo(() => {
    const stats: Record<string, { gf: number; ga: number; draws: number }> = {};
    entries.forEach((e) => { stats[e.playerId] = { gf: 0, ga: 0, draws: 0 }; });
    matches
      .filter((m) => m.status === "completed" && typeof m.scoreA === "number" && typeof m.scoreB === "number")
      .forEach((m) => {
        const sA = m.scoreA as number;
        const sB = m.scoreB as number;
        if (stats[m.playerAId]) {
          stats[m.playerAId].gf += sA;
          stats[m.playerAId].ga += sB;
          if (sA === sB) stats[m.playerAId].draws++;
        }
        if (stats[m.playerBId]) {
          stats[m.playerBId].gf += sB;
          stats[m.playerBId].ga += sA;
          if (sA === sB) stats[m.playerBId].draws++;
        }
      });
    return stats;
  }, [entries, matches]);

  const lapBoard = useMemo(
    () =>
      [...entries]
        .filter((e) => typeof e.bestLapTime === "number" && (e.bestLapTime ?? 0) > 0)
        .sort((a, b) => (a.bestLapTime ?? 0) - (b.bestLapTime ?? 0)),
    [entries]
  );
  const leaderTime = lapBoard[0]?.bestLapTime;

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen pt-32 px-6">
        <div className="max-w-4xl mx-auto text-slate-400">Loading tournament...</div>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="min-h-screen pt-32 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/tournaments" className="text-amber-400 hover:underline">← Back to tournaments</Link>
          <p className="mt-8 text-slate-400">Tournament not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0D1E] pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* BACK LINK */}
        <Link href="/tournaments" className="inline-block text-amber-400 hover:underline text-sm">
          ← Back to tournaments
        </Link>

        {/* HEADER */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs uppercase tracking-[0.24em] font-bold ${STATUS_COLOR[tournament.status] ?? "text-slate-400"}`}>
              {tournament.status}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{FORMAT_LABEL[fmt] ?? fmt}</span>
          </div>
          <h1 className="text-5xl font-black uppercase text-white leading-tight">{tournament.name}</h1>
          <p className="text-slate-400">{tournament.game} · {tournament.category}</p>
        </div>

        {/* WINNER BANNER */}
        {isCompleted && tournament.winnerName && (
          <div className="rounded-[2rem] border border-amber-500/40 bg-amber-500/10 p-8 text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-400 font-bold">Champion</p>
            <div className="flex justify-center">
              <PlayerAvatar
                name={tournament.winnerName}
                avatarUrl={tournament.winnerId ? avatarMap[tournament.winnerId] : null}
                size="lg"
                className="ring-4 ring-amber-400/60"
              />
            </div>
            <h2 className="text-5xl font-black text-white">🏆 {tournament.winnerName}</h2>
            {tournament.runnerUpName && (
              <div className="flex items-center justify-center gap-3">
                <PlayerAvatar
                  name={tournament.runnerUpName}
                  avatarUrl={tournament.runnerUpId ? avatarMap[tournament.runnerUpId] : null}
                  size="sm"
                />
                <p className="text-slate-300 text-lg">
                  Runner-up: <span className="font-bold text-white">{tournament.runnerUpName}</span>
                </p>
              </div>
            )}
            <p className="text-amber-300 font-semibold text-xl">${tournament.prizeUsd} Prize</p>
          </div>
        )}

        {/* INFO GRID */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Start",       value: new Date(tournament.startAt).toLocaleDateString() },
            { label: "End",         value: new Date(tournament.endAt).toLocaleDateString() },
            { label: "Prize Pool",  value: `$${tournament.prizeUsd}` },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {tournament.prizeDescription && (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5">
            <p className="text-sm text-slate-400">{tournament.prizeDescription}</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FASTEST LAP: F1-style classification board             */}
        {/* ═══════════════════════════════════════════════════════ */}
        {fmt === "fastest_lap" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-400">Classification</p>
            <h2 className="mt-2 text-2xl font-black text-white">Race Results</h2>
            <div className="mt-5 space-y-2">
              {lapBoard.length === 0 && (
                <p className="text-sm text-slate-500">No times recorded yet. Check back after the race.</p>
              )}
              {lapBoard.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 ${
                    i === 0
                      ? "bg-amber-500/10 border border-amber-500/30"
                      : i === 1
                      ? "bg-slate-300/5 border border-slate-300/10"
                      : i === 2
                      ? "bg-orange-500/5 border border-orange-500/10"
                      : "bg-black/20"
                  }`}
                >
                  <span className={`w-10 text-center font-black text-lg ${
                    i === 0 ? "text-amber-400" : i === 1 ? "text-slate-200" : i === 2 ? "text-orange-400" : "text-slate-600"
                  }`}>
                    P{i + 1}
                  </span>
                  <PlayerAvatar name={entry.playerName} avatarUrl={entry.playerAvatarUrl} size="sm" />
                  <span className="flex-1 font-bold text-white">{entry.playerName}</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {formatLapTime(entry.bestLapTime!)}
                  </span>
                  <span className="font-mono text-slate-400 text-sm w-24 text-right">
                    {leaderTime !== undefined ? formatGap(leaderTime, entry.bestLapTime!) : ""}
                  </span>
                </div>
              ))}
              {entries.filter((e) => !e.bestLapTime).map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 rounded-2xl bg-black/20 px-5 py-4 opacity-40">
                  <span className="w-10 text-center text-slate-600 font-bold">—</span>
                  <span className="flex-1 font-bold text-slate-400">{entry.playerName}</span>
                  <span className="text-slate-600 text-sm">No time</span>
                  <span className="w-24 text-right text-slate-600 text-sm">DNF</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* POINTS LEAGUE: Table + fixtures                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {fmt === "points_league" && (
          <div className="space-y-6">
            {/* League Table */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-400">Standings</p>
              <h2 className="mt-2 text-2xl font-black text-white">League Table</h2>
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
                      <th className="pb-3 text-center w-12 text-amber-400 font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagueStandings.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500 text-sm">
                          Standings will appear once matches are played.
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
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <PlayerAvatar name={entry.playerName} avatarUrl={entry.playerAvatarUrl} size="xs" />
                              <span className="font-semibold text-white">{entry.playerName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center text-slate-300">{played}</td>
                          <td className="py-3 text-center text-green-400 font-semibold">{entry.wins}</td>
                          <td className="py-3 text-center text-slate-400">{gs.draws}</td>
                          <td className="py-3 text-center text-red-400">{entry.losses}</td>
                          <td className="py-3 text-center text-slate-300">{gs.gf}</td>
                          <td className="py-3 text-center text-slate-300">{gs.ga}</td>
                          <td className={`py-3 text-center font-semibold ${gd > 0 ? "text-green-400" : gd < 0 ? "text-red-400" : "text-slate-400"}`}>
                            {gd > 0 ? "+" : ""}{gd}
                          </td>
                          <td className="py-3 text-center font-black text-amber-400 text-base">{entry.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fixture Results */}
            {matches.length > 0 && (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-amber-400">Results</p>
                <h2 className="mt-2 text-2xl font-black text-white">All Fixtures</h2>
                <div className="mt-5 space-y-3">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className={`flex items-center gap-3 rounded-2xl px-5 py-4 ${
                        match.status === "completed" ? "bg-black/30 border border-white/5" : "bg-black/10 border border-white/5 opacity-60"
                      }`}
                    >
                      <div className={`flex-1 flex items-center justify-end gap-2 text-sm font-semibold ${
                        match.status === "completed" && match.winnerId === match.playerAId ? "text-white" :
                        match.status === "completed" && match.scoreA === match.scoreB ? "text-slate-300" :
                        match.status === "completed" ? "text-slate-500" : "text-white"
                      }`}>
                        {match.playerAName}
                        <PlayerAvatar name={match.playerAName} avatarUrl={avatarMap[match.playerAId]} size="xs" />
                      </div>
                      <span className="text-xl font-black text-white tabular-nums min-w-[64px] text-center">
                        {match.status === "completed"
                          ? `${match.scoreA} — ${match.scoreB}`
                          : "vs"
                        }
                      </span>
                      <div className={`flex-1 flex items-center gap-2 text-sm font-semibold ${
                        match.status === "completed" && match.winnerId === match.playerBId ? "text-white" :
                        match.status === "completed" && match.scoreA === match.scoreB ? "text-slate-300" :
                        match.status === "completed" ? "text-slate-500" : "text-white"
                      }`}>
                        <PlayerAvatar name={match.playerBName} avatarUrl={avatarMap[match.playerBId]} size="xs" />
                        {match.playerBName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* KNOCKOUT / SWISS / DOUBLE ELIM: bracket by round      */}
        {/* ═══════════════════════════════════════════════════════ */}
        {(fmt === "knockout" || fmt === "swiss" || fmt === "double_elimination") && (
          <div className="space-y-5">
            {matches.length === 0 ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-slate-400">Fixtures will be published once the tournament begins.</p>
              </div>
            ) : (
              rounds.map((round) => {
                const roundMatches = matchesByRound[round];
                const stageLabel = roundMatches.find((m) => !m.isBye)?.stage ?? `Round ${round}`;
                return (
                  <div key={round} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                    <p className="text-xs uppercase tracking-[0.24em] text-amber-400">Round {round}</p>
                    <h2 className="mt-2 text-2xl font-black text-white">{stageLabel}</h2>
                    <div className="mt-5 space-y-3">
                      {roundMatches.map((match) => {
                        if (match.isBye) {
                          const advancer = match.playerAName !== "BYE" ? match.playerAName : match.playerBName;
                          return (
                            <div key={match.id} className="flex items-center gap-4 rounded-2xl bg-black/20 px-5 py-4 opacity-50">
                              <span className="text-white font-semibold text-sm">{advancer}</span>
                              <span className="text-slate-500 text-xs">— BYE</span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={match.id}
                            className={`flex items-center gap-3 rounded-2xl px-5 py-4 ${
                              match.status === "completed"
                                ? "bg-black/30 border border-white/5"
                                : "bg-black/10 border border-white/5"
                            }`}
                          >
                            <div className={`flex-1 flex items-center justify-end gap-2 text-sm font-semibold ${
                              match.status === "completed" && match.winnerId === match.playerAId
                                ? "text-white"
                                : match.status === "completed"
                                ? "text-slate-500 line-through"
                                : "text-white"
                            }`}>
                              {match.playerAName}
                              <PlayerAvatar name={match.playerAName} avatarUrl={avatarMap[match.playerAId]} size="xs" />
                            </div>
                            <span className="text-xl font-black text-white tabular-nums min-w-[64px] text-center">
                              {match.status === "completed"
                                ? `${match.scoreA} — ${match.scoreB}`
                                : "vs"
                              }
                            </span>
                            <div className={`flex-1 flex items-center gap-2 text-sm font-semibold ${
                              match.status === "completed" && match.winnerId === match.playerBId
                                ? "text-white"
                                : match.status === "completed"
                                ? "text-slate-500 line-through"
                                : "text-white"
                            }`}>
                              <PlayerAvatar name={match.playerBName} avatarUrl={avatarMap[match.playerBId]} size="xs" />
                              {match.playerBName}
                            </div>
                            {match.status === "completed" && match.winnerName && (
                              <span className="text-xs text-green-400 font-bold shrink-0 hidden sm:block">
                                ✓ {match.winnerName} advances
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PARTICIPANTS LIST (always shown)                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-400">Roster</p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {entries.length} {entries.length === 1 ? "Participant" : "Participants"}
          </h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {entries.length === 0 && (
              <p className="text-sm text-slate-500 sm:col-span-2">No participants registered yet.</p>
            )}
            {entries.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3">
                <span className="text-xs font-bold text-slate-500 w-5">{i + 1}</span>
                <PlayerAvatar name={entry.playerName} avatarUrl={entry.playerAvatarUrl} size="sm" />
                <span className="font-semibold text-white text-sm">{entry.playerName}</span>
                {fmt === "points_league" && (
                  <span className="ml-auto text-sm text-amber-400 font-bold">{entry.points} pts</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
