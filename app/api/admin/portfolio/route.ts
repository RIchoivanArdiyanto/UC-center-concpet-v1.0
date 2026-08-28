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

    const where = role === "CENTER_ADMIN" && centerId ? { centerId } : {};

    const projects = await prisma.portfolioProject.findMany({
      where,
      include: {
        center: { select: { name: true, slug: true } },
        expertiseTags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("[Admin Portfolio GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio projects." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = (session.user as any).id;
    const role = (session.user as any).role;
    const userCenterId = (session.user as any).centerId;

    const body = await req.json();
    const { centerId, title, summary, caseStudyContent, coverImageUrl, videoEmbedUrl, isHighlighted, isPublished, tagIds } = body;

    const targetCenterId = role === "CENTER_ADMIN" && userCenterId ? userCenterId : centerId;

    if (!targetCenterId || !title) {
      return NextResponse.json({ error: "Center dan judul proyek wajib diisi." }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newProject = await prisma.portfolioProject.create({
      data: {
        centerId: targetCenterId,
        title,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        summary,
        caseStudyContent,
        coverImageUrl,
        videoEmbedUrl,
        isHighlighted: isHighlighted ?? false,
        isPublished: isPublished ?? true,
        expertiseTags: tagIds?.length
          ? {
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
    });

    // Cache Invalidation
    await invalidateCachePattern("public:portfolio*");

    // Activity Logging
    await logActivity({
      actorId,
      action: "CREATE",
      entityType: "PortfolioProject",
      entityId: newProject.id,
      metadata: { title: newProject.title },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Portfolio POST Error]:", error);
    return NextResponse.json({ error: "Failed to create portfolio project." }, { status: 500 });
  }
}
