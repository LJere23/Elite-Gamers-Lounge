import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.galleryImage.delete({ where: { id } });

    const filePath = path.join(
      process.cwd(),
      "public",
      "gallery",
      "uploads",
      image.filename
    );
    await unlink(filePath).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
