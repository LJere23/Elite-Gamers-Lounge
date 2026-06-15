"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  message: string;
  sortOrder: number;
}

const EMPTY = { name: "", role: "", message: "", sortOrder: 0 };

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function openNew() {
    setForm(EMPTY);
    setEditId("new");
  }

  function openEdit(t: Testimonial) {
    setForm({ name: t.name, role: t.role, message: t.message, sortOrder: t.sortOrder });
    setEditId(t.id);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editId === "new") {
        const res = await fetch("/api/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        setItems((prev) => [...prev, created]);
      } else {
        const res = await fetch(`/api/testimonials/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setItems((prev) => prev.map((t) => (t.id === editId ? updated : t)));
      }
      setEditId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  const inputClass =
    "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400";

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Testimonials"
        description="Manage what gamers say about the lounge. Shown on the homepage."
      />

      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-cyan-400"
        >
          <Plus size={16} /> Add testimonial
        </button>
      </div>

      {/* Inline form */}
      {editId && (
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 space-y-5">
          <h2 className="text-xl font-black text-white">{editId === "new" ? "New testimonial" : "Edit testimonial"}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-100">
              Name
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Player name" />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Role / title
              <input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className={inputClass} placeholder="e.g. Competitive FIFA Player" />
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-100">
            Message
            <textarea
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400 resize-y"
              placeholder="What did they say about the lounge?"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-100">
            Sort order
            <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} className={inputClass} />
          </label>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-2.5 text-sm font-bold text-black transition hover:bg-cyan-400 disabled:opacity-50">
              <Check size={16} /> {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditId(null)} className="flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/20">
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-10 text-center">
          <p className="text-slate-400">No testimonials yet. Add one above.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <div key={t.id} className="rounded-[2rem] border border-slate-700 bg-slate-900/80 p-6 space-y-3">
              <p className="text-slate-200 text-sm leading-7">&ldquo;{t.message}&rdquo;</p>
              <div>
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="text-xs text-cyan-300">{t.role}</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => openEdit(t)} className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(t.id)} className="flex items-center gap-1.5 rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:border-red-400/50 hover:bg-red-950/20">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
