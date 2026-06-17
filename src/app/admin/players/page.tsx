"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import PlayerAvatar from "@/components/ui/PlayerAvatar";
import { Player } from "@/types/admin";

/* ─────────────────────────────────────────────
   Badge helpers
───────────────────────────────────────────── */

function tierBadge(tier: string, founderNumber?: number | null) {
  const map: Record<string, string> = {
    Villager: "border-slate-500/40 bg-slate-500/10 text-slate-400",
    Adventurer: "border-green-500/40 bg-green-500/10 text-green-400",
    Warrior: "border-blue-500/40 bg-blue-500/10 text-blue-400",
    Hero: "border-purple-500/40 bg-purple-500/10 text-purple-400",
    Legend: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    FoundingHero: "border-yellow-400/60 bg-yellow-400/10 text-yellow-300",
  };
  const cls = map[tier] ?? "border-white/10 bg-white/5 text-slate-400";
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${cls} inline-flex items-center gap-1`}>
      {tier === "FoundingHero" && <span>★</span>}
      {tier === "FoundingHero" ? "Founding Hero" : tier}
      {tier === "FoundingHero" && founderNumber && (
        <span className="opacity-60">#{founderNumber}</span>
      )}
    </span>
  );
}

function rankBadge(rank: string) {
  const map: Record<string, string> = {
    Villager: "border-slate-500/40 bg-slate-500/10 text-slate-400",
    Adventurer: "border-green-500/40 bg-green-500/10 text-green-400",
    "F Rank": "border-zinc-500/40 bg-zinc-500/10 text-zinc-400",
    "E Rank": "border-stone-400/40 bg-stone-400/10 text-stone-400",
    "D Rank": "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
    "C Rank": "border-orange-500/40 bg-orange-500/10 text-orange-400",
    "B Rank": "border-sky-500/40 bg-sky-500/10 text-sky-400",
    "A Rank": "border-violet-500/40 bg-violet-500/10 text-violet-400",
    "S Rank": "border-rose-500/40 bg-rose-500/10 text-rose-400",
  };
  const cls = map[rank] ?? "border-white/10 bg-white/5 text-slate-400";
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${cls}`}>
      {rank}
    </span>
  );
}

function statusBadge(status: string) {
  if (status === "active")
    return <span className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-0.5 text-xs font-semibold text-green-400">Active</span>;
  if (status === "banned")
    return <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-0.5 text-xs font-semibold text-red-400">Banned</span>;
  return <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-0.5 text-xs font-semibold text-slate-400">Inactive</span>;
}

/* ─────────────────────────────────────────────
   Form state type
───────────────────────────────────────────── */

interface PlayerForm {
  name: string;
  gamerTag: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  city: string;
  favoriteGame: string;
  membershipTier: string;
  status: string;
  tempPin: string;
}

const EMPTY_FORM: PlayerForm = {
  name: "",
  gamerTag: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  city: "Gweru",
  favoriteGame: "",
  membershipTier: "Villager",
  status: "active",
  tempPin: "",
};

/* ─────────────────────────────────────────────
   Modal component
───────────────────────────────────────────── */

function PlayerModal({
  title,
  form,
  onChange,
  onSubmit,
  onClose,
  saving,
  showStatus,
}: {
  title: string;
  form: PlayerForm;
  onChange: (field: keyof PlayerForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  saving: boolean;
  showStatus: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950 p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-400 transition hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>
        </div>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-100">
              Full name
              <input
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Gamer tag
              <input
                value={form.gamerTag}
                onChange={(e) => onChange("gamerTag", e.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Auto-generated if blank"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-100">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
              required
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-100">
              Phone
              <input
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Date of birth
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => onChange("dateOfBirth", e.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-100">
              City
              <input
                value={form.city}
                onChange={(e) => onChange("city", e.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Favourite game
              <input
                value={form.favoriteGame}
                onChange={(e) => onChange("favoriteGame", e.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-100">
              Membership tier
              <select
                value={form.membershipTier}
                onChange={(e) => onChange("membershipTier", e.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
              >
                <option value="Villager">Villager</option>
                <option value="Adventurer">Adventurer</option>
                <option value="Warrior">Warrior</option>
                <option value="Hero">Hero</option>
                <option value="Legend">Legend</option>
                <option value="FoundingHero">Founding Hero ($15/mo — limited)</option>
              </select>
            </label>
            {showStatus && (
              <label className="block text-sm font-semibold text-slate-100">
                Status
                <select
                  value={form.status}
                  onChange={(e) => onChange("status", e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                </select>
              </label>
            )}
          </div>
          {!showStatus && (
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-950/10 p-4 space-y-2">
              <p className="text-sm font-bold text-yellow-400">Temporary PIN (optional)</p>
              <p className="text-xs text-slate-400">Set a 4–6 digit PIN so this player can access their Guild Card. They can change it later.</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={form.tempPin}
                onChange={(e) => onChange("tempPin", e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-yellow-400"
                placeholder="4–6 digits"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save player"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Delete confirm modal
───────────────────────────────────────────── */

function DeleteModal({
  player,
  onConfirm,
  onClose,
  deleting,
}: {
  player: Player;
  onConfirm: () => void;
  onClose: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950 p-8 shadow-2xl shadow-black/40">
        <h2 className="text-xl font-black text-white">Delete player?</h2>
        <p className="mt-3 text-slate-300">
          This will permanently remove <span className="font-semibold text-white">{player.name}</span> ({player.gamerTag}) and all associated data.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-3xl border border-white/10 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-3xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */

interface FounderSlots { cap: number; remaining: number; filled: number; }
interface MemberAlert { id: string; name: string; gamerTag: string; membershipTier: string; membershipExpiresAt: string | null; isFounder: boolean; }
interface MembershipAlerts { expired: MemberAlert[]; expiringSoon: MemberAlert[]; }

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [founderSlots, setFounderSlots] = useState<FounderSlots | null>(null);
  const [alerts, setAlerts] = useState<MembershipAlerts | null>(null);

  // Modal state
  const [addOpen, setAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);

  const [form, setForm] = useState<PlayerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/founder-slots").then((r) => r.json()),
      fetch("/api/admin/membership-alerts").then((r) => r.json()),
    ])
      .then(([playerData, slots, membershipAlerts]) => {
        setPlayers(playerData);
        setFounderSlots(slots);
        setAlerts(membershipAlerts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* helpers */
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setAddOpen(true);
  };

  const openEdit = (player: Player) => {
    setForm({
      name: player.name,
      gamerTag: player.gamerTag,
      email: player.email,
      phone: player.phone ?? "",
      dateOfBirth: player.dateOfBirth ? player.dateOfBirth.slice(0, 10) : "",
      city: player.city,
      favoriteGame: player.favoriteGame ?? "",
      membershipTier: player.membershipTier,
      status: player.status,
      tempPin: "",
    });
    setEditPlayer(player);
  };

  const handleFormChange = (field: keyof PlayerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* create */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        gamerTag: form.gamerTag || undefined,
        email: form.email,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        city: form.city || "Gweru",
        favoriteGame: form.favoriteGame || undefined,
        membershipTier: form.membershipTier,
        pin: form.tempPin || undefined,
      };
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create player");
      const created: Player = await res.json();
      setPlayers((prev) => [created, ...prev]);
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  };

  /* update */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlayer) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        gamerTag: form.gamerTag || undefined,
        email: form.email,
        phone: form.phone || null,
        dateOfBirth: form.dateOfBirth || null,
        city: form.city || "Gweru",
        favoriteGame: form.favoriteGame || null,
        membershipTier: form.membershipTier,
        status: form.status,
      };
      const res = await fetch(`/api/players/${editPlayer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update player");
      const updated: Player = await res.json();
      setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditPlayer(null);
    } finally {
      setSaving(false);
    }
  };

  /* delete */
  const handleDelete = async () => {
    if (!deletePlayer) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/players/${deletePlayer.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete player");
      setPlayers((prev) => prev.filter((p) => p.id !== deletePlayer.id));
      setDeletePlayer(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Player registry"
        description="Register new members, track member details, and keep a complete member database."
      />

      {/* Modals */}
      {addOpen && (
        <PlayerModal
          title="Add new player"
          form={form}
          onChange={handleFormChange}
          onSubmit={handleAdd}
          onClose={() => setAddOpen(false)}
          saving={saving}
          showStatus={false}
        />
      )}
      {editPlayer && (
        <PlayerModal
          title={`Edit — ${editPlayer.name}`}
          form={form}
          onChange={handleFormChange}
          onSubmit={handleEdit}
          onClose={() => setEditPlayer(null)}
          saving={saving}
          showStatus={true}
        />
      )}
      {deletePlayer && (
        <DeleteModal
          player={deletePlayer}
          onConfirm={handleDelete}
          onClose={() => setDeletePlayer(null)}
          deleting={deleting}
        />
      )}

      {/* Membership expiry alerts */}
      {alerts && (alerts.expired.length > 0 || alerts.expiringSoon.length > 0) && (
        <div className="space-y-3">
          {alerts.expired.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm">
              <span className="text-red-400 font-bold">Expired</span>
              <span className="text-white">{p.name}</span>
              <span className="text-slate-400">@{p.gamerTag}</span>
              <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-xs text-red-300">{p.membershipTier}</span>
              {p.membershipExpiresAt && (
                <span className="text-slate-500 text-xs ml-auto">
                  Expired {new Date(p.membershipExpiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
          {alerts.expiringSoon.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-3 text-sm">
              <span className="text-yellow-400 font-bold">Expiring</span>
              <span className="text-white">{p.name}</span>
              <span className="text-slate-400">@{p.gamerTag}</span>
              <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-300">{p.membershipTier}</span>
              {p.membershipExpiresAt && (
                <span className="text-slate-500 text-xs ml-auto">
                  Expires {new Date(p.membershipExpiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-400">
            {players.length} player{players.length !== 1 ? "s" : ""} in the system
          </p>
          {founderSlots && (
            <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
              ★ {founderSlots.filled} / {founderSlots.cap} founding spots taken
            </span>
          )}
        </div>
        <button
          onClick={openAdd}
          className="rounded-3xl bg-cyan-500 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.15em] text-black transition hover:bg-cyan-400"
        >
          + Add Player
        </button>
      </div>

      {/* Table */}
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading players...</div>
        ) : players.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No players registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-4 py-4 font-semibold">GamerTag</th>
                  <th className="px-4 py-4 font-semibold">Email</th>
                  <th className="px-4 py-4 font-semibold">Tier</th>
                  <th className="px-4 py-4 font-semibold">Rank</th>
                  <th className="px-4 py-4 font-semibold text-right">XP</th>
                  <th className="px-4 py-4 font-semibold text-right">Visits</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Joined</th>
                  <th className="px-4 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {players.map((player) => (
                  <tr key={player.id} className="group transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} size="sm" />
                        <div>
                          <p className="font-semibold text-white">{player.name}</p>
                          {player.city && player.city !== "Gweru" && (
                            <p className="text-xs text-slate-500">{player.city}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-cyan-400">
                      {player.gamerTag}
                    </td>
                    <td className="px-4 py-4 text-slate-300">{player.email}</td>
                    <td className="px-4 py-4">{tierBadge(player.membershipTier, player.founderNumber)}</td>
                    <td className="px-4 py-4">{rankBadge(player.rank)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-white">
                      {player.xp}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-300">
                      {player.visitCount}
                    </td>
                    <td className="px-4 py-4">{statusBadge(player.status)}</td>
                    <td className="px-4 py-4 text-slate-400">
                      {new Date(player.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(player)}
                          className="rounded-2xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletePlayer(player)}
                          className="rounded-2xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-red-500/40 hover:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
