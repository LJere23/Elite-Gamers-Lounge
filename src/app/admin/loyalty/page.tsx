"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

interface LeaderboardPlayer {
  id: string;
  name: string;
  gamerTag: string;
  rank: string;
  xp: number;
  membershipTier: string;
  visitCount: number;
  position: number;
}

interface Player {
  id: string;
  name: string;
  gamerTag: string;
}

interface Job {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  active: boolean;
  jobType?: string;
}

type Tab = "leaderboard" | "award" | "jobs";

/*
|--------------------------------------------------------------------------
| RANK BADGE
|--------------------------------------------------------------------------
*/

function RankBadge({ rank }: { rank: string }) {
  const styles: Record<string, string> = {
    "S Rank": "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    "A Rank": "bg-purple-500/20 text-purple-300 border-purple-500/40",
    "B Rank": "bg-blue-500/20 text-blue-300 border-blue-500/40",
    "C Rank": "bg-green-500/20 text-green-300 border-green-500/40",
    "D Rank": "bg-teal-500/20 text-teal-300 border-teal-500/40",
    "E Rank": "bg-orange-500/20 text-orange-300 border-orange-500/40",
    "F Rank": "bg-red-500/20 text-red-300 border-red-500/40",
    "Adventurer": "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    "Villager": "bg-zinc-600/40 text-zinc-400 border-zinc-600/40",
  };

  const cls = styles[rank] ?? "bg-zinc-600/40 text-zinc-400 border-zinc-600/40";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {rank}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function AdminLoyaltyPage() {
  const [activeTab, setActiveTab] = useState<Tab>("leaderboard");

  /* ---- Leaderboard ---- */
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  /* ---- Award XP ---- */
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({
    playerId: "",
    amount: 1,
    source: "visit",
    note: "",
  });
  const [awardLoading, setAwardLoading] = useState(false);
  const [awardResult, setAwardResult] = useState<string | null>(null);
  const [awardError, setAwardError] = useState<string | null>(null);

  /* ---- Jobs ---- */
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobForm, setJobForm] = useState({
    name: "",
    description: "",
    xpReward: 1,
  });
  const [jobSubmitting, setJobSubmitting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  async function loadLeaderboard() {
    setLeaderboardLoading(true);
    try {
      const res = await fetch("/api/loyalty/xp?limit=20");
      const data = await res.json();
      setLeaderboard(data);
    } catch {
      // silent
    } finally {
      setLeaderboardLoading(false);
    }
  }

  async function loadPlayers() {
    try {
      const res = await fetch("/api/players");
      const data = await res.json();
      setPlayers(data);
    } catch {
      // silent
    }
  }

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const res = await fetch("/api/loyalty/jobs");
      const data = await res.json();
      setJobs(data);
    } catch {
      // silent
    } finally {
      setJobsLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
    loadPlayers();
    loadJobs();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | AWARD XP
  |--------------------------------------------------------------------------
  */

  async function handleAwardXp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!awardForm.playerId) {
      setAwardError("Please select a player first.");
      return;
    }
    setAwardLoading(true);
    setAwardResult(null);
    setAwardError(null);

    try {
      const res = await fetch("/api/loyalty/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: awardForm.playerId,
          amount: Number(awardForm.amount),
          source: awardForm.source,
          note: awardForm.note || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setAwardError(data.error ?? "Failed to award XP.");
      } else {
        const playerName = data.player?.name ?? "Player";
        setAwardResult(
          `Awarded ${data.xpAwarded} XP to ${playerName}. New rank: ${data.newRank}${data.rankUp ? " — Rank Up!" : ""}`
        );
        setAwardForm({ playerId: "", amount: 1, source: "visit", note: "" });
        setSelectedPlayer(null);
        setPlayerSearch("");
        await loadLeaderboard();
      }
    } catch {
      setAwardError("Network error. Please try again.");
    } finally {
      setAwardLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | JOBS
  |--------------------------------------------------------------------------
  */

  async function handleAddJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJobSubmitting(true);

    try {
      const res = await fetch("/api/loyalty/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: jobForm.name,
          description: jobForm.description,
          xpReward: Number(jobForm.xpReward),
        }),
      });

      if (res.ok) {
        setJobForm({ name: "", description: "", xpReward: 1 });
        await loadJobs();
      }
    } catch {
      // silent
    } finally {
      setJobSubmitting(false);
    }
  }

  async function handleToggleJob(job: Job) {
    try {
      await fetch(`/api/loyalty/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !job.active }),
      });
      await loadJobs();
    } catch {
      // silent
    }
  }

  async function handleDeleteJob(jobId: string) {
    try {
      await fetch(`/api/loyalty/jobs/${jobId}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch {
      // silent
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  const tabs: { key: Tab; label: string }[] = [
    { key: "leaderboard", label: "XP Leaderboard" },
    { key: "award", label: "Award XP" },
    { key: "jobs", label: "Manage Jobs" },
  ];

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Loyalty & XP"
        description="Track player rankings, award XP for activities, and manage the jobs reward system."
      />

      {/* TABS */}
      <div className="flex gap-2 rounded-3xl border border-white/10 bg-slate-950/80 p-2 shadow-2xl shadow-black/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-cyan-500 text-black"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* XP LEADERBOARD TAB */}
      {activeTab === "leaderboard" && (
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Top Players</p>
            <h2 className="mt-3 text-3xl font-black text-white">XP Leaderboard</h2>
            <p className="mt-2 text-slate-400">Top 20 players ranked by XP earned.</p>
          </div>

          {leaderboardLoading ? (
            <p className="py-12 text-center text-slate-400">Loading leaderboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="py-12 text-center text-slate-500">No players found.</p>
          ) : (
            <div className="space-y-3">
              {/* Header row */}
              <div className="hidden grid-cols-[3rem_1fr_1fr_1fr_5rem_8rem_5rem] gap-4 px-4 text-xs uppercase tracking-[0.18em] text-slate-500 md:grid">
                <span>#</span>
                <span>Name</span>
                <span>GamerTag</span>
                <span>Rank</span>
                <span className="text-right">XP</span>
                <span>Tier</span>
                <span className="text-right">Visits</span>
              </div>

              {leaderboard.map((player) => (
                <div
                  key={player.id}
                  className="rounded-3xl border border-white/5 bg-black/40 p-4"
                >
                  {/* Mobile layout */}
                  <div className="flex items-start justify-between gap-3 md:hidden">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                          player.position === 1
                            ? "bg-yellow-500/30 text-yellow-300"
                            : player.position === 2
                            ? "bg-slate-400/20 text-slate-300"
                            : player.position === 3
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-white/5 text-slate-400"
                        }`}
                      >
                        {player.position}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{player.name}</p>
                        <p className="text-sm text-slate-400">@{player.gamerTag}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-cyan-400">{player.xp} XP</p>
                      <RankBadge rank={player.rank} />
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden grid-cols-[3rem_1fr_1fr_1fr_5rem_8rem_5rem] items-center gap-4 md:grid">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                        player.position === 1
                          ? "bg-yellow-500/30 text-yellow-300"
                          : player.position === 2
                          ? "bg-slate-400/20 text-slate-300"
                          : player.position === 3
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-white/5 text-slate-400"
                      }`}
                    >
                      {player.position}
                    </span>
                    <span className="font-semibold text-white">{player.name}</span>
                    <span className="text-slate-400">@{player.gamerTag}</span>
                    <span>
                      <RankBadge rank={player.rank} />
                    </span>
                    <span className="text-right font-black text-cyan-400">{player.xp}</span>
                    <span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          player.membershipTier === "Legend"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : player.membershipTier === "Hero"
                            ? "bg-purple-500/20 text-purple-300"
                            : player.membershipTier === "Warrior"
                            ? "bg-blue-500/20 text-blue-300"
                            : player.membershipTier === "Adventurer"
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-zinc-600/40 text-zinc-400"
                        }`}
                      >
                        {player.membershipTier}
                      </span>
                    </span>
                    <span className="text-right text-slate-300">{player.visitCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AWARD XP TAB */}
      {activeTab === "award" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Award XP</p>
            <h2 className="mt-3 text-3xl font-black text-white">Grant experience points</h2>
            <p className="mt-2 text-slate-400">
              Award XP to a player for visits, jobs, or manual bonuses. Tier multipliers apply automatically.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleAwardXp}>
              <div className="block text-sm font-semibold text-slate-100">
                Player
                <div className="relative mt-3">
                  {selectedPlayer ? (
                    <div className="flex items-center justify-between rounded-3xl border border-cyan-400/50 bg-black/40 px-4 py-3">
                      <span className="text-white">
                        {selectedPlayer.name}{" "}
                        <span className="text-slate-400">@{selectedPlayer.gamerTag}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlayer(null);
                          setAwardForm({ ...awardForm, playerId: "" });
                          setPlayerSearch("");
                        }}
                        className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none ml-3"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Search by name or gamerTag..."
                        value={playerSearch}
                        onChange={(e) => { setPlayerSearch(e.target.value); setSearchOpen(true); }}
                        onFocus={() => setSearchOpen(true)}
                        onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                        className="w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                      />
                      {searchOpen && playerSearch.length > 0 && (
                        <div className="absolute z-10 mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
                          {players
                            .filter((p) => {
                              const q = playerSearch.toLowerCase();
                              return p.name.toLowerCase().includes(q) || p.gamerTag.toLowerCase().includes(q);
                            })
                            .slice(0, 8)
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onMouseDown={() => {
                                  setSelectedPlayer(p);
                                  setAwardForm({ ...awardForm, playerId: p.id });
                                  setPlayerSearch("");
                                  setSearchOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                              >
                                <span className="text-white font-semibold">{p.name}</span>
                                <span className="text-slate-400 text-sm ml-2">@{p.gamerTag}</span>
                              </button>
                            ))}
                          {players.filter((p) => {
                            const q = playerSearch.toLowerCase();
                            return p.name.toLowerCase().includes(q) || p.gamerTag.toLowerCase().includes(q);
                          }).length === 0 && (
                            <p className="px-4 py-3 text-slate-500 text-sm">No players found.</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-100">
                  XP Amount
                  <input
                    type="number"
                    min={1}
                    required
                    value={awardForm.amount}
                    onChange={(e) => setAwardForm({ ...awardForm, amount: Number(e.target.value) })}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-100">
                  Source
                  <select
                    value={awardForm.source}
                    onChange={(e) => setAwardForm({ ...awardForm, source: e.target.value })}
                    className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="visit">Visit</option>
                    <option value="job">Job</option>
                    <option value="manual">Manual</option>
                    <option value="birthday">Birthday</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-100">
                Note (optional)
                <input
                  type="text"
                  placeholder="e.g. Won weekly challenge"
                  value={awardForm.note}
                  onChange={(e) => setAwardForm({ ...awardForm, note: e.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>

              <button
                type="submit"
                disabled={awardLoading}
                className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-cyan-400 disabled:opacity-60"
              >
                {awardLoading ? "Awarding..." : "Award XP"}
              </button>
            </form>
          </div>

          {/* Result panel */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Result</p>
            <h2 className="mt-3 text-3xl font-black text-white">Award status</h2>

            {!awardResult && !awardError && (
              <p className="mt-8 text-slate-500">Submit the form to award XP. The result will appear here.</p>
            )}

            {awardResult && (
              <div className="mt-8 rounded-3xl border border-green-500/30 bg-green-500/10 p-6">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-400">Success</p>
                <p className="mt-3 text-lg font-semibold text-white">{awardResult}</p>
              </div>
            )}

            {awardError && (
              <div className="mt-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-400">Error</p>
                <p className="mt-3 text-white">{awardError}</p>
              </div>
            )}

            <div className="mt-8 space-y-3">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">XP Multipliers</p>
              {[
                { tier: "Legend", multiplier: "1.35x", color: "text-yellow-300" },
                { tier: "Hero", multiplier: "1.2x", color: "text-purple-300" },
                { tier: "Warrior", multiplier: "1.1x", color: "text-blue-300" },
                { tier: "Adventurer / Villager", multiplier: "1.0x", color: "text-cyan-300" },
              ].map((item) => (
                <div key={item.tier} className="flex items-center justify-between rounded-3xl border border-white/5 bg-black/40 px-4 py-3">
                  <span className="text-sm text-slate-300">{item.tier}</span>
                  <span className={`text-sm font-bold ${item.color}`}>{item.multiplier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE JOBS TAB */}
      {activeTab === "jobs" && (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          {/* Job list */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">Reward Activities</p>
              <h2 className="mt-3 text-3xl font-black text-white">{jobs.length} jobs configured</h2>
            </div>

            {jobsLoading ? (
              <p className="py-8 text-center text-slate-400">Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p className="py-8 text-center text-slate-500">No jobs yet. Add one using the form.</p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="rounded-3xl border border-white/5 bg-black/40 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white">{job.name}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              job.active
                                ? "bg-green-500/20 text-green-400"
                                : "bg-zinc-600/40 text-zinc-400"
                            }`}
                          >
                            {job.active ? "Active" : "Inactive"}
                          </span>
                          {job.jobType && job.jobType !== "standard" && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              job.jobType === "milestone_first_session"
                                ? "bg-cyan-500/20 text-cyan-300"
                                : job.jobType === "tournament_entry"
                                ? "bg-purple-500/20 text-purple-300"
                                : job.jobType === "referral"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-yellow-500/20 text-yellow-300"
                            }`}>
                              auto
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{job.description}</p>
                        <p className="mt-2 text-sm font-bold text-cyan-400">+{job.xpReward} XP</p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => handleToggleJob(job)}
                          className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                            job.active
                              ? "border-zinc-600/40 text-zinc-400 hover:border-red-500/40 hover:text-red-400"
                              : "border-green-500/30 text-green-400 hover:border-green-400/60"
                          }`}
                        >
                          {job.active ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="rounded-2xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition hover:border-red-400/60 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add job form */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">New Job</p>
            <h2 className="mt-3 text-2xl font-black text-white">Add reward activity</h2>
            <p className="mt-2 text-slate-400">Create a new XP-rewarding job for players to complete.</p>

            <form className="mt-8 space-y-5" onSubmit={handleAddJob}>
              <label className="block text-sm font-semibold text-slate-100">
                Job name
                <input
                  required
                  placeholder="e.g. Competition Winner"
                  value={jobForm.name}
                  onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-100">
                Description
                <input
                  required
                  placeholder="e.g. Win a tournament event"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-100">
                XP reward
                <input
                  type="number"
                  min={1}
                  required
                  value={jobForm.xpReward}
                  onChange={(e) => setJobForm({ ...jobForm, xpReward: Number(e.target.value) })}
                  className="mt-3 w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>

              <button
                type="submit"
                disabled={jobSubmitting}
                className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-cyan-400 disabled:opacity-60"
              >
                {jobSubmitting ? "Adding..." : "Add job"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
