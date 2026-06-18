"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { LoungeSettings } from "@/types/admin";

const EMPTY: LoungeSettings = {
  id: "singleton",
  name: "",
  tagline: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  sessionRate: 1.0,
  wifiRate: 0.5,
  currency: "USD",
  openingTime: "09:00",
  closingTime: "22:00",
  whatsappNumber: "",
  adminPassword: "",
  communityHeadline: "",
  communityBody: "",
  communityStat1Label: "Members",
  communityStat1Value: "200+",
  communityStat2Label: "Tournaments",
  communityStat2Value: "50+",
  communityStat3Label: "Games Available",
  communityStat3Value: "30+",
  countdownEnabled: false,
  countdownTitle: "Next Event",
  countdownDate: "",
  doubleXpActive: false,
  doubleXpMultiplier: 2.0,
  doubleXpUntil: null,
  doubleXpLabel: "Double XP Event",
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<LoungeSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: LoungeSettings) => {
        setForm({ ...EMPTY, ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof LoungeSettings, value: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (status !== "idle") setStatus("idle");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      const saved: LoungeSettings = await res.json();
      setForm({ ...EMPTY, ...saved });
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-slate-300">Loading settings...</div>;
  }

  const inputClass =
    "mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400";

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="System settings"
        description="Configure lounge defaults, operating hours, contact information and community content."
      />

      <form onSubmit={handleSave} className="space-y-8">
        {/* ── Operational ── */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 space-y-6">
          <h2 className="text-2xl font-black text-white">Operational settings</h2>

          <label className="block text-sm font-semibold text-slate-100">
            Lounge name
            <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} className={inputClass} required />
          </label>

          <label className="block text-sm font-semibold text-slate-100">
            Tagline
            <input type="text" value={form.tagline} onChange={(e) => handleChange("tagline", e.target.value)} className={inputClass} />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-100">
              Contact email
              <input type="email" value={form.contactEmail} onChange={(e) => handleChange("contactEmail", e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Contact phone
              <input type="text" value={form.contactPhone} onChange={(e) => handleChange("contactPhone", e.target.value)} className={inputClass} />
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-100">
            WhatsApp number (digits only, e.g. 263784497531)
            <input type="text" value={form.whatsappNumber ?? ""} onChange={(e) => handleChange("whatsappNumber", e.target.value)} className={inputClass} placeholder="263784497531" />
          </label>

          <label className="block text-sm font-semibold text-slate-100">
            Address
            <input type="text" value={form.address} onChange={(e) => handleChange("address", e.target.value)} className={inputClass} />
          </label>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-slate-100">
              Session rate ($/hr)
              <input type="number" step="0.01" min="0" value={form.sessionRate} onChange={(e) => handleChange("sessionRate", parseFloat(e.target.value) || 0)} className={inputClass} required />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              WiFi rate ($/hr)
              <input type="number" step="0.01" min="0" value={form.wifiRate} onChange={(e) => handleChange("wifiRate", parseFloat(e.target.value) || 0)} className={inputClass} required />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Currency
              <select value={form.currency} onChange={(e) => handleChange("currency", e.target.value)} className={inputClass}>
                <option value="USD">USD</option>
                <option value="ZWL">ZWL</option>
                <option value="ZAR">ZAR</option>
              </select>
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-100">
              Opening time
              <input type="time" value={form.openingTime} onChange={(e) => handleChange("openingTime", e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm font-semibold text-slate-100">
              Closing time
              <input type="time" value={form.closingTime} onChange={(e) => handleChange("closingTime", e.target.value)} className={inputClass} />
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-100">
            Admin password
            <input type="password" value={form.adminPassword ?? ""} onChange={(e) => handleChange("adminPassword", e.target.value)} className={inputClass} placeholder="Leave blank to keep current" autoComplete="new-password" />
          </label>
        </div>

        {/* ── Community ── */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 space-y-6">
          <h2 className="text-2xl font-black text-white">Community section</h2>
          <p className="text-sm text-zinc-500">Shown on the homepage between Memberships and Gallery.</p>

          <label className="block text-sm font-semibold text-slate-100">
            Headline
            <input type="text" value={form.communityHeadline ?? ""} onChange={(e) => handleChange("communityHeadline", e.target.value)} className={inputClass} />
          </label>

          <label className="block text-sm font-semibold text-slate-100">
            Body text
            <textarea value={form.communityBody ?? ""} onChange={(e) => handleChange("communityBody", e.target.value)} rows={4} className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400 resize-y" />
          </label>

          <div className="grid gap-5 sm:grid-cols-3">
            {(
              [
                { labelKey: "communityStat1Label", valueKey: "communityStat1Value" },
                { labelKey: "communityStat2Label", valueKey: "communityStat2Value" },
                { labelKey: "communityStat3Label", valueKey: "communityStat3Value" },
              ] as const
            ).map(({ labelKey, valueKey }, i) => (
              <div key={i} className="space-y-3">
                <label className="block text-sm font-semibold text-slate-100">
                  Stat {i + 1} label
                  <input type="text" value={form[labelKey] ?? ""} onChange={(e) => handleChange(labelKey, e.target.value)} className={inputClass} />
                </label>
                <label className="block text-sm font-semibold text-slate-100">
                  Stat {i + 1} value
                  <input type="text" value={form[valueKey] ?? ""} onChange={(e) => handleChange(valueKey, e.target.value)} className={inputClass} />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* ── Countdown ── */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 space-y-6">
          <h2 className="text-2xl font-black text-white">Countdown timer</h2>
          <p className="text-sm text-zinc-500">Show a countdown on the homepage. Use for grand openings, tournaments, special events, or anything you want to build hype for.</p>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => handleChange("countdownEnabled", !form.countdownEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.countdownEnabled ? "bg-cyan-500" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.countdownEnabled ? "left-7" : "left-1"}`} />
            </div>
            <span className="text-sm font-semibold text-slate-100">{form.countdownEnabled ? "Visible on homepage" : "Hidden"}</span>
          </label>

          <label className="block text-sm font-semibold text-slate-100">
            Event title
            <input type="text" value={form.countdownTitle ?? ""} onChange={(e) => handleChange("countdownTitle", e.target.value)} className={inputClass} placeholder="Grand Opening, Next Tournament…" />
          </label>

          <label className="block text-sm font-semibold text-slate-100">
            Target date & time
            <input type="datetime-local" value={form.countdownDate ?? ""} onChange={(e) => handleChange("countdownDate", e.target.value)} className={`${inputClass} [color-scheme:dark]`} />
          </label>
        </div>

        {/* ── Double XP Event ── */}
        <div className="space-y-5 rounded-[2rem] border border-white/10 bg-zinc-950 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-400">Double XP Events</p>
            <h2 className="mt-2 text-xl font-black text-white">XP Multiplier</h2>
            <p className="text-sm text-zinc-500 mt-1">Enable a multiplier on all XP earned — applies to visit XP, job rewards, and challenge completions.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleChange("doubleXpActive", !form.doubleXpActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.doubleXpActive ? "bg-amber-500" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.doubleXpActive ? "left-7" : "left-1"}`} />
            </button>
            <span className="text-sm font-semibold text-slate-100">{form.doubleXpActive ? "Active — XP multiplier ON" : "Inactive"}</span>
          </div>

          {form.doubleXpActive && (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-semibold text-slate-100 sm:col-span-1">
                Label
                <input type="text" value={form.doubleXpLabel ?? ""} onChange={(e) => handleChange("doubleXpLabel", e.target.value)}
                  placeholder="Double XP Weekend" className={inputClass} />
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Multiplier
                <input type="number" min="1" max="10" step="0.5" value={form.doubleXpMultiplier ?? 2}
                  onChange={(e) => handleChange("doubleXpMultiplier", parseFloat(e.target.value))}
                  className={inputClass} />
              </label>
              <label className="block text-sm font-semibold text-slate-100">
                Ends at (optional)
                <input type="datetime-local" value={form.doubleXpUntil ? form.doubleXpUntil.replace("Z", "") : ""}
                  onChange={(e) => handleChange("doubleXpUntil", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className={`${inputClass} [color-scheme:dark]`} />
              </label>
            </div>
          )}
        </div>

        {/* ── Save ── */}
        {status === "success" && (
          <p className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-400">
            Settings saved successfully.
          </p>
        )}
        {status === "error" && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
            {errorMsg || "Failed to save settings. Please try again."}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-3xl bg-cyan-500 px-8 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save all settings"}
        </button>
      </form>
    </section>
  );
}
