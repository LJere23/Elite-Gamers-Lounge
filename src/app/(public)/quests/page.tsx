"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

interface Quest {
  id: string;
  name: string;
  description: string;
  xpReward: number;
}

interface QuestData {
  jobs: Quest[];
  completedJobIds: string[];
  isLoggedIn: boolean;
}

const RANK_COLORS: Record<string, { border: string; glow: string; badge: string; xpColor: string }> = {
  low:    { border: "border-slate-600",    glow: "",                         badge: "bg-slate-700 text-slate-300",      xpColor: "text-slate-300" },
  mid:    { border: "border-blue-500/50",  glow: "shadow-blue-900/20",      badge: "bg-blue-900/60 text-blue-300",     xpColor: "text-blue-300" },
  high:   { border: "border-purple-500/50",glow: "shadow-purple-900/20",    badge: "bg-purple-900/60 text-purple-300", xpColor: "text-purple-300" },
  elite:  { border: "border-amber-500/60", glow: "shadow-amber-900/30",     badge: "bg-amber-900/60 text-amber-300",   xpColor: "text-amber-300" },
};

function questRank(xp: number) {
  if (xp >= 200) return { key: "elite", label: "S-Rank Quest" };
  if (xp >= 100) return { key: "high",  label: "A-Rank Quest" };
  if (xp >= 50)  return { key: "mid",   label: "B-Rank Quest" };
  return              { key: "low",   label: "C-Rank Quest" };
}

export default function QuestBoardPage() {
  const [data, setData] = useState<QuestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/quests")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const completed = data?.completedJobIds ?? [];
  const available = (data?.jobs ?? []).filter((j) => !completed.includes(j.id));
  const done = (data?.jobs ?? []).filter((j) => completed.includes(j.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0D1E] via-[#1a1230] to-[#0F0D1E] text-white relative overflow-x-hidden">
      <AnimatedBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.4em] text-yellow-400 mb-3">Guild Hall</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4">
            Quest <span className="text-yellow-400">Board</span>
          </h1>
          <p className="text-purple-300 max-w-xl mx-auto text-base leading-relaxed">
            Complete quests at the lounge to earn XP and rise through the ranks. Ask staff to record your progress.
          </p>
        </div>

        {/* Login prompt if not logged in */}
        {!loading && !data?.isLoggedIn && (
          <div className="mb-10 rounded-2xl border border-yellow-400/30 bg-yellow-950/20 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-yellow-300 text-sm font-semibold">
              Log in to see which quests you&apos;ve completed
            </p>
            <Link
              href="/portal?redirect=/quests"
              className="rounded-xl bg-yellow-400 text-[#0F0D1E] font-black text-sm px-5 py-2 hover:bg-amber-400 transition-colors"
            >
              Log in
            </Link>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-white/10 bg-white/5 h-44 animate-pulse" />
            ))}
          </div>
        ) : (data?.jobs ?? []).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-purple-300 text-lg">No quests available right now.</p>
            <p className="text-purple-400/60 text-sm mt-2">Check back soon — the guild masters are preparing new challenges.</p>
          </div>
        ) : (
          <>
            {/* Available quests */}
            {available.length > 0 && (
              <div className="mb-14">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-purple-500/20" />
                  <p className="text-xs uppercase tracking-[0.3em] text-purple-400 font-semibold">Available Quests</p>
                  <div className="h-px flex-1 bg-purple-500/20" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {available.map((quest) => {
                    const rank = questRank(quest.xpReward);
                    const colors = RANK_COLORS[rank.key];
                    return (
                      <div
                        key={quest.id}
                        className={`rounded-3xl border ${colors.border} bg-[#1E1654]/60 p-6 shadow-lg ${colors.glow} flex flex-col gap-3`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                            {rank.label}
                          </span>
                          <span className={`text-lg font-black ${colors.xpColor}`}>
                            +{quest.xpReward} XP
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white leading-snug">{quest.name}</h3>
                        <p className="text-purple-300/80 text-sm leading-relaxed flex-1">{quest.description}</p>
                        <div className="mt-auto pt-2 border-t border-white/5">
                          <p className="text-xs text-purple-400/60">Ask staff to record completion</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed quests */}
            {data?.isLoggedIn && done.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-green-500/20" />
                  <p className="text-xs uppercase tracking-[0.3em] text-green-400 font-semibold">Completed</p>
                  <div className="h-px flex-1 bg-green-500/20" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {done.map((quest) => (
                    <div
                      key={quest.id}
                      className="rounded-3xl border border-green-500/30 bg-green-950/20 p-6 flex flex-col gap-3 opacity-70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-900/60 text-green-300">
                          ✓ Completed
                        </span>
                        <span className="text-lg font-black text-green-400">+{quest.xpReward} XP</span>
                      </div>
                      <h3 className="text-base font-black text-white/70 leading-snug line-through">{quest.name}</h3>
                      <p className="text-green-300/50 text-sm leading-relaxed">{quest.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer nav */}
        <div className="mt-16 text-center space-x-6">
          <Link href="/portal" className="text-sm text-purple-400 hover:text-yellow-400 transition-colors">
            Guild Card
          </Link>
          <Link href="/" className="text-sm text-purple-400 hover:text-yellow-400 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
