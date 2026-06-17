"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import AvatarCropModal from "@/components/ui/AvatarCropModal";
import GuildNotificationOverlay from "@/components/ui/GuildNotificationOverlay";
import type { PerkStatus } from "@/lib/membershipTiers";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlayerTitle {
  id: string;
  playerId: string;
  title: string;
  awardedAt: string;
}

interface XpLedgerEntry {
  id: string;
  playerId: string;
  amount: number;
  source: string;
  jobId: string | null;
  note: string | null;
  createdAt: string;
}

interface Player {
  id: string;
  name: string;
  gamerTag: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  city: string;
  age: number | null;
  membershipTier: string;
  membershipExpiresAt: string | null;
  status: string;
  xp: number;
  rank: string;
  visitCount: number;
  favoriteGame: string | null;
  joinedAt: string;
  lastVisitAt: string | null;
  avatarUrl: string | null;
  isFounder: boolean;
  founderNumber: number | null;
  titles: PlayerTitle[];
  xpLedger: XpLedgerEntry[];
}

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: string;
  startAt: string;
}

interface TournamentEntry {
  id: string;
  tournamentId: string;
  playerId: string;
  playerName: string;
  registeredAt: string;
  status: string;
  points: number;
  wins: number;
  losses: number;
  tournament: Tournament;
}

interface GuildNotification {
  id: string;
  type: string;
  heading: string;
  message: string;
  createdAt: string;
}

interface PortalData {
  player: Player;
  xpToNextRank: number;
  nextRank: string;
  activeTournaments: TournamentEntry[];
  perkStatus: PerkStatus;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const RANK_THRESHOLDS: { rank: string; minXp: number }[] = [
  { rank: "F Rank", minXp: 30 },
  { rank: "E Rank", minXp: 80 },
  { rank: "D Rank", minXp: 150 },
  { rank: "C Rank", minXp: 250 },
  { rank: "B Rank", minXp: 400 },
  { rank: "A Rank", minXp: 600 },
  { rank: "S Rank", minXp: 850 },
];

function getRankProgressPercent(xp: number, nextRank: string): number {
  if (nextRank === "Max Rank") return 100;
  const idx = RANK_THRESHOLDS.findIndex((r) => r.rank === nextRank);
  const prevMinXp = idx > 0 ? RANK_THRESHOLDS[idx - 1].minXp : 0;
  const nextMinXp = RANK_THRESHOLDS[idx].minXp;
  return Math.min(100, Math.max(0, Math.round(((xp - prevMinXp) / (nextMinXp - prevMinXp)) * 100)));
}

/** "B Rank" → "B", "Adventurer" → "Adventurer" */
function shortRank(rank: string): string {
  return rank.endsWith(" Rank") ? rank.replace(" Rank", "") : rank;
}

const RANK_STYLES: Record<string, {
  avatarRing: string; badgeBorder: string; badgeBg: string; badgeText: string;
  badgeShadow: string; dotActive: string; dotDone: string;
}> = {
  "Villager":   { avatarRing: "border-slate-500 shadow-slate-500/20",   badgeBorder: "border-slate-500/50",  badgeBg: "bg-slate-800/60",  badgeText: "text-slate-300",  badgeShadow: "",                      dotActive: "bg-slate-400 shadow-slate-400/60",   dotDone: "bg-slate-600" },
  "Adventurer": { avatarRing: "border-emerald-400 shadow-emerald-400/20",badgeBorder: "border-emerald-400/60",badgeBg: "bg-emerald-900/40",badgeText: "text-emerald-300",badgeShadow: "",                      dotActive: "bg-emerald-400 shadow-emerald-400/60",dotDone: "bg-emerald-700" },
  "F Rank":     { avatarRing: "border-zinc-400 shadow-zinc-400/20",     badgeBorder: "border-zinc-400/60",   badgeBg: "bg-zinc-800/60",   badgeText: "text-zinc-300",   badgeShadow: "shadow-zinc-500/20",    dotActive: "bg-zinc-400 shadow-zinc-400/60",     dotDone: "bg-zinc-600" },
  "E Rank":     { avatarRing: "border-stone-400 shadow-stone-400/20",   badgeBorder: "border-stone-400/60",  badgeBg: "bg-stone-800/60",  badgeText: "text-stone-300",  badgeShadow: "shadow-stone-500/20",   dotActive: "bg-stone-400 shadow-stone-400/60",   dotDone: "bg-stone-600" },
  "D Rank":     { avatarRing: "border-yellow-400 shadow-yellow-400/30", badgeBorder: "border-yellow-400/70", badgeBg: "bg-yellow-900/40", badgeText: "text-yellow-300", badgeShadow: "shadow-yellow-500/30",  dotActive: "bg-yellow-400 shadow-yellow-400/70", dotDone: "bg-yellow-800" },
  "C Rank":     { avatarRing: "border-orange-400 shadow-orange-400/30", badgeBorder: "border-orange-400/70", badgeBg: "bg-orange-900/40", badgeText: "text-orange-300", badgeShadow: "shadow-orange-500/30",  dotActive: "bg-orange-400 shadow-orange-400/70", dotDone: "bg-orange-800" },
  "B Rank":     { avatarRing: "border-sky-400 shadow-sky-400/30",       badgeBorder: "border-sky-400/70",    badgeBg: "bg-sky-900/40",    badgeText: "text-sky-300",    badgeShadow: "shadow-sky-500/30",     dotActive: "bg-sky-400 shadow-sky-400/70",       dotDone: "bg-sky-800" },
  "A Rank":     { avatarRing: "border-violet-400 shadow-violet-400/40", badgeBorder: "border-violet-400/80", badgeBg: "bg-violet-900/50", badgeText: "text-violet-300", badgeShadow: "shadow-violet-500/40",  dotActive: "bg-violet-400 shadow-violet-400/80", dotDone: "bg-violet-800" },
  "S Rank":     { avatarRing: "border-rose-400 shadow-rose-400/50",     badgeBorder: "border-rose-400/90",   badgeBg: "bg-rose-900/50",   badgeText: "text-rose-300",   badgeShadow: "shadow-rose-500/50",    dotActive: "bg-rose-400 shadow-rose-400/80",     dotDone: "bg-rose-800" },
};

// Class (membership tier) colours
const CLASS_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  "FoundingHero": { border: "border-yellow-400/80", bg: "bg-yellow-900/40", text: "text-yellow-300" },
  "Legend":       { border: "border-amber-400/80",  bg: "bg-amber-900/40",  text: "text-amber-300" },
  "Hero":         { border: "border-purple-400/70", bg: "bg-purple-900/40", text: "text-purple-300" },
  "Warrior":      { border: "border-blue-400/60",   bg: "bg-blue-900/40",   text: "text-blue-300" },
  "Adventurer":   { border: "border-emerald-400/60",bg: "bg-emerald-900/40",text: "text-emerald-300" },
  "Villager":     { border: "border-slate-500/40",  bg: "bg-slate-800/40",  text: "text-slate-400" },
};

function classDisplayName(tier: string): string {
  if (tier === "FoundingHero") return "Founding Hero";
  return tier;
}

const ALL_RANKS = ["Villager", "F Rank", "E Rank", "D Rank", "C Rank", "B Rank", "A Rank", "S Rank"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

// ── Guild Benefits panel ───────────────────────────────────────────────────────

function BenefitRow({ icon, label, value, sub, depleted }: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  depleted?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 py-2.5 border-b border-purple-800/30 last:border-0 ${depleted ? "opacity-60" : ""}`}>
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-purple-400 font-semibold">{label}</p>
        <p className={`text-sm font-bold mt-0.5 ${depleted ? "text-slate-400" : "text-white"}`}>{value}</p>
        {sub && <p className="text-[11px] text-purple-400/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function GuildBenefitsPanel({ ps, membershipExpiresAt }: { ps: PerkStatus; membershipExpiresAt: string | null }) {
  if (!ps.membershipActive || ps.gaming.periodType === null) return null;

  const g = ps.gaming;
  const r = ps.racing;
  const t = ps.tournaments;
  const w = ps.wifi;
  const p = ps.perks;

  // Gaming label
  const gamingValue = g.hoursRemainingThisPeriod === null
    ? g.dailyCap ? `Unlimited · ${g.dailyRemaining?.toFixed(1) ?? 0}h left today` : "Unlimited"
    : g.hoursRemainingThisPeriod <= 0
    ? "All hours used this period"
    : `${g.hoursRemainingThisPeriod.toFixed(1)}h remaining`;

  const gamingPeriod = g.periodEnds
    ? `Resets ${new Date(g.periodEnds).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : g.periodType === "weekly" ? "Weekly allowance" : "Monthly allowance";

  const gamingDepleted = g.hoursRemainingThisPeriod !== null && g.hoursRemainingThisPeriod <= 0;

  // Racing label
  const racingValue = r.freeRacesTotal === 0
    ? "Walk-in price ($3/race)"
    : r.freeRacesRemaining > 0
    ? `${r.freeRacesRemaining} free race${r.freeRacesRemaining > 1 ? "s" : ""} remaining`
    : `Free races used — $${r.priceAfterFree.toFixed(2)} each`;

  // Friday tourney
  const fridayValue = t.fridayFreeRemaining === "unlimited"
    ? "Always free entry"
    : t.fridayFreeRemaining > 0
    ? `${t.fridayFreeRemaining} free entr${t.fridayFreeRemaining > 1 ? "ies" : "y"} remaining`
    : `Free entry used — $${t.fridayPriceAfterFree.toFixed(2)} per extra`;

  const fridayDepleted = t.fridayFreeRemaining !== "unlimited" && t.fridayFreeRemaining <= 0;

  // Wi-Fi
  const wifiValue = w.unlimitedInSession
    ? "Unlimited while gaming"
    : w.minutesRemaining !== null && w.minutesRemaining > 0
    ? `${w.minutesRemaining.toFixed(0)} min remaining`
    : w.minutesRemaining === null
    ? "Fully unlimited"
    : "All minutes used";

  const expiryStr = membershipExpiresAt
    ? `Membership valid until ${new Date(membershipExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : undefined;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Guild Benefits</p>
        {expiryStr && <p className="text-[10px] text-purple-400/50">{expiryStr}</p>}
      </div>
      <div className="bg-[#150f3a]/60 rounded-2xl border border-purple-700/30 px-4 py-1">
        <BenefitRow
          icon="⚔"
          label="Gaming time"
          value={gamingValue}
          sub={gamingPeriod}
          depleted={gamingDepleted}
        />
        {r.freeRacesTotal > 0 && (
          <BenefitRow
            icon="🏎"
            label="Racing sim"
            value={racingValue}
            sub={r.freeRacesRemaining === 0 && r.discountPct > 0 ? `${r.discountPct}% off after free races` : undefined}
            depleted={r.freeRacesRemaining <= 0}
          />
        )}
        <BenefitRow
          icon="🏆"
          label="Friday Mini-Tourney"
          value={fridayValue}
          depleted={fridayDepleted}
        />
        {t.otherDiscountPct > 0 && (
          <BenefitRow
            icon="⚡"
            label="Other tournaments"
            value={`${t.otherDiscountPct}% off every entry`}
          />
        )}
        {t.racingLeagueFreeTotal > 0 && (
          <BenefitRow
            icon="🏁"
            label="Racing Sim League"
            value={t.racingLeagueFreeRemaining > 0 ? "1 free entry this month" : "Free entry used — $5 for next"}
            depleted={t.racingLeagueFreeRemaining <= 0}
          />
        )}
        <BenefitRow
          icon="📶"
          label="Wi-Fi"
          value={wifiValue}
        />
        {p.snackDiscountPct > 0 && (
          <BenefitRow
            icon="🍟"
            label="Snack bar"
            value={`${p.snackDiscountPct}% off — show this card to staff`}
          />
        )}
        {p.chessClubIncluded && (
          <BenefitRow icon="♟" label="Chess Club" value="Included — mention at reception" />
        )}
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function GuildCardPage() {
  const router = useRouter();
  const params = useParams();
  const urlGamerTag = params?.gamerTag as string | undefined;
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [pendingNotifications, setPendingNotifications] = useState<GuildNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState<string>("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const [showPinForm, setShowPinForm] = useState(false);
  const [pinForm, setPinForm] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const [pinStatus, setPinStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/portal/me");
        if (res.status === 401) {
          try { localStorage.removeItem("guild_session"); } catch {}
          router.replace("/portal");
          return;
        }
        if (!res.ok) { router.replace("/portal"); return; }
        const json: PortalData = await res.json();
        if (urlGamerTag && urlGamerTag !== json.player.gamerTag) {
          router.replace(`/portal/${json.player.gamerTag}`);
          return;
        }
        setData(json);
        setAvatarUrl(json.player.avatarUrl);
        setDisplayName(json.player.name);

        const notifRes = await fetch("/api/portal/notifications");
        if (notifRes.ok) {
          const notifs: GuildNotification[] = await notifRes.json();
          if (notifs.length > 0) { setPendingNotifications(notifs); setShowNotifications(true); }
        }
      } catch {
        router.replace("/portal");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, urlGamerTag]);

  async function handleLogout() {
    setLoggingOut(true);
    try { localStorage.removeItem("guild_session"); } catch {}
    try { await fetch("/api/portal/me", { method: "POST" }); }
    finally { router.replace("/portal"); }
  }

  function handleAvatarFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarFileRef.current) avatarFileRef.current.value = "";
    setCropImageSrc(URL.createObjectURL(file));
  }

  async function handleCropSave(blob: Blob) {
    setAvatarUploading(true);
    const prevSrc = cropImageSrc;
    setCropImageSrc(null);
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/portal/avatar", { method: "POST", body: fd });
      const json = await res.json();
      if (json.avatarUrl) setAvatarUrl(json.avatarUrl);
    } finally {
      setAvatarUploading(false);
      if (prevSrc) URL.revokeObjectURL(prevSrc);
    }
  }

  function handleCropCancel() {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === displayName) { setEditingName(false); return; }
    setNameSaving(true); setNameError("");
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) { setNameError(json.error || "Could not save name."); return; }
      setDisplayName(json.name); setEditingName(false);
    } finally { setNameSaving(false); }
  }

  async function handleAvatarRemove() {
    await fetch("/api/portal/avatar", { method: "DELETE" });
    setAvatarUrl(null);
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault(); setPinError("");
    if (pinForm.newPin !== pinForm.confirmPin) { setPinError("New PINs do not match."); return; }
    setPinStatus("saving");
    try {
      const res = await fetch("/api/portal/pin", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pinForm),
      });
      const json = await res.json();
      if (!res.ok) { setPinError(json.error || "Failed to change PIN."); setPinStatus("error"); return; }
      setPinStatus("success");
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
      setTimeout(() => { setShowPinForm(false); setPinStatus("idle"); }, 2000);
    } catch {
      setPinError("Connection error."); setPinStatus("error");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0D1E] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-yellow-400 rounded-full animate-spin mx-auto" />
          <p className="text-purple-300 text-sm">Loading your Guild Card...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { player, xpToNextRank, nextRank, activeTournaments, perkStatus } = data;
  const isMaxRank = nextRank === "Max Rank";
  const progressPercent = getRankProgressPercent(player.xp, nextRank);
  const rankStyle = RANK_STYLES[player.rank] ?? RANK_STYLES["Villager"];
  const classStyle = CLASS_STYLES[player.membershipTier] ?? CLASS_STYLES["Villager"];
  const initials = getInitials(displayName || player.name);
  const currentRankIndex = ALL_RANKS.indexOf(player.rank);
  const recentXp = player.xpLedger.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0F0D1E] p-6 relative overflow-hidden">
      <AnimatedBackground />
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-purple-400/60 hover:text-purple-300 transition-colors" title="Back to home">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75a.75.75 0 01-.75-.75v-5.25H9V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
              </svg>
            </Link>
            <h1 className="text-2xl font-black text-yellow-400 tracking-tight">Guild Card</h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm text-purple-300 hover:text-rose-400 border border-purple-500/40 hover:border-rose-500/50 rounded-xl px-4 py-2 transition-colors disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>

        {/* ── Main Guild Card ──────────────────────────────────────────────── */}
        <div className="rounded-3xl p-[1px] bg-gradient-to-br from-purple-500/50 via-violet-900/10 to-amber-500/25 shadow-2xl shadow-purple-950/70">
        <div className="bg-[#1E1654] rounded-3xl p-8">

          {/* Player Identity */}
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            {/* Left: avatar + name */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0 group">
                <input ref={avatarFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarFileSelect} className="hidden" />
                <button
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={avatarUploading}
                  className={`w-16 h-16 rounded-full border-2 ${rankStyle.avatarRing} overflow-hidden flex items-center justify-center bg-[#0F0D1E] shadow-lg select-none relative transition-opacity ${avatarUploading ? "opacity-60" : ""}`}
                  title="Change profile picture"
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={player.name} fill className="object-cover" unoptimized />
                  ) : (
                    <span className="font-black text-xl text-white">{initials}</span>
                  )}
                  <span className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {avatarUploading ? (
                      <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </span>
                </button>
                {avatarUrl && (
                  <button onClick={handleAvatarRemove} title="Remove photo"
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 border border-[#0F0D1E] flex items-center justify-center transition-colors">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <div>
                {editingName ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus value={nameInput}
                        onChange={(e) => { setNameInput(e.target.value); setNameError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                        maxLength={40}
                        className="bg-[#0F0D1E] border border-purple-500/50 focus:border-yellow-400/70 focus:outline-none rounded-xl px-3 py-1.5 text-white text-xl font-black w-44 transition-colors"
                      />
                      <button onClick={handleSaveName} disabled={nameSaving}
                        className="text-xs font-bold text-yellow-400 border border-yellow-400/40 hover:bg-yellow-400/10 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50">
                        {nameSaving ? "…" : "Save"}
                      </button>
                      <button onClick={() => { setEditingName(false); setNameError(""); }} className="text-xs text-purple-400/60 hover:text-purple-300 transition-colors">Cancel</button>
                    </div>
                    {nameError && <p className="text-xs text-rose-400">{nameError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <h2 className="text-3xl font-black text-white leading-tight tracking-tight">{displayName || player.name}</h2>
                    <button onClick={() => { setNameInput(displayName || player.name); setEditingName(true); setNameError(""); }}
                      title="Edit name"
                      className="opacity-0 group-hover/name:opacity-100 transition-opacity text-purple-400/50 hover:text-purple-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" /></svg>
                    </button>
                  </div>
                )}
                <p className="text-purple-400/70 text-sm mt-0.5 font-medium">@{player.gamerTag}</p>
              </div>
            </div>

            {/* Right: RPG character stat block */}
            <div className="flex flex-col gap-1.5 min-w-[130px]">
              {/* Class */}
              <div className={`rounded-xl border px-3 py-2 ${classStyle.border} ${classStyle.bg}`}>
                <p className="text-[9px] uppercase tracking-widest text-purple-400/70 font-semibold leading-none mb-1">Class</p>
                <p className={`text-sm font-black leading-tight ${classStyle.text}`}>
                  {player.isFounder && <span className="mr-1">★</span>}
                  {classDisplayName(player.membershipTier)}
                  {player.isFounder && player.founderNumber && (
                    <span className="text-[10px] font-semibold opacity-70 ml-1">#{player.founderNumber}</span>
                  )}
                </p>
              </div>

              {/* Rank */}
              <div className={`rounded-xl border px-3 py-2 ${rankStyle.badgeBorder} ${rankStyle.badgeBg}`}>
                <p className="text-[9px] uppercase tracking-widest text-purple-400/70 font-semibold leading-none mb-1">Rank</p>
                <p className={`text-sm font-black leading-tight ${rankStyle.badgeText}`}>
                  {shortRank(player.rank)}
                </p>
              </div>

              {/* Skills — only if they have titles */}
              {player.titles.length > 0 && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-900/20 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-purple-400/70 font-semibold leading-none mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {player.titles.map((t) => (
                      <span key={t.id} className="text-[10px] font-bold text-amber-300 leading-tight">{t.title}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* XP Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">XP Progress</span>
              {isMaxRank ? (
                <span className="text-xs font-black text-amber-400">MAX RANK</span>
              ) : (
                <span className="text-xs text-purple-300">
                  <span className="text-white font-bold">{player.xp}</span>
                  {" / "}
                  <span className="text-purple-400">{player.xp + xpToNextRank} XP</span>
                  {" → "}
                  <span className="text-yellow-400 font-semibold">{nextRank}</span>
                </span>
              )}
            </div>
            {isMaxRank ? (
              <div className="h-3 rounded-full bg-amber-900/40 border border-amber-400/30 flex items-center justify-center">
                <span className="text-[10px] font-black text-amber-400 tracking-widest">★ MAX RANK ★</span>
              </div>
            ) : (
              <div className="h-3 rounded-full bg-purple-950/80 border border-purple-800/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-violet-400 to-amber-400 transition-all duration-700 relative"
                  style={{ width: `${Math.max(progressPercent, 2)}%` }}
                >
                  {progressPercent > 3 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-300 blur-sm opacity-70 animate-pulse" />
                  )}
                </div>
              </div>
            )}
            {!isMaxRank && <p className="text-xs text-purple-400/70 mt-1.5">{xpToNextRank} XP to {nextRank}</p>}
          </div>

          {/* Return motivator */}
          {!isMaxRank && xpToNextRank <= 20 && (
            <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-900/20 px-4 py-3 flex items-center gap-3">
              <span className="text-amber-400 text-xl shrink-0">🔥</span>
              <p className="text-sm text-amber-300 font-semibold">
                You are <span className="font-black text-amber-400">{xpToNextRank} XP</span> away from {nextRank}. One more visit could do it.
              </p>
            </div>
          )}
          {!isMaxRank && xpToNextRank > 20 && xpToNextRank <= 50 && (
            <div className="mb-6 rounded-2xl border border-purple-500/30 bg-purple-900/20 px-4 py-3 flex items-center gap-3">
              <span className="text-purple-300 text-xl shrink-0">⚔</span>
              <p className="text-sm text-purple-300">
                <span className="font-black text-white">{xpToNextRank} XP</span> to {nextRank}. Keep showing up — the rank is within reach.
              </p>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Quests Completed", value: String(player.visitCount) },
              { label: "Member Since",     value: formatDate(player.joinedAt) },
              { label: "Fav Game",         value: player.favoriteGame || "—" },
              { label: "Hometown",         value: player.city },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#2a1e90]/40 rounded-2xl p-3 border border-purple-600/20 shadow-inner shadow-purple-950/30">
                <p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold mb-0.5">{label}</p>
                <p className="text-sm font-bold text-white leading-tight mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Active Tournaments */}
          {activeTournaments.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">Active Tournaments</p>
              <div className="space-y-2">
                {activeTournaments.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between bg-[#231980]/50 rounded-xl px-4 py-3 border border-purple-700/30">
                    <div>
                      <p className="text-sm font-bold text-white">{entry.tournament.name}</p>
                      <p className="text-xs text-purple-400">{entry.tournament.game} · Starts {formatDate(entry.tournament.startAt)}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      entry.tournament.status === "ongoing"
                        ? "bg-emerald-900/50 border border-emerald-500/50 text-emerald-400"
                        : "bg-blue-900/50 border border-blue-500/40 text-blue-300"
                    }`}>{entry.tournament.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent XP Activity / Rank Trail */}
          {recentXp.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">Recent XP Activity</p>
              <div className="space-y-1.5">
                {recentXp.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between bg-[#2a1e90]/30 rounded-xl px-4 py-2.5 border border-purple-700/20">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{entry.source}</p>
                      {entry.note && <p className="text-xs text-purple-400 truncate">{entry.note}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-emerald-400 font-black text-sm">+{entry.amount} XP</span>
                      <span className="text-purple-400/60 text-xs">{formatRelativeDate(entry.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-5">Your Rank Journey</p>
              <div className="relative px-1">
                <div className="absolute top-3 left-4 right-4 h-px bg-purple-700/30" />
                <div className="flex items-start justify-between relative z-10">
                  {ALL_RANKS.map((rank, i) => {
                    const isDone = i < currentRankIndex;
                    const isCurrent = i === currentRankIndex;
                    const rs = RANK_STYLES[rank] ?? RANK_STYLES["Villager"];
                    return (
                      <div key={rank} className="flex flex-col items-center gap-2">
                        <div className={`flex items-center justify-center rounded-full border-2 transition-all ${
                          isCurrent ? `w-7 h-7 ${rs.dotActive} border-transparent shadow-lg scale-110`
                          : isDone ? `w-5 h-5 ${rs.dotDone} border-transparent`
                          : "w-5 h-5 bg-purple-900/40 border-purple-700/30"
                        }`}>
                          {isDone && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className={`text-[9px] font-bold text-center leading-tight max-w-[36px] ${isCurrent ? "text-white" : isDone ? "text-purple-400/60" : "text-purple-600/40"}`}>
                          {rank === "Villager" ? "Start" : shortRank(rank)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-purple-400/50 mt-5 text-center">Play sessions and complete quests to earn XP and rise through the ranks</p>
            </div>
          )}
        </div>
        </div>

        {/* ── Change PIN ──────────────────────────────────────────────────── */}
        <div className="bg-[#1E1654]/60 rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-purple-300">Guild PIN</p>
              <p className="text-xs text-purple-400/60">Change your login PIN at any time</p>
            </div>
            <button
              onClick={() => { setShowPinForm((v) => !v); setPinStatus("idle"); setPinError(""); }}
              className="text-xs font-semibold text-yellow-400 border border-yellow-400/30 rounded-xl px-4 py-2 hover:bg-yellow-400/10 transition"
            >
              {showPinForm ? "Cancel" : "Change PIN"}
            </button>
          </div>
          {showPinForm && (
            <form onSubmit={handleChangePin} className="space-y-3 mt-2">
              {(["currentPin", "newPin", "confirmPin"] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    {field === "currentPin" ? "Current PIN" : field === "newPin" ? "New PIN" : "Confirm new PIN"}
                  </label>
                  <input type="password" inputMode="numeric" maxLength={6} value={pinForm[field]}
                    onChange={(e) => setPinForm((f) => ({ ...f, [field]: e.target.value.replace(/\D/g, "") }))}
                    placeholder="••••"
                    className="w-full bg-[#0F0D1E] border border-purple-500/40 focus:border-yellow-400/60 focus:outline-none rounded-xl px-4 py-2.5 text-white placeholder-purple-500/50 text-sm transition-colors"
                    required />
                </div>
              ))}
              {pinStatus === "success" && <p className="text-emerald-400 text-sm bg-emerald-950/30 border border-emerald-500/30 rounded-xl px-4 py-2.5">PIN changed successfully!</p>}
              {(pinStatus === "error" || pinError) && <p className="text-rose-400 text-sm bg-rose-950/30 border border-rose-500/30 rounded-xl px-4 py-2.5">{pinError}</p>}
              <button type="submit" disabled={pinStatus === "saving"}
                className="w-full bg-yellow-400 hover:bg-amber-400 disabled:opacity-50 text-[#0F0D1E] font-black text-sm rounded-xl py-2.5 transition-colors">
                {pinStatus === "saving" ? "Saving..." : "Save new PIN"}
              </button>
            </form>
          )}
        </div>

        {/* ── Quest Board CTA ─────────────────────────────────────────────── */}
        <Link href="/quests"
          className="block rounded-3xl border border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10 p-5 transition-colors group">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-yellow-400/70 mb-1">Guild Hall</p>
              <p className="text-xl font-black text-yellow-400 group-hover:text-amber-300 transition-colors">⚔ Quest Board</p>
              <p className="text-purple-300/60 text-xs mt-1">View active quests — staff will award your XP when you complete them at the lounge</p>
            </div>
            <span className="shrink-0 text-yellow-400/60 group-hover:text-yellow-400 text-2xl transition-colors">→</span>
          </div>
        </Link>

        {/* ── Guild Benefits ──────────────────────────────────────────────── */}
        <GuildBenefitsPanel ps={perkStatus} membershipExpiresAt={player.membershipExpiresAt} />

        <div className="text-center pb-4">
          <Link href="/" className="text-sm text-purple-400 hover:text-purple-200 transition-colors">Back to Home</Link>
        </div>
      </div>

      {cropImageSrc && <AvatarCropModal imageSrc={cropImageSrc} onSave={handleCropSave} onCancel={handleCropCancel} />}

      {showNotifications && pendingNotifications.length > 0 && (
        <GuildNotificationOverlay
          notifications={pendingNotifications}
          gamerTag={player.gamerTag}
          avatarUrl={avatarUrl}
          playerTitle={player.titles?.[0]?.title ?? null}
          xp={player.xp}
          memberSince={player.joinedAt}
          onDone={() => { setShowNotifications(false); fetch("/api/portal/notifications", { method: "POST" }); }}
        />
      )}
    </div>
  );
}
