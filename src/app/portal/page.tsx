"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-[#0F0D1E] border border-purple-500/50 focus:border-yellow-400/70 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-purple-400/60 transition-colors";

// ── Login form ────────────────────────────────────────────────────────────────

const SESSION_KEY = "guild_session";
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours

function PortalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect && redirect.startsWith("/")) setRedirectTo(redirect);
  }, [searchParams]);

  // Auto-redirect if the user authenticated within the last 2 hours
  useEffect(() => {
    async function tryAutoRedirect() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const { gamerTag, authedAt } = JSON.parse(raw);
          if (gamerTag && Date.now() - authedAt < SESSION_TTL) {
            const res = await fetch("/api/portal/me");
            if (res.ok) {
              const data = await res.json();
              router.replace(redirectTo ?? `/portal/${data.player.gamerTag}`);
              return;
            }
            // Cookie expired — clear stale localStorage entry
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch {}
      setChecking(false);
    }
    tryAutoRedirect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) { setError("Please enter your email or GamerTag."); return; }
    if (!pin.trim()) { setError("Please enter your PIN."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed. Please try again."); return; }
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ gamerTag: data.player.gamerTag, authedAt: Date.now() }));
      } catch {}
      router.push(redirectTo ?? `/portal/${data.player.gamerTag}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  if (showForgot) {
    return <ForgotPinForm onBack={() => setShowForgot(false)} />;
  }

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[#231980] border-2 border-yellow-400/50 flex items-center justify-center shadow-lg shadow-purple-900/40">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-yellow-400">
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
            <label className="block text-purple-200 text-sm font-semibold mb-2">Email or GamerTag</label>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-purple-200 text-sm font-semibold">PIN</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs text-yellow-400/70 hover:text-yellow-400 transition-colors underline underline-offset-2"
              >
                Forgot PIN?
              </button>
            </div>
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
  );
}

// ── Forgot PIN form ───────────────────────────────────────────────────────────

type ForgotStep = "verify" | "reset" | "done";

function ForgotPinForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<ForgotStep>("verify");
  const [identifier, setIdentifier] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gamerTag, setGamerTag] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !dateOfBirth) {
      setError("Both fields are required.");
      return;
    }
    // Pre-flight: just check identity — we pass a placeholder PIN that won't match
    // to avoid resetting on this step. Instead, move to PIN entry step.
    setStep("reset");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newPin || !confirmPin) { setError("Both PIN fields are required."); return; }
    if (newPin !== confirmPin) { setError("PINs do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/portal/forgot-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), dateOfBirth, newPin, confirmPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not reset PIN. Please try again.");
        // If identity failed, go back to verify step
        if (res.status === 401) setStep("verify");
        return;
      }
      setGamerTag(data.gamerTag);
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[#231980] border-2 border-yellow-400/50 flex items-center justify-center shadow-lg shadow-purple-900/40">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-yellow-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      </div>

      <div className="bg-[#1E1654] border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-950/60">

        {step === "done" ? (
          <div className="text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-yellow-400 mb-2">PIN Reset!</h2>
              <p className="text-purple-300 text-sm">Your PIN has been updated. You can now log in with your new PIN.</p>
            </div>
            <button
              onClick={() => router.push(`/portal/${gamerTag}`)}
              className="w-full bg-yellow-400 hover:bg-amber-400 text-[#0F0D1E] font-black text-base rounded-xl py-3 transition-colors"
            >
              Go to My Guild Card
            </button>
            <button onClick={onBack} className="w-full text-purple-400/60 hover:text-purple-300 text-sm transition-colors">
              Back to Login
            </button>
          </div>
        ) : step === "verify" ? (
          <>
            <h2 className="text-2xl font-black text-yellow-400 mb-1 tracking-tight">Reset Your PIN</h2>
            <p className="text-purple-300/70 text-sm mb-6">
              Verify your identity using your registered email or GamerTag and date of birth.
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-2">Email or GamerTag</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="GamerTag or email"
                  autoFocus
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={inputClass + " [color-scheme:dark]"}
                />
              </div>

              {error && (
                <p className="text-rose-400 text-sm bg-rose-950/30 border border-rose-500/30 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-amber-400 text-[#0F0D1E] font-black text-base rounded-xl py-3 transition-colors"
              >
                Verify Identity
              </button>
            </form>

            <button onClick={onBack} className="w-full text-purple-400/60 hover:text-purple-300 text-sm mt-4 transition-colors">
              ← Back to Login
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-black text-yellow-400 mb-1 tracking-tight">Set New PIN</h2>
            <p className="text-purple-300/70 text-sm mb-6">
              Choose a new 4–6 digit PIN for your Guild Card.
            </p>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-2">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="4–6 digit PIN"
                  autoFocus
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-semibold mb-2">Confirm New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Repeat your PIN"
                  autoComplete="new-password"
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
                className="w-full bg-yellow-400 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#0F0D1E] font-black text-base rounded-xl py-3 transition-colors"
              >
                {loading ? "Saving..." : "Save New PIN"}
              </button>
            </form>

            <button onClick={() => setStep("verify")} className="w-full text-purple-400/60 hover:text-purple-300 text-sm mt-4 transition-colors">
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PortalLoginPage() {
  return (
    <div className="bg-gradient-to-br from-[#0F0D1E] via-[#1E1654] to-[#0F0D1E] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      <Suspense fallback={null}>
        <PortalLoginForm />
      </Suspense>
    </div>
  );
}
