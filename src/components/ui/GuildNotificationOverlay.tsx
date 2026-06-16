"use client";

import { useEffect, useRef, useState } from "react";
import GuildShareCard from "./GuildShareCard";

interface GuildNotification {
  id: string;
  type: string;
  heading: string;
  message: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pull the rank / title name out of the server-written message */
function extractRankOrTitle(type: string, message: string, heading: string): string {
  if (type === "rank_up") {
    // "You have ascended to B Rank. The lounge…"
    const m = message.match(/ascended to (.+?)\./);
    return m?.[1] ?? heading;
  }
  if (type === "title") {
    // `You have been granted the title "Otherworlder".`
    const m = message.match(/"(.+?)"/);
    return m?.[1] ?? heading;
  }
  if (type === "quest") {
    // "You completed "First Arrival" and earned…"
    const m = message.match(/"(.+?)"/);
    return m?.[1] ?? heading;
  }
  return heading;
}

// ── Styling per type ──────────────────────────────────────────────────────────

const RANK_ACCENT: Record<string, string> = {
  "S Rank": "#f87171", "A Rank": "#c084fc", "B Rank": "#38bdf8",
  "C Rank": "#fb923c", "D Rank": "#facc15", "E Rank": "#86efac",
  "F Rank": "#a1a1aa", "Adventurer": "#34d399",
};

const TYPE_META: Record<string, { icon: string; label: string; accentFallback: string }> = {
  rank_up: { icon: "⚔", label: "SYSTEM",  accentFallback: "#f87171" },
  title:   { icon: "👑", label: "SYSTEM",  accentFallback: "#fbbf24" },
  quest:   { icon: "✦",  label: "NOTICE",  accentFallback: "#34d399" },
};

function getAccent(type: string, rankOrTitle: string): string {
  if (type === "rank_up") return RANK_ACCENT[rankOrTitle] ?? "#f87171";
  if (type === "title")   return "#fbbf24";
  return "#34d399";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  notifications: GuildNotification[];
  gamerTag: string;
  avatarUrl?: string | null;
  playerTitle?: string | null;
  xp?: number;
  memberSince?: string | null;
  onDone: () => void;
}

export default function GuildNotificationOverlay({ notifications, gamerTag, avatarUrl, playerTitle, xp, memberSince, onDone }: Props) {
  const [index, setIndex]   = useState(0);
  const [phase, setPhase]   = useState<"enter" | "visible" | "exit">("enter");
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  function advance() {
    if (index < notifications.length - 1) {
      setPhase("exit");
      setTimeout(() => {
        setIndex((i) => i + 1);
        setPhase("enter");
        setTimeout(() => setPhase("visible"), 60);
      }, 350);
    } else {
      setPhase("exit");
      setTimeout(onDone, 350);
    }
  }

  // Trigger enter animation each time a new notification is shown
  useEffect(() => {
    setPhase("enter");
    const t = setTimeout(() => setPhase("visible"), 60);
    return () => clearTimeout(t);
  }, [index]);

  // ── Share handler ──────────────────────────────────────────────────────────
  async function handleShare() {
    if (sharing || !cardRef.current) return;
    setSharing(true);
    try {
      // Dynamic import — keeps bundle lean
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 4,  // 540×540 card × 4 = 2160×2160 high-res output
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) { setSharing(false); return; }
        try {
          const file = new File([blob], `egl-${current.type}-${gamerTag}.png`, { type: "image/png" });

          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${current.heading} — Elite Gamers Lounge`,
              text: `@${gamerTag} just ${current.type === "rank_up" ? `reached ${rankOrTitle}` : `earned the title "${rankOrTitle}"`} at Elite Gamers Lounge! Think you can match it?`,
            });
          } else {
            // Desktop fallback — trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          // AbortError = user dismissed the share sheet — not an error
          if (err instanceof Error && err.name !== "AbortError") {
            console.error("Share failed:", err);
          }
        } finally {
          setSharing(false);
        }
      }, "image/png");
    } catch {
      setSharing(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const current = notifications[index];
  if (!current) return null;

  // Only rank_up and title are shareable — quest completions aren't bragworthy enough
  const isShareable = current.type === "rank_up" || current.type === "title";
  const rankOrTitle = extractRankOrTitle(current.type, current.message, current.heading);
  const meta = TYPE_META[current.type] ?? TYPE_META.quest;
  const accent = getAccent(current.type, rankOrTitle);

  const overlayVisible = phase === "visible";
  const cardShift =
    phase === "visible" ? "scale-100 translate-y-0 opacity-100" :
    phase === "enter"   ? "scale-95 translate-y-6 opacity-0"    :
                          "scale-95 -translate-y-4 opacity-0";

  return (
    <>
      {/* ── Off-screen share card (captured by html2canvas) ──────────── */}
      {isShareable && (
        <GuildShareCard
          ref={cardRef}
          type={current.type as "rank_up" | "title" | "quest"}
          heading={current.heading}
          gamerTag={gamerTag}
          rankOrTitle={rankOrTitle}
          avatarUrl={avatarUrl}
          playerTitle={playerTitle}
          xp={xp}
          memberSince={memberSince}
        />
      )}

      {/* ── Full-screen overlay ──────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
        style={{
          background: "rgba(5,3,18,0.90)",
          backdropFilter: "blur(14px)",
          transition: "opacity 0.3s",
          opacity: overlayVisible ? 1 : 0,
        }}
      >
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.025) 2px, rgba(139,92,246,0.025) 4px)"
        }} />

        {/* Ambient glow behind card */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: accent }} />
        </div>

        {/* ── Notification card ────────────────────────────────────── */}
        <div className={`relative w-full max-w-sm transition-all duration-500 ${cardShift}`}>

          {/* Gradient border */}
          <div
            className="absolute inset-0 rounded-3xl blur-sm opacity-60"
            style={{ background: `linear-gradient(135deg, ${accent}55, transparent 60%, ${accent}33)` }}
          />

          <div
            className="relative rounded-3xl overflow-hidden border"
            style={{ borderColor: `${accent}50`, background: "linear-gradient(160deg,#0F0D1E 0%,#1a1540 100%)" }}
          >
            {/* Top label bar */}
            <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-white/5">
              <span className="text-[10px] font-black tracking-[0.45em] uppercase" style={{ color: accent, opacity: 0.75 }}>
                {meta.label}
              </span>
              <span className="text-[10px] text-purple-500/40 tracking-widest">◈ ELITE GAMERS LOUNGE</span>
              {notifications.length > 1 && (
                <span className="ml-auto text-[10px] text-purple-500/40">{index + 1}/{notifications.length}</span>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-7 space-y-5">
              {/* Icon + text */}
              <div className="flex items-start gap-4">
                <div className="text-4xl leading-none mt-0.5 shrink-0 drop-shadow-lg">{meta.icon}</div>
                <div>
                  <p className="text-[11px] font-black tracking-[0.35em] uppercase mb-1.5" style={{ color: accent }}>
                    {current.heading}
                  </p>

                  {/* Rank / title name displayed large for rank_up and title */}
                  {(current.type === "rank_up" || current.type === "title") && (
                    <p className="text-3xl font-black text-white leading-tight tracking-tight mb-2" style={{
                      textShadow: `0 0 30px ${accent}60`
                    }}>
                      {rankOrTitle}
                    </p>
                  )}

                  <p className="text-sm text-purple-200/70 leading-relaxed">{current.message}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full" style={{
                background: `linear-gradient(90deg, transparent, ${accent}40, transparent)`
              }} />

              {/* Actions */}
              <div className={`grid gap-2 ${isShareable ? "grid-cols-2" : "grid-cols-1"}`}>
                {isShareable && (
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black tracking-[0.2em] uppercase transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      background: `${accent}22`,
                      border: `1px solid ${accent}60`,
                      color: accent,
                    }}
                  >
                    {sharing ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                      </svg>
                    )}
                    {sharing ? "Creating..." : "Share"}
                  </button>
                )}
                <button
                  onClick={advance}
                  className="rounded-2xl py-3 text-xs font-black tracking-[0.2em] uppercase border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-all active:scale-95"
                >
                  {index < notifications.length - 1 ? "Continue ›" : "Acknowledged"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
