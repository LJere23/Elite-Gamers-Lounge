import { ReactNode } from "react";

import type { Device } from "./device";

/*
|--------------------------------------------------------------------------
| STATUS TYPES
|--------------------------------------------------------------------------
*/

export type PlayerStatus =
  | "active"
  | "inactive"
  | "banned";

export type SessionStatus =
  | "ACTIVE"
  | "ENDED"
  | "PAUSED";

export type TournamentStatus =
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled";

export type TournamentEntryStatus =
  | "registered"
  | "confirmed"
  | "eliminated";

export interface TournamentEntry {
  id: string;
  tournamentId: string;
  playerId: string;
  playerName: string;
  playerAvatarUrl?: string | null;
  registeredAt: string;
  status: TournamentEntryStatus;
  points: number;
  wins: number;
  losses: number;
  bestLapTime?: number;
  lapTimeNote?: string;
}

export type MatchStatus =
  | "scheduled"
  | "in_progress"
  | "completed";

export type MatchStage =
  | "Round 1"
  | "Round 2"
  | "Quarter Final"
  | "Semi Final"
  | "Final"
  | "Grand Final";

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  scheduledAt: string;
  status: MatchStatus;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  winnerName?: string | null;
  round: number;
  stage: MatchStage;
  isBye?: boolean;
  bracket?: "winner" | "loser" | "grand_final";
  // Best-of series fields
  game1ScoreA?: number | null;
  game1ScoreB?: number | null;
  game2ScoreA?: number | null;
  game2ScoreB?: number | null;
  game3ScoreA?: number | null;
  game3ScoreB?: number | null;
  seriesWinsA?: number;
  seriesWinsB?: number;
}

export type WifiStatus =
  | "active"
  | "expired";

/*
|--------------------------------------------------------------------------
| PLAYER
|--------------------------------------------------------------------------
*/

export interface Player {
  id: string;
  name: string;
  gamerTag: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  city: string;
  age?: number;
  membershipType?: "member" | "visitor"; // legacy compat
  membershipTier: string; // "Villager" | "Adventurer" | "Warrior" | "Hero" | "Legend"
  membershipPlan?: string; // legacy compat
  membershipExpiresAt?: string;
  status: PlayerStatus;
  xp: number;
  rank: string;
  visitCount: number;
  favoriteGame?: string;
  joinedAt: string;
  lastVisitAt?: string;
  avatarUrl?: string | null;
}

/*
|--------------------------------------------------------------------------
| RPG LOYALTY SYSTEM
|--------------------------------------------------------------------------
*/

export interface PlayerTitle {
  id: string;
  playerId: string;
  title: string;
  awardedAt: string;
}

export interface XpLedgerEntry {
  id: string;
  playerId: string;
  amount: number;
  source: string; // "visit" | "job" | "manual" | "birthday" | "rank_up"
  jobId?: string;
  note?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  active: boolean;
}

export interface JobCompletion {
  id: string;
  playerId: string;
  jobId: string;
  completedAt: string;
}

/*
|--------------------------------------------------------------------------
| LOUNGE SETTINGS
|--------------------------------------------------------------------------
*/

export interface LoungeSettings {
  id: string;
  name: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  sessionRate: number;
  wifiRate: number;
  currency: string;
  openingTime: string;
  closingTime: string;
  whatsappNumber?: string;
  adminPassword?: string;
  communityHeadline?: string;
  communityBody?: string;
  communityStat1Label?: string;
  communityStat1Value?: string;
  communityStat2Label?: string;
  communityStat2Value?: string;
  communityStat3Label?: string;
  communityStat3Value?: string;
  countdownEnabled?: boolean;
  countdownTitle?: string;
  countdownDate?: string;
}

/*
|--------------------------------------------------------------------------
| SESSION
|--------------------------------------------------------------------------
*/

export interface Session {
  id: string;
  playerName: string;
  game: string;
  deviceId: string;
  deviceName: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalPrice: number;
  remainingMinutes: number;
  status: SessionStatus;
}

/*
|--------------------------------------------------------------------------
| TOURNAMENT
|--------------------------------------------------------------------------
*/

export type TournamentCategory =
  | "Sports Games"
  | "Racing"
  | "Fighting"
  | "Strategy"
  | "Minds";

export type TournamentFormat =
  | "knockout"
  | "points_league"
  | "fastest_lap"
  | "swiss"
  | "double_elimination";

export type ScoringSystem =
  | "best_of_1"
  | "best_of_3"
  | "best_of_5";

export interface Tournament {
  id: string;
  name: string;
  game: string;
  category: TournamentCategory;
  format: TournamentFormat;
  status: TournamentStatus;
  startAt: string;
  endAt: string;
  entries: number;
  prizeUsd: number;
  prizeDescription: string;
  scoringSystem: ScoringSystem;
  currentRound?: number;
  prizeAmount?: string;
  winnerId?: string;
  winnerName?: string;
  runnerUpId?: string;
  runnerUpName?: string;
  completedAt?: string;
}

/*
|--------------------------------------------------------------------------
| WIFI USAGE
|--------------------------------------------------------------------------
*/

export interface WifiUsage {
  id: string;
  name: string;
  device: string;
  station: string;
  status: WifiStatus;
  startedAt: string;
  expiresAt: string;
  durationHours: number;
  remainingMinutes: number;
  priceUsd: number;
}

/*
|--------------------------------------------------------------------------
| MEMBERSHIP
|--------------------------------------------------------------------------
*/

export interface MembershipPlan {
  id: string;
  name: string;
  priceUsd: number;
  period: string;
  description: string;
  perks: string[];
}

export interface Announcement {
  id: string;
  tournamentId?: string;
  tournamentName?: string;
  message: string;
  winnerName?: string;
  prizeAmount?: string;
  type?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Notification {
  id: string;
  message: string;
  severity: "success" | "warning" | "info";
  createdAt: string;
}

/*
|--------------------------------------------------------------------------
| DEVICE
|--------------------------------------------------------------------------
*/

// Device is defined in /src/types/device.ts

/*
|--------------------------------------------------------------------------
| STORE
|--------------------------------------------------------------------------
*/

// Note: Store is kept for backward compatibility. In the new Prisma system,
// readStore() is no longer the primary data access pattern.
export interface Store {
  devices: Device[];
  players: Player[];
  sessions: Session[];
  tournaments: Tournament[];
  entries: TournamentEntry[];
  matches: TournamentMatch[];
  wifi: WifiUsage[];
  memberships: MembershipPlan[];
  announcements: Announcement[];
  notifications: Notification[];
}

/*
|--------------------------------------------------------------------------
| ANALYTICS
|--------------------------------------------------------------------------
*/

export interface AnalyticsPayload {
  /*
  -----------------------------------
  MAIN STATS
  -----------------------------------
  */
  totalRevenueUsd: number;
  activeSessions: number;
  activeWifiUsers: number;
  totalMembers: number;

  /*
  -----------------------------------
  REVENUE BREAKDOWN
  -----------------------------------
  */
  revenueByCategory: {
    sessions: number;
    memberships: number;
    wifi: number;
  };

  /*
  -----------------------------------
  GAME ANALYTICS
  -----------------------------------
  */
  mostPlayedGames: Array<{
    game: string;
    count: number;
  }>;

  /*
  -----------------------------------
  DEVICE ANALYTICS
  -----------------------------------
  */
  mostUsedStations: Array<{
    station: string;
    count: number;
  }>;

  /*
  -----------------------------------
  LIVE SESSIONS
  -----------------------------------
  */
  activeSessionsList: Session[];

  /*
  -----------------------------------
  WIFI USERS
  -----------------------------------
  */
  activeWifiList: WifiUsage[];

  announcements: Announcement[];

  /*
  -----------------------------------
  NOTIFICATIONS
  -----------------------------------
  */
  notifications: Array<{
    id: string;
    message: string;
    severity:
      | "info"
      | "warning"
      | "success";
  }>;

  /*
  -----------------------------------
  EXTRA BUSINESS METRICS
  -----------------------------------
  */
  completedSessions: number;
  totalGamingHours: number;
  averageSessionRevenue: number;
  busiestGame: string;
  busiestDevice: string;

  /*
  -----------------------------------
  DATE FILTERING / PERIOD METRICS
  -----------------------------------
  */
  revenueByPeriod?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  totalPlayers?: number;
  newPlayersThisMonth?: number;
}

/*
|--------------------------------------------------------------------------
| DASHBOARD CARD
|--------------------------------------------------------------------------
*/

export interface DashboardCardProps {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
}
