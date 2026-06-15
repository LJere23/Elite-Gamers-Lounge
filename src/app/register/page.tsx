"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

interface FormState {
  name: string;
  gamerTag: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  city: string;
  favouriteGame: string;
  pin: string;
  confirmPin: string;
}

interface SuccessData {
  name: string;
  gamerTag: string;
}

function cleanGamerTag(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32);
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    gamerTag: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    city: "Gweru",
    favouriteGame: "",
    pin: "",
    confirmPin: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessData | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === "gamerTag") {
      setForm((prev) => ({ ...prev, gamerTag: cleanGamerTag(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.pin !== form.confirmPin) {
      setError("PINs do not match.");
      setLoading(false);
      return;
    }
    if (!/^\d{4,6}$/.test(form.pin)) {
      setError("PIN must be 4–6 digits.");
      setLoading(false);
      return;
    }

    const cleanedTag = cleanGamerTag(form.gamerTag);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      gamerTag: cleanedTag,
      email: form.email.trim(),
      membershipTier: "Adventurer",
      city: form.city.trim() || "Gweru",
      pin: form.pin,
    };

    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.favouriteGame.trim()) payload.favouriteGame = form.favouriteGame.trim();

    // Auto-assign Otherworlder title for non-Gweru cities
    if (payload.city !== "Gweru") {
      payload.title = "Otherworlder";
    }

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            "Registration failed. Your email or GamerTag may already be taken."
        );
        return;
      }

      const gamerTag = data.gamerTag ?? cleanedTag;

      // Auto-login the newly registered player
      const loginRes = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: gamerTag, pin: form.pin }),
      });

      if (loginRes.ok) {
        router.push(`/portal/${gamerTag}`);
      } else {
        // Registration succeeded but auto-login failed — send to portal login
        router.push("/portal");
      }
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors";

  const labelClass = "block text-sm font-semibold text-slate-300 mb-2";

  // ── Success screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Glow ring icon */}
          <div className="flex justify-center mb-8">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl" />
              <div className="relative w-24 h-24 rounded-full bg-slate-950 border-2 border-cyan-400/60 flex items-center justify-center shadow-lg shadow-cyan-900/40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-12 h-12 text-cyan-400"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40 text-center space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-400 mb-2">
                Quest complete
              </p>
              <h1 className="text-3xl font-black text-white leading-tight">
                Welcome to the Guild,{" "}
                <span className="text-cyan-400">{success.name}</span>!
              </h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4 space-y-1">
              <p className="text-slate-400 text-sm">Your GamerTag</p>
              <p className="text-cyan-400 text-xl font-black tracking-wide">
                @{success.gamerTag}
              </p>
            </div>

            <p className="text-slate-400 text-sm">
              Access your Guild Card at{" "}
              <span className="text-cyan-400 font-semibold">/portal</span>
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => router.push("/portal")}
                className="w-full rounded-3xl bg-cyan-500 hover:bg-cyan-400 px-5 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-black transition-colors"
              >
                View My Guild Card
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full rounded-3xl border border-white/10 bg-black/40 hover:bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-300 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <AnimatedBackground />
      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-cyan-400/15 blur-xl" />
              <div className="relative w-20 h-20 rounded-full bg-slate-950 border-2 border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-900/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-cyan-400"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-400 mb-2">
            Gweru&apos;s Gamers Lounge
          </p>
          <h1 className="text-4xl font-black text-white mb-3">
            Join the Guild
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            Register your account to earn XP and track your progress
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-950 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className={labelClass}>
                Full Name <span className="text-cyan-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                className={inputClass}
              />
            </div>

            {/* GamerTag */}
            <div>
              <label htmlFor="gamerTag" className={labelClass}>
                GamerTag <span className="text-cyan-400">*</span>
              </label>
              <input
                id="gamerTag"
                name="gamerTag"
                type="text"
                value={form.gamerTag}
                onChange={handleChange}
                placeholder="e.g. ShadowByte99"
                required
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1.5 px-1">
                This is your unique player ID — letters, numbers and underscores only
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email <span className="text-cyan-400">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+263 7XX XXX XXX"
                className={inputClass}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className={labelClass}>
                Date of Birth{" "}
                <span className="text-slate-500 font-normal">
                  (for birthday rewards)
                </span>
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className={labelClass}>
                City <span className="text-cyan-400">*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                placeholder="Gweru"
                required
                className={inputClass}
              />
              {form.city.trim() && form.city.trim() !== "Gweru" && (
                <p className="text-xs text-cyan-400/70 mt-1.5 px-1">
                  Out-of-town adventurer detected — you will receive the &quot;Otherworlder&quot; title
                </p>
              )}
            </div>

            {/* Favourite Game */}
            <div>
              <label htmlFor="favouriteGame" className={labelClass}>
                Favourite Game{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="favouriteGame"
                name="favouriteGame"
                type="text"
                value={form.favouriteGame}
                onChange={handleChange}
                placeholder="e.g. FIFA 24, Call of Duty, Fortnite..."
                className={inputClass}
              />
            </div>

            {/* PIN */}
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/10 p-5 space-y-4">
              <p className="text-sm font-bold text-cyan-400">Set your Guild PIN</p>
              <p className="text-xs text-slate-400">Choose a 4–6 digit PIN to secure your Guild Card. You&apos;ll need it every time you log in.</p>
              <div>
                <label htmlFor="pin" className={labelClass}>
                  PIN <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pin}
                  onChange={handleChange}
                  placeholder="4–6 digits"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="confirmPin" className={labelClass}>
                  Confirm PIN <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="confirmPin"
                  name="confirmPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.confirmPin}
                  onChange={handleChange}
                  placeholder="Repeat your PIN"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition-colors mt-2"
            >
              {loading ? "Joining the Guild..." : "Join the Guild"}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            Already a member?{" "}
            <button
              onClick={() => router.push("/portal")}
              className="text-cyan-400/70 hover:text-cyan-400 transition-colors underline underline-offset-2"
            >
              Access your Guild Card
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
