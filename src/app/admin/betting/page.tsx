"use client";

import { useEffect, useState, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Outcome {
  id: string;
  label: string;
  outcomeType: string;
  totalStakedCxp: number;
}

interface OddsRow {
  outcomeId: string;
  label: string;
  outcomeType: string;
  totalStakedCxp: number;
  payoutMultiplier: number | null;
  impliedProbabilityPct: number | null;
}

interface AccessEntry {
  id: string;
  playerId: string;
  player: { id: string; gamerTag: string; name: string; cxpBalance: number };
}

interface Pool {
  id: string;
  title: string;
  status: string;
  scopeType: string;
  enabled: boolean;
  houseCutPercent: number;
  totalPoolCxp: number;
  totalHouseCutCollected: number;
  closesAt: string;
  settledAt: string | null;
  createdAt: string;
  allowDraw: boolean;
  distinctStakers: number;
  tournament: { name: string };
  outcomes: Outcome[];
  odds: OddsRow[];
  access: AccessEntry[];
  stakes: { playerId: string; amountCxp: number; settled: boolean; outcome: { label: string }; player: { gamerTag: string } }[];
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  entries: number;
}

interface Match {
  id: string;
  playerAName: string;
  playerBName: string;
  status: string;
}

// ── Status badge ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  draft:     "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  open:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  closed:    "bg-amber-500/20 text-amber-300 border-amber-500/30",
  settled:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminBettingPage() {
  const [pools, setPools]                 = useState<Pool[]>([]);
  const [oracleEnabled, setOracleEnabled] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [selectedPool, setSelectedPool]   = useState<Pool | null>(null);
  const [detailPool, setDetailPool]       = useState<Pool | null>(null);

  // Create pool state
  const [showCreate, setShowCreate]   = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches]         = useState<Match[]>([]);
  const [createForm, setCreateForm]   = useState({
    tournamentId: "", scopeType: "full_tournament", matchId: "",
    title: "", closesAt: "", houseCutPercent: 20,
  });

  // Settle/refund modal
  const [settleModal, setSettleModal]   = useState<Pool | null>(null);
  const [winOutcomeId, setWinOutcomeId] = useState("");
  const [refundModal, setRefundModal]   = useState<Pool | null>(null);
  const [refundReason, setRefundReason] = useState("");

  // Access management
  const [accessModal, setAccessModal]     = useState<Pool | null>(null);
  const [accessPlayer, setAccessPlayer]   = useState("");
  const [accessError, setAccessError]     = useState("");

  // CXP adjustment
  const [cxpModal, setCxpModal]   = useState(false);
  const [cxpForm, setCxpForm]     = useState({ gamerTag: "", amount: 0, reason: "", sourceType: "admin_adjustment" });
  const [cxpMsg, setCxpMsg]       = useState("");

  const [msg, setMsg] = useState("");

  const loadPools = useCallback(async () => {
    const [poolsRes, settingsRes] = await Promise.all([
      fetch("/api/admin/betting/pools"),
      fetch("/api/admin/betting/settings"),
    ]);
    if (poolsRes.ok) setPools(await poolsRes.json());
    if (settingsRes.ok) {
      const s = await settingsRes.json();
      setOracleEnabled(s.oraclePoolEnabled ?? false);
    }
  }, []);

  useEffect(() => { loadPools(); }, [loadPools]);

  async function toggleOracle() {
    setLoading(true);
    await fetch("/api/admin/betting/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oraclePoolEnabled: !oracleEnabled }),
    });
    setOracleEnabled((v) => !v);
    setLoading(false);
  }

  async function loadTournaments() {
    const res = await fetch("/api/tournaments");
    if (res.ok) {
      const all = await res.json();
      setTournaments(all.filter((t: Tournament) => t.status !== "completed" && t.status !== "cancelled"));
    }
  }

  async function loadMatches(tournamentId: string) {
    if (!tournamentId) { setMatches([]); return; }
    const res = await fetch(`/api/tournaments/${tournamentId}/matches`);
    if (res.ok) setMatches(await res.json());
  }

  async function handleCreatePool(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg("");
    const res = await fetch("/api/admin/betting/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...createForm,
        matchId: createForm.scopeType === "single_match" ? createForm.matchId : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Pool created in draft status.");
      setShowCreate(false);
      setCreateForm({ tournamentId: "", scopeType: "full_tournament", matchId: "", title: "", closesAt: "", houseCutPercent: 20 });
      await loadPools();
    } else {
      setMsg(data.error ?? "Failed to create pool.");
    }
    setLoading(false);
  }

  async function patchPool(poolId: string, data: Record<string, unknown>) {
    setLoading(true);
    await fetch(`/api/admin/betting/pools/${poolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await loadPools();
    setLoading(false);
  }

  async function handleSettle(e: React.FormEvent) {
    e.preventDefault();
    if (!settleModal || !winOutcomeId) return;
    setLoading(true);
    const res = await fetch(`/api/admin/betting/pools/${settleModal.id}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winningOutcomeId: winOutcomeId }),
    });
    const d = await res.json();
    setMsg(res.ok ? "Pool settled." : (d.error ?? "Failed."));
    setSettleModal(null); setWinOutcomeId("");
    await loadPools();
    setLoading(false);
  }

  async function handleRefund(e: React.FormEvent) {
    e.preventDefault();
    if (!refundModal || !refundReason.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/admin/betting/pools/${refundModal.id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: refundReason }),
    });
    const d = await res.json();
    setMsg(res.ok ? "Pool refunded." : (d.error ?? "Failed."));
    setRefundModal(null); setRefundReason("");
    await loadPools();
    setLoading(false);
  }

  async function handleAddAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!accessModal) return;
    setAccessError(""); setLoading(true);
    const res = await fetch(`/api/admin/betting/pools/${accessModal.id}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gamerTag: accessPlayer }),
    });
    const d = await res.json();
    if (!res.ok) { setAccessError(d.error ?? "Failed."); setLoading(false); return; }
    setAccessPlayer("");
    await loadPools();
    // Refresh the modal's data
    const fresh = pools.find((p) => p.id === accessModal.id);
    if (fresh) setAccessModal(fresh);
    setLoading(false);
  }

  async function handleRemoveAccess(poolId: string, playerId: string) {
    setLoading(true);
    await fetch(`/api/admin/betting/pools/${poolId}/access/${playerId}`, { method: "DELETE" });
    await loadPools();
    setLoading(false);
  }

  async function handleCxpAdjust(e: React.FormEvent) {
    e.preventDefault();
    setCxpMsg(""); setLoading(true);
    const res = await fetch("/api/admin/cxp/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cxpForm),
    });
    const d = await res.json();
    setCxpMsg(res.ok ? `Done. New balance: ${d.newBalance} C-XP.` : (d.error ?? "Failed."));
    if (res.ok) setCxpForm({ gamerTag: "", amount: 0, reason: "", sourceType: "admin_adjustment" });
    setLoading(false);
  }

  const totalHouseCut = pools.reduce((s, p) => s + p.totalHouseCutCollected, 0);

  const inputCls = "mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400";

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="The Oracle Pool"
        description="Parimutuel C-XP betting on tournaments and matches. House takes a cut; winners share the rest."
      />

      {msg && (
        <p className={`text-sm px-4 py-2 rounded-2xl ${msg.includes("Failed") || msg.includes("error") ? "bg-red-950/30 border border-red-500/30 text-red-400" : "bg-emerald-950/30 border border-emerald-500/30 text-emerald-400"}`}>
          {msg}
        </p>
      )}

      {/* Global controls row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-5 flex items-center gap-4 flex-1 min-w-[260px]">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Oracle Pool</p>
            <p className="text-lg font-black text-white mt-0.5">{oracleEnabled ? "Globally Active" : "Globally Off"}</p>
            <p className="text-xs text-slate-500 mt-0.5">Shows Oracle Pool section to invited players on their Guild Card</p>
          </div>
          <button onClick={toggleOracle} disabled={loading}
            className={`relative w-14 h-7 rounded-full transition-colors shrink-0 ${oracleEnabled ? "bg-emerald-500" : "bg-zinc-700"}`}>
            <span className={`absolute top-1.5 w-4 h-4 rounded-full bg-white transition-all ${oracleEnabled ? "left-9" : "left-1.5"}`} />
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-5 flex-1 min-w-[180px]">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-400">Total House Cut</p>
          <p className="text-3xl font-black text-white mt-1">{totalHouseCut.toLocaleString()} <span className="text-sm text-amber-400 font-semibold">C-XP</span></p>
          <p className="text-xs text-slate-500 mt-0.5">Across {pools.filter((p) => p.status === "settled").length} settled pools</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setShowCreate(true); loadTournaments(); }}
            className="rounded-3xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm px-6 py-3 transition">
            + Create Pool
          </button>
          <button onClick={() => setCxpModal(true)}
            className="rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-sm px-6 py-3 transition">
            C-XP Missions
          </button>
        </div>
      </div>

      {/* Pools list */}
      <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">All Pools</p>
          <h2 className="mt-1 text-2xl font-black text-white">{pools.length} pools</h2>
        </div>

        {pools.length === 0 && <p className="text-sm text-slate-500">No betting pools yet. Create one above.</p>}

        <div className="space-y-3">
          {pools.map((pool) => (
            <div key={pool.id} className="rounded-3xl border border-white/5 bg-black/30 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold ${STATUS_BADGE[pool.status] ?? STATUS_BADGE.draft}`}>
                      {pool.status}
                    </span>
                    {pool.enabled && pool.status !== "settled" && pool.status !== "cancelled" && (
                      <span className="text-xs text-emerald-400 font-semibold">Visible</span>
                    )}
                    <span className="text-xs text-slate-500">{pool.scopeType === "single_match" ? "Match" : "Tournament"}</span>
                  </div>
                  <p className="text-white font-bold text-sm">{pool.title}</p>
                  <p className="text-slate-400 text-xs">{pool.tournament.name}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    <span>{pool.totalPoolCxp.toLocaleString()} C-XP pool</span>
                    <span>{pool.distinctStakers} stakers</span>
                    <span>{pool.houseCutPercent}% house cut</span>
                    <span>Closes {new Date(pool.closesAt).toLocaleString()}</span>
                    {pool.status === "settled" && <span className="text-amber-400">{pool.totalHouseCutCollected} C-XP house cut collected</span>}
                  </div>

                  {/* Odds preview */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {pool.odds.map((o) => (
                      <div key={o.outcomeId} className="bg-white/5 rounded-xl px-3 py-1.5 text-xs">
                        <span className={o.outcomeType === "draw" ? "text-amber-300" : "text-white"}>{o.label}</span>
                        <span className="text-slate-400 ml-2">
                          {o.payoutMultiplier !== null ? `${o.payoutMultiplier}×` : "—"}
                        </span>
                        <span className="text-slate-500 ml-1">({o.totalStakedCxp} C-XP)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 shrink-0 items-end text-xs font-semibold">
                  {pool.status === "draft" && (
                    <>
                      <button onClick={() => patchPool(pool.id, { status: "open", enabled: true })}
                        className="text-emerald-400 hover:text-emerald-300">Open Pool</button>
                      <button onClick={() => patchPool(pool.id, { enabled: !pool.enabled })}
                        className="text-slate-400 hover:text-white">{pool.enabled ? "Hide" : "Show"}</button>
                    </>
                  )}
                  {pool.status === "open" && (
                    <>
                      <button onClick={() => patchPool(pool.id, { status: "closed" })}
                        className="text-amber-400 hover:text-amber-300">Close Betting</button>
                      <button onClick={() => patchPool(pool.id, { enabled: !pool.enabled })}
                        className="text-slate-400 hover:text-white">{pool.enabled ? "Hide" : "Show"}</button>
                    </>
                  )}
                  {(pool.status === "open" || pool.status === "closed") && (
                    <>
                      <button onClick={() => { setSettleModal(pool); setWinOutcomeId(""); }}
                        className="text-blue-400 hover:text-blue-300">Force Settle</button>
                      <button onClick={() => { setRefundModal(pool); setRefundReason(""); }}
                        className="text-red-400 hover:text-red-300">Force Refund</button>
                    </>
                  )}
                  <button onClick={() => setAccessModal(pool)}
                    className="text-purple-400 hover:text-purple-300">
                    Invite ({pool.access.length})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Create Pool Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 w-full max-w-lg space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Create Betting Pool</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreatePool} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-100">
                Title
                <input value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  required placeholder="e.g. Friday Tourney Winner Market" className={inputCls} />
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Tournament
                <select value={createForm.tournamentId}
                  onChange={(e) => {
                    setCreateForm((f) => ({ ...f, tournamentId: e.target.value, matchId: "" }));
                    loadMatches(e.target.value);
                  }}
                  required className={inputCls}>
                  <option value="">Select tournament…</option>
                  {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.status})</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Scope
                <select value={createForm.scopeType}
                  onChange={(e) => setCreateForm((f) => ({ ...f, scopeType: e.target.value, matchId: "" }))}
                  className={inputCls}>
                  <option value="full_tournament">Full Tournament (all entries)</option>
                  <option value="single_match">Single Match</option>
                </select>
              </label>
              {createForm.scopeType === "single_match" && (
                <label className="block text-sm font-semibold text-slate-100">
                  Match
                  <select value={createForm.matchId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, matchId: e.target.value }))}
                    required className={inputCls}>
                    <option value="">Select match…</option>
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>{m.playerAName} vs {m.playerBName} ({m.status})</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-slate-100">
                  Closes At
                  <input type="datetime-local" value={createForm.closesAt}
                    onChange={(e) => setCreateForm((f) => ({ ...f, closesAt: e.target.value }))}
                    required className={`${inputCls} [color-scheme:dark]`} />
                </label>
                <label className="block text-sm font-semibold text-slate-100">
                  House Cut %
                  <input type="number" min="0" max="50" step="1" value={createForm.houseCutPercent}
                    onChange={(e) => setCreateForm((f) => ({ ...f, houseCutPercent: Number(e.target.value) }))}
                    className={inputCls} />
                </label>
              </div>
              <button type="submit" disabled={loading || !createForm.tournamentId || !createForm.title || !createForm.closesAt}
                className="w-full rounded-3xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-bold text-sm py-3 transition">
                {loading ? "Creating…" : "Create Pool (draft)"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Settle Modal ── */}
      {settleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setSettleModal(null); setWinOutcomeId(""); } }}>
          <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 w-full max-w-sm space-y-5">
            <h3 className="text-lg font-black text-white">Force Settle — {settleModal.title}</h3>
            <p className="text-sm text-slate-400">
              Select the winning outcome. Winners split {100 - settleModal.houseCutPercent}% of the {settleModal.totalPoolCxp} C-XP pool proportionally. House keeps {settleModal.houseCutPercent}%.
            </p>
            <form onSubmit={handleSettle} className="space-y-4">
              <div className="space-y-2">
                {settleModal.outcomes.map((o) => (
                  <label key={o.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition ${winOutcomeId === o.id ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 bg-black/30 hover:border-white/20"}`}>
                    <input type="radio" name="winOutcome" value={o.id} checked={winOutcomeId === o.id}
                      onChange={() => setWinOutcomeId(o.id)} className="accent-cyan-400" />
                    <span className={`text-sm font-semibold ${o.outcomeType === "draw" ? "text-amber-300" : "text-white"}`}>{o.label}</span>
                    <span className="ml-auto text-xs text-slate-400">{o.totalStakedCxp} C-XP staked</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading || !winOutcomeId}
                  className="flex-1 rounded-3xl bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold text-sm py-3 transition">
                  Settle Pool
                </button>
                <button type="button" onClick={() => { setSettleModal(null); setWinOutcomeId(""); }}
                  className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Refund Modal ── */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setRefundModal(null); setRefundReason(""); } }}>
          <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 w-full max-w-sm space-y-5">
            <h3 className="text-lg font-black text-white">Force Refund — {refundModal.title}</h3>
            <p className="text-sm text-slate-400">All {refundModal.distinctStakers} stakers will be refunded in full. Zero house cut.</p>
            <form onSubmit={handleRefund} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-100">
                Reason (required — shown to players)
                <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
                  required rows={3} placeholder="e.g. Match was cancelled due to technical issues."
                  className="mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white text-sm outline-none focus:border-red-400 resize-none" />
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={loading || !refundReason.trim()}
                  className="flex-1 rounded-3xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold text-sm py-3 transition">
                  Refund All
                </button>
                <button type="button" onClick={() => { setRefundModal(null); setRefundReason(""); }}
                  className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Access Modal ── */}
      {accessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAccessModal(null); }}>
          <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 w-full max-w-md space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Invite Players — {accessModal.title}</h3>
              <button onClick={() => setAccessModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 px-4 py-3 text-xs text-amber-300">
              Competitors in this pool&apos;s tournament or match are automatically blocked. They will never see the betting UI.
            </div>

            <form onSubmit={handleAddAccess} className="flex gap-2">
              <input value={accessPlayer} onChange={(e) => setAccessPlayer(e.target.value)}
                placeholder="@gamerTag" required
                className="flex-1 rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400" />
              <button type="submit" disabled={loading || !accessPlayer.trim()}
                className="rounded-3xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-bold text-sm px-5 py-2.5 transition">
                Add
              </button>
            </form>
            {accessError && <p className="text-sm text-red-400 bg-red-950/30 border border-red-500/30 rounded-2xl px-4 py-2">{accessError}</p>}

            <div className="space-y-2">
              {pools.find((p) => p.id === accessModal.id)?.access.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-black/30 rounded-2xl px-4 py-2.5 border border-white/5">
                  <div>
                    <span className="text-white text-sm font-semibold">@{a.player.gamerTag}</span>
                    <span className="text-slate-400 text-xs ml-2">{a.player.name}</span>
                    <span className="text-amber-400 text-xs ml-3">{a.player.cxpBalance} C-XP</span>
                  </div>
                  <button onClick={() => handleRemoveAccess(accessModal.id, a.playerId)}
                    className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              ))}
              {(pools.find((p) => p.id === accessModal.id)?.access.length ?? 0) === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No players invited yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CXP Missions Modal ── */}
      {cxpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setCxpModal(false); }}>
          <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 w-full max-w-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">C-XP Mission / Adjustment</h3>
              <button onClick={() => setCxpModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCxpAdjust} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-100">
                GamerTag
                <input value={cxpForm.gamerTag} onChange={(e) => setCxpForm((f) => ({ ...f, gamerTag: e.target.value }))}
                  required placeholder="@gamerTag" className={inputCls} />
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Amount (positive = credit, negative = debit)
                <input type="number" value={cxpForm.amount}
                  onChange={(e) => setCxpForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                  required className={inputCls} />
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Type
                <select value={cxpForm.sourceType} onChange={(e) => setCxpForm((f) => ({ ...f, sourceType: e.target.value }))}
                  className={inputCls}>
                  <option value="mission">Mission</option>
                  <option value="admin_adjustment">Admin Adjustment</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Reason (shown to player)
                <input value={cxpForm.reason} onChange={(e) => setCxpForm((f) => ({ ...f, reason: e.target.value }))}
                  required placeholder="e.g. Won the weekly trivia challenge" className={inputCls} />
              </label>
              <button type="submit" disabled={loading || !cxpForm.gamerTag || !cxpForm.reason || cxpForm.amount === 0}
                className="w-full rounded-3xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-bold text-sm py-3 transition">
                Apply
              </button>
              {cxpMsg && <p className={`text-sm text-center ${cxpMsg.includes("Failed") || cxpMsg.includes("error") ? "text-red-400" : "text-emerald-400"}`}>{cxpMsg}</p>}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
