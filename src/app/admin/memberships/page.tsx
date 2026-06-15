"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { MembershipPlan, Player } from "@/types/admin";

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<MembershipPlan[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetch("/api/memberships").then((res) => res.json()).then(setMemberships);
    fetch("/api/players").then((res) => res.json()).then(setPlayers);
  }, []);

  const totals = useMemo(
    () =>
      memberships.map((plan) => ({
        ...plan,
        members: players.filter((player) => player.membershipPlan === plan.name).length,
      })),
    [memberships, players]
  );

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Membership management"
        description="See active membership plans, enrollment counts, and the member distribution by plan."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {totals.map((plan) => (
          <div key={plan.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-lg shadow-black/10">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">{plan.name}</p>
            <h2 className="mt-4 text-4xl font-black text-white">${plan.priceUsd}</h2>
            <p className="mt-3 text-slate-300">{plan.description}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">
              {plan.members} members
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
        <h2 className="text-2xl font-black text-white">Recent member activity</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {players.slice(0, 4).map((player) => (
            <div key={player.id} className="rounded-3xl bg-black/40 p-5 text-slate-300">
              <p className="font-semibold text-white">{player.name}</p>
              <p>{player.membershipPlan}</p>
              <p className="mt-2 text-sm">Expires {player.membershipExpiresAt ? new Date(player.membershipExpiresAt).toLocaleDateString() : "N/A"}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
