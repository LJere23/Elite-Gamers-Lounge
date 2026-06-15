import type { LeaderboardPlayer, Tier, GameCategory } from "@/types/leaderboard";

function rankToTier(rank: string): Tier {
  const map: Record<string, Tier> = {
    Legend: "Champion",
    Hero: "Pro",
    Warrior: "Elite",
    Adventurer: "Competitive",
    Villager: "Casual",
  };
  return map[rank] ?? "Rookie";
}

export async function fetchLeaderboardPlayers(): Promise<LeaderboardPlayer[]> {
  try {
    const res = await fetch("/api/players", { cache: "no-store" });
    if (!res.ok) return [];
    const players = await res.json();

    return players
      .sort(
        (a: { xp: number }, b: { xp: number }) => b.xp - a.xp
      )
      .slice(0, 50)
      .map(
        (
          p: {
            id: string;
            gamerTag: string;
            name: string;
            rank: string;
            xp: number;
            favoriteGame?: string;
            visitCount: number;
            lastVisitAt?: string;
            avatarUrl?: string | null;
          },
          i: number
        ): LeaderboardPlayer => ({
          id: i + 1,
          username: p.gamerTag,
          avatar: p.gamerTag.slice(0, 2).toUpperCase(),
          avatarUrl: p.avatarUrl ?? null,
          game: (p.favoriteGame as GameCategory) ?? "FIFA/MK",
          rank: i + 1,
          tier: rankToTier(p.rank),
          wins: Math.floor(p.visitCount * 0.6),
          gamesPlayed: p.visitCount,
          streak: p.visitCount % 6,
          points: p.xp,
          movement: 0,
          lastSeen: p.lastVisitAt
            ? new Date(p.lastVisitAt).toLocaleDateString()
            : "—",
          isLive: false,
        })
      );
  } catch {
    return [];
  }
}
