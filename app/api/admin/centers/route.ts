import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/redis";
import { logActivity } from "@/lib/activity-log";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const centerId = (session.user as any).centerId;

    // Hard Rule: Filter by centerId at query level for CENTER_ADMIN
    const where = role === "CENTER_ADMIN" && centerId ? { id: centerId } : {};

    const centers = await prisma.center.findMany({
      where,
      include: {
        expertiseTags: { include: { tag: true } },
        _count: { select: { projects: true, team: true, leads: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(centers);
  } catch (error: any) {
    console.error("[Admin Centers GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch centers." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = (session.user as any).id;
    const body = await req.json();
    const { name, tagline, logoUrl, heroMediaType, heroMediaUrl, aboutContent, profilePdfUrl, isPublished, tagIds } = body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newCenter = await prisma.center.create({
      data: {
        name,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        tagline,
        logoUrl,
        heroMediaType: heroMediaType || "IMAGE",
        heroMediaUrl,
        aboutContent,
        profilePdfUrl,
        isPublished: isPublished ?? true,
        expertiseTags: tagIds?.length
          ? {
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
    });

    // Explicit Redis Cache Invalidation
    await invalidateCachePattern("public:centers*");

    // Explicit Activity Log Insertion
    await logActivity({
      actorId,
      action: "CREATE",
      entityType: "Center",
      entityId: newCenter.id,
      metadata: { name: newCenter.name },
    });

    return NextResponse.json(newCenter, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Centers POST Error]:", error);
    return NextResponse.json({ error: "Failed to create center." }, { status: 500 });
  }
}
