"use client";

import { useEffect, useRef, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AnnouncementShareCard } from "@/components/ui/AnnouncementShareCard";
import { Announcement } from "@/types/admin";
import html2canvas from "html2canvas";

const TYPE_BADGE: Record<string, string> = {
  champion:             "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  rank_up:              "bg-purple-500/20 text-purple-300 border-purple-500/30",
  title_awarded:        "bg-yellow-500/20 text-yellow-200 border-yellow-500/30",
  birthday:             "bg-pink-500/20 text-pink-300 border-pink-500/30",
  milestone:            "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  tournament_scheduled: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  tournament_started:   "bg-orange-500/20 text-orange-300 border-orange-500/30",
  weekly_leaderboard:   "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  general:              "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

const TYPE_LABEL: Record<string, string> = {
  champion:             "🏆 Champion",
  rank_up:              "⬆ Rank Up",
  title_awarded:        "🎖 Title",
  birthday:             "🎂 Birthday",
  milestone:            "⚔ Milestone",
  tournament_scheduled: "📅 Tournament",
  tournament_started:   "⚡ Live",
  weekly_leaderboard:   "📊 Leaderboard",
  general:              "📢 General",
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState("");
  const [expiryDays, setExpiryDays]       = useState("");
  const [formMsg, setFormMsg]             = useState<string | null>(null);
  const [showAll, setShowAll]             = useState(false);
  const [shareCard, setShareCard]         = useState<Announcement | null>(null);
  const [capturing, setCapturing]         = useState(false);
  const [copyDone, setCopyDone]           = useState(false);

  const captureRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/announcements/all");
    if (res.ok) setAnnouncements(await res.json());
  }

  useEffect(() => { load(); }, []);

  const visible = showAll
    ? announcements
    : announcements.filter((a) => !a.expiresAt || new Date(a.expiresAt) > new Date());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setFormMsg(null);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message:      message.trim(),
        type:         "general",
        expiresInDays: expiryDays ? Number(expiryDays) : undefined,
      }),
    });
    if (res.ok) {
      setMessage("");
      setExpiryDays("");
      setFormMsg("Announcement published.");
      await load();
    } else {
      const d = await res.json();
      setFormMsg(d.error ?? "Failed to publish.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    setLoading(true);
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setLoading(false);
  };

  const handleClearExpired = async () => {
    const expired = announcements.filter(
      (a) => a.expiresAt && new Date(a.expiresAt) <= new Date()
    );
    if (expired.length === 0) { setFormMsg("No expired announcements to clear."); return; }
    if (!window.confirm(`Delete ${expired.length} expired announcement(s)?`)) return;
    setLoading(true);
    await Promise.all(expired.map((a) => fetch(`/api/announcements/${a.id}`, { method: "DELETE" })));
    await load();
    setLoading(false);
  };

  const handleDownloadCard = async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `ggl-announcement-${shareCard?.id?.slice(0, 8) ?? "card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setCapturing(false);
    }
  };

  const handleCopyText = () => {
    if (!shareCard) return;
    navigator.clipboard.writeText(shareCard.message).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  const expiredCount = announcements.filter(
    (a) => a.expiresAt && new Date(a.expiresAt) <= new Date()
  ).length;

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Announcements"
        description="Publish updates visible on the public homepage. Most announcements are created automatically."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

        {/* LIST */}
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">All Announcements</p>
              <h2 className="mt-2 text-2xl font-black text-white">{announcements.length} total</h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="rounded-3xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                {showAll ? "Hide expired" : `Show expired (${expiredCount})`}
              </button>
              {expiredCount > 0 && (
                <button
                  onClick={handleClearExpired}
                  disabled={loading}
                  className="rounded-3xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                >
                  Clear expired
                </button>
              )}
            </div>
          </div>

          {visible.length === 0 && (
            <p className="text-sm text-slate-500">No announcements yet. Create one using the form.</p>
          )}

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {visible.map((a) => {
              const isExpired = !!a.expiresAt && new Date(a.expiresAt) <= new Date();
              const type = a.type ?? "general";
              return (
                <div
                  key={a.id}
                  className={`rounded-3xl border p-5 ${isExpired ? "opacity-40 border-white/5 bg-black/20" : "border-white/5 bg-black/30"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${TYPE_BADGE[type] ?? TYPE_BADGE.general}`}>
                          {TYPE_LABEL[type] ?? "📢"}
                        </span>
                        {isExpired && (
                          <span className="text-xs text-red-400 font-semibold">EXPIRED</span>
                        )}
                        {a.tournamentName && (
                          <span className="text-xs text-slate-400">{a.tournamentName}</span>
                        )}
                      </div>
                      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{a.message}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                        {a.expiresAt && (
                          <span>
                            {isExpired ? "Expired" : "Expires"} {new Date(a.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                        {a.winnerName && <span className="text-yellow-400">Winner: {a.winnerName}</span>}
                        {a.prizeAmount && <span className="text-green-400">{a.prizeAmount}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2 pt-1">
                      <button
                        onClick={() => setShareCard(a)}
                        title="Create share card"
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition font-semibold"
                      >
                        Share ↗
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={loading}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CREATE FORM */}
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-6 h-fit space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Publish Announcement</p>
            <h2 className="mt-2 text-2xl font-black text-white">New update</h2>
            <p className="mt-2 text-sm text-slate-400">
              Most announcements — tournaments, birthdays, milestones, weekly leaderboard — are auto-created.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-100">
              Message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write your announcement..."
                required
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400 text-sm resize-none"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-100">
              Expires after (days)
              <input
                type="number"
                min="1"
                max="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                placeholder="Leave blank to never expire"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.15em] text-black hover:bg-cyan-400 transition disabled:opacity-60"
            >
              {loading ? "Publishing..." : "Publish Announcement"}
            </button>

            {formMsg && (
              <p className={`text-sm text-center ${formMsg.includes("Failed") ? "text-red-400" : "text-green-400"}`}>
                {formMsg}
              </p>
            )}
          </form>

          <div className="rounded-3xl border border-white/5 bg-black/30 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto-created types</p>
            <div className="space-y-1 text-xs text-slate-500">
              <p>🏆 <span className="text-yellow-300 font-semibold">Champion</span> — tournament completes</p>
              <p>📅 <span className="text-amber-300 font-semibold">Tournament</span> — scheduled & started</p>
              <p>⬆ <span className="text-purple-300 font-semibold">Rank Up</span> — player earns new rank</p>
              <p>🎖 <span className="text-yellow-200 font-semibold">Title</span> — title awarded at visit milestone</p>
              <p>⚔ <span className="text-emerald-300 font-semibold">Milestone</span> — 10 / 25 / 50 / 100 visits</p>
              <p>🎂 <span className="text-pink-300 font-semibold">Birthday</span> — daily cron</p>
              <p>📊 <span className="text-cyan-300 font-semibold">Leaderboard</span> — every Monday</p>
            </div>
          </div>
        </div>
      </div>

      {/* SHARE CARD MODAL */}
      {shareCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShareCard(null); }}
        >
          <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 w-full max-w-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-400">Share Card</p>
                <h3 className="mt-1 text-lg font-black text-white">Download or copy for socials</h3>
              </div>
              <button
                onClick={() => setShareCard(null)}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Preview box — scaled down visually (separate from capture ref) */}
            <div className="flex justify-center">
              <div
                style={{ width: 270, height: 270, overflow: "hidden", borderRadius: 16, position: "relative" }}
                className="border border-white/10"
              >
                <div style={{ transform: "scale(0.5)", transformOrigin: "top left" }}>
                  <AnnouncementShareCard announcement={shareCard} />
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Card will be exported at 2160×2160 (4× retina). Ideal for WhatsApp and Instagram.
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadCard}
                disabled={capturing}
                className="flex-1 rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black hover:bg-cyan-400 transition disabled:opacity-60"
              >
                {capturing ? "Generating…" : "⬇ Download PNG"}
              </button>
              <button
                onClick={handleCopyText}
                className="flex-1 rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10 transition"
              >
                {copyDone ? "✓ Copied!" : "Copy text"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen capture target — positioned off-screen so html2canvas can read it */}
      {shareCard && (
        <div style={{ position: "fixed", top: -1200, left: 0, pointerEvents: "none" }}>
          <AnnouncementShareCard ref={captureRef} announcement={shareCard} />
        </div>
      )}
    </section>
  );
}
