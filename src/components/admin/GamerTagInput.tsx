"use client";

import { useEffect, useRef, useState } from "react";

interface PlayerOption {
  id: string;
  gamerTag: string;
  name: string;
  cxpBalance: number;
  membershipTier: string;
}

interface GamerTagInputProps {
  value: string;
  onChange: (gamerTag: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** If provided, the selected player object is also emitted */
  onPlayerSelect?: (player: PlayerOption | null) => void;
}

export default function GamerTagInput({
  value,
  onChange,
  placeholder = "@gamerTag",
  required,
  className,
  onPlayerSelect,
}: GamerTagInputProps) {
  const [players, setPlayers]     = useState<PlayerOption[]>([]);
  const [loaded, setLoaded]       = useState(false);
  const [open, setOpen]           = useState(false);
  const [cursor, setCursor]       = useState(-1);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const listRef                   = useRef<HTMLUListElement>(null);
  const containerRef              = useRef<HTMLDivElement>(null);

  async function loadPlayers() {
    if (loaded) return;
    try {
      const res = await fetch("/api/players");
      if (res.ok) setPlayers(await res.json());
    } catch {}
    setLoaded(true);
  }

  // Close when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = value.replace(/^@/, "").toLowerCase();
  const suggestions = q.length === 0 ? [] : players
    .filter(
      (p) =>
        p.gamerTag.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q)
    )
    .slice(0, 6);

  function selectPlayer(p: PlayerOption) {
    onChange(p.gamerTag);
    onPlayerSelect?.(p);
    setOpen(false);
    setCursor(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && cursor >= 0) {
      e.preventDefault();
      selectPlayer(suggestions[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const item = listRef.current.children[cursor] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [cursor]);

  const TIER_DOT: Record<string, string> = {
    FoundingHero: "bg-yellow-400",
    Legend:       "bg-amber-400",
    Hero:         "bg-purple-400",
    Warrior:      "bg-blue-400",
    Adventurer:   "bg-emerald-400",
    Villager:     "bg-zinc-500",
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        required={required}
        placeholder={placeholder}
        onFocus={() => { loadPlayers(); if (q.length > 0) setOpen(true); }}
        onChange={(e) => {
          onChange(e.target.value);
          onPlayerSelect?.(null);
          setCursor(-1);
          setOpen(e.target.value.replace(/^@/, "").length > 0);
        }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={className}
      />

      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full rounded-2xl border border-white/10 bg-zinc-900 shadow-xl overflow-hidden max-h-56 overflow-y-auto"
        >
          {suggestions.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectPlayer(p); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                  i === cursor ? "bg-cyan-500/20 text-white" : "hover:bg-white/5 text-slate-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${TIER_DOT[p.membershipTier] ?? "bg-zinc-500"}`}
                />
                <span className="text-sm font-bold text-white">@{p.gamerTag}</span>
                <span className="text-xs text-slate-400 truncate">{p.name}</span>
                {p.cxpBalance > 0 && (
                  <span className="ml-auto text-xs text-amber-400 shrink-0">{p.cxpBalance} C-XP</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
