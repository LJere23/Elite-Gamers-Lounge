"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tournament } from "@/types/admin";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TournamentTemplate {
  id: string;
  templateName: string;
  defaultGame: string;
  category: string;
  format: string;
  scoringSystem: string;
  maxPlayers: number;
  walkInFee: number;
  warriorFreeEntriesPerMonth: number;
  warriorDiscountPercent: number;
  heroFreeEntriesPerMonth: number;
  heroDiscountPercent: number;
  legendFreeEntriesPerMonth: number;
  legendDiscountPercent: number;
  xpReward: number;
  prizeDescription: string;
  isEnabled: boolean;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function freeLabel(free: number, discount: number, walkIn: number): string {
  if (free === -1) return "Always free";
  if (free === 0 && discount === 0) return `$${walkIn.toFixed(2)} (full price)`;
  if (free === 0 && discount > 0) return `${discount}% off ($${(walkIn * (1 - discount / 100)).toFixed(2)})`;
  const after = discount > 0 ? `$${(walkIn * (1 - discount / 100)).toFixed(2)}` : `$${walkIn.toFixed(2)}`;
  return `${free} free/month then ${after}`;
}

const BLANK_TEMPLATE: Omit<TournamentTemplate, "id" | "createdAt"> = {
  templateName: "",
  defaultGame: "",
  category: "other",
  format: "knockout",
  scoringSystem: "best_of_1",
  maxPlayers: 8,
  walkInFee: 0,
  warriorFreeEntriesPerMonth: 0,
  warriorDiscountPercent: 0,
  heroFreeEntriesPerMonth: 0,
  heroDiscountPercent: 0,
  legendFreeEntriesPerMonth: 0,
  legendDiscountPercent: 0,
  xpReward: 0,
  prizeDescription: "",
  isEnabled: true,
};

const INPUT = "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none focus:border-cyan-400 text-sm";
const LABEL = "block text-xs font-semibold text-slate-300 mb-1";

// ── Sub-components ─────────────────────────────────────────────────────────────

function PricingLabel({ free, discount, walkIn }: { free: number; discount: number; walkIn: number }) {
  const label = freeLabel(free, discount, walkIn);
  const isFree = free === -1;
  const isDiscount = !isFree && discount > 0;
  return (
    <span className={`text-xs ${isFree ? "text-emerald-400" : isDiscount ? "text-amber-400" : "text-slate-400"}`}>
      {label}
    </span>
  );
}

function TemplateCard({
  tpl,
  onToggle,
  onEdit,
  onDelete,
}: {
  tpl: TournamentTemplate;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (tpl: TournamentTemplate) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`rounded-3xl border p-5 transition ${tpl.isEnabled ? "border-white/10 bg-black/30" : "border-white/5 bg-black/10 opacity-60"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-white text-base leading-tight">{tpl.templateName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{tpl.defaultGame} · {tpl.format.replace(/_/g, " ")} · {tpl.maxPlayers}p · +{tpl.xpReward} XP</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle(tpl.id, !tpl.isEnabled)}
            className={`text-[10px] font-black px-3 py-1 rounded-full border transition ${
              tpl.isEnabled
                ? "border-emerald-500/40 bg-emerald-900/30 text-emerald-400 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/40"
                : "border-slate-600/40 bg-slate-800/30 text-slate-500 hover:bg-emerald-900/20 hover:text-emerald-400"
            }`}
          >
            {tpl.isEnabled ? "ON" : "OFF"}
          </button>
          <button onClick={() => onEdit(tpl)} className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-400/30 hover:border-cyan-400/60 rounded-xl px-3 py-1 transition">Edit</button>
          <button onClick={() => onDelete(tpl.id)} className="text-xs text-slate-500 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 rounded-xl px-3 py-1 transition">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { tier: "Warrior", free: tpl.warriorFreeEntriesPerMonth, disc: tpl.warriorDiscountPercent },
          { tier: "Hero",    free: tpl.heroFreeEntriesPerMonth,    disc: tpl.heroDiscountPercent },
          { tier: "Legend",  free: tpl.legendFreeEntriesPerMonth,  disc: tpl.legendDiscountPercent },
        ].map(({ tier, free, disc }) => (
          <div key={tier} className="bg-white/5 rounded-xl px-3 py-2">
            <p className="text-[10px] text-slate-500 font-semibold mb-0.5">{tier}</p>
            <PricingLabel free={free} discount={disc} walkIn={tpl.walkInFee} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] text-slate-400 italic truncate">{tpl.prizeDescription}</p>
        <span className="text-xs text-slate-500 shrink-0">Walk-in ${tpl.walkInFee.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ── Template form ──────────────────────────────────────────────────────────────

function TemplateForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: Omit<TournamentTemplate, "id" | "createdAt">;
  onSave: (data: Omit<TournamentTemplate, "id" | "createdAt">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [f, setF] = useState(initial);
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL}>Template name</label>
          <input className={INPUT} value={f.templateName} onChange={(e) => set({ templateName: e.target.value })} placeholder="e.g. Friday Mini-Tourney" required />
        </div>
        <div>
          <label className={LABEL}>Default game</label>
          <input className={INPUT} value={f.defaultGame} onChange={(e) => set({ defaultGame: e.target.value })} placeholder="e.g. FIFA / MK" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL}>Category</label>
          <select className={INPUT} value={f.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="friday_mini">Friday Mini</option>
            <option value="racing_sim_league">Racing Sim League</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Format</label>
          <select className={INPUT} value={f.format} onChange={(e) => set({ format: e.target.value })}>
            <option value="knockout">Knockout</option>
            <option value="points_league">Points League</option>
            <option value="fastest_lap">Fastest Lap</option>
            <option value="double_elimination">Double Elimination</option>
            <option value="swiss">Swiss</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Scoring</label>
          <select className={INPUT} value={f.scoringSystem} onChange={(e) => set({ scoringSystem: e.target.value })}>
            <option value="best_of_1">Best of 1</option>
            <option value="best_of_3">Best of 3</option>
            <option value="best_of_5">Best of 5</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL}>Max players</label>
          <input type="number" min={2} className={INPUT} value={f.maxPlayers} onChange={(e) => set({ maxPlayers: Number(e.target.value) })} />
        </div>
        <div>
          <label className={LABEL}>Walk-in fee ($)</label>
          <input type="number" min={0} step={0.5} className={INPUT} value={f.walkInFee} onChange={(e) => set({ walkInFee: Number(e.target.value) })} />
        </div>
        <div>
          <label className={LABEL}>XP reward per entry</label>
          <input type="number" min={0} className={INPUT} value={f.xpReward} onChange={(e) => set({ xpReward: Number(e.target.value) })} />
        </div>
      </div>

      {/* Tier pricing */}
      <div>
        <p className={LABEL}>Tier pricing (free entries/month — use -1 for unlimited; discount % applies after free quota)</p>
        <div className="grid gap-3 sm:grid-cols-3 mt-2">
          {([
            ["Warrior", "warriorFreeEntriesPerMonth", "warriorDiscountPercent"],
            ["Hero",    "heroFreeEntriesPerMonth",    "heroDiscountPercent"],
            ["Legend",  "legendFreeEntriesPerMonth",  "legendDiscountPercent"],
          ] as const).map(([tier, freeKey, discKey]) => (
            <div key={tier} className="bg-white/5 rounded-2xl p-3 space-y-2">
              <p className="text-xs font-bold text-slate-300">{tier}</p>
              <div>
                <label className="text-[10px] text-slate-500">Free/month (-1=∞)</label>
                <input type="number" min={-1} className={INPUT + " mt-1"} value={f[freeKey]} onChange={(e) => set({ [freeKey]: Number(e.target.value) } as never)} />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Discount % after free</label>
                <input type="number" min={0} max={100} className={INPUT + " mt-1"} value={f[discKey]} onChange={(e) => set({ [discKey]: Number(e.target.value) } as never)} />
              </div>
              <p className="text-[10px] text-slate-400 italic mt-1">
                → <PricingLabel free={f[freeKey]} discount={f[discKey]} walkIn={f.walkInFee} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL}>Prize description</label>
        <textarea className={INPUT} rows={2} value={f.prizeDescription} onChange={(e) => set({ prizeDescription: e.target.value })} placeholder="e.g. $4 shop credit to winner" />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(f)}
          disabled={saving || !f.templateName.trim()}
          className="flex-1 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 py-3 text-sm font-bold text-black uppercase tracking-wider transition"
        >
          {saving ? "Saving…" : "Save template"}
        </button>
        <button onClick={onCancel} className="rounded-2xl border border-white/10 px-6 py-3 text-sm text-slate-300 hover:text-white transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const BLANK_TOURNAMENT = {
  name: "", game: "", category: "Sports Games", format: "knockout",
  scoringSystem: "best_of_1", entries: 8, entryFee: 0, prizeUsd: 0,
  prizeDescription: "", startAt: "", endAt: "",
};

export default function AdminTournamentsPage() {
  const [pageTab, setPageTab] = useState<"tournaments" | "templates">("tournaments");

  // ── Tournaments ──────────────────────────────────────────────────────────────
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [createMode, setCreateMode] = useState<"template" | "custom">("template");
  const [customForm, setCustomForm] = useState(BLANK_TOURNAMENT);
  const [creating, setCreating] = useState(false);

  // Template-based creation state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [fromTemplateName, setFromTemplateName] = useState("");
  const [fromTemplateStart, setFromTemplateStart] = useState("");
  const [fromTemplateEnd, setFromTemplateEnd] = useState("");
  const [fromTemplateGame, setFromTemplateGame] = useState("");
  const [fromTemplatePrize, setFromTemplatePrize] = useState("");
  const [fromTemplatePrizeUsd, setFromTemplatePrizeUsd] = useState(0);

  // ── Templates ────────────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<TournamentTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<TournamentTemplate | null>(null);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);

  const enabledTemplates = templates.filter((t) => t.isEnabled);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  useEffect(() => {
    fetch("/api/tournaments").then((r) => r.json()).then(setTournaments);
    fetch("/api/tournament-templates").then((r) => r.json()).then(setTemplates);
  }, []);

  // When a template is selected, pre-fill name and game
  function handleSelectTemplate(id: string) {
    setSelectedTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setFromTemplateName(tpl.templateName);
      setFromTemplateGame(tpl.defaultGame);
      setFromTemplatePrize(tpl.prizeDescription);
      setFromTemplatePrizeUsd(0);
    }
  }

  async function handleCreateFromTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return;
    setCreating(true);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fromTemplateName.trim() || selectedTemplate.templateName,
        game: fromTemplateGame.trim() || selectedTemplate.defaultGame,
        category: selectedTemplate.category,
        format: selectedTemplate.format,
        scoringSystem: selectedTemplate.scoringSystem,
        entries: selectedTemplate.maxPlayers,
        entryFee: selectedTemplate.walkInFee,
        prizeUsd: fromTemplatePrizeUsd,
        prizeDescription: fromTemplatePrize.trim() || selectedTemplate.prizeDescription,
        startAt: fromTemplateStart,
        endAt: fromTemplateEnd,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setTournaments((prev) => [created, ...prev]);
      setSelectedTemplateId("");
      setFromTemplateName("");
      setFromTemplateStart("");
      setFromTemplateEnd("");
      setFromTemplateGame("");
      setFromTemplatePrize("");
      setFromTemplatePrizeUsd(0);
    }
    setCreating(false);
  }

  async function handleCreateCustom(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...customForm, entryFee: Number(customForm.entryFee), prizeUsd: Number(customForm.prizeUsd), entries: Number(customForm.entries) }),
    });
    if (res.ok) {
      const created = await res.json();
      setTournaments((prev) => [created, ...prev]);
      setCustomForm(BLANK_TOURNAMENT);
    }
    setCreating(false);
  }

  // ── Template CRUD ────────────────────────────────────────────────────────────

  async function handleToggleTemplate(id: string, enabled: boolean) {
    const res = await fetch(`/api/tournament-templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: enabled }),
    });
    if (res.ok) {
      const updated: TournamentTemplate = await res.json();
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  }

  async function handleSaveTemplate(data: Omit<TournamentTemplate, "id" | "createdAt">) {
    setTemplateSaving(true);
    if (editingTemplate) {
      const res = await fetch(`/api/tournament-templates/${editingTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated: TournamentTemplate = await res.json();
        setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? updated : t)));
        setEditingTemplate(null);
      }
    } else {
      const res = await fetch("/api/tournament-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created: TournamentTemplate = await res.json();
        setTemplates((prev) => [...prev, created]);
        setShowNewTemplateForm(false);
      }
    }
    setTemplateSaving(false);
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Delete this template? Tournaments already created from it won't be affected.")) return;
    const res = await fetch(`/api/tournament-templates/${id}`, { method: "DELETE" });
    if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Tournament management"
        description="Create new events, schedule matches, and keep tournament operations live."
      />

      {/* Page tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {(["tournaments", "templates"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setPageTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition capitalize ${
              pageTab === tab
                ? "border-cyan-400 text-cyan-400 bg-cyan-400/5"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {tab === "tournaments" ? `Tournaments (${tournaments.length})` : `Templates (${templates.length})`}
          </button>
        ))}
      </div>

      {/* ── Tournaments tab ── */}
      {pageTab === "tournaments" && (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.7fr]">
          {/* Tournament list */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">All tournaments</p>
                <h2 className="mt-3 text-3xl font-black text-white">
                  {tournaments.length} events
                  {tournaments.filter((t) => t.status === "ongoing").length > 0 &&
                    ` • ${tournaments.filter((t) => t.status === "ongoing").length} live`}
                </h2>
              </div>
            </div>
            <div className="space-y-4">
              {tournaments.length === 0 && (
                <p className="text-slate-500 text-sm py-8 text-center">No tournaments yet. Create one from a template or custom.</p>
              )}
              {tournaments.map((tournament) => (
                <Link key={tournament.id} href={`/admin/tournaments/${tournament.id}`}
                  className="block rounded-3xl border border-white/5 bg-black/40 p-5 transition hover:border-cyan-400/40">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{tournament.status}</p>
                      <h3 className="mt-2 text-xl font-bold text-white">{tournament.name}</h3>
                      <p className="text-slate-300">{tournament.game} · {tournament.category} · {tournament.format.replace(/_/g, " ")}</p>
                      <p className="mt-2 text-slate-300">{tournament.entries} target entries</p>
                    </div>
                    <span className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">${tournament.prizeUsd} prize</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Create panel */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
            <h2 className="text-2xl font-black text-white mb-1">Create a tournament</h2>
            <p className="text-slate-400 text-sm mb-5">Pick a template for quick setup, or build a fully custom event.</p>

            {/* Mode tabs */}
            <div className="flex rounded-2xl border border-white/10 p-1 gap-1 mb-6">
              {(["template", "custom"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCreateMode(mode)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                    createMode === mode ? "bg-cyan-500 text-black" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {mode === "template" ? "From Template" : "Custom"}
                </button>
              ))}
            </div>

            {/* From Template form */}
            {createMode === "template" && (
              <form onSubmit={handleCreateFromTemplate} className="space-y-4">
                <div>
                  <label className={LABEL}>Template</label>
                  <select
                    className={INPUT}
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    required
                  >
                    <option value="">— pick a template —</option>
                    {enabledTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.templateName}</option>
                    ))}
                  </select>
                  {enabledTemplates.length === 0 && (
                    <p className="text-xs text-amber-400 mt-1">No enabled templates. Enable one in the Templates tab.</p>
                  )}
                </div>

                {/* Template preview card */}
                {selectedTemplate && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-900/10 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-cyan-300">{selectedTemplate.format.replace(/_/g, " ")} · {selectedTemplate.maxPlayers} players · +{selectedTemplate.xpReward} XP</p>
                      <span className="text-xs text-slate-400">Walk-in ${selectedTemplate.walkInFee.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {[
                        ["Warrior", selectedTemplate.warriorFreeEntriesPerMonth, selectedTemplate.warriorDiscountPercent],
                        ["Hero",    selectedTemplate.heroFreeEntriesPerMonth,    selectedTemplate.heroDiscountPercent],
                        ["Legend",  selectedTemplate.legendFreeEntriesPerMonth,  selectedTemplate.legendDiscountPercent],
                      ].map(([tier, free, disc]) => (
                        <div key={String(tier)} className="bg-white/5 rounded-xl p-2">
                          <p className="text-[9px] text-slate-500 font-semibold">{tier}</p>
                          <PricingLabel free={Number(free)} discount={Number(disc)} walkIn={selectedTemplate.walkInFee} />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 italic">{selectedTemplate.prizeDescription}</p>
                  </div>
                )}

                <div>
                  <label className={LABEL}>Tournament name</label>
                  <input className={INPUT} value={fromTemplateName} onChange={(e) => setFromTemplateName(e.target.value)}
                    placeholder={selectedTemplate?.templateName ?? "Tournament name"} required />
                </div>
                <div>
                  <label className={LABEL}>Game (optional override)</label>
                  <input className={INPUT} value={fromTemplateGame} onChange={(e) => setFromTemplateGame(e.target.value)}
                    placeholder={selectedTemplate?.defaultGame ?? "Game"} />
                </div>
                <div>
                  <label className={LABEL}>Prize description (optional override)</label>
                  <input className={INPUT} value={fromTemplatePrize} onChange={(e) => setFromTemplatePrize(e.target.value)}
                    placeholder={selectedTemplate?.prizeDescription ?? "Prize"} />
                </div>
                <div>
                  <label className={LABEL}>Prize value USD (for display)</label>
                  <input type="number" min={0} className={INPUT} value={fromTemplatePrizeUsd}
                    onChange={(e) => setFromTemplatePrizeUsd(Number(e.target.value))} />
                </div>
                <div>
                  <label className={LABEL}>Start date & time</label>
                  <input type="datetime-local" className={INPUT} value={fromTemplateStart}
                    onChange={(e) => setFromTemplateStart(e.target.value)} required />
                </div>
                <div>
                  <label className={LABEL}>End date & time</label>
                  <input type="datetime-local" className={INPUT} value={fromTemplateEnd}
                    onChange={(e) => setFromTemplateEnd(e.target.value)} required />
                </div>
                <button type="submit" disabled={creating || !selectedTemplateId}
                  className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-cyan-400 disabled:opacity-50">
                  {creating ? "Creating…" : "Create tournament"}
                </button>
              </form>
            )}

            {/* Custom form */}
            {createMode === "custom" && (
              <form className="space-y-5" onSubmit={handleCreateCustom}>
                <div>
                  <label className={LABEL}>Tournament name</label>
                  <input className={INPUT} value={customForm.name} onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className={LABEL}>Game</label>
                  <input className={INPUT} value={customForm.game} onChange={(e) => setCustomForm({ ...customForm, game: e.target.value })} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Category</label>
                    <select className={INPUT} value={customForm.category} onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}>
                      <option>Sports Games</option>
                      <option>Racing</option>
                      <option>Fighting</option>
                      <option>Strategy</option>
                      <option>Minds</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Format</label>
                    <select className={INPUT} value={customForm.format} onChange={(e) => setCustomForm({ ...customForm, format: e.target.value })}>
                      <option value="knockout">Knockout</option>
                      <option value="points_league">Points League</option>
                      <option value="fastest_lap">Fastest Lap</option>
                      <option value="double_elimination">Double Elimination</option>
                      <option value="swiss">Swiss</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Scoring system</label>
                  <select className={INPUT} value={customForm.scoringSystem} onChange={(e) => setCustomForm({ ...customForm, scoringSystem: e.target.value })}>
                    <option value="best_of_1">Best of 1</option>
                    <option value="best_of_3">Best of 3</option>
                    <option value="best_of_5">Best of 5</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Prize description</label>
                  <textarea className={INPUT} rows={2} value={customForm.prizeDescription} onChange={(e) => setCustomForm({ ...customForm, prizeDescription: e.target.value })} />
                </div>
                <div className="grid gap-4 grid-cols-3">
                  <div>
                    <label className={LABEL}>Max players</label>
                    <input type="number" min={2} className={INPUT} value={customForm.entries} onChange={(e) => setCustomForm({ ...customForm, entries: Number(e.target.value) })} required />
                  </div>
                  <div>
                    <label className={LABEL}>Entry fee ($)</label>
                    <input type="number" min={0} step={0.5} className={INPUT} value={customForm.entryFee} onChange={(e) => setCustomForm({ ...customForm, entryFee: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className={LABEL}>Prize USD</label>
                    <input type="number" min={0} className={INPUT} value={customForm.prizeUsd} onChange={(e) => setCustomForm({ ...customForm, prizeUsd: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Start date & time</label>
                  <input type="datetime-local" className={INPUT} value={customForm.startAt} onChange={(e) => setCustomForm({ ...customForm, startAt: e.target.value })} required />
                </div>
                <div>
                  <label className={LABEL}>End date & time</label>
                  <input type="datetime-local" className={INPUT} value={customForm.endAt} onChange={(e) => setCustomForm({ ...customForm, endAt: e.target.value })} required />
                </div>
                <button type="submit" disabled={creating}
                  className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-cyan-400 disabled:opacity-50">
                  {creating ? "Creating…" : "Create tournament"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Templates tab ── */}
      {pageTab === "templates" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{templates.length} templates · {enabledTemplates.length} active</p>
            <button
              onClick={() => { setShowNewTemplateForm(true); setEditingTemplate(null); }}
              className="text-sm font-semibold text-cyan-400 border border-cyan-400/30 rounded-2xl px-5 py-2 hover:bg-cyan-400/10 transition"
            >
              + New template
            </button>
          </div>

          {/* New template form */}
          {showNewTemplateForm && !editingTemplate && (
            <div className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/80 p-8">
              <h3 className="text-lg font-black text-white mb-6">New template</h3>
              <TemplateForm
                initial={BLANK_TEMPLATE}
                onSave={handleSaveTemplate}
                onCancel={() => setShowNewTemplateForm(false)}
                saving={templateSaving}
              />
            </div>
          )}

          {/* Edit form */}
          {editingTemplate && (
            <div className="rounded-[2rem] border border-amber-400/20 bg-slate-950/80 p-8">
              <h3 className="text-lg font-black text-white mb-6">Edit — {editingTemplate.templateName}</h3>
              <TemplateForm
                initial={editingTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => setEditingTemplate(null)}
                saving={templateSaving}
              />
            </div>
          )}

          {/* Template cards */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8">
            <div className="grid gap-4 lg:grid-cols-2">
              {templates.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  onToggle={handleToggleTemplate}
                  onEdit={(t) => { setEditingTemplate(t); setShowNewTemplateForm(false); }}
                  onDelete={handleDeleteTemplate}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
