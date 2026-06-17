"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type Period = "all" | "monthly" | "weekly" | "daily";

const PERIOD_LABELS: Record<Period, string> = {
  all: "All Time", monthly: "This Month", weekly: "This Week", daily: "Today",
};

interface Analytics {
  period: string;
  totalRevenueUsd: number;
  sessionRevenue: number;
  wifiRevenue: number;
  tournamentRevenue: number;
  membershipRevenue: number;
  revenueByPeriod: {
    daily:   { sessions: number; wifi: number; tournaments: number; total: number };
    weekly:  { sessions: number; wifi: number; tournaments: number; total: number };
    monthly: { sessions: number; wifi: number; tournaments: number; total: number };
  };
  revenueByStation: { station: string; revenue: number; sessions: number; hours: number }[];
  revenueByGame:    { game: string;    revenue: number; sessions: number }[];
  topSpenders:      { name: string; spend: number; sessions: number }[];
  bestTournaments:  { id: string; name: string; game: string; entryFee: number; entries: number; revenue: number; prizeUsd: number; profit: number }[];
  activeSessions:   number;
  activeWifiUsers:  number;
  totalMembers:     number;
  completedSessions: number;
  totalGamingHours:  number;
  averageSessionRevenue: number;
  totalPlayers:      number;
  newPlayersThisMonth: number;
}

function fmt(n: number) { return `$${n.toFixed(2)}`; }

function StatCard({ label, value, sub, color = "cyan" }: { label: string; value: string; sub?: string; color?: string }) {
  const accent = color === "green" ? "text-green-400" : color === "yellow" ? "text-yellow-400" : color === "purple" ? "text-purple-400" : color === "orange" ? "text-orange-400" : "text-cyan-400";
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-lg">
      <p className={`text-xs uppercase tracking-[0.28em] ${accent}`}>{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
    </div>
  );
}

function Bar({ pct, color = "#22d3ee" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/5 mt-2">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData]       = useState<Analytics | null>(null);
  const [period, setPeriod]   = useState<Period>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (!data && loading) return <div className="p-10 text-slate-400">Loading analytics…</div>;
  if (!data)            return <div className="p-10 text-red-400">Failed to load analytics.</div>;

  const maxStation = data.revenueByStation[0]?.revenue || 1;
  const maxGame    = data.revenueByGame[0]?.revenue    || 1;
  const maxSpender = data.topSpenders[0]?.spend        || 1;

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Business Analytics"
        description="Every dollar accounted for — sessions, WiFi, tournaments, memberships."
      />

      {/* Period selector + Reports link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-3xl border px-4 py-1.5 text-sm font-semibold transition ${
                period === p
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                  : "border-white/10 bg-black/30 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          {loading && <span className="self-center text-xs text-slate-500 pl-2">Refreshing…</span>}
        </div>
        <Link
          href="/admin/reports"
          className="rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 px-4 py-1.5 text-sm font-bold transition"
        >
          📄 Download Reports
        </Link>
      </div>

      {/* ── Revenue totals ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Revenue"      value={fmt(data.totalRevenueUsd)}      sub={PERIOD_LABELS[period]}      color="cyan"   />
        <StatCard label="Sessions"           value={fmt(data.sessionRevenue)}        sub={`${data.completedSessions} sessions`} color="green"  />
        <StatCard label="WiFi"               value={fmt(data.wifiRevenue)}           sub={`${data.activeWifiUsers} active now`} color="yellow" />
        <StatCard label="Tournaments"        value={fmt(data.tournamentRevenue)}     sub="Entry fees (completed)"     color="orange" />
        <StatCard label="Memberships"        value={fmt(data.membershipRevenue)}     sub={`${data.totalMembers} paid members`} color="purple" />
      </div>

      {/* ── Period breakdown ───────────────────────────────────────────── */}
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-400 mb-1">Revenue by period</p>
        <h2 className="text-xl font-black text-white mb-6">Sessions + WiFi + Tournaments</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["daily","weekly","monthly"] as const).map((p) => {
            const d = data.revenueByPeriod[p];
            return (
              <div key={p} className="rounded-3xl border border-white/5 bg-black/40 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">{p === "daily" ? "Today" : p === "weekly" ? "This Week" : "This Month"}</p>
                <p className="text-3xl font-black text-white">{fmt(d.total)}</p>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>Sessions: {fmt(d.sessions)}</p>
                  <p>WiFi: {fmt(d.wifi)}</p>
                  <p>Tournaments: {fmt(d.tournaments)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Operational quick stats ────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Sessions"    value={String(data.activeSessions)}     sub="Right now"                  />
        <StatCard label="Avg Session Value"  value={fmt(data.averageSessionRevenue)} sub="Per booking"                color="green"  />
        <StatCard label="Total Players"      value={String(data.totalPlayers)}       sub={`+${data.newPlayersThisMonth} this month`} color="purple" />
        <StatCard label="Total Hours Played" value={data.totalGamingHours.toFixed(1)+"h"} sub="Across all sessions"  color="yellow" />
      </div>

      {/* ── Revenue by station + game ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-400 mb-1">Revenue by station</p>
          <h2 className="text-lg font-black text-white mb-6">Which device earns the most</h2>
          {data.revenueByStation.length === 0 ? (
            <p className="text-slate-500">No session data for this period.</p>
          ) : (
            <div className="space-y-4">
              {data.revenueByStation.map((s) => (
                <div key={s.station}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-semibold">{s.station}</span>
                    <span className="text-green-400 font-bold">{fmt(s.revenue)}</span>
                  </div>
                  <Bar pct={(s.revenue / maxStation) * 100} color="#4ade80" />
                  <p className="text-xs text-slate-500 mt-1">{s.sessions} sessions · {s.hours.toFixed(1)}h</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-yellow-400 mb-1">Revenue by game</p>
          <h2 className="text-lg font-black text-white mb-6">Which title drives the most revenue</h2>
          {data.revenueByGame.length === 0 ? (
            <p className="text-slate-500">No session data for this period.</p>
          ) : (
            <div className="space-y-4">
              {data.revenueByGame.map((g) => (
                <div key={g.game}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-semibold">{g.game}</span>
                    <span className="text-yellow-400 font-bold">{fmt(g.revenue)}</span>
                  </div>
                  <Bar pct={(g.revenue / maxGame) * 100} color="#facc15" />
                  <p className="text-xs text-slate-500 mt-1">{g.sessions} sessions</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Top spenders + best tournaments ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-purple-400 mb-1">Top spenders</p>
          <h2 className="text-lg font-black text-white mb-6">Biggest customers by session spend</h2>
          {data.topSpenders.length === 0 ? (
            <p className="text-slate-500">No data for this period.</p>
          ) : (
            <div className="space-y-4">
              {data.topSpenders.map((s, i) => (
                <div key={s.name}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-500 w-4">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white font-semibold">{s.name}</span>
                        <span className="text-purple-400 font-bold">{fmt(s.spend)}</span>
                      </div>
                      <Bar pct={(s.spend / maxSpender) * 100} color="#c084fc" />
                      <p className="text-xs text-slate-500 mt-1">{s.sessions} sessions</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-orange-400 mb-1">Best tournaments</p>
          <h2 className="text-lg font-black text-white mb-6">Revenue vs prize payout</h2>
          {data.bestTournaments.length === 0 ? (
            <p className="text-slate-500">No completed tournaments yet.</p>
          ) : (
            <div className="space-y-4">
              {data.bestTournaments.map((t, i) => (
                <div key={t.id} className="rounded-2xl border border-white/5 bg-black/30 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">#{i + 1}</p>
                      <p className="text-white font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.game} · {t.entries} entrants @ {fmt(t.entryFee)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-orange-400 font-black">{fmt(t.revenue)}</p>
                      <p className={`text-xs font-semibold ${t.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {t.profit >= 0 ? "+" : ""}{fmt(t.profit)} net
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
