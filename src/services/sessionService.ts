import { Session } from "@/types/models";

import {
  lockDevice,
  releaseDevice,
} from "@/services/deviceService";

const API_URL =
  "/api/sessions";

/*
|--------------------------------------------------------------------------
| GET ALL SESSIONS
|--------------------------------------------------------------------------
*/

export async function getSessions():
Promise<Session[]> {

  const response =
    await fetch(API_URL);

  if (!response.ok) {

    throw new Error(
      "Failed to fetch sessions"
    );
  }

  return response.json();
}

/*
|--------------------------------------------------------------------------
| CREATE SESSION
|--------------------------------------------------------------------------
*/

interface CreateSessionPayload {

  playerName: string;

  game: string;

  deviceId: string;

  deviceType: string;

  station: string;

  durationHours: number;

  totalPriceUsd: number;
}

export async function createSession(
  payload: CreateSessionPayload
): Promise<Session> {

  /*
  |--------------------------------------------------------------------------
  | CREATE SESSION OBJECT
  |--------------------------------------------------------------------------
  */

  const sessionData =
    {

      playerName:
        payload.playerName,

      game:
        payload.game,

      deviceType:
        payload.deviceType,

      station:
        payload.station,

      durationHours:
        payload.durationHours,

      totalPriceUsd:
        payload.totalPriceUsd,

      startedAt:
        new Date().toISOString(),

      expiresAt:
        new Date(
          Date.now() +
          payload.durationHours *
          60 *
          60 *
          1000
        ).toISOString(),

      status:
        "active",
    };

  /*
  |--------------------------------------------------------------------------
  | CREATE SESSION
  |--------------------------------------------------------------------------
  */

  const response =
    await fetch(
      API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          sessionData
        ),
      }
    );

  if (!response.ok) {

    throw new Error(
      "Failed to create session"
    );
  }

  const createdSession =
    await response.json();

  /*
  |--------------------------------------------------------------------------
  | LOCK DEVICE
  |--------------------------------------------------------------------------
  */

  await lockDevice(
    payload.deviceId,
    createdSession.id
  );

  return createdSession;
}

/*
|--------------------------------------------------------------------------
| END SESSION
|--------------------------------------------------------------------------
*/

export async function endSession(
  sessionId: string,
  deviceId: string
): Promise<Session> {

  /*
  |--------------------------------------------------------------------------
  | UPDATE SESSION
  |--------------------------------------------------------------------------
  */

  const response =
    await fetch(
      `${API_URL}/${sessionId}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          status:
            "completed",
        }),
      }
    );

  if (!response.ok) {

    throw new Error(
      "Failed to end session"
    );
  }

  const updatedSession =
    await response.json();

  /*
  |--------------------------------------------------------------------------
  | RELEASE DEVICE
  |--------------------------------------------------------------------------
  */

  await releaseDevice(
    deviceId
  );

  return updatedSession;
}

/*
|--------------------------------------------------------------------------
| DELETE SESSION
|--------------------------------------------------------------------------
*/

export async function deleteSession(
  id: string
): Promise<void> {

  const response =
    await fetch(
      `${API_URL}/${id}`,
      {
        method:
          "DELETE",
      }
    );

  if (!response.ok) {

    throw new Error(
      "Failed to delete session"
    );
  }
}

/*
|--------------------------------------------------------------------------
| ANALYTICS HELPERS
|--------------------------------------------------------------------------
*/

export function getActiveSessionsCount(
  sessions: Session[]
): number {

  return sessions.filter(
    (session) =>
      session.status ===
      "active"
  ).length;
}

export function calculateSessionRevenue(
  sessions: Session[]
): number {

  return sessions.reduce(
    (
      total,
      session
    ) =>
      total +
      session.totalPriceUsd,
    0
  );
}

/*
|--------------------------------------------------------------------------
| OVERDUE SESSIONS
|--------------------------------------------------------------------------
*/

export function getOverdueSessions(
  sessions: Session[]
): Session[] {

  return sessions.filter(
    (session) =>
      session.status ===
        "active" &&
      new Date(
        session.expiresAt
      ).getTime() <
        Date.now()
  );
}