"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminPageHeader
  from "@/components/admin/AdminPageHeader";

import {
  WifiUsage,
} from "@/types/admin";

import {
  fetchWifiSessions,
  createWifiSession,
  stopWifiSession,
  sortWifiSessions,
} from "@/services/wifiService";

import {
  formatCountdown,
} from "@/utils/time";

const stations = [
  "Main Floor",
  "VIP Lounge",
  "Streaming Bay",
  "Arcade Zone",
];

export default function AdminWifiPage() {

  const [wifi, setWifi] =
    useState<WifiUsage[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [timeNow, setTimeNow] =
    useState(Date.now());

  const [form, setForm] =
    useState({
      name: "",
      device: "Laptop",
      station: stations[0],
      priceUsd: 5,
      durationMinutes: 60,
    });

  /*
    LOAD WIFI SESSIONS
  */

  useEffect(() => {

    fetchWifiSessions()
      .then(setWifi);

  }, []);

  /*
    LIVE TIMER REFRESH
  */

  useEffect(() => {

    const timer =
      window.setInterval(() => {

        setTimeNow(Date.now());

      }, 1000);

    return () =>
      window.clearInterval(timer);

  }, []);

  /*
    ACTIVE WIFI COUNT
  */

  const activeCount =
    useMemo(() => {

      return wifi.filter(
        (item) =>
          item.status === "active"
      ).length;

    }, [wifi]);

  /*
    CREATE WIFI SESSION
  */

  async function submitForm(
    event:
      React.FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setLoading(true);

    try {

      const payload = {

        name: form.name,

        device: form.device,

        station: form.station,

        priceUsd:
          Number(form.priceUsd),

        expiresAt:
          new Date(
            Date.now()
            + form.durationMinutes
            * 60000
          ).toISOString(),
      };

      const created =
        await createWifiSession(
          payload
        );

      setWifi((prev) => [
        created,
        ...prev,
      ]);

      setForm({
        name: "",
        device: "Laptop",
        station: stations[0],
        priceUsd: 5,
        durationMinutes: 60,
      });

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  }

  /*
    STOP WIFI SESSION
  */

  async function handleStopWifi(
    id: string
  ) {

    const updated =
      await stopWifiSession(id);

    setWifi((prev) =>
      prev.map((item) =>

        item.id === id
          ? updated
          : item

      )
    );
  }

  /*
    SORTED DISPLAY
  */

  const displayItems =
    sortWifiSessions(wifi);

  return (

    <section className="space-y-8">

      <AdminPageHeader
        title="WiFi management"
        description="
        Provision user access,
        view station usage,
        and manage active
        connections from
        one dashboard.
        "
      />

      <div
        className="
        grid gap-6
        lg:grid-cols-[1.4fr_0.6fr]
      "
      >

        {/* LEFT PANEL */}

        <div
          className="
          rounded-[2rem]
          border border-white/10
          bg-slate-950/80
          p-8
          shadow-2xl
          shadow-black/20
        "
        >

          <div
            className="
            flex items-center
            justify-between
            gap-4
          "
          >

            <div>

              <p
                className="
                text-sm uppercase
                tracking-[0.28em]
                text-cyan-400
              "
              >
                Live connections
              </p>

              <h2
                className="
                mt-3 text-3xl
                font-black text-white
              "
              >
                {activeCount}
                {" "}
                active WiFi users
              </h2>

            </div>

            <span
              className="
              rounded-full
              bg-white/5
              px-4 py-2
              text-sm
              text-slate-300
            "
            >
              {wifi.length}
              {" "}
              total sessions
            </span>

          </div>

          {/* WIFI LIST */}

          <div className="mt-8 space-y-4">

            {displayItems.map(
              (item) => (

              <div
                key={item.id}
                className="
                rounded-3xl
                border border-white/5
                bg-black/40
                p-5
              "
              >

                <div
                  className="
                  flex flex-col
                  gap-4
                  md:flex-row
                  md:items-center
                  md:justify-between
                "
                >

                  <div>

                    <p
                      className="
                      text-sm uppercase
                      tracking-[0.24em]
                      text-slate-400
                    "
                    >
                      {item.station}
                    </p>

                    <h3
                      className="
                      mt-2 text-xl
                      font-bold text-white
                    "
                    >
                      {item.name}
                    </h3>

                    <p
                      className="
                      text-sm
                      text-slate-300
                    "
                    >
                      {item.device}
                      {" — "}
                      $
                      {item.priceUsd}
                    </p>

                  </div>

                  <div
                    className="
                    space-y-2
                    text-right
                  "
                  >

                    <p
                      className="
                      text-sm text-slate-400
                    "
                    >
                      Expires
                    </p>

                    <p
                      className="
                      text-lg
                      font-semibold
                      text-white
                    "
                    >
                      {
                        formatCountdown(
                          item.expiresAt
                        )
                      }
                    </p>

                  </div>

                </div>

                <div
                  className="
                  mt-4
                  flex flex-wrap
                  gap-3
                "
                >

                  <button
                    className="
                    rounded-3xl
                    bg-red-500
                    px-5 py-3
                    text-sm
                    font-semibold
                    text-black
                    transition
                    hover:bg-red-400
                  "
                    onClick={() =>
                      handleStopWifi(
                        item.id
                      )
                    }
                  >
                    End session
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div
          className="
          rounded-[2rem]
          border border-white/10
          bg-slate-950/80
          p-8
          shadow-2xl
          shadow-black/20
        "
        >

          <h2
            className="
            text-2xl
            font-black
            text-white
          "
          >
            Assign WiFi access
          </h2>

          <p
            className="
            mt-3 text-slate-400
          "
          >
            Create a timed access
            session and track
            connection status.
          </p>

          <form
            className="
            mt-8 space-y-5
          "
            onSubmit={submitForm}
          >

            {/* NAME */}

            <label
              className="
              block text-sm
              font-semibold
              text-slate-100
            "
            >

              Name

              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name:
                      event.target.value,
                  })
                }
                placeholder="
                Member name
                "
                className="
                mt-3 w-full
                rounded-3xl
                border border-white/10
                bg-black/40
                px-4 py-3
                text-white
                outline-none
                focus:border-cyan-400
              "
              />

            </label>

            {/* DEVICE */}

            <label
              className="
              block text-sm
              font-semibold
              text-slate-100
            "
            >

              Device

              <input
                required
                value={form.device}
                onChange={(event) =>
                  setForm({
                    ...form,
                    device:
                      event.target.value,
                  })
                }
                placeholder="
                Laptop, Phone,
                Tablet
                "
                className="
                mt-3 w-full
                rounded-3xl
                border border-white/10
                bg-black/40
                px-4 py-3
                text-white
                outline-none
                focus:border-cyan-400
              "
              />

            </label>

            {/* STATION */}

            <label
              className="
              block text-sm
              font-semibold
              text-slate-100
            "
            >

              Station

              <select
                value={form.station}
                onChange={(event) =>
                  setForm({
                    ...form,
                    station:
                      event.target.value,
                  })
                }
                className="
                mt-3 w-full
                rounded-3xl
                border border-white/10
                bg-black/40
                px-4 py-3
                text-white
                outline-none
                focus:border-cyan-400
              "
              >

                {stations.map(
                  (station) => (

                  <option
                    key={station}
                    value={station}
                  >
                    {station}
                  </option>

                ))}

              </select>

            </label>

            {/* PRICE */}

            <label
              className="
              block text-sm
              font-semibold
              text-slate-100
            "
            >

              Price (USD)

              <input
                required
                type="number"
                value={form.priceUsd}
                onChange={(event) =>
                  setForm({
                    ...form,
                    priceUsd:
                      Number(
                        event.target.value
                      ),
                  })
                }
                className="
                mt-3 w-full
                rounded-3xl
                border border-white/10
                bg-black/40
                px-4 py-3
                text-white
                outline-none
                focus:border-cyan-400
              "
              />

            </label>

            {/* DURATION */}

            <label
              className="
              block text-sm
              font-semibold
              text-slate-100
            "
            >

              Duration (minutes)

              <input
                required
                type="number"
                value={
                  form.durationMinutes
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    durationMinutes:
                      Number(
                        event.target.value
                      ),
                  })
                }
                className="
                mt-3 w-full
                rounded-3xl
                border border-white/10
                bg-black/40
                px-4 py-3
                text-white
                outline-none
                focus:border-cyan-400
              "
              />

            </label>

            {/* BUTTON */}

            <button
              disabled={loading}
              className="
              w-full
              rounded-3xl
              bg-cyan-500
              px-5 py-4
              text-sm font-bold
              uppercase
              tracking-[0.18em]
              text-black
              transition
              hover:bg-cyan-400
            "
            >

              {loading
                ? "Assigning..."
                : "Assign WiFi access"
              }

            </button>

          </form>

        </div>

      </div>

    </section>
  );
}