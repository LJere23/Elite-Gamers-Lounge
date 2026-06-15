import { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
}

export default function GlowCard({
  children,
}: GlowCardProps) {
  return (
    <div className="rounded-3xl bg-white/5 border border-purple-500/20 p-8 hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition duration-300">
      {children}
    </div>
  );
}