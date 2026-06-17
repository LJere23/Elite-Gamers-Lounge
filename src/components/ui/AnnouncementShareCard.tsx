"use client";

import { forwardRef } from "react";
import { Announcement } from "@/types/admin";

// ── Design tokens by announcement type ──────────────────────────────────────

const CARD_THEME: Record<string, {
  bg: string;           // gradient background (CSS)
  accent: string;       // headline & icon colour
  accentRgb: string;    // for glows
  border: string;
  label: string;        // top badge text
  icon: string;         // big emoji
}> = {
  tournament_scheduled: {
    bg:        "linear-gradient(145deg,#0d0520 0%,#1a0a3d 45%,#0a1a2e 100%)",
    accent:    "#fbbf24",
    accentRgb: "251,191,36",
    border:    "#fbbf24",
    label:     "TOURNAMENT",
    icon:      "🏆",
  },
  tournament_started: {
    bg:        "linear-gradient(145deg,#1a0800 0%,#2d1200 45%,#0a0d1f 100%)",
    accent:    "#f97316",
    accentRgb: "249,115,22",
    border:    "#f97316",
    label:     "LIVE NOW",
    icon:      "⚡",
  },
  champion: {
    bg:        "linear-gradient(145deg,#1a1000 0%,#2d1f00 45%,#120d00 100%)",
    accent:    "#fde68a",
    accentRgb: "253,230,138",
    border:    "#fde68a",
    label:     "CHAMPION",
    icon:      "🏆",
  },
  birthday: {
    bg:        "linear-gradient(145deg,#0d0020 0%,#200040 45%,#1a0030 100%)",
    accent:    "#f472b6",
    accentRgb: "244,114,182",
    border:    "#f472b6",
    label:     "BIRTHDAY",
    icon:      "🎂",
  },
  milestone: {
    bg:        "linear-gradient(145deg,#001a10 0%,#002d1a 45%,#001510 100%)",
    accent:    "#34d399",
    accentRgb: "52,211,153",
    border:    "#34d399",
    label:     "MILESTONE",
    icon:      "⚔",
  },
  rank_up: {
    bg:        "linear-gradient(145deg,#0d0030 0%,#1a0050 45%,#0a000d 100%)",
    accent:    "#c084fc",
    accentRgb: "192,132,252",
    border:    "#c084fc",
    label:     "RANK UP",
    icon:      "⬆",
  },
  title_awarded: {
    bg:        "linear-gradient(145deg,#180d00 0%,#2d1a00 45%,#0d0820 100%)",
    accent:    "#fde68a",
    accentRgb: "253,230,138",
    border:    "#fde68a",
    label:     "TITLE AWARDED",
    icon:      "🎖",
  },
  weekly_leaderboard: {
    bg:        "linear-gradient(145deg,#001a1a 0%,#002d30 45%,#000d15 100%)",
    accent:    "#22d3ee",
    accentRgb: "34,211,238",
    border:    "#22d3ee",
    label:     "WEEKLY TOP",
    icon:      "📊",
  },
  general: {
    bg:        "linear-gradient(145deg,#050510 0%,#0d102a 45%,#050510 100%)",
    accent:    "#22d3ee",
    accentRgb: "34,211,238",
    border:    "#22d3ee",
    label:     "ANNOUNCEMENT",
    icon:      "📢",
  },
};

// ── Message parser ───────────────────────────────────────────────────────────

interface ParsedCard {
  headline: string;
  lines: string[];
  sub?: string;
}

function parse(a: Announcement): ParsedCard {
  const t = (a.type ?? "general");
  const msg = a.message;

  if (t === "tournament_scheduled" || t === "tournament_started") {
    // Format: "🏆 New tournament: NAME | Game: X — Circuit: Y | Starts: ... | Ends: ... | Prize · XP"
    const parts = msg.split(" | ").map((s) => s.replace(/^[^:]+:\s*/, "").trim());
    // Extract tournament name from first segment
    const nameMatch = msg.match(/(?:New tournament|LIVE NOW!?):?\s*([^|⚡]+)/);
    const headline = a.tournamentName ?? (nameMatch ? nameMatch[1].trim() : parts[0] ?? "Tournament");
    const details = parts.slice(1).filter(Boolean);
    return { headline, lines: details };
  }

  if (t === "champion") {
    const headline = a.tournamentName ?? "Tournament Complete";
    const lines: string[] = [];
    if (a.winnerName) lines.push(`🥇 ${a.winnerName}`);
    if (a.prizeAmount) lines.push(`Prize: ${a.prizeAmount}`);
    return { headline, lines };
  }

  if (t === "birthday") {
    const gamerMatch = msg.match(/@(\S+)/);
    const gamerTag  = gamerMatch ? gamerMatch[1] : "";
    return {
      headline: `Happy Birthday${gamerTag ? ` @${gamerTag}` : ""}!`,
      lines: ["From all of us at Gweru's Gamers Lounge", "May your day be legendary 🎮"],
    };
  }

  if (t === "milestone") {
    const countMatch = msg.match(/(\d+) visits/);
    const titleMatch = msg.match(/"([^"]+)"/);
    const gamerMatch = msg.match(/@(\S+)/);
    return {
      headline: gamerMatch ? `@${gamerMatch[1]}` : "Achievement Unlocked",
      lines: [
        countMatch ? `${countMatch[1]} Visits Reached` : "Milestone Reached",
        titleMatch ? `"${titleMatch[1]}"` : "",
      ].filter(Boolean),
    };
  }

  if (t === "rank_up") {
    const rankMatch  = msg.match(/ranked up to ([^\n!]+)/);
    const gamerMatch = msg.match(/@(\S+)/);
    const rank       = rankMatch ? rankMatch[1].trim() : "New Rank";
    return {
      headline: gamerMatch ? `@${gamerMatch[1]}` : "Guild Member",
      lines:    ["Has Ranked Up!", rank],
    };
  }

  if (t === "title_awarded") {
    const titleMatch = msg.match(/"([^"]+)"/);
    const gamerMatch = msg.match(/@(\S+)/);
    return {
      headline: titleMatch ? titleMatch[1] : "Title Awarded",
      lines:    [
        gamerMatch ? `@${gamerMatch[1]}` : "A Guild Member",
        "has earned this title",
      ],
    };
  }

  if (t === "weekly_leaderboard") {
    const headerLine = msg.split("\n")[0].replace("📊 ", "");
    const entries    = msg.split("\n").slice(1);
    return {
      headline: "Weekly Top Adventurers",
      lines:    [headerLine, ...entries].filter(Boolean),
    };
  }

  // General / fallback
  const shortMsg = msg.length > 120 ? msg.slice(0, 117) + "…" : msg;
  return { headline: "Guild Update", lines: [shortMsg] };
}

// ── EGL Brackets (cosmetic corner decorations) ───────────────────────────────

function Brackets({ color }: { color: string }) {
  const s = (style: React.CSSProperties): React.CSSProperties => style;
  const size = 28;
  const thick = 3;
  const corner: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    borderColor: color,
    borderStyle: "solid",
    opacity: 0.7,
  };
  return (
    <>
      <div style={s({ ...corner, top: 16, left: 16, borderWidth: `${thick}px 0 0 ${thick}px` })} />
      <div style={s({ ...corner, top: 16, right: 16, borderWidth: `${thick}px ${thick}px 0 0` })} />
      <div style={s({ ...corner, bottom: 16, left: 16, borderWidth: `0 0 ${thick}px ${thick}px` })} />
      <div style={s({ ...corner, bottom: 16, right: 16, borderWidth: `0 ${thick}px ${thick}px 0` })} />
    </>
  );
}

// ── Main share card ──────────────────────────────────────────────────────────

interface Props {
  announcement: Announcement;
}

export const AnnouncementShareCard = forwardRef<HTMLDivElement, Props>(
  function AnnouncementShareCard({ announcement }, ref) {
    const type    = (announcement.type ?? "general") as string;
    const theme   = CARD_THEME[type] ?? CARD_THEME.general;
    const parsed  = parse(announcement);
    const isBday  = type === "birthday";
    const isLeader= type === "weekly_leaderboard";

    return (
      <div
        ref={ref}
        style={{
          width:      540,
          height:     540,
          background: theme.bg,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          overflow:   "hidden",
          userSelect: "none",
          position:   "relative",
          flexShrink: 0,
        }}
      >
        {/* Glow spot */}
        <div style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${theme.accentRgb},0.15) 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <Brackets color={theme.border} />

        {/* Top bar */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          borderBottom: `1px solid rgba(${theme.accentRgb},0.15)`,
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
          }}>
            GWERU&apos;S GAMERS LOUNGE
          </span>
          {/* Type badge */}
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.18em",
            color: theme.accent,
            background: `rgba(${theme.accentRgb},0.12)`,
            border: `1px solid rgba(${theme.accentRgb},0.35)`,
            borderRadius: 99,
            padding: "3px 10px",
            textTransform: "uppercase",
          }}>
            {theme.label}
          </span>
        </div>

        {/* Main content area */}
        <div style={{
          position: "absolute",
          top: 56,
          left: 0,
          right: 0,
          bottom: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 36px",
          textAlign: "center",
          gap: 0,
        }}>
          {/* Big icon */}
          <div style={{
            fontSize: isBday ? 72 : 60,
            lineHeight: 1,
            marginBottom: isBday ? 12 : 10,
            filter: `drop-shadow(0 0 16px rgba(${theme.accentRgb},0.6))`,
          }}>
            {theme.icon}
          </div>

          {/* Headline */}
          <div style={{
            color: theme.accent,
            fontSize: parsed.headline.length > 24 ? 26 : 32,
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            textShadow: `0 0 28px rgba(${theme.accentRgb},0.5)`,
            maxWidth: 420,
            marginBottom: 14,
            wordBreak: "break-word",
          }}>
            {parsed.headline}
          </div>

          {/* Divider line */}
          <div style={{
            width: 60,
            height: 2,
            background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)`,
            marginBottom: 16,
            opacity: 0.6,
          }} />

          {/* Detail lines */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: isLeader ? 5 : 7,
            width: "100%",
            maxWidth: 420,
          }}>
            {parsed.lines.map((line, i) => (
              <div key={i} style={{
                color: i === 0 && !isLeader ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
                fontSize: isLeader ? 13 : (i === 0 ? 15 : 13),
                fontWeight: i === 0 ? 600 : 400,
                lineHeight: 1.4,
                wordBreak: "break-word",
              }}>
                {line}
              </div>
            ))}
          </div>

          {parsed.sub && (
            <div style={{
              marginTop: 14,
              color: `rgba(${theme.accentRgb},0.8)`,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              {parsed.sub}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: `1px solid rgba(${theme.accentRgb},0.15)`,
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: `rgba(${theme.accentRgb},0.5)`,
            textTransform: "uppercase",
          }}>
            gwerusgamerslounge.com
          </span>
        </div>
      </div>
    );
  }
);
