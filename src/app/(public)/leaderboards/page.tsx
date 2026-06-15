"use client";

import { useEffect, useMemo, useState } from "react";

import LiveIndicator from "@/components/leaderboard/LiveIndicator";
import LeaderboardStats from "@/components/leaderboard/LeaderboardStats";
import LeaderboardSeason from "@/components/leaderboard/LeaderboardSeason";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

import { fetchLeaderboardPlayers } from "@/data/leaderboard/players";
import { gameFilters } from "@/data/leaderboard/games";

import type { LeaderboardPlayer } from "@/types/leaderboard";

export default function LeaderboardsPage() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Games");

  useEffect(() => {
    fetchLeaderboardPlayers()
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  const filteredPlayers = useMemo(() => {
    if (activeFilter === "All Games") return players;
    return players.filter((player) => player.game === activeFilter);
  }, [activeFilter, players]);

  return (
    <main className="min-h-screen bg-black text-white pt-32 px-4 pb-20">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="bg-zinc-100 text-black rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">

          <div>

            <h1 className="text-4xl md:text-5xl font-black">
              Gweru's Gamers Lounge
            </h1>

            <p className="text-zinc-600 text-lg mt-2">
              Competitive gaming rankings & live sessions
            </p>

          </div>

          <LiveIndicator />

        </div>

        {/* STATS */}

        <LeaderboardStats />

        {/* SEASON */}

        <LeaderboardSeason />

        {/* FILTERS */}

        <div className="mb-10 overflow-x-auto touch-pan-x">

          <div className="flex gap-3 min-w-max">

            {gameFilters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`
                    shrink-0 whitespace-nowrap
                    px-5 py-3 rounded-2xl
                    border transition-all duration-200
                    font-semibold text-sm active:scale-95
                    touch-manipulation
                    ${
                      isActive
                        ? "bg-white text-black border-white"
                        : "bg-zinc-900 border-white/10 text-white"
                    }
                  `}
                >
                  {filter}
                </button>
              );
            })}

          </div>

        </div>

        {/* TABLE */}

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-16 text-center text-zinc-400 text-lg">
            Loading leaderboard...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-16 text-center text-zinc-400 text-lg">
            No players yet — be the first on the board.
          </div>
        ) : (
          <LeaderboardTable players={filteredPlayers} />
        )}

        {/* FOOTER */}

        <div className="text-center text-zinc-500 text-sm mt-8">
          Monthly leaderboard • Season rankings update automatically
        </div>

      </div>

    </main>
  );
}
