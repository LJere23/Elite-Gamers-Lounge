"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Plan {
  id: string;
  name: string;
  priceUsd: number;
  period: string;
  description: string;
  perks: string[];
}

const EMPTY_FORM = { name: "", priceUsd: 0, period: "Month", description: "", perks: [] as string[] };

export default function AdminMembershipsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [founderSlots, setFounderSlots] = useState<{ cap: number; remaining: number; filled: number } | null>(null);

  // Edit state — null means no plan is being edited
  const [editing, setEditing] = useState<Plan | null>(null);
  const [editPerkInput, setEditPerkInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Create new tier state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createPerkInput, setCreatePerkInput] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadPlans() {
    try {
      const [plans, slots] = await Promise.all([
        fetch("/api/memberships").then((r) => r.json()),
        fetch("/api/founder-slots").then((r) => r.json()),
      ]);
      setPlans(plans);
      setFounderSlots(slots);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlans(); }, []);

  // ── Edit helpers ────────────────────────────────────────────────────────────

  function startEdit(plan: Plan) {
    setEditing({ ...plan, perks: [...plan.perks] });
    setEditPerkInput("");
  }

  function editAddPerk() {
    const perk = editPerkInput.trim();
    if (!perk || !editing) return;
    setEditing({ ...editing, perks: [...editing.perks, perk] });
    setEditPerkInput("");
  }

  function editRemovePerk(i: number) {
    if (!editing) return;
    setEditing({ ...editing, perks: editing.perks.filter((_, idx) => idx !== i) });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/memberships/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          priceUsd: Number(editing.priceUsd),
          period: editing.period,
          description: editing.description,
          perks: editing.perks,
        }),
      });
      const updated = await res.json();
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(plan: Plan) {
    if (!confirm(`Delete the "${plan.name}" tier? This cannot be undone.`)) return;
    await fetch(`/api/memberships/${plan.id}`, { method: "DELETE" });
    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
  }

  // ── Create helpers ──────────────────────────────────────────────────────────

  function createAddPerk() {
    const perk = createPerkInput.trim();
    if (!perk) return;
    setCreateForm((prev) => ({ ...prev, perks: [...prev.perks, perk] }));
    setCreatePerkInput("");
  }

  function createRemovePerk(i: number) {
    setCreateForm((prev) => ({ ...prev, perks: prev.perks.filter((_, idx) => idx !== i) }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const created = await res.json();
      setPlans((prev) => [...prev, created]);
      setCreateForm(EMPTY_FORM);
      setCreatePerkInput("");
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  }

  // ── Shared styles ───────────────────────────────────────────────────────────

  const inputCls = "w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-cyan-400";
  const labelCls = "block text-sm font-semibold text-slate-300 mb-1.5";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Memberships"
        description="Edit membership tiers, adjust prices and perks, or create new tiers."
      />

      {/* Founder slot counter */}
      {founderSlots && (
        <div className="flex items-center gap-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-5 py-4">
          <span className="text-2xl">★</span>
          <div>
            <p className="text-sm font-bold text-yellow-300">
              {founderSlots.filled} of {founderSlots.cap} Founding Hero spots taken
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {founderSlots.remaining} slot{founderSlots.remaining !== 1 ? "s" : ""} remaining at $15/month (locked forever).
              {founderSlots.remaining === 0 && " The Founding Hero plan is now hidden from public listings."}
            </p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-[2rem] bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) =>
            editing?.id === plan.id ? (
              // ── Edit form ──────────────────────────────────────────────────
              <div key={plan.id} className="rounded-[2rem] border border-cyan-400/30 bg-slate-950/80 p-6 space-y-5">
                <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Editing — {plan.name}</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Tier name</label>
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Price ($)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editing.priceUsd}
                        onChange={(e) => setEditing({ ...editing, priceUsd: Number(e.target.value) })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Period</label>
                      <select
                        value={editing.period}
                        onChange={(e) => setEditing({ ...editing, period: e.target.value })}
                        className={inputCls}
                      >
                        <option>Day</option>
                        <option>Week</option>
                        <option>Month</option>
                        <option>Year</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={2}
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    className={inputCls + " resize-none"}
                  />
                </div>

                <div>
                  <label className={labelCls}>Perks</label>
                  <div className="space-y-2 mb-3">
                    {editing.perks.map((perk, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-3 py-2 text-sm text-white">
                        <span>{perk}</span>
                        <button
                          type="button"
                          onClick={() => editRemovePerk(i)}
                          className="text-zinc-500 hover:text-red-400 transition ml-3 text-base leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      placeholder="Add a perk…"
                      value={editPerkInput}
                      onChange={(e) => setEditPerkInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editAddPerk(); } }}
                      className={inputCls + " text-sm py-2"}
                    />
                    <button
                      type="button"
                      onClick={editAddPerk}
                      className="rounded-2xl bg-white/10 hover:bg-white/20 transition text-white px-4 py-2 text-sm font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="bg-cyan-400 hover:bg-cyan-300 transition text-black font-bold px-6 py-3 rounded-2xl disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="bg-white/5 hover:bg-white/10 transition text-white px-6 py-3 rounded-2xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // ── Plan display card ──────────────────────────────────────────
              <div key={plan.id} className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h2 className="text-2xl font-black text-white">{plan.name}</h2>
                      <span className="text-3xl font-black text-cyan-400">
                        ${plan.priceUsd}
                        <span className="text-sm font-normal text-zinc-400"> / {plan.period}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-400 text-sm">{plan.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.perks.map((perk, i) => (
                        <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => startEdit(plan)}
                      className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition px-4 py-2 text-sm font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePlan(plan)}
                      className="rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition px-4 py-2 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Create new tier */}
      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="rounded-[2rem] border border-purple-500/30 bg-slate-950/80 p-6 space-y-5"
        >
          <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">New Tier</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Tier name</label>
              <input
                required
                placeholder="e.g. Champion"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Price ($)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={createForm.priceUsd || ""}
                  onChange={(e) => setCreateForm({ ...createForm, priceUsd: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Period</label>
                <select
                  value={createForm.period}
                  onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })}
                  className={inputCls}
                >
                  <option>Day</option>
                  <option>Week</option>
                  <option>Month</option>
                  <option>Year</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              required
              rows={2}
              placeholder="What does this tier offer?"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className={inputCls + " resize-none"}
            />
          </div>

          <div>
            <label className={labelCls}>Perks</label>
            <div className="space-y-2 mb-3">
              {createForm.perks.map((perk, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-3 py-2 text-sm text-white">
                  <span>{perk}</span>
                  <button
                    type="button"
                    onClick={() => createRemovePerk(i)}
                    className="text-zinc-500 hover:text-red-400 transition ml-3 text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Add a perk…"
                value={createPerkInput}
                onChange={(e) => setCreatePerkInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); createAddPerk(); } }}
                className={inputCls + " text-sm py-2"}
              />
              <button
                type="button"
                onClick={createAddPerk}
                className="rounded-2xl bg-white/10 hover:bg-white/20 transition text-white px-4 py-2 text-sm font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={creating}
              className="bg-purple-500 hover:bg-purple-400 transition text-white font-bold px-6 py-3 rounded-2xl disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create Tier"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); setCreatePerkInput(""); }}
              className="bg-white/5 hover:bg-white/10 transition text-white px-6 py-3 rounded-2xl"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full rounded-[2rem] border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition py-5 text-sm font-semibold text-zinc-400 hover:text-white"
        >
          + Add New Tier
        </button>
      )}
    </section>
  );
}
