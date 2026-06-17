import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// GET is public — blog post detail page
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const { slug } = await params;
    const body = await request.json();

    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const wasPublished = existing.published;
    const nowPublished = body.published ?? existing.published;

    const post = await prisma.blogPost.update({
      where: { slug },
      data: {
        title: body.title ?? existing.title,
        content: body.content ?? existing.content,
        excerpt: body.excerpt ?? existing.excerpt,
        author: body.author ?? existing.author,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
        published: nowPublished,
        publishedAt: nowPublished && !wasPublished ? new Date() : existing.publishedAt,
      },
    });

    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  try {
    const { slug } = await params;
    await prisma.blogPost.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
