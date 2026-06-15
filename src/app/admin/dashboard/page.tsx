"use client";

import {
  useEffect,
  useState,
} from "react";

import AdminPageHeader from "@/components/admin/AdminPageHeader";

import DashboardCard from "@/components/admin/DashboardCard";

import QuickActions from "@/components/admin/QuickActions";

import {
  AnalyticsPayload,
} from "../../../types/admin";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type ActiveSession = {

  id: string;

  playerName: string;

  game: string;

  deviceName: string;

  durationHours: number;

  totalPrice: number;
};

type DashboardAnalyticsPayload =
  AnalyticsPayload & {

    activeSessionsList:
      ActiveSession[];
  };

/*
|--------------------------------------------------------------------------
| DASHBOARD CARDS
|--------------------------------------------------------------------------
*/

const cards = [

  {
    label:
      "Active Sessions",

    key:
      "activeSessions",
  },

  {
    label:
      "Active WiFi Users",

    key:
      "activeWifiUsers",
  },

  {
    label:
      "Total Members",

    key:
      "totalMembers",
  },

  {
    label:
      "Revenue",

    key:
      "totalRevenueUsd",
  },
];

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function AdminDashboardPage() {

  const [analytics, setAnalytics] =
    useState<DashboardAnalyticsPayload | null>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD ANALYTICS
  |--------------------------------------------------------------------------
  */

  async function loadAnalytics() {

    try {

      const response =
        await fetch(
          "/api/analytics"
        );

      const data =
        await response.json();

      setAnalytics(data);

    } catch (error) {

      console.error(error);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | AUTO REFRESH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    loadAnalytics();

    const interval =
      setInterval(() => {

        loadAnalytics();

      }, 5000);

    return () =>
      clearInterval(interval);

  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (!analytics) {

    return (
      <div className="p-10 text-zinc-400">
        Loading dashboard...
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (

    <section className="space-y-8">

      <AdminPageHeader
        title="Gaming Lounge Dashboard"
        description="Monitor sessions, revenue, memberships and device usage live."
      />

      {/* STATS */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {cards.map((card) => (

          <DashboardCard
            key={card.key}
            label={card.label}
            value={
              card.key ===
              "totalRevenueUsd"

                ? `$${analytics.totalRevenueUsd}`

                : String(
                    (analytics as any)[
                      card.key
                    ]
                  )
            }
            delta="+5%"
          />
        ))}

      </div>

      {/* QUICK ACTIONS */}

      <QuickActions />

      {/* MAIN GRID */}

      <div className="grid gap-6 xl:grid-cols-3">

        {/* ACTIVE SESSIONS */}

        <div className="xl:col-span-2 bg-zinc-950 border border-white/10 rounded-3xl p-6">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-cyan-400 text-sm uppercase tracking-[0.3em]">
                Live
              </p>

              <h2 className="text-3xl font-black text-white mt-2">
                Active Sessions
              </h2>

            </div>

            <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-2xl text-sm font-bold">

              {analytics.activeSessionsList.length}
              {" "}
              Active

            </div>

          </div>

          <div className="mt-6 space-y-4">

            {analytics.activeSessionsList
              .length === 0 && (

              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-zinc-400">

                No active sessions right now.

              </div>
            )}

            {analytics.activeSessionsList.map(
              (session) => (

                <div
                  key={session.id}
                  className="bg-black/40 border border-white/5 rounded-2xl p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <h3 className="text-xl font-bold text-white">
                        {session.playerName}
                      </h3>

                      <p className="text-zinc-400 mt-1">
                        {session.game}
                      </p>

                    </div>

                    <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">

                      ACTIVE

                    </span>

                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3 text-zinc-300 text-sm">

                    <div>
                      Device:
                      {" "}
                      {session.deviceName}
                    </div>

                    <div>
                      Duration:
                      {" "}
                      {session.durationHours}
                      h
                    </div>

                    <div>
                      Revenue:
                      {" "}
                      $
                      {session.totalPrice}
                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="space-y-6">

          {/* MOST PLAYED */}

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">

            <h2 className="text-2xl font-black text-white">

              Most Played Games

            </h2>

            <div className="mt-5 space-y-3">

              {analytics.mostPlayedGames.map(
                (item) => (

                  <div
                    key={item.game}
                    className="bg-black/40 rounded-2xl p-4 flex items-center justify-between"
                  >

                    <span className="text-white font-semibold">

                      {item.game}

                    </span>

                    <span className="text-zinc-400 text-sm">

                      {item.count}
                      {" "}
                      plays

                    </span>

                  </div>
                )
              )}

            </div>

          </div>

          {/* REVENUE */}

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">

            <h2 className="text-2xl font-black text-white">

              Revenue Breakdown

            </h2>

            <div className="mt-5 space-y-4 text-zinc-300">

              <div className="flex justify-between">

                <span>
                  Sessions
                </span>

                <span>
                  $
                  {analytics.revenueByCategory.sessions}
                </span>

              </div>

              <div className="flex justify-between">

                <span>
                  Memberships
                </span>

                <span>
                  $
                  {analytics.revenueByCategory.memberships}
                </span>

              </div>

              <div className="flex justify-between">

                <span>
                  WiFi
                </span>

                <span>
                  $
                  {analytics.revenueByCategory.wifi}
                </span>

              </div>

            </div>

          </div>

          {/* MOST USED DEVICES */}

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">

            <h2 className="text-2xl font-black text-white">

              Most Used Devices

            </h2>

            <div className="mt-5 space-y-3">

              {analytics.mostUsedStations.map(
                (station) => (

                  <div
                    key={station.station}
                    className="bg-black/40 rounded-2xl p-4 flex items-center justify-between"
                  >

                    <span className="text-white font-semibold">

                      {station.station}

                    </span>

                    <span className="text-zinc-400 text-sm">

                      {station.count}
                      {" "}
                      uses

                    </span>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}