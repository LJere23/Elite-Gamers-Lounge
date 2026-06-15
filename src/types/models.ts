export type SessionStatus =
  | "active"
  | "completed"
  | "expired";

export type WifiStatus =
  | "active"
  | "expired";

export type TournamentStatus =
  | "upcoming"
  | "live"
  | "completed";

export interface Session {
  id: string;

  playerName: string;

  game: string;

  deviceId: string;

  deviceType: string;

  station: string;

  durationHours: number;

  startedAt: string;

  expiresAt: string;

  totalPriceUsd: number;

  status: SessionStatus;
}

export interface WifiSession {
  id: string;

  name: string;

  device: string;

  station: string;

  priceUsd: number;

  startedAt: string;

  expiresAt: string;

  status: WifiStatus;
}

export interface Tournament {
  id: string;

  name: string;

  game: string;

  prizePoolUsd: number;

  maxPlayers: number;

  currentPlayers: number;

  startDate: string;

  status: TournamentStatus;
}

export interface Player {
  id: string;

  gamerTag: string;

  favoriteGame: string;

  points: number;

  wins: number;

  losses: number;

  rank: number;
}

export interface MembershipPlan {
  id: string;

  name: string;

  priceUsd: number;

  durationDays: number;

  benefits: string[];
}

export interface AnalyticsPayload {
  activeSessions: number;

  activeWifiUsers: number;

  totalMembers: number;

  totalRevenueUsd: number;

  mostPlayedGames: {
    game: string;
    count: number;
  }[];

  mostUsedStations: {
    station: string;
    count: number;
  }[];

  revenueByCategory: {
    sessions: number;
    memberships: number;
    wifi: number;
  };

  notifications: {
    id: string;
    message: string;
  }[];
}