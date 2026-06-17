"use client";

import { useState, useEffect, useCallback } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type ReportType = "all" | "sessions" | "wifi" | "tournaments";

interface ReportRow {
  type: string;
  date: string;
  time: string;
  player: string;
  detail: string;
  hours: string;
  revenue: string;
  status: string;
  id: string;
}

interface Report {
  from: string;
  to: string;
  type: string;
  count: number;
  totalRevenue: number;
  rows: ReportRow[];
}

function today()  { return new Date().toISOString().slice(0, 10); }
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

const TYPE_COLOR: Record<string, string> = {
  session:    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  wifi:       "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  tournament: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const PRESETS = [
  { label: "Today",      from: today,        to: today        },
  { label: "This week",  from: startOfWeek,  to: today        },
  { label: "This month", from: startOfMonth, to: today        },
  { label: "Last 7d",   from: () => daysAgo(7),  to: today   },
  { label: "Last 30d",  from: () => daysAgo(30), to: today   },
];

export default function AdminReportsPage() {
  const [from, setFrom]         = useState(startOfMonth());
  const [to, setTo]             = useState(today());
  const [type, setType]         = useState<ReportType>("all");
  const [report, setReport]     = useState<Report | null>(null);
  const [loading, setLoading]   = useState(false);
  const [autoDaily, setAutoDaily] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?from=${from}&to=${to}&type=${type}&format=json`);
      const data = await res.json();
      setReport(data);
    } finally {
      setLoading(false);
    }
  }, [from, to, type]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const downloadCSV = () => {
    const url = `/api/admin/reports?from=${from}&to=${to}&type=${type}&format=csv`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${from}_to_${to}.csv`;
    a.click();
  };

  const downloadTodayCSV = () => {
    const t = today();
    const url = `/api/admin/reports?from=${t}&to=${t}&type=all&format=csv`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily_report_${t}.csv`;
    a.click();
  };

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Reports"
        description="Download transaction records for any date range — sessions, WiFi, tournaments."
      />

      {/* Controls */}
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 space-y-6">
        {/* Presets */}
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Quick presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setFrom(p.from()); setTo(p.to()); }}
                className="rounded-3xl border border-white/10 bg-black/30 px-4 py-1.5 text-sm text-slate-300 hover:border-white/20 hover:text-white transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date pickers + type */}
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="block text-sm font-semibold text-slate-300">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none focus:border-cyan-400"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-300">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none focus:border-cyan-400"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-300">
            Revenue type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none focus:border-cyan-400"
            >
              <option value="all">All revenue</option>
              <option value="sessions">Sessions only</option>
              <option value="wifi">WiFi only</option>
              <option value="tournaments">Tournaments only</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex-1 rounded-3xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-cyan-400 transition disabled:opacity-50"
            >
              {loading ? "Loading…" : "Run report"}
            </button>
          </div>
        </div>

        {/* Download buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={downloadCSV}
            className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm font-bold text-cyan-400 hover:bg-cyan-500/20 transition"
          >
            ⬇ Download CSV (selected range)
          </button>
          <button
            onClick={downloadTodayCSV}
            className="rounded-3xl border border-green-500/30 bg-green-500/10 px-5 py-2 text-sm font-bold text-green-400 hover:bg-green-500/20 transition"
          >
            📅 Download Today&apos;s Report
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none ml-auto">
            <input
              type="checkbox"
              checked={autoDaily}
              onChange={(e) => setAutoDaily(e.target.checked)}
              className="accent-cyan-500 w-4 h-4"
            />
            Auto-download daily on page open
          </label>
        </div>
      </div>

      {/* Summary */}
      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <p className="text-xs uppercase tracking-widest text-cyan-400">Total Revenue</p>
              <p className="mt-3 text-4xl font-black text-white">${report.totalRevenue.toFixed(2)}</p>
              <p className="mt-1 text-sm text-slate-500">{report.from.slice(0,10)} → {report.to.slice(0,10)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400">Transactions</p>
              <p className="mt-3 text-4xl font-black text-white">{report.count}</p>
              <p className="mt-1 text-sm text-slate-500">{report.type} records</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400">Avg per transaction</p>
              <p className="mt-3 text-4xl font-black text-white">
                ${report.count > 0 ? (report.totalRevenue / report.count).toFixed(2) : "0.00"}
              </p>
              <p className="mt-1 text-sm text-slate-500">Revenue per record</p>
            </div>
          </div>

          {/* Transaction table */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Transactions</h2>
              <span className="text-sm text-slate-500">{report.rows.length} rows</span>
            </div>
            <div className="overflow-x-auto">
              {report.rows.length === 0 ? (
                <p className="px-8 py-12 text-slate-500 text-center">No transactions for this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs uppercase tracking-widest text-slate-500">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Player</th>
                      <th className="px-6 py-3">Detail</th>
                      <th className="px-6 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((r) => (
                      <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                        <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                          {r.date} <span className="text-slate-600">{r.time}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[r.type] ?? ""}`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-white font-medium">{r.player}</td>
                        <td className="px-6 py-3 text-slate-400 max-w-xs truncate">{r.detail}</td>
                        <td className="px-6 py-3 text-right text-green-400 font-bold whitespace-nowrap">
                          ${r.revenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 bg-black/20">
                      <td colSpan={4} className="px-6 py-4 text-sm font-bold text-slate-300 uppercase tracking-widest">Total</td>
                      <td className="px-6 py-4 text-right text-xl font-black text-white">${report.totalRevenue.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Auto-daily effect: download once on mount if toggle set */}
      {autoDaily && <AutoDailyDownload />}
    </section>
  );
}

function AutoDailyDownload() {
  useEffect(() => {
    const t = new Date().toISOString().slice(0, 10);
    const url = `/api/admin/reports?from=${t}&to=${t}&type=all&format=csv`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily_report_${t}.csv`;
    a.click();
  }, []);
  return null;
}
