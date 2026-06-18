"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

export default function StaffLoginPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ name: "", pin: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.replace("/admin/sessions");
      } else {
        const d = await res.json();
        setError(d.error ?? "Invalid credentials.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0D1E] flex items-center justify-center p-6 relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-400 mb-2">Elite Gamers Lounge</p>
          <h1 className="text-3xl font-black text-white">Staff Login</h1>
          <p className="text-slate-400 text-sm mt-2">Enter your name and PIN to continue</p>
        </div>

        <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-100">
              Your Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Tendai"
                autoComplete="username"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white text-sm outline-none focus:border-cyan-400 transition"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-100">
              PIN
              <div className="relative mt-2">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))}
                  required
                  minLength={4}
                  maxLength={8}
                  placeholder="••••"
                  autoComplete="current-password"
                  className="w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white text-sm outline-none focus:border-cyan-400 transition pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white transition"
                >
                  {showPin ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <p className="text-sm text-rose-400 bg-rose-950/30 border border-rose-500/30 rounded-2xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !form.name.trim() || !form.pin}
              className="w-full rounded-3xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black text-sm uppercase tracking-[0.15em] py-4 transition-colors"
            >
              {loading ? "Logging in..." : "Enter"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Admin?{" "}
          <a href="/admin" className="text-slate-400 hover:text-white transition-colors">
            Go to admin dashboard →
          </a>
        </p>
      </div>
    </div>
  );
}
