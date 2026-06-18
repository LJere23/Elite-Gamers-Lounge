"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface StaffAccount {
  id: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function AdminStaffPage() {
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading]   = useState(false);
  const [form, setForm]         = useState({ name: "", pin: "", role: "staff" });
  const [editId, setEditId]     = useState<string | null>(null);
  const [msg, setMsg]           = useState<string | null>(null);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  async function load() {
    const res = await fetch("/api/staff/accounts");
    if (res.ok) setAccounts(await res.json());
  }

  useEffect(() => { load(); }, []);

  function startEdit(a: StaffAccount) {
    setEditId(a.id);
    setForm({ name: a.name, pin: "", role: a.role });
    setMsg(null);
  }

  function cancelEdit() { setEditId(null); setForm({ name: "", pin: "", role: "staff" }); setMsg(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const url    = editId ? `/api/staff/accounts/${editId}` : "/api/staff/accounts";
    const method = editId ? "PATCH" : "POST";
    const body   = editId && !form.pin.trim()
      ? { name: form.name, role: form.role }
      : form;
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setMsg(editId ? "Account updated." : "Account created.");
      cancelEdit();
      await load();
    } else {
      const d = await res.json();
      setMsg(d.error ?? "Failed to save.");
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete staff account "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    await fetch(`/api/staff/accounts/${id}`, { method: "DELETE" });
    await load();
    setLoading(false);
  }

  async function handleToggle(a: StaffAccount) {
    setLoading(true);
    await fetch(`/api/staff/accounts/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !a.active }),
    });
    await load();
    setLoading(false);
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Staff Accounts"
        description="Manage staff PIN logins. Staff can create gaming sessions but cannot access admin settings."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

        {/* LIST */}
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Staff Accounts</p>
            <h2 className="mt-2 text-2xl font-black text-white">{accounts.length} accounts</h2>
          </div>

          {accounts.length === 0 && (
            <p className="text-sm text-slate-500">No staff accounts yet. Create one using the form.</p>
          )}

          <div className="space-y-3">
            {accounts.map((a) => (
              <div key={a.id} className={`rounded-3xl border p-5 ${a.active ? "border-white/5 bg-black/30" : "border-white/5 bg-black/10 opacity-50"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold">{a.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${a.role === "admin" ? "bg-amber-500/20 text-amber-300" : "bg-cyan-500/20 text-cyan-300"}`}>
                        {a.role}
                      </span>
                      {!a.active && <span className="text-[10px] text-red-400 font-semibold">INACTIVE</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Created {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <button onClick={() => startEdit(a)} className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">Edit</button>
                    <button onClick={() => handleToggle(a)} disabled={loading} className={`text-xs font-semibold ${a.active ? "text-amber-400" : "text-emerald-400"}`}>
                      {a.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => handleDelete(a.id, a.name)} disabled={loading} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 h-fit space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">{editId ? "Edit Account" : "New Account"}</p>
            <h2 className="mt-2 text-2xl font-black text-white">{editId ? "Update Staff" : "Add Staff"}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-100">
              Name
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                placeholder="e.g. Tendai"
                className="mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400" />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              PIN {editId && <span className="text-slate-500 font-normal">(leave blank to keep current)</span>}
              <div className="relative mt-1">
                <input
                  type={showPins["form"] ? "text" : "password"}
                  inputMode="numeric"
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))}
                  required={!editId}
                  minLength={4}
                  maxLength={8}
                  placeholder="4-8 digit PIN"
                  className="w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400 pr-12"
                />
                <button type="button" onClick={() => setShowPins((p) => ({ ...p, form: !p["form"] }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white">
                  {showPins["form"] ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Role
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="mt-1 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-400">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={loading || !form.name.trim()}
                className="flex-1 rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-bold uppercase tracking-wider text-black hover:bg-cyan-400 transition disabled:opacity-60">
                {loading ? "Saving..." : editId ? "Update" : "Add Account"}
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Access</p>
            <div className="space-y-1 text-xs text-slate-500">
              <p>Staff can log in at <span className="text-cyan-400 font-mono">/staff</span> using their name + PIN</p>
              <p>Staff can <span className="text-white font-semibold">create gaming sessions</span> for players</p>
              <p>Staff <span className="text-red-400">cannot</span> access admin settings, reports, or player data</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
