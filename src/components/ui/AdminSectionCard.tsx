interface AdminSectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export default function AdminSectionCard({
  title,
  subtitle,
  children,
  rightSlot,
}: AdminSectionCardProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/20">

      {(title || subtitle || rightSlot) && (
        <div className="mb-8 flex items-start justify-between gap-4">

          <div>

            {subtitle && (
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">
                {subtitle}
              </p>
            )}

            {title && (
              <h2 className="mt-3 text-2xl font-black text-white">
                {title}
              </h2>
            )}

          </div>

          {rightSlot}

        </div>
      )}

      {children}

    </div>
  );
}