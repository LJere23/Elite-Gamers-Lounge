import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers.map((h) => {
        const v = String(row[h] ?? "");
        return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(",")
    );
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");
  const type   = searchParams.get("type") || "all"; // sessions | wifi | tournaments | all
  const format = searchParams.get("format") || "json"; // json | csv

  const fromDate = from ? new Date(from) : new Date(0);
  const toDate   = to   ? new Date(to)   : new Date();
  // include the whole end day
  toDate.setHours(23, 59, 59, 999);

  const rows: Record<string, unknown>[] = [];

  if (type === "sessions" || type === "all") {
    const sessions = await prisma.session.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      orderBy: { createdAt: "desc" },
    });
    for (const s of sessions) {
      rows.push({
        type:      "session",
        date:      s.createdAt.toISOString().slice(0, 10),
        time:      s.createdAt.toISOString().slice(11, 16),
        player:    s.playerName,
        detail:    `${s.game} on ${s.deviceName}`,
        hours:     s.durationHours.toFixed(2),
        revenue:   s.totalPrice.toFixed(2),
        status:    s.status,
        id:        s.id,
      });
    }
  }

  if (type === "wifi" || type === "all") {
    const wifiSessions = await prisma.wifiSession.findMany({
      where: { startedAt: { gte: fromDate, lte: toDate } },
      orderBy: { startedAt: "desc" },
    });
    for (const w of wifiSessions) {
      rows.push({
        type:      "wifi",
        date:      w.startedAt.toISOString().slice(0, 10),
        time:      w.startedAt.toISOString().slice(11, 16),
        player:    w.name,
        detail:    `${w.device} — ${w.station}`,
        hours:     w.durationHours.toFixed(2),
        revenue:   w.priceUsd.toFixed(2),
        status:    w.status,
        id:        w.id,
      });
    }
  }

  if (type === "tournaments" || type === "all") {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: "completed",
        completedAt: { gte: fromDate, lte: toDate },
      },
      include: { _count: { select: { tournamentEntries: true } } },
      orderBy: { completedAt: "desc" },
    });
    for (const t of tournaments) {
      const revenue = (t.entryFee || 0) * t._count.tournamentEntries;
      rows.push({
        type:      "tournament",
        date:      t.completedAt ? t.completedAt.toISOString().slice(0, 10) : "",
        time:      t.completedAt ? t.completedAt.toISOString().slice(11, 16) : "",
        player:    t.winnerName || "—",
        detail:    `${t.name} (${t.game}) — ${t._count.tournamentEntries} entrants @ $${(t.entryFee || 0).toFixed(2)}`,
        hours:     "",
        revenue:   revenue.toFixed(2),
        status:    "completed",
        id:        t.id,
      });
    }
  }

  // sort all rows by date desc
  rows.sort((a, b) => {
    const da = `${a.date} ${a.time}`;
    const db = `${b.date} ${b.time}`;
    return db < da ? -1 : db > da ? 1 : 0;
  });

  const totalRevenue = rows.reduce((s, r) => s + parseFloat(String(r.revenue) || "0"), 0);

  if (format === "csv") {
    const csv = toCSV(rows);
    const filename = `report_${from || "all"}_${to || "now"}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({
    from:  fromDate.toISOString(),
    to:    toDate.toISOString(),
    type,
    count: rows.length,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    rows,
  });
}
