"use client";

import { motion } from "framer-motion";
import { slideUp } from "@/animations/slide";
import useCountdown from "@/hooks/useCountdown";
import { useEffect, useState } from "react";

export default function Countdown() {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [label, setLabel] = useState("Next Tournament");
  const [sublabel, setSublabel] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    async function loadData() {
      try {
        // Check settings first for a custom countdown
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.countdownEnabled && settings.countdownDate) {
            setTarget(settings.countdownDate);
            setLabel(settings.countdownTitle || "Next Event");
            setSublabel("Coming Up");
            setVisible(true);
            return;
          }
          // If settings countdown is off, hide the section entirely
          if (!settings.countdownEnabled) {
            setVisible(false);
            return;
          }
        }

        // Fall back to next scheduled tournament
        const tourneyRes = await fetch("/api/tournaments");
        if (tourneyRes.ok) {
          const tournaments: Array<{ name: string; startAt: string; status: string }> = await tourneyRes.json();
          const now = Date.now();
          const next = tournaments
            .filter((t) => t.status === "scheduled" && new Date(t.startAt).getTime() > now)
            .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];

          if (next) {
            setTarget(next.startAt);
            setLabel(next.name);
            setSublabel("Tournament");
            setVisible(true);
          }
        }
      } catch {
        // Silently fail — countdown stays hidden
      }
    }

    loadData();
  }, []);

  const timeLeft = useCountdown(target ?? "2099-01-01T00:00:00");

  if (!mounted || !visible || !target) return null;

  return (
    <section className="section-padding">
      <motion.div
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-5xl mx-auto rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 p-12 text-center"
      >
        <p className="uppercase tracking-[0.3em] text-purple-400 mb-4">{sublabel}</p>
        <h2 className="text-4xl md:text-6xl font-black uppercase mb-8">{label}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: timeLeft.days, unit: "Days" },
            { value: timeLeft.hours, unit: "Hours" },
            { value: timeLeft.minutes, unit: "Minutes" },
            { value: timeLeft.seconds, unit: "Seconds" },
          ].map(({ value, unit }) => (
            <div key={unit} className="bg-black/40 rounded-2xl p-6 border border-white/10">
              <h3 className="text-5xl font-black text-cyan-400">{value}</h3>
              <p className="uppercase text-sm tracking-widest mt-2">{unit}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
