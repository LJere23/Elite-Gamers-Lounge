"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  target: number;
  xpReward: number;
  weeklyReset: boolean;
  active: boolean;
  sortOrder: number;
  _count?: { progress: number };
}

const CHALLENGE_TYPES = [
  { value: "sessions",          label: "Sessions" },
  { value: "tournament_entry",  label: "Tournament Entry" },
  { value: "referral",          label: "Referral" },
];

const blank: Omit<Challenge, "id" | "_count"> = {
  name: "", description: "", icon: "⚔", type: "sessions",
  target: 3, xpReward: 15, weeklyReset: true, active: true, sortOrder: 0,
};

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading]       = useState(false);
  const [form, setForm]             = useState({ ...blank });
  const [editId, setEditId]         = useState<string | null>(null);
  const [msg, setMsg]               = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/challenges");
    if (res.ok) setChallenges(await res.json());
  }

  useEffect(() => { load(); }, []);

  function startEdit(c: Challenge) {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description, icon: c.icon, type: c.type,
      target: c.target, xpReward: c.xpReward, weeklyReset: c.weeklyReset,
      active: c.active, sortOrder: c.sortOrder });
    setMsg(null);
  }

  function cancelEdit() { setEditId(null); setForm({ ...blank }); setMsg(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const url    = editId ? `/api/challenges/${editId}` : "/api/challenges";
    const method = editId ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setMsg(editId ? "Challenge updated." : "Challenge created.");
      cancelEdit();
      await load();
    } else {
      const d = await res.json();
      setMsg(d.error ?? "Failed to save.");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this challenge?")) return;
    setLoading(true);
    await fetch(`/api/challenges/${id}`, { method: "DELETE" });
    await load();
    setLoading(false);
  }

  async function handleToggle(c: Challenge) {
    setLoading(true);
    await fetch(`/api/challenges/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    await load();
    setLoading(false);
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Guild Challenges"
        description="Weekly challenges that reward players with XP for completing in-lounge activities."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

        {/* LIST */}
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Active Challenges</p>
            <h2 className="mt-2 text-2xl font-black text-white">{challenges.length} total</h2>
          </div>
          {challenges.length === 0 && (
            <p className="text-sm text-slate-500">No challenges yet. Create one using the form.</p>
          )}
          <div className="space-y-3">
            {challenges.map((c) => (
              <div key={c.id} className={`rounded-3xl border p-5 ${c.active ? "border-white/5 bg-black/30" : "border-white/5 bg-black/10 opacity-50"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-2xl shrink-0">{c.icon}</span>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm">{c.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{c.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full px-2 py-0.5">{CHALLENGE_TYPES.find((t) => t.value === c.type)?.label ?? c.type}</span>
                        <span className="bg-white/5 text-slate-400 rounded-full px-2 py-0.5">Target: {c.target}</span>
                        <span className="bg-emerald-500/10 text-emerald-300 rounded-full px-2 py-0.5">+{c.xpReward} XP</span>
                        {c.weeklyReset && <span className="bg-cyan-500/10 text-cyan-400 rounded-full px-2 py-0.5">Weekly</span>}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col gap-1.5 items-end">
                    <button onClick={() => startEdit(c)} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">Edit</button>
                    <button onClick={() => handleToggle(c)} disabled={loading} className={`text-xs font-semibold ${c.active ? "text-amber-400" : "text-emerald-400"}`}>
                      {c.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => handleDelete(c.id)} disabled={loading} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 h-fit space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">{editId ? "Edit Challenge" : "New Challenge"}</p>
            <h2 className="mt-2 text-2xl font-black text-white">{editId ? "Update" : "Create"}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <label className="block text-sm font-semibold text-slate-100">
                Name
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                  className="mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400" />
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Icon
                <input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400 text-center" />
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-100">
              Description
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400" />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Type
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400">
                {CHALLENGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-slate-100">
                Target
                <input type="number" min="1" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400" />
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                XP Reward
                <input type="number" min="1" value={form.xpReward} onChange={(e) => setForm((f) => ({ ...f, xpReward: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400" />
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.weeklyReset} onChange={(e) => setForm((f) => ({ ...f, weeklyReset: e.target.checked }))} className="w-4 h-4" />
                Weekly reset
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="w-4 h-4" />
                Active
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading || !form.name.trim()}
                className="flex-1 rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-bold uppercase tracking-wider text-black hover:bg-cyan-400 transition disabled:opacity-60">
                {loading ? "Saving..." : editId ? "Update" : "Create"}
              </button>
              {editId && (
                <button type="button" onClick={cancelEdit}
                  className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 transition">
                  Cancel
                </button>
              )}
            </div>
            {msg && <p className={`text-sm text-center ${msg.includes("Failed") || msg.includes("error") ? "text-red-400" : "text-green-400"}`}>{msg}</p>}
          </form>

          <div className="rounded-3xl border border-white/5 bg-black/30 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Challenge Types</p>
            <div className="space-y-1 text-xs text-slate-500">
              <p><span className="text-purple-300 font-semibold">sessions</span> — tracked when a gaming session starts</p>
              <p><span className="text-purple-300 font-semibold">tournament_entry</span> — tracked on tournament sign-up</p>
              <p><span className="text-purple-300 font-semibold">referral</span> — tracked when a referred player registers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
