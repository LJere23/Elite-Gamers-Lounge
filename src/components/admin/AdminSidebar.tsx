"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LayoutDashboard, Monitor, Trophy, Users, Wifi, CreditCard, BarChart3, Settings, Gamepad2, Cpu, Star, Megaphone, Image, BookOpen, MessageSquareQuote, FileText } from "lucide-react";

const links = [
  { label: "Dashboard",    href: "/admin/dashboard",    icon: LayoutDashboard },
  { label: "Sessions",     href: "/admin/sessions",     icon: Monitor },
  { label: "Tournaments",  href: "/admin/tournaments",  icon: Trophy },
  { label: "Players",      href: "/admin/players",      icon: Users },
  { label: "WiFi",         href: "/admin/wifi",         icon: Wifi },
  { label: "Memberships",  href: "/admin/memberships",  icon: CreditCard },
  { label: "Loyalty & XP", href: "/admin/loyalty",      icon: Star },
  { label: "Analytics",    href: "/admin/analytics",    icon: BarChart3 },
  { label: "Reports",      href: "/admin/reports",      icon: FileText },
  { label: "Announcements",href: "/admin/announcements",icon: Megaphone },
  { label: "Gallery",      href: "/admin/gallery",      icon: Image },
  { label: "Blog",         href: "/admin/blog",         icon: BookOpen },
  { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
  { label: "Settings",     href: "/admin/settings",     icon: Settings },
  { label: "Devices",      href: "/admin/devices",      icon: Cpu },
  { label: "Games",        href: "/admin/games",        icon: Gamepad2 },
];

function NavLinks({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNav}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-semibold ${
              active ? "bg-cyan-400 text-black" : "hover:bg-zinc-900 text-zinc-300"
            }`}
          >
            <Icon size={18} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Logo() {
  return (
    <div className="h-20 border-b border-white/10 flex items-center px-6 gap-3 shrink-0">
      <Gamepad2 className="text-cyan-400" size={22} />
      <div>
        <h1 className="font-black text-base">EGL OS</h1>
        <p className="text-zinc-500 text-xs">Admin Panel</p>
      </div>
    </div>
  );
}

export default function AdminSidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-64 xl:w-72 border-r border-white/10 bg-zinc-950 flex-col shrink-0">
        <Logo />
        <NavLinks />
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          {/* Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-zinc-950 border-r border-white/10 flex flex-col h-full shadow-2xl">
            <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-3">
                <Gamepad2 className="text-cyan-400" size={22} />
                <div>
                  <h1 className="font-black text-base">EGL OS</h1>
                  <p className="text-zinc-500 text-xs">Admin Panel</p>
                </div>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <NavLinks onNav={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
