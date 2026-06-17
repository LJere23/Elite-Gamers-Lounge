import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { requireAdmin } from "@/lib/adminAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.galleryImage.delete({ where: { id } });

    if (image.filename.startsWith("https://")) {
      await del(image.filename).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    const body = await request.json();
    const image = await prisma.galleryImage.update({
      where: { id },
      data: {
        caption: body.caption ?? undefined,
        sortOrder: body.sortOrder ?? undefined,
      },
    });
    return NextResponse.json(image);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
