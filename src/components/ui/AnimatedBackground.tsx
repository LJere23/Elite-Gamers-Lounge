"use client";

import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// HEX GRID MATH — computed once at module load
// ─────────────────────────────────────────────────────────────────────────────

const R    = 52;
const SQ3  = Math.sqrt(3);
const HEXH = R * SQ3;
const DX   = R * 1.5;   // horizontal step (flat-top)
const DY   = HEXH;      // vertical step

const VW   = 1920;
const VH   = 1080;
const COLS = Math.ceil((VW + R * 2) / DX) + 2;
const ROWS = Math.ceil((VH + HEXH)  / DY) + 2;

type Hex = { cx: number; cy: number; col: number; row: number; idx: number };

const ALL_HEXES: Hex[] = [];
for (let c = 0; c < COLS; c++) {
  for (let r = 0; r < ROWS; r++) {
    ALL_HEXES.push({
      cx:  c * DX - R,
      cy:  r * DY + (c % 2 === 1 ? DY / 2 : 0) - HEXH / 2,
      col: c,
      row: r,
      idx: ALL_HEXES.length,
    });
  }
}

// Fast O(1) lookup: grid[col][row] → hex
const GRID: Hex[][] = Array.from({ length: COLS }, () => []);
for (const h of ALL_HEXES) GRID[h.col][h.row] = h;

const GLOW_RADIUS = DX * 2.4; // how far (in SVG units) the mouse illuminates

// ~32 cells that auto-pulse even without mouse interaction
const AUTO_PULSE = ALL_HEXES
  .filter((_, i) => i % 11 === 3 || i % 13 === 8)
  .slice(0, 34);

const GLOW_ANIMS = ["hex-cyan", "hex-purple", "hex-green"] as const;

function hexPoints(cx: number, cy: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

// Return candidate hexes around a grid coordinate (O(neighbourhood), ~25 checks)
function neighbours(mx: number, my: number): Hex[] {
  const approxCol = Math.round((mx + R) / DX);
  const approxRow = Math.round((my + HEXH / 2) / DY);
  const span = Math.ceil(GLOW_RADIUS / Math.min(DX, DY)) + 1;
  const result: Hex[] = [];
  for (let dc = -span; dc <= span; dc++) {
    const col = approxCol + dc;
    if (col < 0 || col >= COLS) continue;
    for (let dr = -span; dr <= span; dr++) {
      const row = approxRow + dr;
      if (row < 0 || row >= ROWS) continue;
      const h = GRID[col]?.[row];
      if (h) result.push(h);
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────

const STYLE = `
@keyframes grid-breathe {
  0%,100% { opacity: 0.6; }
  50%     { opacity: 1;   }
}
@keyframes hex-cyan {
  0%,100% { fill: rgba(0,240,255,0);    stroke: rgba(0,240,255,0.06); }
  40%,60% { fill: rgba(0,240,255,0.16); stroke: rgba(0,240,255,0.6); }
}
@keyframes hex-purple {
  0%,100% { fill: rgba(139,92,246,0);    stroke: rgba(139,92,246,0.06); }
  40%,60% { fill: rgba(139,92,246,0.16); stroke: rgba(139,92,246,0.6); }
}
@keyframes hex-green {
  0%,100% { fill: rgba(0,255,136,0);    stroke: rgba(0,255,136,0.06); }
  40%,60% { fill: rgba(0,255,136,0.16); stroke: rgba(0,255,136,0.6); }
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AnimatedBackground() {
  const svgRef   = useRef<SVGSVGElement>(null);
  const polyRefs = useRef<Map<number, SVGPolygonElement>>(new Map());
  const active   = useRef<Set<number>>(new Set());

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    let raf = 0;

    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Convert client → SVG viewBox coordinates
        const ctm = svg!.getScreenCTM();
        if (!ctm) return;
        const pt = svg!.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const { x: mx, y: my } = pt.matrixTransform(ctm.inverse());

        const nextActive = new Set<number>();

        // Light up hexes within radius — only check neighbours (~25 hexes)
        for (const h of neighbours(mx, my)) {
          const dist = Math.hypot(h.cx - mx, h.cy - my);
          if (dist >= GLOW_RADIUS) continue;

          nextActive.add(h.idx);
          const t   = 1 - dist / GLOW_RADIUS;          // 1 at centre, 0 at edge
          const el  = polyRefs.current.get(h.idx);
          if (!el) continue;

          el.style.fill         = `rgba(0,240,255,${(t * 0.28).toFixed(3)})`;
          el.style.stroke       = `rgba(0,240,255,${(0.06 + t * 0.88).toFixed(3)})`;
          el.style.strokeWidth  = `${(1 + t * 1.5).toFixed(2)}`;
        }

        // Reset hexes that left the radius — CSS transition fades them out
        for (const idx of active.current) {
          if (nextActive.has(idx)) continue;
          const el = polyRefs.current.get(idx);
          if (!el) continue;
          el.style.fill        = "";
          el.style.stroke      = "";
          el.style.strokeWidth = "";
        }

        active.current = nextActive;
      });
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: "grid-breathe 8s ease-in-out infinite" }}
        >
          {/* ── Base grid — all cells, faint static stroke ── */}
          {ALL_HEXES.map((h) => (
            <polygon
              key={h.idx}
              ref={(el) => {
                if (el) polyRefs.current.set(h.idx, el);
                else    polyRefs.current.delete(h.idx);
              }}
              points={hexPoints(h.cx, h.cy)}
              fill="none"
              stroke="rgba(0,240,255,0.055)"
              strokeWidth="1"
              style={{
                // smooth fade-out when cursor leaves
                transition: "fill 0.5s ease-out, stroke 0.4s ease-out, stroke-width 0.4s ease-out",
              }}
            />
          ))}

          {/* ── Auto-pulsing cells (random glow when idle) ── */}
          {AUTO_PULSE.map((h) => {
            const anim  = GLOW_ANIMS[h.idx % 3];
            const dur   = (3 + (h.idx * 0.31) % 4.2).toFixed(1);
            const delay = ((h.idx * 0.73) % 8).toFixed(1);
            return (
              <polygon
                key={`g${h.idx}`}
                points={hexPoints(h.cx, h.cy)}
                fill="none"
                stroke="rgba(0,240,255,0.055)"
                strokeWidth="1"
                style={{ animation: `${anim} ${dur}s ease-in-out ${delay}s infinite` }}
              />
            );
          })}
        </svg>
      </div>
    </>
  );
}
