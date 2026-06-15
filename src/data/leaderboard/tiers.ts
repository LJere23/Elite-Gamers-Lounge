import type { Tier } from "@/types/leaderboard";

export const tierStyles: Record<Tier, string> = {
  Champion:    "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30",
  Pro:         "bg-purple-500/20 text-purple-400 border border-purple-400/30",
  Elite:       "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30",
  Competitive: "bg-blue-500/20 text-blue-400 border border-blue-400/30",
  Casual:      "bg-green-500/20 text-green-400 border border-green-400/30",
  Rookie:      "bg-zinc-700 text-zinc-400 border border-zinc-600",
};
