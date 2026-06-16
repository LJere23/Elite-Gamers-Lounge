"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Trophy, Gamepad2 } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gamerTag, setGamerTag] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/portal/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.player?.gamerTag) setGamerTag(data.player.gamerTag); })
      .catch(() => {});
  }, [pathname]); // re-check on route change so login/logout reflects immediately

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/40 backdrop-blur-md border-b border-purple-500/20">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <div className="flex items-center gap-2">
          <Gamepad2 className="text-purple-400" />

          <span className="text-xl font-black tracking-widest">
            EGL
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 uppercase text-sm tracking-wide">
          <Link href="/">Home</Link>
          <Link href="/leaderboards">Leaderboards</Link>
          <Link href="/tournaments">Tournaments</Link>
          <Link href="/memberships">Memberships</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/blog">News</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/quests"
            className="text-sm uppercase tracking-wide text-yellow-400 hover:text-yellow-300 border border-yellow-400/40 hover:border-yellow-400/70 rounded-full px-4 py-1.5 transition font-bold"
          >
            ⚔ Quests
          </Link>
          <Link href="/portal" className="text-sm uppercase tracking-wide text-amber-400 hover:text-amber-300 transition font-semibold">
            Guild Portal
          </Link>
          {gamerTag ? (
            <Link href={`/portal/${gamerTag}`} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 transition px-5 py-2 rounded-full font-bold text-sm uppercase text-[#0F0D1E]">
              🃏 My Card
            </Link>
          ) : (
            <Link href="/register" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 transition px-5 py-2 rounded-full neon-glow">
              <Trophy size={18} />
              Register
            </Link>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>

      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-purple-500/20 px-6 py-6 flex flex-col gap-6 uppercase text-sm tracking-wide z-50">

          <Link href="/">Home</Link>
          <Link href="/leaderboards">Leaderboards</Link>
          <Link href="/tournaments">Tournaments</Link>
          <Link href="/memberships">Memberships</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/blog">News</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/quests" className="font-bold text-yellow-400">
            ⚔ Quest Board
          </Link>
          <Link href="/portal" className="font-bold text-amber-400">
            🃏 Guild Portal
          </Link>

          {gamerTag ? (
            <Link href={`/portal/${gamerTag}`} className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 transition px-5 py-3 rounded-full font-bold text-[#0F0D1E]">
              🃏 My Guild Card
            </Link>
          ) : (
            <Link href="/register" className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 transition px-5 py-3 rounded-full neon-glow">
              <Trophy size={18} />
              Register
            </Link>
          )}

        </div>
      )}

    </nav>
  );
}