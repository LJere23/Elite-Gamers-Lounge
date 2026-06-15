"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { slideUp } from "@/animations/slide";
import { useEffect, useState } from "react";

interface Quest {
  id: string;
  name: string;
  description: string;
  xpReward: number;
}

const PREVIEW_QUESTS: Quest[] = [
  { id: "1", name: "First Blood", description: "Play your first session at the lounge", xpReward: 50 },
  { id: "2", name: "Tournament Contender", description: "Enter any official tournament", xpReward: 100 },
  { id: "3", name: "Community Champion", description: "Refer a friend who registers", xpReward: 75 },
];

function xpBadge(xp: number) {
  if (xp >= 200) return "text-amber-300 border-amber-400/50 bg-amber-900/40";
  if (xp >= 100) return "text-purple-300 border-purple-400/50 bg-purple-900/40";
  if (xp >= 50)  return "text-blue-300 border-blue-400/50 bg-blue-900/40";
  return "text-slate-300 border-slate-500/40 bg-slate-800/40";
}

export default function QuestBoard() {
  const [quests, setQuests] = useState<Quest[]>(PREVIEW_QUESTS);

  useEffect(() => {
    fetch("/api/portal/quests")
      .then((r) => r.json())
      .then((d: { jobs: Quest[] }) => {
        if (Array.isArray(d.jobs) && d.jobs.length > 0) {
          setQuests(d.jobs.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-yellow-400/5 blur-[80px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] items-center">

          {/* Left — copy */}
          <motion.div
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-yellow-400 font-semibold">Guild Hall</p>
              <h2 className="text-5xl md:text-6xl font-black uppercase leading-none">
                Quest<br />
                <span className="text-yellow-400">Board</span>
              </h2>
            </div>

            <p className="text-slate-300 text-lg leading-relaxed max-w-md">
              Every visit is a mission. Complete quests, earn XP, and climb the ranks from Villager to S-Rank.
              Your progress lives on your Guild Card.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 text-xs font-black">1</span>
                Register and get your Guild Card
              </div>
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 text-xs font-black">2</span>
                Complete quests during your sessions
              </div>
              <div className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 text-xs font-black">3</span>
                Staff records your XP — you rise through the ranks
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/quests"
                className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 hover:bg-amber-400 text-[#0F0D1E] font-black text-sm px-7 py-3.5 transition-colors shadow-lg shadow-yellow-900/30"
              >
                View Quest Board
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 hover:border-yellow-400/30 bg-white/5 hover:bg-yellow-400/5 text-white font-semibold text-sm px-7 py-3.5 transition-colors"
              >
                Join the Guild
              </Link>
            </div>
          </motion.div>

          {/* Right — quest preview cards */}
          <div className="space-y-4">
            {quests.map((quest, i) => (
              <motion.div
                key={quest.id}
                variants={slideUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-purple-500/20 bg-[#1E1654]/50 backdrop-blur-sm p-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-black text-white text-base">{quest.name}</p>
                  <p className="text-purple-300/80 text-sm mt-0.5 truncate">{quest.description}</p>
                </div>
                <span className={`shrink-0 text-sm font-black px-3 py-1.5 rounded-full border ${xpBadge(quest.xpReward)}`}>
                  +{quest.xpReward} XP
                </span>
              </motion.div>
            ))}

            <Link
              href="/quests"
              className="block text-center rounded-2xl border border-yellow-400/20 bg-yellow-400/5 hover:bg-yellow-400/10 py-3.5 text-yellow-400 font-bold text-sm transition-colors"
            >
              See all quests →
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
