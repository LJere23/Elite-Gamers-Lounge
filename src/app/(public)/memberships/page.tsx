import { readStore } from "@/lib/database";
import { MembershipPlan } from "@/types/admin";

export default async function MembershipsPage() {
  const store = await readStore();
  const plans: MembershipPlan[] = store.memberships;
  const activeMembers = store.players.filter((player) => player.membershipType === "member");

  return (
    <main className="min-h-screen pt-32 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-400">Memberships</p>
          <h1 className="text-5xl font-black uppercase">Choose the right pass</h1>
          <p className="text-slate-400 max-w-3xl">
            Access exclusive sessions, priority booking, and tournament perks with each tier. Compare plans and join the membership package that suits your playstyle.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white">{plan.name}</h2>
                  <p className="mt-2 text-slate-400">{plan.period} access</p>
                </div>
                <div className="text-4xl font-black text-cyan-400">${plan.priceUsd}</div>
              </div>

              <p className="mt-6 text-slate-300">{plan.description}</p>

              <ul className="mt-8 space-y-3 text-slate-300">
                {plan.perks.map((perk) => (
                  <li key={perk} className="rounded-3xl border border-white/5 bg-black/40 px-4 py-3">
                    {perk}
                  </li>
                ))}
              </ul>

              <button className="mt-10 w-full rounded-full bg-purple-600 px-6 py-4 text-sm font-bold uppercase text-white transition hover:bg-purple-500">
                Join {plan.name}
              </button>
            </article>
          ))}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 text-slate-300">
          <h2 className="text-2xl font-black text-white">Membership snapshot</h2>
          <p className="mt-4 max-w-2xl text-slate-400">
            There are currently <span className="font-semibold text-white">{activeMembers.length}</span> active members in the lounge.
          </p>
        </div>
      </div>
    </main>
  );
}
