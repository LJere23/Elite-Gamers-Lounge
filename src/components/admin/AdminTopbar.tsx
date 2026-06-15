"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

export default function AdminTopbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="h-16 md:h-20 border-b border-white/10 bg-black/40 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition"
        >
          <Menu size={18} />
        </button>

        <div className="hidden sm:block">
          <p className="uppercase tracking-[0.25em] text-cyan-400 text-xs">Receptionist System</p>
          <h2 className="text-lg md:text-xl font-black leading-tight">Gaming Lounge Operations</h2>
        </div>
        <div className="sm:hidden">
          <h2 className="text-base font-black">EGL OS</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-zinc-400 text-sm">Online</span>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          className="h-9 w-9 rounded-xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-400/30 transition"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
