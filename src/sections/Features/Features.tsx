"use client";

import { motion } from "framer-motion";
import {
  Gamepad2,
  Trophy,
  Car,
  Swords,
} from "lucide-react";

const features = [
  {
    title: "PS5 Gaming",
    icon: Gamepad2,
    description:
      "Competitive and casual gaming experiences with premium setups.",
  },
  {
    title: "Sim Racing",
    icon: Car,
    description:
      "Immersive racing simulator experiences with leaderboards.",
  },
  {
    title: "Tournaments",
    icon: Trophy,
    description:
      "Weekly competitions, prizes, rankings, and community events.",
  },
  {
    title: "Competitive Arena",
    icon: Swords,
    description:
      "Battle friends and rivals in high-energy gaming sessions.",
  },
];

export default function Features() {
  return (
    <section className="section-padding">

      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.3em] text-purple-400 mb-4">
            Experience
          </p>

          <h2 className="text-4xl md:text-6xl font-black uppercase">
            What Awaits You
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={index}
                whileHover={{
                  y: -10,
                }}
                className="rounded-3xl border border-purple-500/20 bg-white/5 p-8 backdrop-blur-sm hover:border-cyan-400/40 transition"
              >

                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
                  <Icon className="text-cyan-400" size={32} />
                </div>

                <h3 className="text-2xl font-bold mb-4">
                  {feature.title}
                </h3>

                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

              </motion.div>
            );
          })}

        </div>

      </div>

    </section>
  );
}