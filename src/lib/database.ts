import fs from "fs/promises";

import path from "path";

import {
  Store,
  Session,
  WifiUsage,
  AnalyticsPayload,
  Player,
  Tournament,
  TournamentEntry,
  TournamentMatch,
  MembershipPlan,
  Announcement,
  Notification,
} from "../types/admin";

import { Device } from "@/types/device";

/*
|--------------------------------------------------------------------------
| DATABASE PATH
|--------------------------------------------------------------------------
*/

const databasePath = path.join(
  process.cwd(),
  "src",
  "data",
  "store.json"
);

/*
|--------------------------------------------------------------------------
| DEFAULT STORE
|--------------------------------------------------------------------------
*/

const defaultStore: Store = {

  devices: [],

  players: [],

  sessions: [],

  tournaments: [],

  entries: [],

  matches: [],

  wifi: [],

  memberships: [],

  announcements: [],

  notifications: [],
};

/*
|--------------------------------------------------------------------------
| ENSURE DATABASE EXISTS
|--------------------------------------------------------------------------
*/

async function ensureDatabase() {

  try {

    await fs.access(databasePath);

  } catch {

    await fs.mkdir(
      path.dirname(databasePath),
      {
        recursive: true,
      }
    );

    await fs.writeFile(
      databasePath,
      JSON.stringify(
        defaultStore,
        null,
        2
      )
    );
  }
}

/*
|--------------------------------------------------------------------------
| READ STORE
|--------------------------------------------------------------------------
*/

export async function readStore(): Promise<Store> {

  await ensureDatabase();

  const raw =
    await fs.readFile(
      databasePath,
      "utf-8"
    );

  const parsed =
    JSON.parse(raw);

  return {

    devices:
      (parsed.devices || []).map(
        (device: Device) => ({
          ...device,
          status: String(device.status).toLowerCase() as Device["status"],
        })
      ) as Device[],

    players:
      (parsed.players || []) as Player[],

    sessions:
      (parsed.sessions || []) as Session[],

    tournaments:
      (parsed.tournaments || []) as Tournament[],

    entries:
      (parsed.entries || []) as TournamentEntry[],

    matches:
      (parsed.matches || []) as TournamentMatch[],

    wifi:
      (parsed.wifi || []) as WifiUsage[],

    memberships:
      (parsed.memberships || []) as MembershipPlan[],

    announcements:
      (parsed.announcements || []) as Announcement[],

    notifications:
      (parsed.notifications || []) as Notification[],
  };
}

/*
|--------------------------------------------------------------------------
| WRITE STORE
|--------------------------------------------------------------------------
*/

export async function writeStore(
  store: Store
) {

  await fs.writeFile(
    databasePath,
    JSON.stringify(
      store,
      null,
      2
    )
  );
}

export async function createNotification(
  _type: string,
  message: string
) {
  const store = await readStore();
  const notification = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message,
    severity: (_type === "WIFI" ? "warning" : "info") as "info" | "warning" | "success",
    createdAt: new Date().toISOString(),
  };

  await writeStore({
    ...store,
    notifications: [notification, ...store.notifications],
  });

  console.log("[createNotification]", _type, message);
}

export async function createAnnouncement(
  message: string,
  expiresInDays = 7
) {
  const store = await readStore();
  const announcement = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
  };

  await writeStore({
    ...store,
    announcements: [announcement, ...store.announcements],
  });

  return announcement;
}

export async function createTournamentAnnouncement(
  tournamentId: string,
  tournamentName: string,
  message: string,
  winnerName?: string,
  prizeAmount?: string,
  type = "champion"
) {
  const store = await readStore();
  const announcement = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    tournamentId,
    tournamentName,
    message,
    winnerName,
    prizeAmount,
    type,
    createdAt: new Date().toISOString(),
  };

  await writeStore({
    ...store,
    announcements: [announcement, ...store.announcements],
  });

  return announcement;
}

/*
|--------------------------------------------------------------------------
| SAVE RESOURCE
|--------------------------------------------------------------------------
*/

export async function saveResource(
  resource: keyof Store,
  data: any[]
) {

  const store =
    await readStore();

  store[resource] = data as never;

  await writeStore(store);
}

/*
|--------------------------------------------------------------------------
| UPDATE SESSION TIMERS
|--------------------------------------------------------------------------
*/

function updateSessionTimers(
  sessions: Session[]
): Session[] {

  return sessions.map(
    (session) => {

      if (
        session.status !==
        "ACTIVE"
      ) {

        return session;
      }

      const remainingMs =
        new Date(
          session.endTime
        ).getTime() -
        Date.now();

      const remainingMinutes =
        Math.max(
          0,
          Math.floor(
            remainingMs / 60000
          )
        );

      return {

        ...session,

        remainingMinutes,

        status:
          (remainingMinutes <= 0
            ? ("ENDED" as Session["status"])
            : session.status),
      } as Session;
    }
  );
}

/*
|--------------------------------------------------------------------------
| UPDATE WIFI TIMERS
|--------------------------------------------------------------------------
*/

function updateWifiTimers(
  wifi: WifiUsage[]
): WifiUsage[] {

  return wifi.map(
    (item) => {

      if (
        item.status !==
        "active"
      ) {

        return item;
      }

      const remainingMs =
        new Date(
          item.expiresAt
        ).getTime() -
        Date.now();

      const remainingMinutes =
        Math.max(
          0,
          Math.floor(
            remainingMs / 60000
          )
        );

      return {

        ...item,

        remainingMinutes,

        status:
          (remainingMinutes <= 0
            ? ("expired" as WifiUsage["status"])
            : item.status),
      } as WifiUsage;
    }
  );
}

/*
|--------------------------------------------------------------------------
| ANALYTICS
|--------------------------------------------------------------------------
*/

export async function getAnalytics():
  Promise<AnalyticsPayload> {

  const store =
    await readStore();

  /*
  |--------------------------------------------------------------------------
  | UPDATE TIMERS
  |--------------------------------------------------------------------------
  */

  const updatedSessions =
    updateSessionTimers(
      store.sessions
    );

  const updatedWifi =
    updateWifiTimers(
      store.wifi
    );

  /*
  |--------------------------------------------------------------------------
  | AUTO SAVE UPDATED STATES
  |--------------------------------------------------------------------------
  */

  await writeStore({

    ...store,

    sessions:
      updatedSessions,

    wifi:
      updatedWifi,
  });

  /*
  |--------------------------------------------------------------------------
  | ACTIVE SESSIONS
  |--------------------------------------------------------------------------
  */

  const activeSessions =
    updatedSessions.filter(
      (session) =>
        session.status ===
        "ACTIVE"
    );

  /*
  |--------------------------------------------------------------------------
  | ACTIVE WIFI
  |--------------------------------------------------------------------------
  */

  const activeWifi =
    updatedWifi.filter(
      (wifi) =>
        wifi.status ===
        "active"
    );

  /*
  |--------------------------------------------------------------------------
  | SESSION REVENUE
  |--------------------------------------------------------------------------
  */

  const sessionRevenue =
    updatedSessions.reduce(
      (
        total,
        session
      ) =>
        total +
        Number(
          session.totalPrice || 0
        ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | WIFI REVENUE
  |--------------------------------------------------------------------------
  */

  const wifiRevenue =
    updatedWifi.reduce(
      (
        total,
        wifi
      ) =>
        total +
        Number(
          wifi.priceUsd || 0
        ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | MEMBERSHIP REVENUE
  |--------------------------------------------------------------------------
  */

  const activeMembers =
    store.players.filter(
      (player) =>
        player.membershipType ===
        "member" &&
        !!player.membershipExpiresAt &&
        new Date(
          player.membershipExpiresAt
        ).getTime() >
        Date.now()
    );

  const membershipRevenue =
    activeMembers.reduce(
      (
        total,
        player
      ) => {
        const plan = store.memberships.find(
          (item) =>
            item.name ===
            player.membershipPlan
        );

        return (
          total +
          Number(
            plan?.priceUsd ||
            0
          )
        );
      },
      0
    );

  /*
  |--------------------------------------------------------------------------
  | TOTAL REVENUE
  |--------------------------------------------------------------------------
  */

  const totalRevenueUsd =
    sessionRevenue +
    wifiRevenue +
    membershipRevenue;

  /*
  |--------------------------------------------------------------------------
  | MOST PLAYED GAMES
  |--------------------------------------------------------------------------
  */

  const gameCounts:
    Record<string, number> =
    {};

  updatedSessions.forEach(
    (session) => {

      gameCounts[
        session.game
      ] =
        (gameCounts[
          session.game
        ] || 0) + 1;
    }
  );

  const mostPlayedGames =
    Object.entries(
      gameCounts
    )
      .map(
        ([game, count]) => ({
          game,
          count,
        })
      )
      .sort(
        (a, b) =>
          b.count -
          a.count
      )
      .slice(0, 5);

  /*
  |--------------------------------------------------------------------------
  | DEVICE USAGE
  |--------------------------------------------------------------------------
  */

  const deviceCounts:
    Record<string, number> =
    {};

  updatedSessions.forEach(
    (session) => {

      deviceCounts[
        session.deviceName
      ] =
        (deviceCounts[
          session.deviceName
        ] || 0) + 1;
    }
  );

  const mostUsedStations =
    Object.entries(
      deviceCounts
    )
      .map(
        (
          [station, count]
        ) => ({
          station,
          count,
        })
      )
      .sort(
        (a, b) =>
          b.count -
          a.count
      )
      .slice(0, 5);

  /*
  |--------------------------------------------------------------------------
  | NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const computedNotifications = [

    ...activeSessions
      .filter(
        (session) =>
          session.remainingMinutes <=
          10
      )
      .map(
        (session) => ({

          id:
            session.id,

          message:
            `${session.playerName}'s session on ${session.deviceName} ends in ${session.remainingMinutes} mins`,

          severity:
            "warning" as const,
        })
      ),

    ...updatedSessions
      .filter(
        (session) =>
          session.status ===
          "ENDED"
      )
      .slice(-3)
      .map(
        (session) => ({

          id:
            `ended-${session.id}`,

          message:
            `${session.playerName}'s session ended on ${session.deviceName}`,

          severity:
            "success" as const,
        })
      ),

    ...activeWifi
      .filter(
        (wifi) =>
          wifi.remainingMinutes <=
          10
      )
      .map(
        (wifi) => ({

          id:
            wifi.id,

          message:
            `${wifi.name}'s WiFi expires in ${wifi.remainingMinutes} mins`,

          severity:
            "warning" as const,
        })
      ),
  ];

  const notifications = [
    ...store.notifications,
    ...computedNotifications,
  ];

  /*
  |--------------------------------------------------------------------------
  | EXTRA METRICS
  |--------------------------------------------------------------------------
  */

  const completedSessions =
    updatedSessions.filter(
      (session) =>
        session.status ===
        "ENDED"
    ).length;

  const totalGamingHours =
    updatedSessions.reduce(
      (
        total,
        session
      ) =>
        total +
        Number(
          session.durationHours
        ),
      0
    );

  const averageSessionRevenue =
    updatedSessions.length > 0
      ? Number(
          (
            sessionRevenue /
            updatedSessions.length
          ).toFixed(2)
        )
      : 0;

  const busiestGame =
    mostPlayedGames[0]
      ?.game || "N/A";

  const busiestDevice =
    mostUsedStations[0]
      ?.station || "N/A";

  /*
  |--------------------------------------------------------------------------
  | SORT ACTIVE SESSIONS
  |--------------------------------------------------------------------------
  */

  const activeSessionsList =
    activeSessions.sort(
      (a, b) =>
        new Date(
          b.startTime
        ).getTime() -
        new Date(
          a.startTime
        ).getTime()
    );

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {

    totalRevenueUsd,

    activeSessions:
      activeSessions.length,

    activeWifiUsers:
      activeWifi.length,

    totalMembers:
      activeMembers.length,

    revenueByCategory: {

      sessions:
        sessionRevenue,

      memberships:
        membershipRevenue,

      wifi:
        wifiRevenue,
    },

    announcements:
      store.announcements,

    mostPlayedGames,

    mostUsedStations,

    notifications,

    activeSessionsList,

    activeWifiList:
      activeWifi,

    completedSessions,

    totalGamingHours,

    averageSessionRevenue,

    busiestGame,

    busiestDevice,
  };
}