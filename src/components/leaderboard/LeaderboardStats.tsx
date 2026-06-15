export default function LeaderboardStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

      <div className="bg-zinc-100 text-black rounded-3xl p-8">
        <p className="text-lg">Players ranked</p>

        <h3 className="text-5xl font-black mt-2">
          47
        </h3>
      </div>

      <div className="bg-zinc-100 text-black rounded-3xl p-8">
        <p className="text-lg">Tournaments run</p>

        <h3 className="text-5xl font-black mt-2">
          23
        </h3>
      </div>

      <div className="bg-zinc-100 text-black rounded-3xl p-8">
        <p className="text-lg">Next event</p>

        <h3 className="text-3xl font-black mt-2">
          Fri 7pm
        </h3>
      </div>

      <div className="bg-zinc-100 text-black rounded-3xl p-8">
        <p className="text-lg">Resets in</p>

        <h3 className="text-3xl font-black mt-2">
          11 days
        </h3>
      </div>

    </div>
  );
}