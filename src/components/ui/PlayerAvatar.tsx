import Image from "next/image";

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: { outer: "w-7 h-7",   text: "text-[10px]" },
  sm: { outer: "w-9 h-9",   text: "text-xs"     },
  md: { outer: "w-11 h-11", text: "text-sm"     },
  lg: { outer: "w-14 h-14", text: "text-base"   },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PlayerAvatar({ name, avatarUrl, size = "md", className = "" }: Props) {
  const { outer, text } = SIZES[size];
  return (
    <div className={`${outer} rounded-full overflow-hidden relative shrink-0 bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center ${className}`}>
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name} fill className="object-cover" unoptimized />
      ) : (
        <span className={`font-bold text-white select-none ${text}`}>{getInitials(name)}</span>
      )}
    </div>
  );
}
