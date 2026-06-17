"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Device } from "@/types/device";
import type { PerkStatus } from "@/lib/membershipTiers";

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
  membershipCovered: boolean;
  membershipDiscount: number;
}

interface MemberOption {
  id: string;
  name: string;
  gamerTag: string;
}

interface SessionPreview {
  isRacingSim: boolean;
  basePrice: number;
  totalPrice: number;
  membershipCovered: boolean;
  membershipDiscount: number;
  label: string;
  warning: string | null;
  raceFree?: boolean;
  dailyCapExceeded?: boolean;
  dailyHoursRemaining?: number | null;
}

interface PreviewResult {
  session: SessionPreview;
  perkStatus: PerkStatus | null;
}

// ── Perk status panel ──────────────────────────────────────────────────────────

function PerkRow({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="text-right">
        <span className={`text-xs font-bold ${highlight ? "text-green-400" : "text-white"}`}>{value}</span>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PerkStatusPanel({ perkStatus }: { perkStatus: PerkStatus }) {
  const g = perkStatus.gaming;
  const r = perkStatus.racing;
  const t = perkStatus.tournaments;
  const w = perkStatus.wifi;
  const p = perkStatus.perks;

  const gamingRemStr = g.hoursRemainingThisPeriod === null
    ? "Unlimited"
    : g.hoursRemainingThisPeriod === 0
    ? "0h (all used)"
    : `${g.hoursRemainingThisPeriod.toFixed(1)}h remaining`;

  const gamingPeriodStr = g.periodEnds
    ? `resets ${new Date(g.periodEnds).toLocaleDateString()}`
    : g.periodType === "weekly" ? "weekly period not started"
    : g.periodType === "monthly" ? "monthly period not started"
    : "";

  const dailyStr = g.dailyCap
    ? g.dailyRemaining === 0
      ? "0h left today (cap reached)"
      : `${g.dailyRemaining?.toFixed(1)}h left today`
    : null;

  const fridayStr = t.fridayFreeRemaining === "unlimited"
    ? "Always free"
    : t.fridayFreeRemaining === 0
    ? `Used — $${t.fridayPriceAfterFree.toFixed(2)} per extra`
    : `${t.fridayFreeRemaining} free remaining`;

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 space-y-0">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">
        {perkStatus.tier === "FoundingHero" ? "Founding Hero" : perkStatus.tier} — Perk Status
      </p>

      {/* Gaming */}
      <PerkRow
        label="Gaming hours"
        value={gamingRemStr}
        sub={[gamingPeriodStr, g.hoursUsedThisPeriod > 0 ? `${g.hoursUsedThisPeriod.toFixed(1)}h used` : ""].filter(Boolean).join(" · ")}
        highlight={g.hoursRemainingThisPeriod !== 0}
      />
      {g.dailyCap && (
        <PerkRow
          label="Daily cap"
          value={dailyStr ?? ""}
          highlight={g.dailyRemaining !== 0}
        />
      )}

      {/* Racing */}
      {r.freeRacesTotal > 0 && (
        <PerkRow
          label="Racing sim races"
          value={r.freeRacesRemaining > 0 ? `${r.freeRacesRemaining} free remaining` : "All used"}
          sub={r.freeRacesRemaining === 0 && r.discountPct > 0 ? `Next race: $${r.priceAfterFree.toFixed(2)} (${r.discountPct}% off)` : undefined}
          highlight={r.freeRacesRemaining > 0}
        />
      )}

      {/* Friday Mini-Tourney */}
      <PerkRow
        label="Friday Mini-Tourney"
        value={fridayStr}
        highlight={t.fridayFreeRemaining !== 0}
      />

      {/* Other tournaments */}
      {t.otherDiscountPct > 0 && (
        <PerkRow
          label="Other tournaments"
          value={`${t.otherDiscountPct}% off — always`}
          highlight
        />
      )}

      {/* Racing Sim League */}
      {t.racingLeagueFreeTotal > 0 && (
        <PerkRow
          label="Racing Sim League"
          value={t.racingLeagueFreeRemaining > 0 ? "1 free entry remaining" : "Free entry used — $5 for next"}
          highlight={t.racingLeagueFreeRemaining > 0}
        />
      )}

      {/* Wi-Fi */}
      <PerkRow
        label="Wi-Fi"
        value={
          w.unlimitedInSession ? "Unlimited in-session"
          : w.minutesRemaining === null ? "Not included"
          : w.minutesRemaining <= 0 ? "0 min left (used)"
          : `${w.minutesRemaining.toFixed(0)} min remaining`
        }
        highlight={w.unlimitedInSession || (w.minutesRemaining !== null && w.minutesRemaining > 0)}
      />

      {/* Physical perks — staff reference */}
      <PerkRow label="Snack discount" value={p.snackDiscountPct > 0 ? `${p.snackDiscountPct}% off at POS` : "None"} />
      {p.chessClubIncluded && <PerkRow label="Chess Club" value="Included" highlight />}
      <PerkRow label="XP bonus per visit" value={p.xpVisitBonus > 0 ? `+${p.xpVisitBonus} (${1 + p.xpVisitBonus} XP total)` : "None (base 1 XP)"} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const [devices,        setDevices]        = useState<Device[]>([]);
  const [sessions,       setSessions]       = useState<Session[]>([]);
  const [members,        setMembers]        = useState<MemberOption[]>([]);
  const [allGames,       setAllGames]       = useState<string[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [notifications,  setNotifications]  = useState<{ id: string; type: "warning" | "ended"; message: string }[]>([]);
  const [preview,        setPreview]        = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [form, setForm] = useState({ game: "", deviceId: "", hours: 1 });

  const [memberSearch,     setMemberSearch]     = useState("");
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [selectedMember,   setSelectedMember]   = useState<MemberOption | null>(null);
  const [guestName,        setGuestName]        = useState("");
  const [isGuest,          setIsGuest]          = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────────

  async function loadDevices() {
    const res = await fetch("/api/devices");
    setDevices(await res.json());
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
      setMembers((data as { id: string; name: string; gamerTag: string }[]).map((p) => ({
        id: p.id, name: p.name, gamerTag: p.gamerTag,
      })));
    } catch {}
  }

  async function loadGames() {
    try {
      const res   = await fetch("/api/games");
      const data  = await res.json() as { name: string }[];
      const names = data.map((g) => g.name);
      setAllGames(names);
      setForm((prev) => ({ ...prev, game: prev.game || names[0] || "" }));
    } catch {}
  }

  useEffect(() => {
    loadDevices(); loadSessions(); loadMembers(); loadGames();
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

  // ── Price preview ──────────────────────────────────────────────────────────────

  const fetchPreview = useCallback(async (gamerTag: string | null, deviceId: string, hours: number) => {
    if (!deviceId) { setPreview(null); return; }
    setPreviewLoading(true);
    try {
      const params = new URLSearchParams({ deviceId, hours: String(hours) });
      if (gamerTag) params.set("gamerTag", gamerTag);
      const res = await fetch(`/api/sessions/price-preview?${params}`);
      if (res.ok) setPreview(await res.json());
    } catch {}
    finally { setPreviewLoading(false); }
  }, []);

  useEffect(() => {
    const gamerTag = !isGuest && selectedMember ? selectedMember.gamerTag : null;
    if (form.deviceId) fetchPreview(gamerTag, form.deviceId, form.hours);
    else setPreview(null);
  }, [selectedMember, isGuest, form.deviceId, form.hours, fetchPreview]);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const availableDevices = useMemo(() => devices.filter((d) => d.status === "available"), [devices]);

  const memberResults = useMemo(() => {
    if (!memberSearch) return [];
    const q = memberSearch.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.gamerTag.toLowerCase().includes(q)).slice(0, 8);
  }, [members, memberSearch]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function getRemainingTime(endTime: string) {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function clearPlayerSelection() {
    setSelectedMember(null); setMemberSearch(""); setGuestName(""); setIsGuest(false); setPreview(null);
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function startSession(e: React.FormEvent) {
    e.preventDefault();
    const playerName     = isGuest ? guestName.trim() : (selectedMember?.name ?? guestName.trim());
    const playerGamerTag = isGuest ? "" : (selectedMember?.gamerTag ?? "");
    if (!playerName) return;
    setLoading(true);
    try {
      const res    = await fetch("/api/sessions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ playerName, playerGamerTag: playerGamerTag || undefined, game: form.game, deviceId: form.deviceId, hours: form.hours }),
      });
      const created = await res.json();
      if (created.error) { alert(created.error); return; }
      await loadSessions(); await loadDevices();
      setForm({ game: allGames[0] ?? "", deviceId: "", hours: 1 });
      clearPlayerSelection();
    } finally { setLoading(false); }
  }

  async function endSession(session: Session, automatic = false) {
    await fetch(`/api/sessions/${session.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ENDED" }),
    });
    await fetch(`/api/devices/${session.deviceId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "available", currentSessionId: null }),
    });
    setNotifications((prev) => [
      { id: crypto.randomUUID(), type: "ended",
        message: automatic ? `${session.playerName}'s session expired on ${session.deviceName}` : `${session.playerName}'s session ended` },
      ...prev,
    ]);
    await loadSessions(); await loadDevices();
  }

  // ── Price box ─────────────────────────────────────────────────────────────────

  function PriceBox() {
    if (!form.deviceId) return null;
    const s = preview?.session;
    const isExhausted = s && !s.membershipCovered && s.membershipDiscount === 0 && s.basePrice !== s.totalPrice;
    const isDailyCapHit = s?.dailyCapExceeded && s.dailyHoursRemaining === 0;
    const isWarning = s?.warning || isDailyCapHit;

    return (
      <div className={`md:col-span-2 rounded-2xl border px-5 py-4 transition ${
        previewLoading
          ? "border-white/10 bg-white/5"
          : isDailyCapHit
          ? "border-red-500/30 bg-red-500/10"
          : s?.membershipCovered
          ? "border-green-500/30 bg-green-500/10"
          : isWarning
          ? "border-yellow-500/30 bg-yellow-500/10"
          : "border-white/10 bg-white/5"
      }`}>
        {previewLoading ? (
          <p className="text-xs text-zinc-500">Calculating price…</p>
        ) : s ? (
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-black ${
                  isDailyCapHit ? "text-red-400"
                  : s.membershipCovered ? "text-green-400"
                  : "text-white"
                }`}>
                  {s.totalPrice === 0 ? "FREE" : `$${s.totalPrice.toFixed(2)}`}
                </span>
                {s.membershipDiscount > 0 && (
                  <span className="text-zinc-500 line-through text-sm">${s.basePrice.toFixed(2)}</span>
                )}
                <span className={`text-xs ${isDailyCapHit ? "text-red-300" : s.membershipCovered ? "text-green-300" : "text-zinc-400"}`}>
                  {s.label}
                </span>
              </div>
              {s.membershipDiscount > 0 && (
                <span className="text-xs text-green-400 font-semibold whitespace-nowrap">
                  saved ${s.membershipDiscount.toFixed(2)}
                </span>
              )}
            </div>
            {s.warning && (
              <p className="mt-2 text-xs text-yellow-400">{s.warning}</p>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <main className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white">Sessions</h1>
        <p className="text-zinc-400 mt-2">Manage live gaming sessions.</p>
      </div>

      {notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.slice(0, 5).map((n) => (
            <div key={n.id} className={`rounded-2xl p-4 border text-sm ${
              n.type === "warning" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>{n.message}</div>
          ))}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        {/* Start session form */}
        <form
          onSubmit={startSession}
          className="bg-zinc-950 border border-white/10 rounded-3xl p-6 grid gap-5 md:grid-cols-2 self-start"
        >
          {/* Player */}
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Player</p>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => { setIsGuest(false); clearPlayerSelection(); }}
                className={`rounded-2xl px-4 py-1.5 text-xs font-semibold transition ${!isGuest ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300" : "bg-white/5 border border-white/10 text-slate-400"}`}>
                Member
              </button>
              <button type="button" onClick={() => { setIsGuest(true); clearPlayerSelection(); }}
                className={`rounded-2xl px-4 py-1.5 text-xs font-semibold transition ${isGuest ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300" : "bg-white/5 border border-white/10 text-slate-400"}`}>
                Guest
              </button>
            </div>
            {isGuest ? (
              <input required placeholder="Guest name" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400" />
            ) : selectedMember ? (
              <div className="flex items-center justify-between rounded-2xl border border-cyan-400/50 bg-black/40 px-4 py-3">
                <span className="text-white">{selectedMember.name} <span className="text-slate-400 text-sm">@{selectedMember.gamerTag}</span></span>
                <button type="button" onClick={clearPlayerSelection} className="text-slate-500 hover:text-red-400 transition ml-3 text-lg leading-none">×</button>
              </div>
            ) : (
              <div className="relative">
                <input placeholder="Search by name or @gamerTag…" value={memberSearch}
                  onChange={(e) => { setMemberSearch(e.target.value); setMemberSearchOpen(true); }}
                  onFocus={() => setMemberSearchOpen(true)}
                  onBlur={() => setTimeout(() => setMemberSearchOpen(false), 150)}
                  className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400" />
                {memberSearchOpen && memberSearch.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
                    {memberResults.length > 0 ? memberResults.map((m) => (
                      <button key={m.id} type="button" onMouseDown={() => { setSelectedMember(m); setMemberSearch(""); setMemberSearchOpen(false); }}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition border-b border-white/5 last:border-0">
                        <span className="text-white font-semibold">{m.name}</span>
                        <span className="text-slate-400 text-sm ml-2">@{m.gamerTag}</span>
                      </button>
                    )) : <p className="px-4 py-3 text-sm text-slate-500">No member found — switch to Guest mode above.</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Game */}
          <select value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })}
            className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-cyan-400">
            {allGames.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          {/* Device */}
          <select required value={form.deviceId}
            onChange={(e) => setForm((prev) => ({ ...prev, deviceId: e.target.value, game: allGames[0] ?? "" }))}
            className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-cyan-400">
            <option value="">Select Device</option>
            {availableDevices.map((d) => <option key={d.id} value={d.id}>{d.name} • ${d.hourlyRate}/hr</option>)}
          </select>

          {/* Hours */}
          <input type="number" min={0.5} step={0.5} value={form.hours}
            onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
            placeholder="Hours" className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-cyan-400" />

          {/* Price box */}
          <PriceBox />

          <button type="submit" disabled={loading || (!selectedMember && !guestName.trim() && !isGuest)}
            className="md:col-span-2 bg-cyan-400 hover:bg-cyan-300 transition text-black font-black py-4 rounded-2xl disabled:opacity-50">
            {loading ? "Starting…" : "Start Session"}
          </button>
        </form>

        {/* Perk status panel */}
        {preview?.perkStatus && (
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 self-start">
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Member Perks</p>
            <p className="text-white font-bold text-lg">{selectedMember?.name}</p>
            <PerkStatusPanel perkStatus={preview.perkStatus} />
          </div>
        )}
      </div>

      {/* Sessions list */}
      <div className="space-y-5">
        {sessions.map((session) => (
          <div key={session.id} className="bg-zinc-950 border border-white/10 rounded-3xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{session.playerName}</h2>
                {session.playerGamerTag && <p className="text-cyan-400 text-sm mt-0.5">@{session.playerGamerTag}</p>}
                <p className="text-zinc-400 mt-1">{session.game}</p>
              </div>
              <div className="flex items-center gap-2">
                {session.membershipCovered && (
                  <span className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-0.5 text-xs font-semibold text-green-400">Membership</span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  session.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-300"
                }`}>{session.status}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 text-zinc-300 text-sm">
              <p>Device: {session.deviceName}</p>
              <p>
                Total:{" "}
                {session.membershipCovered && session.totalPrice === 0
                  ? <span className="text-green-400 font-bold">FREE</span>
                  : <>
                      <span className="font-bold">${Number(session.totalPrice || 0).toFixed(2)}</span>
                      {session.membershipDiscount > 0 && (
                        <span className="ml-2 text-green-400 text-xs">(saved ${session.membershipDiscount.toFixed(2)})</span>
                      )}
                    </>
                }
              </p>
              <p>Start: {new Date(session.startTime).toLocaleString()}</p>
              <p>End: {new Date(session.endTime).toLocaleString()}</p>
              {session.status === "ACTIVE" && (
                <p className="md:col-span-2 text-cyan-400 font-bold">Remaining: {getRemainingTime(session.endTime)}</p>
              )}
            </div>

            {session.status === "ACTIVE" && (
              <button onClick={() => endSession(session)}
                className="mt-6 bg-red-500 hover:bg-red-400 transition text-black px-5 py-3 rounded-2xl font-bold">
                End Session
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
