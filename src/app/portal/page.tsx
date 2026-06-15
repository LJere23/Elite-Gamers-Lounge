"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

export default function PortalLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect && redirect.startsWith("/")) setRedirectTo(redirect);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) {
      setError("Please enter your email or GamerTag.");
      return;
    }
    if (!pin.trim()) {
      setError("Please enter your PIN.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }
      router.push(redirectTo ?? `/portal/${data.player.gamerTag}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-[#0F0D1E] border border-purple-500/50 focus:border-yellow-400/70 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-purple-400/60 transition-colors";

  return (
    <div className="bg-gradient-to-br from-[#0F0D1E] via-[#1E1654] to-[#0F0D1E] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      <div className="w-full max-w-md relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#231980] border-2 border-yellow-400/50 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 text-yellow-400"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#1E1654] border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-950/60">
          <h1 className="text-3xl font-black text-center text-yellow-400 mb-1 tracking-tight">
            Guild Portal
          </h1>
          {redirectTo === "/quests" ? (
            <p className="text-center text-yellow-400/80 text-sm mb-8 bg-yellow-950/30 border border-yellow-400/20 rounded-xl px-4 py-2">
              Log in to track your Quest progress
            </p>
          ) : (
            <p className="text-center text-purple-300 text-sm mb-8">
              Enter your GamerTag (or email) and PIN
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-purple-200 text-sm font-semibold mb-2">
                Email or GamerTag
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="GamerTag or email"
                autoFocus
                autoComplete="username"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-purple-200 text-sm font-semibold mb-2">
                PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Your 4–6 digit PIN"
                autoComplete="current-password"
                className={inputClass}
              />
            </div>

            {error && (
              <p className="text-rose-400 text-sm bg-rose-950/30 border border-rose-500/30 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#0F0D1E] font-black text-base rounded-xl py-3 transition-colors mt-2"
            >
              {loading ? "Entering the Guild..." : "Enter the Guild"}
            </button>
          </form>

          <p className="text-center text-purple-400/60 text-xs mt-6">
            New here?{" "}
            <Link href="/register" className="text-yellow-400/80 hover:text-yellow-400 transition-colors underline underline-offset-2">
              Register and set your PIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
