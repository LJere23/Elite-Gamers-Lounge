"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Device,
} from "@/types/device";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface Session {

  id: string;

  playerName: string;

  game: string;

  deviceId: string;

  deviceName: string;

  startTime: string;

  endTime: string;

  totalPrice: number;

  status:
    | "ACTIVE"
    | "ENDED";
}

interface Notification {

  id: string;

  type:
    | "warning"
    | "ended";

  message: string;
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function SessionsPage() {

  const [devices, setDevices] =
    useState<Device[]>([]);

  const [sessions, setSessions] =
    useState<Session[]>([]);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [form, setForm] =
    useState({

      playerName: "",

      game: "FC25",

      deviceId: "",

      hours: 1,
    });

  /*
  |--------------------------------------------------------------------------
  | LOAD DEVICES
  |--------------------------------------------------------------------------
  */

  async function loadDevices() {

    try {

      const response =
        await fetch(
          "/api/devices"
        );

      const data =
        await response.json();

      setDevices(data);

    } catch (error) {

      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD SESSIONS
  |--------------------------------------------------------------------------
  */

  async function loadSessions() {

    try {

      const response =
        await fetch(
          "/api/sessions"
        );

      const data =
        await response.json();

      /*
      -----------------------------------
      ACTIVE FIRST
      NEWEST FIRST
      -----------------------------------
      */

      const sorted =
        data.sort(
          (
            a: Session,
            b: Session
          ) => {

            if (
              a.status ===
                "ACTIVE" &&
              b.status !==
                "ACTIVE"
            ) {
              return -1;
            }

            if (
              a.status !==
                "ACTIVE" &&
              b.status ===
                "ACTIVE"
            ) {
              return 1;
            }

            return (
              new Date(
                b.startTime
              ).getTime() -
              new Date(
                a.startTime
              ).getTime()
            );
          }
        );

      setSessions(sorted);

    } catch (error) {

      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | START SESSION
  |--------------------------------------------------------------------------
  */

  async function startSession(
    event: React.FormEvent
  ) {

    event.preventDefault();

    try {

      setLoading(true);

      const response =
        await fetch(
          "/api/sessions",
          {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              playerName:
                form.playerName,

              game:
                form.game,

              deviceId:
                form.deviceId,

              hours:
                form.hours,
            }),
          }
        );

      const created =
        await response.json();

      if (created.error) {

        alert(created.error);

        return;
      }

      await loadSessions();

      await loadDevices();

      setForm({

        playerName: "",

        game: "FC25",

        deviceId: "",

        hours: 1,
      });

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | END SESSION
  |--------------------------------------------------------------------------
  */

  async function endSession(
    session: Session,
    automatic = false
  ) {

    try {

      await fetch(
        `/api/sessions/${session.id}`,
        {

          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            status:
              "ENDED",
          }),
        }
      );

      await fetch(
        `/api/devices/${session.deviceId}`,
        {

          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            status:
              "available",

            currentSessionId:
              null,
          }),
        }
      );

      /*
      -----------------------------------
      NOTIFICATION
      -----------------------------------
      */

      setNotifications(
        (prev) => [

          {
            id:
              crypto.randomUUID(),

            type:
              "ended",

            message:
              automatic
                ? `${session.playerName}'s session expired on ${session.deviceName}`
                : `${session.playerName}'s session ended`,
          },

          ...prev,
        ]
      );

      await loadSessions();

      await loadDevices();

    } catch (error) {

      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    loadDevices();

    loadSessions();

  }, []);

  /*
  |--------------------------------------------------------------------------
  | AUTO REFRESH + AUTO END
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const interval =
      setInterval(async () => {

        const response =
          await fetch(
            "/api/sessions"
          );

        const data =
          await response.json();

        /*
        -----------------------------------
        CHECK EXPIRY
        -----------------------------------
        */

        for (const session of data) {

          if (
            session.status ===
            "ACTIVE"
          ) {

            const end =
              new Date(
                session.endTime
              ).getTime();

            const remaining =
              end - Date.now();

            /*
            WARNING
            */

            if (
              remaining <=
                10 *
                  60 *
                  1000 &&
              remaining >
                9 *
                  60 *
                  1000
            ) {

              setNotifications(
                (prev) => [

                  {
                    id:
                      crypto.randomUUID(),

                    type:
                      "warning",

                    message:
                      `${session.playerName}'s session ends in under 10 minutes`,
                  },

                  ...prev,
                ]
              );
            }

            /*
            AUTO END
            */

            if (
              Date.now() >=
              end
            ) {

              await endSession(
                session,
                true
              );
            }
          }
        }

        await loadSessions();

        await loadDevices();

      }, 10000);

    return () =>
      clearInterval(interval);

  }, []);

  /*
  |--------------------------------------------------------------------------
  | AVAILABLE DEVICES
  |--------------------------------------------------------------------------
  */

  const availableDevices =
    useMemo(() => {

      return devices.filter(
        (device) =>
          device.status ===
          "available"
      );

    }, [devices]);

  /*
  |--------------------------------------------------------------------------
  | TIME REMAINING
  |--------------------------------------------------------------------------
  */

  function getRemainingTime(
    endTime: string
  ) {

    const end =
      new Date(
        endTime
      ).getTime();

    const now =
      Date.now();

    const difference =
      end - now;

    if (
      difference <= 0
    ) {

      return "Expired";
    }

    const hours =
      Math.floor(
        difference /
          (1000 * 60 * 60)
      );

    const minutes =
      Math.floor(
        (
          difference %
          (1000 * 60 * 60)
        ) /
          (1000 * 60)
      );

    return `${hours}h ${minutes}m`;
  }

  return (

    <main className="p-6 md:p-8 space-y-8">

      {/* HEADER */}

      <div>

        <h1 className="text-4xl font-black text-white">
          Sessions
        </h1>

        <p className="text-zinc-400 mt-2">
          Manage live gaming sessions.
        </p>

      </div>

      {/* NOTIFICATIONS */}

      {notifications.length > 0 && (

        <div className="space-y-3">

          {notifications
            .slice(0, 5)
            .map((notification) => (

              <div
                key={notification.id}
                className={`
                  rounded-2xl
                  p-4
                  border

                  ${
                    notification.type ===
                    "warning"

                      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"

                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }
                `}
              >

                {notification.message}

              </div>
            ))}

        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={startSession}
        className="
          bg-zinc-950
          border border-white/10
          rounded-3xl
          p-6
          grid gap-5
          md:grid-cols-2
        "
      >

        <input
          required
          placeholder="Player Name"
          value={form.playerName}
          onChange={(e) =>
            setForm({
              ...form,
              playerName:
                e.target.value,
            })
          }
          className="
            bg-black
            border border-white/10
            rounded-2xl
            px-4 py-3
            text-white
          "
        />

        <select
          value={form.game}
          onChange={(e) =>
            setForm({
              ...form,
              game:
                e.target.value,
            })
          }
          className="
            bg-black
            border border-white/10
            rounded-2xl
            px-4 py-3
            text-white
          "
        >

          <option>FC25</option>
          <option>Tekken 8</option>
          <option>Mortal Kombat</option>
          <option>Gran Turismo</option>
          <option>Call Of Duty</option>

        </select>

        <select
          required
          value={form.deviceId}
          onChange={(e) =>
            setForm({
              ...form,
              deviceId:
                e.target.value,
            })
          }
          className="
            bg-black
            border border-white/10
            rounded-2xl
            px-4 py-3
            text-white
          "
        >

          <option value="">
            Select Device
          </option>

          {availableDevices.map(
            (device) => (

              <option
                key={device.id}
                value={device.id}
              >

                {device.name}
                {" • "}
                $
                {device.hourlyRate}/hr

              </option>
            )
          )}

        </select>

        <input
          type="number"
          min={1}
          value={form.hours}
          onChange={(e) =>
            setForm({
              ...form,
              hours:
                Number(
                  e.target.value
                ),
            })
          }
          className="
            bg-black
            border border-white/10
            rounded-2xl
            px-4 py-3
            text-white
          "
        />

        <button
          type="submit"
          disabled={loading}
          className="
            md:col-span-2
            bg-cyan-400
            hover:bg-cyan-300
            transition
            text-black
            font-black
            py-4
            rounded-2xl
          "
        >

          {loading
            ? "Starting..."
            : "Start Session"}

        </button>

      </form>

      {/* SESSIONS */}

      <div className="space-y-5">

        {sessions.map((session) => (

          <div
            key={session.id}
            className="
              bg-zinc-950
              border border-white/10
              rounded-3xl
              p-6
            "
          >

            <div className="flex items-start justify-between">

              <div>

                <h2 className="text-2xl font-black text-white">
                  {session.playerName}
                </h2>

                <p className="text-zinc-400 mt-1">
                  {session.game}
                </p>

              </div>

              <span
                className={`
                  px-3 py-1 rounded-full text-xs font-bold

                  ${
                    session.status ===
                    "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-zinc-700 text-zinc-300"
                  }
                `}
              >

                {session.status}

              </span>

            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 text-zinc-300">

              <p>
                Device:
                {" "}
                {session.deviceName}
              </p>

              <p>
                Total:
                {" "}
                $
                {Number(
                  session.totalPrice || 0
                ).toFixed(2)}
              </p>

              <p>
                Start:
                {" "}
                {new Date(
                  session.startTime
                ).toLocaleString()}
              </p>

              <p>
                End:
                {" "}
                {new Date(
                  session.endTime
                ).toLocaleString()}
              </p>

              {session.status ===
                "ACTIVE" && (

                <p className="md:col-span-2 text-cyan-400 font-bold">

                  Remaining:
                  {" "}
                  {getRemainingTime(
                    session.endTime
                  )}

                </p>
              )}

            </div>

            {session.status ===
              "ACTIVE" && (

              <button
                onClick={() =>
                  endSession(
                    session
                  )
                }
                className="
                  mt-6
                  bg-red-500
                  hover:bg-red-400
                  transition
                  text-black
                  px-5 py-3
                  rounded-2xl
                  font-bold
                "
              >

                End Session

              </button>
            )}

          </div>
        ))}

      </div>

    </main>
  );
}