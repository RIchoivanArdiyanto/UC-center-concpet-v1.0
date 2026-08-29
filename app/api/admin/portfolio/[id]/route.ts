import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import {
  ApiError,
  assertCenterAccess,
  handleApiError,
  readJson,
  requireAdmin,
} from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.PORTFOLIO_MANAGE);

    const existing = await prisma.portfolioProject.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Proyek tidak ditemukan.");
    assertCenterAccess(user, existing.centerId);

    const body = await readJson<Record<string, any>>(req);
    const tagIds: string[] | undefined = Array.isArray(body.tagIds) ? body.tagIds : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.projectExpertise.deleteMany({ where: { projectId: params.id } });
        if (tagIds.length > 0) {
          await tx.projectExpertise.createMany({
            data: tagIds.map((tagId) => ({ projectId: params.id, tagId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.portfolioProject.update({
        where: { id: params.id },
        data: {
          title: body.title,
          summary: body.summary,
          caseStudyContent: body.caseStudyContent,
          coverImageUrl: body.coverImageUrl,
          videoEmbedUrl: body.videoEmbedUrl,
          isHighlighted: body.isHighlighted,
          isPublished: body.isPublished,
        },
      });
    });

    await invalidateCachePattern("public:portfolio*");
    await invalidateCachePattern("public:centers*");

    await logActivity({
      actorId: user.id,
      action: "UPDATE",
      entityType: "PortfolioProject",
      entityId: updated.id,
      metadata: { title: updated.title },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError("Admin Portfolio PUT", error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.PORTFOLIO_MANAGE);

    const existing = await prisma.portfolioProject.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Proyek tidak ditemukan.");
    assertCenterAccess(user, existing.centerId);

    await prisma.portfolioProject.delete({ where: { id: params.id } });

    await invalidateCachePattern("public:portfolio*");
    await invalidateCachePattern("public:centers*");

    await logActivity({
      actorId: user.id,
      action: "DELETE",
      entityType: "PortfolioProject",
      entityId: params.id,
      metadata: { title: existing.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError("Admin Portfolio DELETE", error);
  }
}
