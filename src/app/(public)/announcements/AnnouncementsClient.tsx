"use client";

import { useState } from "react";

interface Announcement {
  id: string;
  message: string;
  type: string | null;
  tournamentName: string | null;
  winnerName: string | null;
  prizeAmount: string | null;
  createdAt: string;
  expiresAt: string | null;
}

const TYPE_BADGE: Record<string, string> = {
  champion: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  rank_up:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  general:  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

const TYPE_LABEL: Record<string, string> = {
  champion: "🏆 Champion",
  rank_up:  "⬆ Rank Up",
  general:  "📢 Update",
};

const FILTERS = [
  { value: "all",      label: "All" },
  { value: "champion", label: "🏆 Champions" },
  { value: "rank_up",  label: "⬆ Rank Ups" },
  { value: "general",  label: "📢 Updates" },
];

export default function AnnouncementsClient({ announcements }: { announcements: Announcement[] }) {
  const [filter, setFilter] = useState("all");

  const visible = filter === "all"
    ? announcements
    : announcements.filter((a) => (a.type ?? "general") === filter);

  if (announcements.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-16 text-center text-zinc-500">
        No announcements yet — check back soon!
      </div>
    );
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border transition ${
              filter === f.value
                ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                : "border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <p className="text-zinc-500 text-center py-16">No {filter} announcements yet.</p>
      ) : (
        <div className="space-y-4">
          {visible.map((a) => {
            const type = a.type ?? "general";
            const now = new Date();
            const expired = a.expiresAt && new Date(a.expiresAt) < now;
            return (
              <div
                key={a.id}
                className={`rounded-3xl border p-6 transition ${expired ? "border-white/5 bg-white/[0.02] opacity-60" : "border-white/10 bg-white/5"}`}
              >
                <div className="flex items-start gap-3 flex-wrap mb-3">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${TYPE_BADGE[type] ?? TYPE_BADGE.general}`}>
                    {TYPE_LABEL[type] ?? "📢 Update"}
                  </span>
                  {a.tournamentName && (
                    <span className="text-xs text-zinc-400 pt-1">{a.tournamentName}</span>
                  )}
                  {expired && (
                    <span className="text-xs text-zinc-600 pt-1 italic">Expired</span>
                  )}
                </div>

                <p className="text-zinc-200 text-lg leading-relaxed">{a.message}</p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                  <span>
                    {new Date(a.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                  {a.winnerName && (
                    <span className="text-yellow-400 font-semibold">Winner: {a.winnerName}</span>
                  )}
                  {a.prizeAmount && (
                    <span className="text-green-400">Prize: ${a.prizeAmount}</span>
                  )}
                  {a.expiresAt && !expired && (
                    <span>Active until {new Date(a.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
