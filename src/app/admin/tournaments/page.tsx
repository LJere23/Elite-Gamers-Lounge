"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tournament } from "@/types/admin";

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [form, setForm] = useState({
    name: "",
    game: "",
    category: "Sports Games",
    format: "knockout",
    scoringSystem: "best_of_1",
    entries: 8,
    prizeUsd: 1200,
    prizeDescription: "",
    startAt: "",
    endAt: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/tournaments").then((res) => res.json()).then(setTournaments);
  }, []);

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const payload = {
      name: form.name,
      game: form.game,
      category: form.category,
      format: form.format,
      scoringSystem: form.scoringSystem,
      prizeUsd: Number(form.prizeUsd),
      entries: Number(form.entries),
      prizeDescription: form.prizeDescription,
      startAt: form.startAt,
      endAt: form.endAt,
    };

    const response = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) { setLoading(false); return; }
    const created = await response.json();
    setTournaments((prev) => [created, ...prev]);
    setForm({
      name: "",
      game: "",
      category: "Sports Games",
      format: "knockout",
      scoringSystem: "best_of_1",
      entries: 8,
      prizeUsd: 1200,
      prizeDescription: "",
      startAt: "",
      endAt: "",
    });
    setLoading(false);
  };

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Tournament management"
        description="Create new events, schedule matches, and keep tournament operations live."
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.7fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">All tournaments</p>
              <h2 className="mt-3 text-3xl font-black text-white">{tournaments.length} events{tournaments.filter(t => t.status === "ongoing").length > 0 ? ` • ${tournaments.filter(t => t.status === "ongoing").length} live` : ""}</h2>
            </div>
          </div>
          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <Link key={tournament.id} href={`/admin/tournaments/${tournament.id}`} className="block rounded-3xl border border-white/5 bg-black/40 p-5 transition hover:border-cyan-400/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{tournament.status}</p>
                    <h3 className="mt-2 text-xl font-bold text-white">{tournament.name}</h3>
                    <p className="text-slate-300">{tournament.game} • {tournament.category} • {tournament.format.replace("_", " ")}</p>
                    <p className="mt-2 text-slate-300">{tournament.entries} target entries</p>
                  </div>
                  <span className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">${tournament.prizeUsd} prize</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
          <h2 className="text-2xl font-black text-white">Create a tournament</h2>
          <p className="mt-3 text-slate-400">Schedule a new competition and define event details.</p>
          <form className="mt-8 space-y-5" onSubmit={submitForm}>
            <label className="block text-sm font-semibold text-slate-100">
              Tournament name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Game
              <input
                value={form.game}
                onChange={(event) => setForm({ ...form, game: event.target.value })}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                required
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-100">
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option>Sports Games</option>
                  <option>Racing</option>
                  <option>Fighting</option>
                  <option>Strategy</option>
                  <option>Minds</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Format
                <select
                  value={form.format}
                  onChange={(event) => setForm({ ...form, format: event.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option value="knockout">Knockout</option>
                  <option value="points_league">Points League</option>
                  <option value="fastest_lap">Fastest Lap</option>
                  <option value="double_elimination">Double Elimination</option>
                  <option value="swiss">Swiss</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-100">
              Scoring system
              <select
                value={form.scoringSystem}
                onChange={(event) => setForm({ ...form, scoringSystem: event.target.value })}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
              >
                <option value="best_of_1">Best of 1</option>
                <option value="best_of_3">Best of 3</option>
                <option value="best_of_5">Best of 5</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Prize description
              <textarea
                value={form.prizeDescription}
                onChange={(event) => setForm({ ...form, prizeDescription: event.target.value })}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                rows={3}
                placeholder="Add a short summary of the prize pool"
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-100">
                Entries
                <input
                  type="number"
                  min={2}
                  value={form.entries}
                  onChange={(event) => setForm({ ...form, entries: Number(event.target.value) })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Prize USD
                <input
                  type="number"
                  value={form.prizeUsd}
                  onChange={(event) => setForm({ ...form, prizeUsd: Number(event.target.value) })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  required
                />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-100">
              Start time
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => setForm({ ...form, startAt: event.target.value })}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              End time
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => setForm({ ...form, endAt: event.target.value })}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                required
              />
            </label>
            <button className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-cyan-400" disabled={loading}>
              {loading ? "Creating..." : "Create tournament"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
