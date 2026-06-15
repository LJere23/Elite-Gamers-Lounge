import { tierStyles } from "@/data/leaderboard/tiers";
import { Tier } from "@/types/leaderboard";

interface PlayerTierBadgeProps {
  tier: Tier;
}

export default function PlayerTierBadge({
  tier,
}: PlayerTierBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${tierStyles[tier]}`}
    >

      <div className="w-3 h-3 rounded-full bg-current opacity-70" />

      {tier}

    </div>
  );
}