import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import { uniqueSlug } from "@/lib/slug";
import {
  handleApiError,
  readJson,
  requireAdmin,
  requireField,
  scopeToCenter,
} from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { normalizeTeam } from "@/lib/center-team";
import { normalizeServices } from "@/lib/center-services";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const user = await requireAdmin(PERMISSIONS.CENTERS_VIEW);

    const centers = await prisma.center.findMany({
      // Role ber-scope OWN_CENTER dibatasi di level query, bukan sekadar di UI.
      where: scopeToCenter(user, "id"),
      include: {
        expertiseTags: { include: { tag: true } },
        // Tim & layanan ikut dikirim supaya form edit center bisa memuatnya
        // tanpa request tambahan.
        team: { orderBy: { sortOrder: "asc" } },
        services: { orderBy: { sortOrder: "asc" } },
        _count: { select: { projects: true, team: true, leads: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(centers);
  } catch (error) {
    return handleApiError("Admin Centers GET", error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin(PERMISSIONS.CENTERS_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    // Versi lama langsung memanggil name.toLowerCase() — body tanpa `name`
    // melempar TypeError dan dibalas 500, bukan 400.
    const name = requireField(body.name, "Nama center") as string;

    const slug = await uniqueSlug(
      name,
      async (candidate) => (await prisma.center.count({ where: { slug: candidate } })) > 0,
      "center"
    );

    const tagIds: string[] = Array.isArray(body.tagIds) ? body.tagIds : [];
    const team = normalizeTeam(body.team);
    const services = normalizeServices(body.services);

    const newCenter = await prisma.center.create({
      data: {
        name,
        slug,
        tagline: body.tagline ?? null,
        logoUrl: body.logoUrl ?? null,
        heroMediaType: body.heroMediaType || "IMAGE",
        heroMediaUrl: body.heroMediaUrl ?? null,
        aboutContent: body.aboutContent ?? null,
        profilePdfUrl: body.profilePdfUrl ?? null,
        isPublished: body.isPublished ?? true,
        expertiseTags: tagIds.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
        team: team.length ? { create: team } : undefined,
        services: services.length ? { create: services } : undefined,
      },
    });

    await invalidateCachePattern("public:centers*");

    await logActivity({
      actorId: user.id,
      action: "CREATE",
      entityType: "Center",
      entityId: newCenter.id,
      metadata: { name: newCenter.name },
    });

    return NextResponse.json(newCenter, { status: 201 });
  } catch (error) {
    return handleApiError("Admin Centers POST", error);
  }
}
