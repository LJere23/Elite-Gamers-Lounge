import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

async function getPlayer() {
  const cookieStore = await cookies();
  const playerId = cookieStore.get("portal_player_id")?.value;
  if (!playerId) return null;
  return prisma.player.findUnique({ where: { id: playerId } });
}

export async function POST(req: NextRequest) {
  try {
    const player = await getPlayer();
    if (!player) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPG, PNG, or WebP." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
    }

    // Delete old avatar file if it exists
    if (player.avatarUrl) {
      const oldPath = path.join(process.cwd(), "public", player.avatarUrl);
      await unlink(oldPath).catch(() => {});
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `avatar-${player.id}-${Date.now()}.${ext}`;
    const savePath = path.join(process.cwd(), "public", "avatars", filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(savePath, buffer);

    const avatarUrl = `/avatars/${filename}`;
    await prisma.player.update({ where: { id: player.id }, data: { avatarUrl } });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("POST /api/portal/avatar error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const player = await getPlayer();
    if (!player) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    if (player.avatarUrl) {
      const filePath = path.join(process.cwd(), "public", player.avatarUrl);
      await unlink(filePath).catch(() => {});
    }

    await prisma.player.update({ where: { id: player.id }, data: { avatarUrl: null } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/portal/avatar error:", error);
    return NextResponse.json({ error: "Failed to remove avatar" }, { status: 500 });
  }
}
