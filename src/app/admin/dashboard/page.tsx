"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DashboardCard from "@/components/admin/DashboardCard";
import QuickActions from "@/components/admin/QuickActions";
import { AnalyticsPayload } from "../../../types/admin";

// ── Types ──────────────────────────────────────────────────────────────────────

type Period = "daily" | "weekly" | "monthly" | "all";

const PERIODS: { key: Period; label: string; sub: string }[] = [
  { key: "daily",   label: "Today",      sub: "last 24 h"    },
  { key: "weekly",  label: "This Week",  sub: "last 7 days"  },
  { key: "monthly", label: "This Month", sub: "last 30 days" },
  { key: "all",     label: "All Time",   sub: "all records"  },
];

type ActiveSession = {
  id: string;
  playerName: string;
  game: string;
  deviceName: string;
  durationHours: number;
  totalPrice: number;
};

type DashboardData = AnalyticsPayload & {
  activeSessionsList: ActiveSession[];
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [data, setData]     = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(false);

  async function load(p: Period) {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${p}`);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }

  // Initial load + period changes
  useEffect(() => { load(period); }, [period]);

  // Auto-refresh every 10s — keep the live panels current
  useEffect(() => {
    const id = setInterval(() => load(period), 10_000);
    return () => clearInterval(id);
  }, [period]);

  const periodMeta = PERIODS.find((p) => p.key === period)!;

  if (!data) {
    return (
      <div className="p-10 text-zinc-400 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        Loading dashboard…
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Live snapshot of sessions, revenue, and activity."
      />

      {/* ── Period selector ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-3xl border px-5 py-2 text-sm font-bold transition ${
              period === p.key
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
        {loading && (
          <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin ml-1" />
        )}
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Always-live stats */}
        <DashboardCard
          label="Active Sessions"
          value={String(data.activeSessions)}
          delta="Live"
        />
        <DashboardCard
          label="Active WiFi Users"
          value={String(data.activeWifiUsers)}
          delta="Live"
        />
        {/* Period-aware stats */}
        <DashboardCard
          label={`Revenue · ${periodMeta.label}`}
          value={`$${data.totalRevenueUsd.toFixed(2)}`}
          delta={periodMeta.sub}
        />
        <DashboardCard
          label={`Sessions Completed · ${periodMeta.label}`}
          value={String(data.completedSessions)}
          delta={periodMeta.sub}
        />
      </div>

      <QuickActions />

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* LIVE ACTIVE SESSIONS */}
        <div className="xl:col-span-2 bg-zinc-950 border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-cyan-400 text-xs uppercase tracking-[0.3em]">Live</p>
              <h2 className="text-2xl font-black text-white mt-1">Active Sessions</h2>
            </div>
            <span className={`px-4 py-2 rounded-2xl text-sm font-bold ${
              data.activeSessionsList.length > 0
                ? "bg-green-500/20 text-green-400"
                : "bg-zinc-800 text-zinc-500"
            }`}>
              {data.activeSessionsList.length} Active
            </span>
          </div>

          {data.activeSessionsList.length === 0 ? (
            <div className="bg-black/40 border border-white/5 rounded-2xl p-8 text-center text-zinc-500">
              No active sessions right now.
            </div>
          ) : (
            <div className="space-y-3">
              {data.activeSessionsList.map((s) => (
                <div key={s.id} className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-white">{s.playerName}</p>
                      <p className="text-zinc-400 text-sm mt-0.5">{s.game}</p>
                    </div>
                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold shrink-0">LIVE</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-zinc-400">
                    <span><span className="text-zinc-500 text-xs block">Device</span>{s.deviceName}</span>
                    <span><span className="text-zinc-500 text-xs block">Duration</span>{s.durationHours}h</span>
                    <span><span className="text-zinc-500 text-xs block">Revenue</span>${s.totalPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">

          {/* Revenue breakdown — period-scoped */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400 mb-1">Revenue Breakdown</p>
            <h2 className="text-lg font-black text-white mb-4">{periodMeta.label}</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: "Sessions",     value: data.revenueByCategory.sessions,    color: "text-cyan-400"   },
                { label: "Memberships",  value: data.revenueByCategory.memberships, color: "text-purple-400" },
                { label: "WiFi",         value: data.revenueByCategory.wifi,        color: "text-yellow-400" },
                { label: "Tournaments",  value: data.revenueByCategory.tournaments ?? 0, color: "text-orange-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-zinc-400">{label}</span>
                  <span className={`font-bold ${color}`}>${(value as number).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                <span className="text-white font-semibold">Total</span>
                <span className="text-white font-black">${data.totalRevenueUsd.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Most played games — period-scoped */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400 mb-1">Most Played</p>
            <h2 className="text-lg font-black text-white mb-4">{periodMeta.label}</h2>
            {data.mostPlayedGames.length === 0 ? (
              <p className="text-zinc-500 text-sm">No sessions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {data.mostPlayedGames.map((item, i) => (
                  <div key={item.game} className="flex items-center justify-between bg-black/40 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-zinc-600 w-4">#{i + 1}</span>
                      <span className="text-white font-semibold text-sm">{item.game}</span>
                    </div>
                    <span className="text-zinc-400 text-xs">{item.count} plays</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most used devices — period-scoped */}
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400 mb-1">Top Devices</p>
            <h2 className="text-lg font-black text-white mb-4">{periodMeta.label}</h2>
            {data.mostUsedStations.length === 0 ? (
              <p className="text-zinc-500 text-sm">No device activity yet.</p>
            ) : (
              <div className="space-y-2">
                {data.mostUsedStations.map((s, i) => (
                  <div key={s.station} className="flex items-center justify-between bg-black/40 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-zinc-600 w-4">#{i + 1}</span>
                      <span className="text-white font-semibold text-sm">{s.station}</span>
                    </div>
                    <span className="text-zinc-400 text-xs">{s.count} uses</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
