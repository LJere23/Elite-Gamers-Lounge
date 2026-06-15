import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guild Portal — Gweru's Gamers Lounge",
  description: "Access your Guild Card, track your XP, and view your rank progression.",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#0F0D1E" }}>
      {children}
    </div>
  );
}
