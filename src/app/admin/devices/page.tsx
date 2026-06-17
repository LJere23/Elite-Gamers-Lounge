"use client";

import { useEffect, useState } from "react";
import { Device } from "@/types/device";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "PS5",
    hourlyRate: 2,
    location: "Main Floor",
  });

  // per-device game select state
  const [gameInputs, setGameInputs] = useState<Record<string, string>>({});
  const [allGames, setAllGames] = useState<string[]>([]);

  async function loadDevices() {
    try {
      const res = await fetch("/api/devices");
      setDevices(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadDevices();
    fetch("/api/games")
      .then((r) => r.json())
      .then((data: { name: string }[]) => setAllGames(data.map((g) => g.name)))
      .catch(() => {});
  }, []);

  async function createDevice(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
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

  async function patchGames(id: string, games: string[]) {
    const res = await fetch(`/api/devices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supportedGames: games }),
    });
    const updated = await res.json();
    setDevices((prev) => prev.map((d) => (d.id === id ? updated : d)));
  }

  function addGame(device: Device) {
    const title = (gameInputs[device.id] || "").trim();
    if (!title) return;
    const current = Array.isArray(device.supportedGames) ? device.supportedGames : [];
    if (current.includes(title)) return;
    patchGames(device.id, [...current, title]);
    setGameInputs((prev) => ({ ...prev, [device.id]: "" }));
  }

  function removeGame(device: Device, game: string) {
    const current = Array.isArray(device.supportedGames) ? device.supportedGames : [];
    patchGames(device.id, current.filter((g) => g !== game));
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Devices"
        description="Manage consoles, PCs, simulators and the games available on each station."
      />

      {/* Add device form */}
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
          disabled={loading}
          className="md:col-span-2 xl:col-span-4 bg-cyan-400 text-black font-bold py-4 rounded-2xl hover:bg-cyan-300 transition disabled:opacity-50"
        >
          {loading ? "Creating…" : "Add Device"}
        </button>
      </form>

      {/* Device cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => {
          const games = Array.isArray(device.supportedGames) ? device.supportedGames : [];
          return (
            <div key={device.id} className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 space-y-5">

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">{device.name}</h2>
                  <p className="text-zinc-400 text-sm mt-0.5">{device.type} · {device.location}</p>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                  device.status === "available"   ? "bg-green-500/20 text-green-400"  :
                  device.status === "busy"        ? "bg-red-500/20 text-red-400"      :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {device.status}
                </span>
              </div>

              <p className="text-zinc-300 text-sm">${device.hourlyRate}/hr</p>

              {/* Games section */}
              <div>
                <p className="text-xs uppercase tracking-widest text-cyan-400 mb-2">Games</p>

                {/* Existing games */}
                {games.length === 0 ? (
                  <p className="text-zinc-600 text-sm italic mb-3">No games added yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {games.map((game) => (
                      <span
                        key={game}
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200"
                      >
                        {game}
                        <button
                          onClick={() => removeGame(device, game)}
                          className="text-zinc-500 hover:text-red-400 transition leading-none"
                          title="Remove game"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add game — dropdown from games library */}
                {(() => {
                  const available = allGames.filter((g) => !games.includes(g));
                  return available.length > 0 ? (
                    <div className="flex gap-2">
                      <select
                        value={gameInputs[device.id] || ""}
                        onChange={(e) => setGameInputs((prev) => ({ ...prev, [device.id]: e.target.value }))}
                        className="flex-1 bg-black border border-white/10 rounded-2xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                      >
                        <option value="">Select a game…</option>
                        {available.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => addGame(device)}
                        className="rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-4 py-2 text-sm font-bold hover:bg-cyan-500/30 transition"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600 italic">
                      All library games added.{" "}
                      <a href="/admin/games" className="text-cyan-500 hover:underline">Manage library</a>
                    </p>
                  );
                })()}
              </div>

              {/* Status + delete */}
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
          );
        })}
      </div>
    </section>
  );
}
