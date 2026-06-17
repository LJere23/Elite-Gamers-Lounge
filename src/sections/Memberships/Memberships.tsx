"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MembershipPlan } from "@/types/admin";

const WA_NUMBER = "263784497531";

function waLink(planName: string): string {
  const msg = encodeURIComponent(
    `Hi, I'd like to sign up for the ${planName} membership at Elite Gamers Lounge.`
  );
  return `https://wa.me/${WA_NUMBER}?text=${msg}`;
}

export default function Memberships() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    fetch("/api/memberships")
      .then((res) => res.json())
      .then((data: MembershipPlan[]) => {
        if (Array.isArray(data)) setPlans(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.3em] text-purple-400 mb-4">Memberships</p>
          <h2 className="text-4xl md:text-6xl font-black uppercase">Choose Your Tier</h2>
          <p className="mt-4 text-gray-400">
            Message us on WhatsApp to reserve your plan — we'll confirm your slot within minutes.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-2xl font-bold text-white mb-2">Coming Soon</p>
            <p className="text-slate-400 max-w-sm">
              Membership plans are being finalised. Check back soon or message us on WhatsApp.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -10 }}
              className="rounded-3xl bg-white/5 border border-purple-500/20 p-8 flex flex-col"
            >
              <h3 className="text-3xl font-black mb-4">{plan.name}</h3>
              <p className="text-slate-300 mb-6">{plan.description}</p>

              <div className="text-5xl font-black text-cyan-400 mb-8">
                ${plan.priceUsd}
                <span className="text-base font-normal text-slate-400"> / {plan.period}</span>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {plan.perks.map((perk, perkIndex) => (
                  <div key={perkIndex} className="flex items-start gap-3 border-b border-white/10 pb-3">
                    <span className="text-cyan-400 mt-0.5 shrink-0">✓</span>
                    <span className="text-slate-200 text-sm">{perk}</span>
                  </div>
                ))}
              </div>

              <a
                href={waLink(plan.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-purple-600 hover:bg-purple-500 transition py-4 rounded-full font-bold uppercase text-center text-white neon-glow"
              >
                Reserve via WhatsApp
              </a>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
