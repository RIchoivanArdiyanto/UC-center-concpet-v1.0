import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/redis";
import { logActivity } from "@/lib/activity-log";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = (session.user as any).id;
    const role = (session.user as any).role;
    const userCenterId = (session.user as any).centerId;

    const existing = await prisma.portfolioProject.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (role === "CENTER_ADMIN" && userCenterId && existing.centerId !== userCenterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, summary, caseStudyContent, coverImageUrl, videoEmbedUrl, isHighlighted, isPublished, tagIds } = body;

    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.projectExpertise.deleteMany({ where: { projectId: params.id } });
        if (tagIds.length > 0) {
          await tx.projectExpertise.createMany({
            data: tagIds.map((tagId: string) => ({ projectId: params.id, tagId })),
          });
        }
      }

      return tx.portfolioProject.update({
        where: { id: params.id },
        data: {
          title,
          summary,
          caseStudyContent,
          coverImageUrl,
          videoEmbedUrl,
          isHighlighted,
          isPublished,
        },
      });
    });

    await invalidateCachePattern("public:portfolio*");

    await logActivity({
      actorId,
      action: "UPDATE",
      entityType: "PortfolioProject",
      entityId: updated.id,
      metadata: { title: updated.title },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[Admin Portfolio PUT Error]:", error);
    return NextResponse.json({ error: "Failed to update project." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = (session.user as any).id;
    const role = (session.user as any).role;
    const userCenterId = (session.user as any).centerId;

    const existing = await prisma.portfolioProject.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (role === "CENTER_ADMIN" && userCenterId && existing.centerId !== userCenterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.portfolioProject.delete({ where: { id: params.id } });

    await invalidateCachePattern("public:portfolio*");

    await logActivity({
      actorId,
      action: "DELETE",
      entityType: "PortfolioProject",
      entityId: params.id,
      metadata: { title: existing.title },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Portfolio DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete project." }, { status: 500 });
  }
}
