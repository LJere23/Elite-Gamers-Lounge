"use client";

import Link from "next/link";
import { Clock3, Gift, ShieldCheck, Sparkles } from "lucide-react";

const actions = [
  { label: "Create event", icon: Sparkles, href: "/admin/tournaments" },
  { label: "Open table", icon: Clock3, href: "/admin/sessions" },
  { label: "New membership", icon: Gift, href: "/admin/memberships" },
  { label: "System health", icon: ShieldCheck, href: "/admin/analytics" },
];

export default function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.label}
            href={action.href}
            className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 transition hover:border-cyan-400/40 hover:bg-slate-900/80 block"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <Icon size={20} />
            </div>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-slate-400">Quick action</p>
            <h3 className="mt-3 text-lg font-semibold text-white">{action.label}</h3>
          </Link>
        );
      })}
    </div>
  );
}
