"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tournament } from "@/types/admin";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((res) => res.json())
      .then(setTournaments)
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen pt-32 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-black uppercase">Tournaments</h1>
          <p className="text-slate-400 max-w-3xl">Browse current and upcoming events, view the schedule, and follow live tournament progress.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-10 text-slate-400">No tournaments available yet.</div>
          ) : (
            tournaments.map((tournament) => (
              <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="block rounded-[2rem] border border-white/10 bg-zinc-950 p-6 transition hover:border-cyan-400/40">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">{tournament.status}</p>
                <h2 className="mt-3 text-2xl font-black text-white">{tournament.name}</h2>
                <p className="mt-2 text-slate-400">{tournament.game} • {tournament.category} • {tournament.format.replace("_", " ")}</p>
                <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
                  <span>{tournament.entries} target entries</span>
                  <span>${tournament.prizeUsd} prize</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
