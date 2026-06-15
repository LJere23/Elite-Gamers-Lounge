"use client";

interface LeaderboardFiltersProps {
  filters: string[];

  activeFilter: string;

  onFilterChange: (filter: string) => void;
}

export default function LeaderboardFilters({
  filters,
  activeFilter,
  onFilterChange,
}: LeaderboardFiltersProps) {

  return (
    <div className="overflow-x-auto pb-2 touch-pan-x">

      <div className="flex gap-3 min-w-max">

        {filters.map((filter) => {

          const isActive =
            activeFilter === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => {

                console.log("CLICKED:", filter);

                onFilterChange(filter);

              }}
              className={`
                shrink-0 whitespace-nowrap
                px-5 py-3 rounded-2xl
                transition-all duration-200
                border text-sm font-semibold touch-manipulation

                ${
                  isActive
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900 text-white border-white/10"
                }
              `}
            >
              {filter}
            </button>
          );
        })}

      </div>

    </div>
  );
}