import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { uniqueSlug } from "@/lib/slug";
import { handleApiError, readJson, requireAdmin, requireField } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    // Daftar tag dipakai form admin (center & portfolio), jadi tetap butuh sesi.
    // Versi lama membiarkan endpoint ini terbuka tanpa autentikasi.
    await requireAdmin(PERMISSIONS.CENTERS_VIEW);

    const tags = await prisma.expertiseTag.findMany({
      include: { _count: { select: { centers: true, projects: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    return handleApiError("Admin Expertise GET", error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin(PERMISSIONS.EXPERTISE_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    const name = (requireField(body.name, "Nama tag") as string).trim();

    const slug = await uniqueSlug(
      name,
      async (candidate) =>
        (await prisma.expertiseTag.count({ where: { slug: candidate } })) > 0,
      "tag"
    );

    // Nama tag unik di schema — duplikat dipetakan jadi 409 oleh handleApiError,
    // bukan 500 generik seperti sebelumnya.
    const tag = await prisma.expertiseTag.create({
      data: { name, slug, colorHex: body.colorHex ?? null },
    });

    await logActivity({
      actorId: user.id,
      action: "CREATE",
      entityType: "ExpertiseTag",
      entityId: tag.id,
      metadata: { name: tag.name },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    return handleApiError("Admin Expertise POST", error);
  }
}
