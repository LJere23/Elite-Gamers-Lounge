"use client";

import { useEffect, useState } from "react";
import { Device } from "@/types/device";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Game {
  id: string;
  name: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "PS5",
    hourlyRate: 2,
    location: "Main Floor",
  });

  const [games, setGames] = useState<Game[]>([]);
  const [gameInput, setGameInput] = useState("");
  const [gameAdding, setGameAdding] = useState(false);
  const [gameError, setGameError] = useState("");

  async function loadDevices() {
    try {
      const res = await fetch("/api/devices");
      setDevices(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function loadGames() {
    try {
      const res = await fetch("/api/games");
      setGames(await res.json());
    } catch {}
  }

  useEffect(() => {
    loadDevices();
    loadGames();
  }, []);

  // ── Devices ────────────────────────────────────────────────────────────────

  async function createDevice(e: React.FormEvent) {
    e.preventDefault();
    setDeviceLoading(true);
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "available" }),
      });
      const created = await res.json();
      setDevices((prev) => [created, ...prev]);
      setForm({ name: "", type: "PS5", hourlyRate: 2, location: "Main Floor" });
    } finally {
      setDeviceLoading(false);
    }
  }

  async function deleteDevice(id: string) {
    if (!confirm("Delete device?")) return;
    await fetch(`/api/devices/${id}`, { method: "DELETE" });
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  async function updateStatus(id: string, status: Device["status"]) {
    const res = await fetch(`/api/devices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
  }

  // ── Games ──────────────────────────────────────────────────────────────────

  async function addGame(e: React.FormEvent) {
    e.preventDefault();
    const name = gameInput.trim();
    if (!name) return;
    setGameAdding(true);
    setGameError("");
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setGameError(data.error ?? "Failed to add game"); return; }
      setGames((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setGameInput("");
    } finally {
      setGameAdding(false);
    }
  }

  async function deleteGame(game: Game) {
    if (!confirm(`Remove "${game.name}" from the games list?`)) return;
    await fetch(`/api/games/${game.id}`, { method: "DELETE" });
    setGames((prev) => prev.filter((g) => g.id !== game.id));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-12">
      <AdminPageHeader
        title="Devices & Games"
        description="Manage the stations in the lounge and the games available for players to choose from."
      />

      {/* ── DEVICES ── */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-white">Devices</h2>

        <form
          onSubmit={createDevice}
          className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <input
            required
            placeholder="Device name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-cyan-400"
          >
            <option>PS5</option>
            <option>PS4</option>
            <option>Gaming PC</option>
            <option>Racing Simulator</option>
            <option>VR</option>
          </select>
          <input
            type="number"
            required
            placeholder="Hourly Rate ($)"
            value={form.hourlyRate}
            onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
            className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400"
          />
          <input
            required
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400"
          />
          <button
            disabled={deviceLoading}
            className="md:col-span-2 xl:col-span-4 bg-cyan-400 text-black font-bold py-4 rounded-2xl hover:bg-cyan-300 transition disabled:opacity-50"
          >
            {deviceLoading ? "Creating…" : "Add Device"}
          </button>
        </form>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => (
            <div key={device.id} className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 space-y-5">

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-white">{device.name}</h3>
                  <p className="text-zinc-400 text-sm mt-0.5">{device.type} · {device.location}</p>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                  device.status === "available"  ? "bg-green-500/20 text-green-400"  :
                  device.status === "busy"       ? "bg-red-500/20 text-red-400"      :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {device.status}
                </span>
              </div>

              <p className="text-zinc-300 text-sm">${device.hourlyRate}/hr</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => updateStatus(device.id, "available")}
                  className="rounded-xl bg-green-500/20 text-green-400 px-4 py-2 text-sm font-bold hover:bg-green-500/30 transition"
                >
                  Available
                </button>
                <button
                  onClick={() => updateStatus(device.id, "maintenance")}
                  className="rounded-xl bg-yellow-500/20 text-yellow-400 px-4 py-2 text-sm font-bold hover:bg-yellow-500/30 transition"
                >
                  Maintenance
                </button>
                <button
                  onClick={() => deleteDevice(device.id)}
                  className="rounded-xl bg-red-500/20 text-red-400 px-4 py-2 text-sm font-bold hover:bg-red-500/30 transition ml-auto"
                >
                  Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* ── GAMES ── */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-black text-white">Games</h2>
          <p className="text-zinc-400 text-sm mt-1">
            These games appear in the session dropdown. Add anything the lounge offers — FIFA, Pool, Darts, Formula 1, Chess, etc.
          </p>
        </div>

        <form
          onSubmit={addGame}
          className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 flex gap-3"
        >
          <input
            required
            placeholder="Game name — e.g. Formula 1 24, Pool, Darts…"
            value={gameInput}
            onChange={(e) => { setGameInput(e.target.value); setGameError(""); }}
            className="flex-1 bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400"
          />
          <button
            disabled={gameAdding}
            className="bg-cyan-400 hover:bg-cyan-300 transition text-black font-bold px-6 py-3 rounded-2xl disabled:opacity-50"
          >
            {gameAdding ? "Adding…" : "Add Game"}
          </button>
        </form>

        {gameError && (
          <p className="text-rose-400 text-sm bg-rose-950/30 border border-rose-500/30 rounded-2xl px-4 py-3">
            {gameError}
          </p>
        )}

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-400 mb-6">
            {games.length} game{games.length !== 1 ? "s" : ""} in library
          </p>

          {games.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">No games yet — add your first one above.</p>
          ) : (
            <div className="space-y-2">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 px-4 py-3"
                >
                  <span className="text-white font-semibold">{game.name}</span>
                  <button
                    onClick={() => deleteGame(game)}
                    className="text-xs font-semibold text-zinc-500 hover:text-red-400 transition border border-zinc-700/40 hover:border-red-500/40 rounded-xl px-3 py-1.5"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
