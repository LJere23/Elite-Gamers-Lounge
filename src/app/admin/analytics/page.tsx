"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AnalyticsPayload } from "@/types/admin";

type Period = "all" | "monthly" | "weekly" | "daily";

const PERIOD_LABELS: Record<Period, string> = {
  all: "All Time",
  monthly: "This Month",
  weekly: "This Week",
  daily: "Today",
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((res) => res.json())
      .then((data: AnalyticsPayload) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (!analytics && loading) {
    return <div className="p-10 text-slate-300">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-10 text-red-400">Failed to load analytics.</div>;
  }

  const revenueByPeriod = analytics.revenueByPeriod as unknown as {
    daily: { sessions: number; wifi: number };
    weekly: { sessions: number; wifi: number };
    monthly: { sessions: number; wifi: number };
  } | undefined;

  const dailyTotal = revenueByPeriod
    ? (revenueByPeriod.daily.sessions + revenueByPeriod.daily.wifi)
    : 0;
  const weeklyTotal = revenueByPeriod
    ? (revenueByPeriod.weekly.sessions + revenueByPeriod.weekly.wifi)
    : 0;
  const monthlyTotal = revenueByPeriod
    ? (revenueByPeriod.monthly.sessions + revenueByPeriod.monthly.wifi)
    : 0;

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Analytics overview"
        description="Review the most important business metrics for station usage and revenue."
      />

      {/* Period selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-3xl border px-5 py-2 text-sm font-semibold transition ${
              period === p
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                : "border-white/10 bg-black/30 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
        {loading && (
          <span className="self-center pl-2 text-xs text-slate-500">Refreshing...</span>
        )}
      </div>

      {/* Main stat cards */}
      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-lg shadow-black/10">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Revenue</p>
          <h2 className="mt-4 text-4xl font-black text-white">
            ${analytics.totalRevenueUsd.toFixed(2)}
          </h2>
          <p className="mt-3 text-slate-300">Combined earnings from sessions, memberships, and WiFi.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-lg shadow-black/10">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Active WiFi</p>
          <h2 className="mt-4 text-4xl font-black text-white">{analytics.activeWifiUsers}</h2>
          <p className="mt-3 text-slate-300">Connections currently live.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-lg shadow-black/10">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Sessions</p>
          <h2 className="mt-4 text-4xl font-black text-white">{analytics.activeSessions}</h2>
          <p className="mt-3 text-slate-300">Active gaming sessions in progress.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-lg shadow-black/10">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Total Players</p>
          <h2 className="mt-4 text-4xl font-black text-white">
            {analytics.totalPlayers ?? 0}
          </h2>
          <p className="mt-3 text-slate-300">Registered players in the system.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-lg shadow-black/10">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">New This Month</p>
          <h2 className="mt-4 text-4xl font-black text-white">
            {analytics.newPlayersThisMonth ?? 0}
          </h2>
          <p className="mt-3 text-slate-300">Players who joined in the last 30 days.</p>
        </div>
      </div>

      {/* Revenue by period breakdown */}
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Revenue by period</p>
        <h2 className="mt-3 text-xl font-black text-white">Breakdown across time frames</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/5 bg-black/40 p-6">
            <p className="text-xs uppercase tracking-widest text-slate-400">Daily</p>
            <p className="mt-3 text-3xl font-black text-white">${dailyTotal.toFixed(2)}</p>
            {revenueByPeriod && (
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>Sessions: ${revenueByPeriod.daily.sessions.toFixed(2)}</p>
                <p>WiFi: ${revenueByPeriod.daily.wifi.toFixed(2)}</p>
              </div>
            )}
          </div>
          <div className="rounded-3xl border border-white/5 bg-black/40 p-6">
            <p className="text-xs uppercase tracking-widest text-slate-400">Weekly</p>
            <p className="mt-3 text-3xl font-black text-white">${weeklyTotal.toFixed(2)}</p>
            {revenueByPeriod && (
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>Sessions: ${revenueByPeriod.weekly.sessions.toFixed(2)}</p>
                <p>WiFi: ${revenueByPeriod.weekly.wifi.toFixed(2)}</p>
              </div>
            )}
          </div>
          <div className="rounded-3xl border border-white/5 bg-black/40 p-6">
            <p className="text-xs uppercase tracking-widest text-slate-400">Monthly</p>
            <p className="mt-3 text-3xl font-black text-white">${monthlyTotal.toFixed(2)}</p>
            {revenueByPeriod && (
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>Sessions: ${revenueByPeriod.monthly.sessions.toFixed(2)}</p>
                <p>WiFi: ${revenueByPeriod.monthly.wifi.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Most used stations + top games */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Most used stations</p>
          <div className="mt-6 space-y-3">
            {analytics.mostUsedStations.length === 0 ? (
              <p className="text-slate-500">No data for this period.</p>
            ) : (
              analytics.mostUsedStations.map((station) => (
                <div key={station.station} className="rounded-3xl bg-black/40 p-4 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <p>{station.station}</p>
                    <span className="text-slate-400">{station.count} sessions</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Top games</p>
          <div className="mt-6 space-y-3">
            {analytics.mostPlayedGames.length === 0 ? (
              <p className="text-slate-500">No data for this period.</p>
            ) : (
              analytics.mostPlayedGames.map((game) => (
                <div key={game.game} className="rounded-3xl bg-black/40 p-4 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <p>{game.game}</p>
                    <span className="text-slate-400">{game.count} plays</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
