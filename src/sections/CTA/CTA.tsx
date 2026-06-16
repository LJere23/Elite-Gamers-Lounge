"use client";

const WA_NUMBER = "263784497531";
const WA_RESERVE = `https://wa.me/${WA_NUMBER}?text=Hi%2C+I%27d+like+to+reserve+a+spot+at+Elite+Gamers+Lounge.`;

export default function CTA() {
  return (
    <section className="section-padding">
      <div className="max-w-5xl mx-auto rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 p-12 text-center">

        <p className="uppercase tracking-[0.3em] text-cyan-400 mb-4">
          Join The Community
        </p>

        <h2 className="text-4xl md:text-6xl font-black uppercase mb-6">
          Ready To Play?
        </h2>

        <p className="text-gray-300 text-lg mb-8">
          Reserve your setup and become part of the
          fastest-growing gaming community.
        </p>

        <a
          href={WA_RESERVE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-purple-600 hover:bg-purple-500 transition px-10 py-4 rounded-full font-bold uppercase neon-glow text-white"
        >
          Reserve Your Spot
        </a>

      </div>
    </section>
  );
}
