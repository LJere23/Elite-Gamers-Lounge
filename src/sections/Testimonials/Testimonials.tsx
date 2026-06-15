"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { slideUp } from "@/animations/slide";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  message: string;
}

const FALLBACK: Testimonial[] = [
  { id: "1", name: "Tapiwa", role: "Competitive FIFA Player", message: "Best gaming experience in Gweru. Competitive and immersive atmosphere." },
  { id: "2", name: "Ashley", role: "Sim Racing Enthusiast", message: "The racing setup and leaderboard system is amazing." },
  { id: "3", name: "Munashe", role: "Community Member", message: "Feels like a real esports arena and gaming community." },
];

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>(FALLBACK);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((data: Testimonial[]) => {
        if (Array.isArray(data) && data.length > 0) setItems(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="section-padding bg-slate-950/70 text-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400 mb-2">Testimonials</p>
          <h2 className="text-4xl font-bold">What our gamers say</h2>
          <p className="text-gray-300 mt-4 max-w-2xl mx-auto">
            Hear from competitive players and community members who love the lounge.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {items.map((item, i) => (
            <motion.article
              key={item.id}
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border border-slate-700 rounded-3xl p-8 bg-slate-900/80 shadow-xl"
            >
              <p className="text-lg leading-8 text-gray-200 mb-6">&ldquo;{item.message}&rdquo;</p>
              <div>
                <p className="font-semibold text-white">{item.name}</p>
                <p className="text-sm text-cyan-300">{item.role}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
