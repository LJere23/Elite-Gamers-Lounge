"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { fadeIn } from "@/animations/fade";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

const WA_NUMBER = "263784497531";
const WA_BOOK = `https://wa.me/${WA_NUMBER}?text=Hi%2C+I%27d+like+to+book+a+gaming+session+at+Elite+Gamers+Lounge.`;

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden section-padding">

      {/* Animated gaming sprite background */}
      <AnimatedBackground />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-black/60 pointer-events-none z-[1]" />

      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center"
      >

        <p className="uppercase tracking-[0.4em] text-cyan-400 mb-6">
          Welcome To The Arena
        </p>

        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-widest mb-6 leading-tight">
          <span className="gradient-text">
            ELITE
          </span>
          <br />
          GAMERS LOUNGE
        </h1>

        <p className="text-lg md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
          Competitive gaming, sim racing, tournaments,
          community events and premium gaming experiences
          all under one roof.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">

          <a
            href={WA_BOOK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 hover:bg-purple-500 transition px-8 py-4 rounded-full neon-glow font-semibold uppercase tracking-wide text-white text-center"
          >
            Book Session
          </a>

          <Link
            href="/leaderboards"
            className="border border-cyan-400 hover:bg-cyan-400/10 transition px-8 py-4 rounded-full uppercase tracking-wide text-center"
          >
            View Leaderboards
          </Link>

        </div>

      </motion.div>

    </section>
  );
}
