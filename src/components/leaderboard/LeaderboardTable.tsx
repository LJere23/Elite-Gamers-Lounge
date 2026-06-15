import LeaderboardRow from "./LeaderboardRow";
import LeaderboardMobileCard from "./LeaderboardMobileCard";

import { LeaderboardPlayer } from "@/types/leaderboard";

interface LeaderboardTableProps {
  players: LeaderboardPlayer[];
}

export default function LeaderboardTable({
  players,
}: LeaderboardTableProps) {
  return (
    <>

      {/* MOBILE */}

      <div className="grid gap-6 lg:hidden relative z-10">

        {players.map((player) => (

          <LeaderboardMobileCard
            key={player.id}
            player={player}
          />

        ))}

      </div>

      {/* DESKTOP */}

      <div className="hidden lg:block overflow-x-auto rounded-[2rem] border border-white/10 bg-black">

        <table className="w-full min-w-[1000px]">

          <thead className="border-b border-white/10 bg-zinc-950">

            <tr className="text-zinc-500 uppercase text-sm tracking-wider">

              <th className="text-left py-6 px-4">
                #
              </th>

              <th className="text-left py-6 px-4">
                Player
              </th>

              <th className="text-left py-6 px-4">
                Tier
              </th>

              <th className="text-left py-6 px-4">
                W
              </th>

              <th className="text-left py-6 px-4">
                Games
              </th>

              <th className="text-left py-6 px-4">
                Streak
              </th>

              <th className="text-left py-6 px-4">
                Movement
              </th>

              <th className="text-right py-6 px-4">
                Points
              </th>

            </tr>

          </thead>

          <tbody>

            {players.map((player) => (

              <LeaderboardRow
                key={player.id}
                player={player}
              />

            ))}

          </tbody>

        </table>

      </div>

    </>
  );
}