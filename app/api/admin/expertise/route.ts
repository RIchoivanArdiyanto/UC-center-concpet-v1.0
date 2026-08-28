import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  try {
    const tags = await prisma.expertiseTag.findMany({
      include: {
        _count: {
          select: { centers: true, projects: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(tags);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch tags." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actorId = (session.user as any).id;
    const { name, colorHex } = await req.json();

    if (!name) return NextResponse.json({ error: "Nama tag wajib diisi." }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const tag = await prisma.expertiseTag.create({
      data: { name, slug, colorHex },
    });

    await logActivity({
      actorId,
      action: "CREATE",
      entityType: "ExpertiseTag",
      entityId: tag.id,
      metadata: { name: tag.name },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create tag." }, { status: 500 });
  }
}
