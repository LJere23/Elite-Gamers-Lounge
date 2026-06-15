import PlayerAvatar from "./PlayerAvatar";
import PlayerTierBadge from "./PlayerTierBadge";

import { LeaderboardPlayer } from "@/types/leaderboard";

interface LeaderboardMobileCardProps {
  player: LeaderboardPlayer;
}

export default function LeaderboardMobileCard({
  player,
}: LeaderboardMobileCardProps) {

  const movementColor =
    player.movement > 0
      ? "text-green-400"
      : player.movement < 0
      ? "text-red-400"
      : "text-zinc-500";

  const movementSymbol =
    player.movement > 0
      ? "↑"
      : player.movement < 0
      ? "↓"
      : "—";

  return (
    <div
      className={`
        rounded-[2rem] border border-white/10 p-6 bg-zinc-950

        ${
          player.rank === 1
            ? "ring-1 ring-yellow-400/40"
            : player.rank === 2
            ? "ring-1 ring-zinc-300/30"
            : player.rank === 3
            ? "ring-1 ring-orange-400/30"
            : ""
        }
      `}
    >

      {/* TOP */}

      <div className="flex items-start justify-between mb-6">

        <div className="flex items-center gap-4">

          <div
            className={`
              text-3xl font-black

              ${
                player.rank === 1
                  ? "text-yellow-400"
                  : player.rank === 2
                  ? "text-zinc-300"
                  : player.rank === 3
                  ? "text-orange-400"
                  : "text-white"
              }
            `}
          >
            #{player.rank}
          </div>

          <PlayerAvatar
            username={player.username}
            avatarUrl={player.avatarUrl}
          />

          <div>

            <div className="flex items-center gap-2">

              <h3 className="font-bold text-lg">
                {player.username}
              </h3>

              {player.isLive && (
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              )}

            </div>

            <p className="text-sm text-zinc-500">
              {player.lastSeen}
            </p>

          </div>

        </div>

        <div className={`font-bold ${movementColor}`}>
          {movementSymbol}

          {player.movement !== 0 &&
            ` ${Math.abs(player.movement)}`}
        </div>

      </div>

      {/* TIER */}

      <div className="mb-6">

        <PlayerTierBadge
          tier={player.tier}
        />

      </div>

      {/* STATS */}

      <div className="grid grid-cols-3 gap-4">

        <div>
          <p className="text-zinc-500 text-sm">
            Wins
          </p>

          <h4 className="text-2xl font-black">
            {player.wins}
          </h4>
        </div>

        <div>
          <p className="text-zinc-500 text-sm">
            Games
          </p>

          <h4 className="text-2xl font-black">
            {player.gamesPlayed}
          </h4>
        </div>

        <div>
          <p className="text-zinc-500 text-sm">
            Points
          </p>

          <h4 className="text-2xl font-black text-cyan-400">
            {player.points}
          </h4>
        </div>

      </div>

      {/* STREAK */}

      {player.streak > 0 && (

        <div className="mt-6 inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-semibold">

          🔥 {player.streak} Win Streak

        </div>

      )}

    </div>
  );
}