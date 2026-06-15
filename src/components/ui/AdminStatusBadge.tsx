interface AdminStatusBadgeProps {
  status: string;
}

export default function AdminStatusBadge({
  status,
}: AdminStatusBadgeProps) {

  const styles: Record<string, string> = {
    active:
      "bg-green-500/20 text-green-300",

    expired:
      "bg-red-500/20 text-red-300",

    pending:
      "bg-yellow-500/20 text-yellow-300",

    completed:
      "bg-cyan-500/20 text-cyan-300",
  };

  return (
    <span
      className={`
        px-3 py-1 rounded-full
        text-xs uppercase tracking-[0.2em]
        font-semibold
        ${styles[status] || "bg-white/10 text-white"}
      `}
    >
      {status}
    </span>
  );
}