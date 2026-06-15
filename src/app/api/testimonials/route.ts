import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("GET /api/testimonials error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, role, message, sortOrder } = await req.json();
    if (!name || !role || !message) {
      return NextResponse.json({ error: "name, role, and message are required" }, { status: 400 });
    }
    const testimonial = await prisma.testimonial.create({
      data: { name, role, message, sortOrder: sortOrder ?? 0 },
    });
    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error("POST /api/testimonials error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
