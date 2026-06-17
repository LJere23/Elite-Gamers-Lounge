"use client";

import { useEffect, useMemo, useState } from "react";
import { Device } from "@/types/device";

interface Session {
  id: string;
  playerName: string;
  playerGamerTag?: string;
  game: string;
  deviceId: string;
  deviceName: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: "ACTIVE" | "ENDED";
}

interface MemberOption {
  id: string;
  name: string;
  gamerTag: string;
}

const DEFAULT_GAMES = ["FC25", "Tekken 8", "Mortal Kombat", "Gran Turismo", "Call Of Duty"];

export default function SessionsPage() {
  const [devices,       setDevices]       = useState<Device[]>([]);
  const [sessions,      setSessions]      = useState<Session[]>([]);
  const [members,       setMembers]       = useState<MemberOption[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; type: "warning" | "ended"; message: string }[]>([]);

  // Form state
  const [form, setForm] = useState({ game: DEFAULT_GAMES[0], deviceId: "", hours: 1 });

  // Member search state
  const [memberSearch,     setMemberSearch]     = useState("");
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [selectedMember,   setSelectedMember]   = useState<MemberOption | null>(null);
  const [guestName,        setGuestName]        = useState("");
  const [isGuest,          setIsGuest]          = useState(false);

  // ── Data loading ─────────────────────────────────────────────────────────

  async function loadDevices() {
    const res  = await fetch("/api/devices");
    const data = await res.json();
    setDevices(data);
  }

  async function loadSessions() {
    const res  = await fetch("/api/sessions");
    const data = await res.json();
    setSessions(
      [...data].sort((a: Session, b: Session) => {
        if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
        if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      })
    );
  }

  async function loadMembers() {
    try {
      const res  = await fetch("/api/players");
      const data = await res.json();
      setMembers(
        (data as { id: string; name: string; gamerTag: string }[]).map((p) => ({
          id: p.id,
          name: p.name,
          gamerTag: p.gamerTag,
        }))
      );
    } catch {}
  }

  useEffect(() => {
    loadDevices();
    loadSessions();
    loadMembers();
  }, []);

  // Auto-refresh + auto-end
  useEffect(() => {
    const interval = setInterval(async () => {
      const res  = await fetch("/api/sessions");
      const data = await res.json();
      for (const s of data as Session[]) {
        if (s.status === "ACTIVE") {
          const end       = new Date(s.endTime).getTime();
          const remaining = end - Date.now();
          if (remaining <= 10 * 60 * 1000 && remaining > 9 * 60 * 1000) {
            setNotifications((prev) => [
              { id: crypto.randomUUID(), type: "warning", message: `${s.playerName}'s session ends in under 10 minutes` },
              ...prev,
            ]);
          }
          if (Date.now() >= end) await endSession(s, true);
        }
      }
      await loadSessions();
      await loadDevices();
    }, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────

  const availableDevices = useMemo(
    () => devices.filter((d) => d.status === "available"),
    [devices]
  );

  // Games for the selected device (fall back to defaults)
  const selectedDevice = devices.find((d) => d.id === form.deviceId);
  const gameOptions    = (selectedDevice?.supportedGames?.length ?? 0) > 0
    ? selectedDevice!.supportedGames
    : DEFAULT_GAMES;

  // Filtered member search results
  const memberResults = useMemo(() => {
    if (!memberSearch) return [];
    const q = memberSearch.toLowerCase();
    return members
      .filter((m) => m.name.toLowerCase().includes(q) || m.gamerTag.toLowerCase().includes(q))
      .slice(0, 8);
  }, [members, memberSearch]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getRemainingTime(endTime: string) {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function clearPlayerSelection() {
    setSelectedMember(null);
    setMemberSearch("");
    setGuestName("");
    setIsGuest(false);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function startSession(e: React.FormEvent) {
    e.preventDefault();
    const playerName    = isGuest ? guestName.trim() : (selectedMember?.name ?? guestName.trim());
    const playerGamerTag = isGuest ? "" : (selectedMember?.gamerTag ?? "");
    if (!playerName) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          playerGamerTag: playerGamerTag || undefined,
          game:     form.game,
          deviceId: form.deviceId,
          hours:    form.hours,
        }),
      });
      const created = await res.json();
      if (created.error) { alert(created.error); return; }
      await loadSessions();
      await loadDevices();
      setForm({ game: DEFAULT_GAMES[0], deviceId: "", hours: 1 });
      clearPlayerSelection();
    } finally {
      setLoading(false);
    }
  }

  async function endSession(session: Session, automatic = false) {
    await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ENDED" }),
    });
    await fetch(`/api/devices/${session.deviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "available", currentSessionId: null }),
    });
    setNotifications((prev) => [
      {
        id:      crypto.randomUUID(),
        type:    "ended",
        message: automatic
          ? `${session.playerName}'s session expired on ${session.deviceName}`
          : `${session.playerName}'s session ended`,
      },
      ...prev,
    ]);
    await loadSessions();
    await loadDevices();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white">Sessions</h1>
        <p className="text-zinc-400 mt-2">Manage live gaming sessions.</p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.slice(0, 5).map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-4 border text-sm ${
                n.type === "warning"
                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              {n.message}
            </div>
          ))}
        </div>
      )}

      {/* Start session form */}
      <form
        onSubmit={startSession}
        className="bg-zinc-950 border border-white/10 rounded-3xl p-6 grid gap-5 md:grid-cols-2"
      >
        {/* Player — member search or guest name */}
        <div className="md:col-span-2">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Player</p>

          {/* Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => { setIsGuest(false); clearPlayerSelection(); }}
              className={`rounded-2xl px-4 py-1.5 text-xs font-semibold transition ${
                !isGuest ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300" : "bg-white/5 border border-white/10 text-slate-400"
              }`}
            >
              Member
            </button>
            <button
              type="button"
              onClick={() => { setIsGuest(true); clearPlayerSelection(); }}
              className={`rounded-2xl px-4 py-1.5 text-xs font-semibold transition ${
                isGuest ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300" : "bg-white/5 border border-white/10 text-slate-400"
              }`}
            >
              Guest
            </button>
          </div>

          {isGuest ? (
            <input
              required
              placeholder="Guest name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400"
            />
          ) : selectedMember ? (
            <div className="flex items-center justify-between rounded-2xl border border-cyan-400/50 bg-black/40 px-4 py-3">
              <span className="text-white">
                {selectedMember.name}{" "}
                <span className="text-slate-400 text-sm">@{selectedMember.gamerTag}</span>
              </span>
              <button
                type="button"
                onClick={clearPlayerSelection}
                className="text-slate-500 hover:text-red-400 transition ml-3 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                placeholder="Search by name or @gamerTag…"
                value={memberSearch}
                onChange={(e) => { setMemberSearch(e.target.value); setMemberSearchOpen(true); }}
                onFocus={() => setMemberSearchOpen(true)}
                onBlur={() => setTimeout(() => setMemberSearchOpen(false), 150)}
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400"
              />
              {memberSearchOpen && memberSearch.length > 0 && (
                <div className="absolute z-20 mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
                  {memberResults.length > 0 ? (
                    memberResults.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onMouseDown={() => {
                          setSelectedMember(m);
                          setMemberSearch("");
                          setMemberSearchOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition border-b border-white/5 last:border-0"
                      >
                        <span className="text-white font-semibold">{m.name}</span>
                        <span className="text-slate-400 text-sm ml-2">@{m.gamerTag}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-slate-500">
                      No member found — switch to Guest mode above.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game — dynamic from device's supported games */}
        <select
          value={form.game}
          onChange={(e) => setForm({ ...form, game: e.target.value })}
          className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-cyan-400"
        >
          {gameOptions.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        {/* Device */}
        <select
          required
          value={form.deviceId}
          onChange={(e) => {
            const newDeviceId = e.target.value;
            setForm((prev) => ({ ...prev, deviceId: newDeviceId, game: DEFAULT_GAMES[0] }));
          }}
          className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-cyan-400"
        >
          <option value="">Select Device</option>
          {availableDevices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} • ${d.hourlyRate}/hr
            </option>
          ))}
        </select>

        {/* Hours */}
        <input
          type="number"
          min={1}
          value={form.hours}
          onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
          placeholder="Hours"
          className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-cyan-400"
        />

        <button
          type="submit"
          disabled={loading || (!selectedMember && !guestName.trim() && !isGuest)}
          className="md:col-span-2 bg-cyan-400 hover:bg-cyan-300 transition text-black font-black py-4 rounded-2xl disabled:opacity-50"
        >
          {loading ? "Starting…" : "Start Session"}
        </button>
      </form>

      {/* Active + recent sessions */}
      <div className="space-y-5">
        {sessions.map((session) => (
          <div key={session.id} className="bg-zinc-950 border border-white/10 rounded-3xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{session.playerName}</h2>
                {session.playerGamerTag && (
                  <p className="text-cyan-400 text-sm mt-0.5">@{session.playerGamerTag}</p>
                )}
                <p className="text-zinc-400 mt-1">{session.game}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                session.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-300"
              }`}>
                {session.status}
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 text-zinc-300 text-sm">
              <p>Device: {session.deviceName}</p>
              <p>Total: ${Number(session.totalPrice || 0).toFixed(2)}</p>
              <p>Start: {new Date(session.startTime).toLocaleString()}</p>
              <p>End: {new Date(session.endTime).toLocaleString()}</p>
              {session.status === "ACTIVE" && (
                <p className="md:col-span-2 text-cyan-400 font-bold">
                  Remaining: {getRemainingTime(session.endTime)}
                </p>
              )}
            </div>

            {session.status === "ACTIVE" && (
              <button
                onClick={() => endSession(session)}
                className="mt-6 bg-red-500 hover:bg-red-400 transition text-black px-5 py-3 rounded-2xl font-bold"
              >
                End Session
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
