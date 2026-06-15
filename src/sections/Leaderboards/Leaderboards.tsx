"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import PlayerAvatar from "@/components/ui/PlayerAvatar";

interface TopPlayer {
  id: string;
  name: string;
  gamerTag: string;
  xp: number;
  rank: string;
  favoriteGame?: string;
  avatarUrl?: string | null;
}

const RANK_COLOR: Record<string, string> = {
  "S Rank":      "text-yellow-300",
  "A Rank":      "text-amber-400",
  "B Rank":      "text-purple-400",
  "C Rank":      "text-cyan-400",
  "D Rank":      "text-blue-400",
  "E Rank":      "text-slate-300",
  "F Rank":      "text-slate-400",
  "Adventurer":  "text-green-400",
  "Villager":    "text-slate-500",
};

const TROPHY_COLOR = ["text-yellow-400", "text-slate-300", "text-orange-400"];

export default function Leaderboards() {
  const [players, setPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data: TopPlayer[]) => {
        const sorted = [...data]
          .sort((a, b) => b.xp - a.xp)
          .slice(0, 5);
        setPlayers(sorted);
      })
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section-padding">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.3em] text-cyan-400 mb-4">Rankings</p>
          <h2 className="text-4xl md:text-6xl font-black uppercase">Leaderboards</h2>
          <p className="mt-4 text-gray-400">Top players by XP earned in the lounge</p>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-10">Loading rankings...</div>
        ) : players.length === 0 ? (
          <div className="text-center text-slate-400 py-10 rounded-3xl border border-white/10 bg-white/5 p-12">
            <Trophy className="mx-auto mb-4 text-yellow-400" size={48} />
            <p className="text-xl font-bold text-white mb-2">No players yet</p>
            <p>Be the first to earn XP and claim the top spot.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                whileHover={{ scale: 1.02 }}
                className={`rounded-3xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  index === 0
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : index === 1
                    ? "bg-slate-400/5 border-slate-400/20"
                    : index === 2
                    ? "bg-orange-500/5 border-orange-500/20"
                    : "bg-white/5 border-purple-500/20"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <PlayerAvatar
                      name={player.name}
                      avatarUrl={player.avatarUrl}
                      size="lg"
                      className={index === 0 ? "ring-2 ring-yellow-400/60" : index === 1 ? "ring-2 ring-slate-300/40" : index === 2 ? "ring-2 ring-orange-400/40" : ""}
                    />
                    {index < 3 && (
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-[#0F0D1E] border border-white/10">
                        <Trophy className={TROPHY_COLOR[index] ?? "text-slate-400"} size={13} />
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">#{index + 1}</p>
                    <h3 className="text-2xl font-bold text-white">{player.gamerTag || player.name}</h3>
                    <p className={`text-sm font-semibold ${RANK_COLOR[player.rank] ?? "text-slate-400"}`}>
                      {player.rank}
                      {player.favoriteGame ? ` · ${player.favoriteGame}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-black text-purple-400">{player.xp.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">XP</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/leaderboards"
            className="inline-block border border-cyan-400 hover:bg-cyan-400/10 transition px-8 py-4 rounded-full uppercase tracking-wide text-sm font-semibold"
          >
            View Full Leaderboard →
          </Link>
        </div>

      </div>
    </section>
  );
}
