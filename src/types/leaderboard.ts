export type Tier =
  | "Champion"
  | "Pro"
  | "Elite"
  | "Competitive"
  | "Casual"
  | "Rookie";

export type GameCategory =
  | "FIFA/MK"
  | "Racing Sim"
  | "Pool"
  | "Darts"
  | "Chess";

export interface LeaderboardPlayer {
  id: number;

  username: string;

  avatar: string;

  avatarUrl?: string | null;

  game: GameCategory;

  rank: number;

  tier: Tier;

  wins: number;

  gamesPlayed: number;

  streak: number;

  points: number;

  movement: number;

  lastSeen: string;

  isLive: boolean;
}