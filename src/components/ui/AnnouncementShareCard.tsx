"use client";

import { forwardRef } from "react";
import { Announcement } from "@/types/admin";

// ── Design tokens by announcement type ──────────────────────────────────────

const CARD_THEME: Record<string, {
  bg: string;
  accent: string;
  accentRgb: string;
  border: string;
  label: string;
  icon: string;
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
    bg:        "linear-gradient(145deg,#0a0028 0%,#160045 40%,#05001a 100%)",
    accent:    "#c084fc",
    accentRgb: "192,132,252",
    border:    "#c084fc",
    label:     "RANK UP",
    icon:      "⬆",
  },
  title_awarded: {
    bg:        "linear-gradient(145deg,#1a0e00 0%,#2d1c00 40%,#0d0820 100%)",
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
  player?: string;       // extracted gamer tag for celebration layout
  achievement?: string;  // extracted rank/title for celebration layout
}

function extractGamerTag(msg: string): string | null {
  // New format: @GamerTag
  const atMatch = msg.match(/@(\S+)/);
  if (atMatch) return atMatch[1];
  // Old jobs.ts format: Name (GamerTag) ranked up...
  const parenMatch = msg.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1];
  return null;
}

function parse(a: Announcement): ParsedCard {
  const t   = (a.type ?? "general");
  const msg = a.message;

  if (t === "tournament_scheduled" || t === "tournament_started") {
    const parts      = msg.split(" | ").map((s) => s.replace(/^[^:]+:\s*/, "").trim());
    const nameMatch  = msg.match(/(?:New tournament|LIVE NOW!?):?\s*([^|⚡]+)/);
    const headline   = a.tournamentName ?? (nameMatch ? nameMatch[1].trim() : parts[0] ?? "Tournament");
    return { headline, lines: parts.slice(1).filter(Boolean) };
  }

  if (t === "champion") {
    const lines: string[] = [];
    if (a.winnerName) lines.push(`🥇 ${a.winnerName}`);
    if (a.prizeAmount) lines.push(`Prize: ${a.prizeAmount}`);
    return { headline: a.tournamentName ?? "Tournament Complete", lines };
  }

  if (t === "birthday") {
    const tag = extractGamerTag(msg);
    return {
      headline: tag ? `@${tag}` : "A Guild Member",
      lines:    ["Happy Birthday!", "From all of us at Gweru's Gamers Lounge 🎮"],
    };
  }

  if (t === "milestone") {
    const countMatch = msg.match(/(\d+) visits/);
    const tag        = extractGamerTag(msg);
    return {
      headline: tag ? `@${tag}` : "Achievement Unlocked",
      lines:    [countMatch ? `${countMatch[1]} Visits Reached` : "Milestone Reached"],
    };
  }

  if (t === "rank_up") {
    // Handles 3 historic message formats:
    // 1. "⬆ @Tag has ranked up to S Rank!"  (new)
    // 2. "⬆ @Tag has ascended to S Rank at Gweru's Gamers Lounge!"  (old visitXP)
    // 3. "Name (Tag) ranked up to S Rank! 🎉"  (old jobs.ts)
    const rankMatch =
      msg.match(/ranked up to ([^\n!🎉]+)/) ??
      msg.match(/ascended to ([^\n!]+?) (?:at |!)/);
    const rank = rankMatch ? rankMatch[1].trim().replace(/[!🎉]/g, "").trim() : "New Rank";
    const tag  = extractGamerTag(msg);

    return {
      headline: "CONGRATULATIONS",
      player:   tag ? `@${tag}` : undefined,
      achievement: rank,
      lines:    [],
    };
  }

  if (t === "title_awarded") {
    const titleMatch = msg.match(/"([^"]+)"/);
    const tag        = extractGamerTag(msg);

    return {
      headline:    "TITLE AWARDED",
      player:      tag ? `@${tag}` : undefined,
      achievement: titleMatch ? titleMatch[1] : "New Title",
      lines:       [],
    };
  }

  if (t === "weekly_leaderboard") {
    const [header, ...entries] = msg.split("\n");
    return {
      headline: "Weekly Top Adventurers",
      lines:    [header.replace("📊 ", ""), ...entries].filter(Boolean),
    };
  }

  const shortMsg = msg.length > 120 ? msg.slice(0, 117) + "…" : msg;
  return { headline: "Guild Update", lines: [shortMsg] };
}

// ── Corner bracket decorations ────────────────────────────────────────────────

function Brackets({ color }: { color: string }) {
  const size = 28, thick = 3;
  const base: React.CSSProperties = {
    position: "absolute", width: size, height: size,
    borderColor: color, borderStyle: "solid", opacity: 0.7,
  };
  return (
    <>
      <div style={{ ...base, top: 16, left: 16,  borderWidth: `${thick}px 0 0 ${thick}px` }} />
      <div style={{ ...base, top: 16, right: 16, borderWidth: `${thick}px ${thick}px 0 0` }} />
      <div style={{ ...base, bottom: 16, left: 16,  borderWidth: `0 0 ${thick}px ${thick}px` }} />
      <div style={{ ...base, bottom: 16, right: 16, borderWidth: `0 ${thick}px ${thick}px 0` }} />
    </>
  );
}

// ── Celebration card (rank_up / title_awarded) ─────────────────────────────

function CelebrationCard({ theme, parsed, type }: {
  theme: typeof CARD_THEME[string];
  parsed: ParsedCard;
  type: string;
}) {
  const isTitle = type === "title_awarded";

  return (
    <>
      {/* Large radial glow centred on player name */}
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: "translateX(-50%)",
        width: 380, height: 380, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${theme.accentRgb},0.18) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Second softer glow */}
      <div style={{
        position: "absolute", top: "10%", left: "30%",
        width: 200, height: 200, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${theme.accentRgb},0.07) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <Brackets color={theme.border} />

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px",
        borderBottom: `1px solid rgba(${theme.accentRgb},0.15)`,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
        }}>
          GWERU&apos;S GAMERS LOUNGE
        </span>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.18em",
          color: theme.accent,
          background: `rgba(${theme.accentRgb},0.12)`,
          border: `1px solid rgba(${theme.accentRgb},0.35)`,
          borderRadius: 99, padding: "3px 10px", textTransform: "uppercase",
        }}>
          {theme.label}
        </span>
      </div>

      {/* Content */}
      <div style={{
        position: "absolute", top: 52, left: 0, right: 0, bottom: 44,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 36px", textAlign: "center",
      }}>
        {/* Icon */}
        <div style={{
          fontSize: 44, lineHeight: 1, marginBottom: 10,
          filter: `drop-shadow(0 0 20px rgba(${theme.accentRgb},0.7))`,
        }}>
          {theme.icon}
        </div>

        {/* "CONGRATULATIONS" / "TITLE AWARDED" label */}
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.28em",
          color: `rgba(${theme.accentRgb},0.7)`,
          textTransform: "uppercase", marginBottom: 14,
        }}>
          {parsed.headline}
        </div>

        {/* Player gamer tag — the big personal element */}
        {parsed.player && (
          <div style={{
            fontSize: parsed.player.length > 14 ? 30 : 38,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 6,
            textShadow: `0 0 32px rgba(${theme.accentRgb},0.4)`,
            wordBreak: "break-word",
            maxWidth: 420,
          }}>
            {parsed.player}
          </div>
        )}

        {/* "has ranked up to" / "has earned the title" */}
        <div style={{
          fontSize: 12, fontWeight: 500,
          color: "rgba(255,255,255,0.45)",
          marginBottom: 16,
          letterSpacing: "0.04em",
        }}>
          {isTitle ? "has earned the title" : "has ranked up to"}
        </div>

        {/* The achievement — rank or title */}
        <div style={{
          fontSize: parsed.achievement && parsed.achievement.length > 16 ? 24 : 34,
          fontWeight: 900,
          color: theme.accent,
          letterSpacing: isTitle ? "0.01em" : "0.04em",
          textShadow: `0 0 32px rgba(${theme.accentRgb},0.6)`,
          fontStyle: isTitle ? "italic" : "normal",
          wordBreak: "break-word",
          maxWidth: 420,
          lineHeight: 1.1,
        }}>
          {isTitle ? `"${parsed.achievement}"` : parsed.achievement}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 44,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderTop: `1px solid rgba(${theme.accentRgb},0.15)`,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
          color: `rgba(${theme.accentRgb},0.45)`, textTransform: "uppercase",
        }}>
          gwerusgamerslounge.com
        </span>
      </div>
    </>
  );
}

// ── Standard card (all other types) ──────────────────────────────────────────

function StandardCard({ theme, parsed, type }: {
  theme: typeof CARD_THEME[string];
  parsed: ParsedCard;
  type: string;
}) {
  const isBday   = type === "birthday";
  const isLeader = type === "weekly_leaderboard";

  return (
    <>
      <div style={{
        position: "absolute", top: "20%", left: "50%",
        transform: "translateX(-50%)",
        width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${theme.accentRgb},0.15) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <Brackets color={theme.border} />

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px",
        borderBottom: `1px solid rgba(${theme.accentRgb},0.15)`,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
        }}>
          GWERU&apos;S GAMERS LOUNGE
        </span>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: "0.18em",
          color: theme.accent,
          background: `rgba(${theme.accentRgb},0.12)`,
          border: `1px solid rgba(${theme.accentRgb},0.35)`,
          borderRadius: 99, padding: "3px 10px", textTransform: "uppercase",
        }}>
          {theme.label}
        </span>
      </div>

      {/* Main content */}
      <div style={{
        position: "absolute", top: 56, left: 0, right: 0, bottom: 48,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 36px", textAlign: "center",
      }}>
        <div style={{
          fontSize: isBday ? 72 : 60, lineHeight: 1,
          marginBottom: isBday ? 12 : 10,
          filter: `drop-shadow(0 0 16px rgba(${theme.accentRgb},0.6))`,
        }}>
          {theme.icon}
        </div>

        <div style={{
          color: theme.accent,
          fontSize: parsed.headline.length > 24 ? 24 : 30,
          fontWeight: 900, lineHeight: 1.15,
          textShadow: `0 0 28px rgba(${theme.accentRgb},0.5)`,
          maxWidth: 420, marginBottom: 14, wordBreak: "break-word",
        }}>
          {parsed.headline}
        </div>

        <div style={{
          width: 60, height: 2,
          background: `linear-gradient(to right, transparent, ${theme.accent}, transparent)`,
          marginBottom: 16, opacity: 0.6,
        }} />

        <div style={{
          display: "flex", flexDirection: "column",
          gap: isLeader ? 5 : 7, width: "100%", maxWidth: 420,
        }}>
          {parsed.lines.map((line, i) => (
            <div key={i} style={{
              color: i === 0 && !isLeader ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
              fontSize: isLeader ? 13 : (i === 0 ? 15 : 13),
              fontWeight: i === 0 ? 600 : 400,
              lineHeight: 1.4, wordBreak: "break-word",
            }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderTop: `1px solid rgba(${theme.accentRgb},0.15)`,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
          color: `rgba(${theme.accentRgb},0.5)`, textTransform: "uppercase",
        }}>
          gwerusgamerslounge.com
        </span>
      </div>
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

interface Props {
  announcement: Announcement;
}

export const AnnouncementShareCard = forwardRef<HTMLDivElement, Props>(
  function AnnouncementShareCard({ announcement }, ref) {
    const type  = (announcement.type ?? "general") as string;
    const theme = CARD_THEME[type] ?? CARD_THEME.general;
    const parsed = parse(announcement);
    const isCelebration = type === "rank_up" || type === "title_awarded";

    return (
      <div
        ref={ref}
        style={{
          width: 540, height: 540,
          background: theme.bg,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          overflow: "hidden",
          userSelect: "none",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {isCelebration ? (
          <CelebrationCard theme={theme} parsed={parsed} type={type} />
        ) : (
          <StandardCard theme={theme} parsed={parsed} type={type} />
        )}
      </div>
    );
  }
);
