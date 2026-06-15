import PlayerAvatar from "./PlayerAvatar";
import PlayerTierBadge from "./PlayerTierBadge";

import { LeaderboardPlayer } from "@/types/leaderboard";

interface LeaderboardRowProps {
  player: LeaderboardPlayer;
}

export default function LeaderboardRow({
  player,
}: LeaderboardRowProps) {

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
    <tr className={`
    border-b border-white/5 transition duration-300 hover:bg-zinc-900/50 hover:scale-[1.01]

    ${
      player.rank === 1
        ? "bg-yellow-500/5"
        : player.rank === 2
        ? "bg-zinc-300/5"
        : player.rank === 3
        ? "bg-orange-500/5"
        : ""
    }
  `}
  >

      {/* RANK */}

      <td className={`
    py-6 px-4 font-black text-xl

    ${
      player.rank === 1
        ? "text-yellow-400"
        : player.rank === 2
        ? "text-zinc-300"
        : player.rank === 3
        ? "text-orange-400"
        : ""
    }
  `}
  >
        {player.rank}
      </td>

      {/* PLAYER */}

      <td className="py-6 px-4">

        <div className="flex items-center gap-4">

          <PlayerAvatar
            username={player.username}
            avatarUrl={player.avatarUrl}
          />

          <div>

            <div className="flex items-center gap-3">

              <h3 className="font-bold text-lg">
                {player.username}
              </h3>

              {player.isLive && (
                <div className="flex items-center gap-2 text-green-400 text-sm">

                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

                  Live

                </div>
              )}

            </div>

            <p className="text-sm text-zinc-500">
              {player.lastSeen}
            </p>

          </div>

        </div>

      </td>

      {/* TIER */}

      <td className="py-6 px-4">
        <PlayerTierBadge
          tier={player.tier}
        />
      </td>

      {/* WINS */}

      <td className="py-6 px-4 text-lg font-semibold">
        {player.wins}
      </td>

      {/* GAMES */}

      <td className="py-6 px-4 text-lg font-semibold">
        {player.gamesPlayed}
      </td>

      {/* STREAK */}

      <td className="py-6 px-4">

        {player.streak > 0 ? (
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-semibold">

            🔥 {player.streak}

          </div>
        ) : (
          <span className="text-zinc-500">
            —
          </span>
        )}

      </td>

      {/* MOVEMENT */}

      <td className={`py-6 px-4 font-bold ${movementColor}`}>

        {movementSymbol}

        {player.movement !== 0 &&
          ` ${Math.abs(player.movement)}`}

      </td>

      {/* POINTS */}

      <td className="py-6 px-4 text-right text-cyan-400 font-black text-2xl">
        {player.points.toLocaleString()}
      </td>

    </tr>
  );
}