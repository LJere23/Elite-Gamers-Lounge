export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import AnnouncementsClient from "./AnnouncementsClient";

export default async function AnnouncementsPage() {
  let announcements: Awaited<ReturnType<typeof prisma.announcement.findMany>> = [];
  try {
    announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB unavailable — show empty state
  }

  return (
    <main className="min-h-screen pt-32 px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <p className="uppercase tracking-[0.3em] text-cyan-400 mb-4">News &amp; Updates</p>
        <h1 className="text-5xl font-black uppercase mb-4">Announcements</h1>
        <p className="text-zinc-400 mb-12">
          Champions crowned, ranks earned, and lounge updates — all in one place.
        </p>
        <AnnouncementsClient announcements={announcements.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
        }))} />
      </div>
    </main>
  );
}
