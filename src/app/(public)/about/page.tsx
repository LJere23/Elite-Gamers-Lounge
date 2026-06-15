import Link from "next/link";
import { Gamepad2, Trophy, Users, Zap, Shield, MapPin } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      {/* Hero */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-400 mb-4">Est. 2025</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-6 leading-none">
            Gweru&apos;s Premier<br />
            <span className="text-cyan-400">Gaming Lounge</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            More than a gaming venue — a competitive arena, a community hub, and the home of esports in Gweru.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6 bg-slate-950/60">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-3">Our Story</p>
          <h2 className="text-4xl font-black mb-8 text-white">Built for players, by players.</h2>
          <div className="space-y-5 text-slate-300 text-lg leading-relaxed">
            <p>
              Gweru&apos;s Gamers Lounge was born from a simple idea: every city deserves a world-class gaming space.
              We set out to build a place where competitive players can train, casual gamers can have fun, and the whole
              community can come together over shared passion.
            </p>
            <p>
              We&apos;ve built an RPG-style loyalty system where every visit earns you XP, every tournament pushes your rank,
              and every quest brings you closer to the top of the leaderboard. Your gaming journey is tracked, celebrated,
              and rewarded.
            </p>
            <p>
              Whether you&apos;re grinding FIFA tournaments, racing the clock on the sim rig, or just relaxing with friends
              — Gweru&apos;s Gamers Lounge is your guild hall.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-3">What we offer</p>
            <h2 className="text-4xl font-black">Everything you need</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Gamepad2, title: "Premium PCs & Consoles", desc: "High-spec gaming rigs with fast WiFi and the latest titles." },
              { icon: Trophy, title: "Live Tournaments", desc: "Regular FIFA, racing, and esports tournaments with prizes." },
              { icon: Users, title: "Guild System", desc: "RPG loyalty system — earn XP, unlock ranks, and claim titles." },
              { icon: Zap, title: "Fast WiFi", desc: "High-speed internet for gaming and streaming." },
              { icon: Shield, title: "Safe Space", desc: "A welcoming environment for all skill levels and ages." },
              { icon: MapPin, title: "Central Location", desc: "Conveniently located in the heart of Gweru, Zimbabwe." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-slate-950/80 p-7 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 flex items-center justify-center">
                  <Icon size={20} className="text-cyan-400" />
                </div>
                <h3 className="text-lg font-black text-white">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-slate-950/60">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "200+", label: "Registered Members" },
              { value: "50+", label: "Tournaments Hosted" },
              { value: "30+", label: "Games Available" },
              { value: "24/7", label: "Community Online" },
            ].map(({ value, label }) => (
              <div key={label} className="space-y-2">
                <p className="text-4xl md:text-5xl font-black text-cyan-400">{value}</p>
                <p className="text-slate-400 text-sm uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-black">Ready to join the guild?</h2>
          <p className="text-slate-400">Register today and start earning XP on your first visit.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="rounded-3xl bg-cyan-500 hover:bg-cyan-400 px-8 py-4 font-bold text-black text-sm uppercase tracking-wide transition-colors"
            >
              Join the Guild
            </Link>
            <Link
              href="/contact"
              className="rounded-3xl border border-white/10 hover:border-white/20 bg-black/40 px-8 py-4 font-semibold text-slate-300 text-sm uppercase tracking-wide transition-colors"
            >
              Find us
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
