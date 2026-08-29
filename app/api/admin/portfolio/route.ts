import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import { uniqueSlug } from "@/lib/slug";
import {
  assertCenterAccess,
  handleApiError,
  readJson,
  requireAdmin,
  requireField,
  scopeToCenter,
} from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const user = await requireAdmin(PERMISSIONS.PORTFOLIO_VIEW);

    const projects = await prisma.portfolioProject.findMany({
      where: scopeToCenter(user),
      include: {
        center: { select: { name: true, slug: true } },
        expertiseTags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return handleApiError("Admin Portfolio GET", error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin(PERMISSIONS.PORTFOLIO_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    // Role ber-scope OWN_CENTER selalu dipaksa ke center miliknya, apa pun isi body.
    const targetCenterId =
      user.scope === "OWN_CENTER" && user.centerId ? user.centerId : body.centerId;

    requireField(targetCenterId, "Center");
    const title = (requireField(body.title, "Judul proyek") as string).trim();
    assertCenterAccess(user, targetCenterId);

    const slug = await uniqueSlug(
      title,
      async (candidate) =>
        (await prisma.portfolioProject.count({ where: { slug: candidate } })) > 0,
      "proyek"
    );

    const tagIds: string[] = Array.isArray(body.tagIds) ? body.tagIds : [];

    const newProject = await prisma.portfolioProject.create({
      data: {
        centerId: targetCenterId,
        title,
        slug,
        summary: body.summary ?? null,
        caseStudyContent: body.caseStudyContent ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        videoEmbedUrl: body.videoEmbedUrl ?? null,
        isHighlighted: body.isHighlighted ?? false,
        isPublished: body.isPublished ?? true,
        expertiseTags: tagIds.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    });

    await invalidateCachePattern("public:portfolio*");
    await invalidateCachePattern("public:centers*");

    await logActivity({
      actorId: user.id,
      action: "CREATE",
      entityType: "PortfolioProject",
      entityId: newProject.id,
      metadata: { title: newProject.title },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    return handleApiError("Admin Portfolio POST", error);
  }
}
