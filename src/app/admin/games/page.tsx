"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Game {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function loadGames() {
    try {
      const res = await fetch("/api/games");
      setGames(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadGames(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add game"); return; }
      setGames((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setInput("");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(game: Game) {
    if (!confirm(`Remove "${game.name}" from the games library?`)) return;
    await fetch(`/api/games/${game.id}`, { method: "DELETE" });
    setGames((prev) => prev.filter((g) => g.id !== game.id));
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Games Library"
        description="Register the games available at the lounge. These appear as options when creating sessions and assigning games to devices."
      />

      {/* Add game form */}
      <form
        onSubmit={handleAdd}
        className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 flex gap-3"
      >
        <input
          required
          placeholder="Game name — e.g. Formula 1 24, Rocket League…"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          className="flex-1 bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400"
        />
        <button
          disabled={adding}
          className="bg-cyan-400 hover:bg-cyan-300 transition text-black font-bold px-6 py-3 rounded-2xl disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add Game"}
        </button>
      </form>

      {error && (
        <p className="text-rose-400 text-sm bg-rose-950/30 border border-rose-500/30 rounded-2xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Games list */}
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-400 mb-6">
          {games.length} game{games.length !== 1 ? "s" : ""} registered
        </p>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">
            No games yet — add your first one above.
          </p>
        ) : (
          <div className="space-y-2">
            {games.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 px-4 py-3"
              >
                <span className="text-white font-semibold">{game.name}</span>
                <button
                  onClick={() => handleDelete(game)}
                  className="text-xs font-semibold text-zinc-500 hover:text-red-400 transition border border-zinc-700/40 hover:border-red-500/40 rounded-xl px-3 py-1.5"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
