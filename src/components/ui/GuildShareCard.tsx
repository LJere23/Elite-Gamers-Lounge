"use client";

import { forwardRef } from "react";

interface Props {
  type: "rank_up" | "title" | "quest";
  heading: string;
  gamerTag: string;
  rankOrTitle: string;
  avatarUrl?: string | null;
  playerTitle?: string | null;
  xp?: number;
  memberSince?: string | null; // ISO date string
}

// ── colour palette per rank / type ───────────────────────────────────────────

const RANK_PALETTE: Record<string, {
  bg: string;
  accent: string;
  accentLight: string;
  glow: string;
  label: string;
}> = {
  "S Rank":     { bg: "linear-gradient(135deg,#1a0000 0%,#0D0D14 50%,#2d0a0a 100%)", accent: "#f87171", accentLight: "#fca5a5", glow: "rgba(248,113,113,0.4)",  label: "S" },
  "A Rank":     { bg: "linear-gradient(135deg,#130a2e 0%,#0D0D14 50%,#1e0f3a 100%)", accent: "#c084fc", accentLight: "#d8b4fe", glow: "rgba(192,132,252,0.4)",  label: "A" },
  "B Rank":     { bg: "linear-gradient(135deg,#001a2e 0%,#0D0D14 50%,#0f2540 100%)", accent: "#38bdf8", accentLight: "#7dd3fc", glow: "rgba(56,189,248,0.4)",   label: "B" },
  "C Rank":     { bg: "linear-gradient(135deg,#1c0a00 0%,#0D0D14 50%,#2d1200 100%)", accent: "#fb923c", accentLight: "#fdba74", glow: "rgba(251,146,60,0.4)",   label: "C" },
  "D Rank":     { bg: "linear-gradient(135deg,#1a1500 0%,#0D0D14 50%,#2a2000 100%)", accent: "#facc15", accentLight: "#fde68a", glow: "rgba(250,204,21,0.4)",   label: "D" },
  "E Rank":     { bg: "linear-gradient(135deg,#0f1a0a 0%,#0D0D14 50%,#162200 100%)", accent: "#86efac", accentLight: "#bbf7d0", glow: "rgba(134,239,172,0.35)", label: "E" },
  "F Rank":     { bg: "linear-gradient(135deg,#111111 0%,#0D0D14 50%,#1a1a1a 100%)", accent: "#a1a1aa", accentLight: "#d4d4d8", glow: "rgba(161,161,170,0.3)",  label: "F" },
  "Adventurer": { bg: "linear-gradient(135deg,#0a1a0a 0%,#0D0D14 50%,#0f2a0f 100%)", accent: "#34d399", accentLight: "#6ee7b7", glow: "rgba(52,211,153,0.35)",  label: "★" },
  "title":      { bg: "linear-gradient(135deg,#1a1200 0%,#0D0D14 50%,#2a1c00 100%)", accent: "#fbbf24", accentLight: "#fde68a", glow: "rgba(251,191,36,0.4)",   label: "👑" },
  "quest":      { bg: "linear-gradient(135deg,#001a0a 0%,#0D0D14 50%,#002a12 100%)", accent: "#34d399", accentLight: "#6ee7b7", glow: "rgba(52,211,153,0.35)",  label: "⚔" },
};

function getPalette(type: string, rankOrTitle: string) {
  if (type === "title") return RANK_PALETTE["title"];
  if (type === "quest") return RANK_PALETTE["quest"];
  return RANK_PALETTE[rankOrTitle] ?? RANK_PALETTE["F Rank"];
}

function formatMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

// ── EGL Logo (inline SVG paths, adapted from brand asset) ────────────────────
// Teal (#00FFB2) accent matches the brand identity
function EGLLogo({ accent }: { accent: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Card background */}
      <rect x="1" y="1" width="30" height="30" rx="6" fill="#0D0D14" stroke={accent} strokeWidth="0.8" opacity="0.9"/>
      {/* Corner brackets */}
      <polyline points="1,6 1,1 6,1" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
      <polyline points="26,1 31,1 31,6" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
      <polyline points="31,26 31,31 26,31" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
      <polyline points="6,31 1,31 1,26" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Gamepad body */}
      <rect x="9" y="11" width="14" height="10" rx="5" fill="#1A1A2E" stroke={accent} strokeWidth="0.8"/>
      <ellipse cx="9" cy="16" rx="2.5" ry="3.5" fill="#1A1A2E" stroke={accent} strokeWidth="0.8"/>
      <ellipse cx="23" cy="16" rx="2.5" ry="3.5" fill="#1A1A2E" stroke={accent} strokeWidth="0.8"/>
      {/* D-pad */}
      <rect x="11" y="13.5" width="1.5" height="5" rx="0.5" fill={accent}/>
      <rect x="10" y="15" width="3.5" height="1.5" rx="0.5" fill={accent}/>
      {/* Buttons */}
      <circle cx="20.5" cy="14" r="1" fill="#FF4466"/>
      <circle cx="22" cy="16" r="1" fill="#FFAA00"/>
      <circle cx="19" cy="16" r="1" fill="#4488FF"/>
    </svg>
  );
}

// ── Share card (540×540 DOM, captured at 2× = 1080×1080 output) ──────────────

const GuildShareCard = forwardRef<HTMLDivElement, Props>(function GuildShareCard(
  { type, heading, gamerTag, rankOrTitle, avatarUrl, playerTitle, xp, memberSince },
  ref
) {
  const p = getPalette(type, rankOrTitle);

  const hook =
    type === "rank_up"
      ? `Not everyone reaches ${rankOrTitle}.`
      : type === "title"
      ? "Only the dedicated earn a title."
      : "Another quest complete.";

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: "540px",
        height: "540px",
        background: p.bg,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(ellipse at 50% 40%, ${p.glow} 0%, transparent 65%)`,
      }} />

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.035, pointerEvents: "none",
        backgroundImage: `linear-gradient(${p.accent} 1px, transparent 1px), linear-gradient(90deg, ${p.accent} 1px, transparent 1px)`,
        backgroundSize: "27px 27px",
      }} />

      {/* Corner bracket accents — top-left */}
      <div style={{ position: "absolute", top: 16, left: 16, width: 28, height: 28, pointerEvents: "none" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polyline points="0,14 0,0 14,0" stroke={p.accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
        </svg>
      </div>
      {/* Corner bracket — top-right */}
      <div style={{ position: "absolute", top: 16, right: 16, width: 28, height: 28, pointerEvents: "none" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polyline points="14,0 28,0 28,14" stroke={p.accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
        </svg>
      </div>
      {/* Corner bracket — bottom-left */}
      <div style={{ position: "absolute", bottom: 16, left: 16, width: 28, height: 28, pointerEvents: "none" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polyline points="0,14 0,28 14,28" stroke={p.accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
        </svg>
      </div>
      {/* Corner bracket — bottom-right */}
      <div style={{ position: "absolute", bottom: 16, right: 16, width: 28, height: 28, pointerEvents: "none" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polyline points="14,28 28,28 28,14" stroke={p.accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
        </svg>
      </div>

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        height: "100%", padding: "36px 44px 28px",
        boxSizing: "border-box",
      }}>

        {/* ── Top bar: logo + brand name ────────────────────────── */}
        <div style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <EGLLogo accent={p.accent} />
            <div>
              <div style={{
                fontSize: "10px", fontWeight: 900,
                letterSpacing: "0.22em", textTransform: "uppercase",
                color: p.accent,
              }}>
                ELITE GAMERS LOUNGE
              </div>
              <div style={{
                fontSize: "7px", color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "1px",
              }}>
                LEVEL UP · CONNECT · CONQUER
              </div>
            </div>
          </div>
          {/* Event type chip */}
          <div style={{
            fontSize: "8px", fontWeight: 900,
            letterSpacing: "0.35em", textTransform: "uppercase",
            color: p.accent, opacity: 0.8,
            border: `1px solid ${p.accent}40`,
            borderRadius: "20px", padding: "4px 10px",
            background: `${p.accent}10`,
          }}>
            {heading}
          </div>
        </div>

        {/* ── Avatar ───────────────────────────────────────────── */}
        <div style={{
          width: "88px", height: "88px", borderRadius: "50%",
          border: `3px solid ${p.accent}`,
          boxShadow: `0 0 24px ${p.glow}, 0 0 48px ${p.glow}`,
          overflow: "hidden", flexShrink: 0,
          background: "#1a1a2e",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "14px",
        }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={gamerTag}
              width={88}
              height={88}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              crossOrigin="anonymous"
            />
          ) : (
            <div style={{
              fontSize: "32px", fontWeight: 900, color: p.accentLight,
              textShadow: `0 0 20px ${p.glow}`,
            }}>
              {p.label}
            </div>
          )}
        </div>

        {/* ── GamerTag — hero element ───────────────────────────── */}
        <div style={{
          fontSize: "38px", fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-0.5px",
          lineHeight: 1,
          textShadow: `0 0 30px ${p.glow}`,
          marginBottom: "6px",
          textAlign: "center",
        }}>
          @{gamerTag}
        </div>

        {/* ── Title (if any) ───────────────────────────────────── */}
        {playerTitle && (
          <div style={{
            fontSize: "11px", fontWeight: 700,
            color: p.accent, letterSpacing: "0.18em",
            textTransform: "uppercase", marginBottom: "14px",
            opacity: 0.9,
          }}>
            ✦ {playerTitle}
          </div>
        )}
        {!playerTitle && <div style={{ marginBottom: "14px" }} />}

        {/* ── Achievement name (rank / title) ───────────────────── */}
        <div style={{
          fontSize: type === "rank_up" ? "52px" : "36px",
          fontWeight: 900,
          lineHeight: 1,
          color: p.accentLight,
          textShadow: `0 0 32px ${p.glow}, 0 0 64px ${p.glow}`,
          letterSpacing: "-0.5px",
          textAlign: "center",
          marginBottom: "10px",
        }}>
          {rankOrTitle}
        </div>

        {/* ── Divider ───────────────────────────────────────────── */}
        <div style={{
          width: "60px", height: "2px", margin: "0 0 14px",
          background: `linear-gradient(90deg, transparent, ${p.accent}, transparent)`,
          borderRadius: "2px",
        }} />

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: "20px", alignItems: "center",
          marginBottom: "18px",
        }}>
          {xp !== undefined && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 900, color: p.accentLight, lineHeight: 1 }}>
                {xp.toLocaleString()}
              </div>
              <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "2px" }}>
                XP
              </div>
            </div>
          )}
          {xp !== undefined && memberSince && (
            <div style={{ width: "1px", height: "28px", background: `${p.accent}30` }} />
          )}
          {memberSince && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: p.accentLight, lineHeight: 1 }}>
                {formatMemberSince(memberSince)}
              </div>
              <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "2px" }}>
                MEMBER SINCE
              </div>
            </div>
          )}
        </div>

        {/* ── Motto ─────────────────────────────────────────────── */}
        <div style={{
          fontSize: "12px", fontWeight: 500,
          color: "rgba(255,255,255,0.65)",
          letterSpacing: "0.06em",
          fontStyle: "italic",
          textAlign: "center",
          marginBottom: "auto",
        }}>
          {hook}
        </div>

        {/* ── Bottom: CTA URL ───────────────────────────────────── */}
        <div style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "center", paddingTop: "16px",
          borderTop: `1px solid ${p.accent}20`,
          marginTop: "16px",
        }}>
          <div style={{
            fontSize: "12px", fontWeight: 800,
            color: p.accent, letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            elitegamerslounge.com
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "3px",
        background: `linear-gradient(90deg, transparent 0%, ${p.accent} 35%, ${p.accentLight} 65%, transparent 100%)`,
      }} />
    </div>
  );
});

export default GuildShareCard;
