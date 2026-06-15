import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `blog-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const savePath = path.join(process.cwd(), "public", "blog", "uploads", filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(savePath, buffer);

    return NextResponse.json({ url: `/blog/uploads/${filename}` });
  } catch (error) {
    console.error("POST /api/blog/image error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
