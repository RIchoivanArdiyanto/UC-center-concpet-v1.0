import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import {
  assertCenterAccess,
  handleApiError,
  readJson,
  requireAdmin,
} from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import { normalizeTeam } from "@/lib/center-team";
import { normalizeServices } from "@/lib/center-services";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.CENTERS_MANAGE);
    assertCenterAccess(user, params.id);

    const body = await readJson<Record<string, any>>(req);
    const tagIds: string[] | undefined = Array.isArray(body.tagIds) ? body.tagIds : undefined;
    // `undefined` berarti form tidak mengirim tim sama sekali (mis. toggle
    // publish dari daftar) — tim yang ada tidak boleh ikut terhapus.
    const team = Array.isArray(body.team) ? normalizeTeam(body.team) : undefined;
    const services = Array.isArray(body.services) ? normalizeServices(body.services) : undefined;

    const updatedCenter = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.centerExpertise.deleteMany({ where: { centerId: params.id } });
        if (tagIds.length > 0) {
          await tx.centerExpertise.createMany({
            data: tagIds.map((tagId) => ({ centerId: params.id, tagId })),
            skipDuplicates: true,
          });
        }
      }

      if (team !== undefined) {
        // TeamMember tidak punya kolom unique alami, jadi ditulis ulang penuh.
        await tx.teamMember.deleteMany({ where: { centerId: params.id } });
        if (team.length > 0) {
          await tx.teamMember.createMany({
            data: team.map((t) => ({ ...t, centerId: params.id })),
          });
        }
      }

      if (services !== undefined) {
        // CenterService juga tidak punya kolom unique alami, jadi ditulis
        // ulang penuh seperti tim.
        await tx.centerService.deleteMany({ where: { centerId: params.id } });
        if (services.length > 0) {
          await tx.centerService.createMany({
            data: services.map((item) => ({ ...item, centerId: params.id })),
          });
        }
      }

      // Field yang tidak dikirim tetap `undefined` sehingga diabaikan Prisma —
      // ini yang membuat toggle "publish" dari daftar center (hanya mengirim
      // isPublished) tidak menghapus field lain.
      return tx.center.update({
        where: { id: params.id },
        data: {
          name: body.name,
          tagline: body.tagline,
          logoUrl: body.logoUrl,
          heroMediaType: body.heroMediaType,
          heroMediaUrl: body.heroMediaUrl,
          aboutContent: body.aboutContent,
          profilePdfUrl: body.profilePdfUrl,
          isPublished: body.isPublished,
        },
      });
    });

    await invalidateCachePattern("public:centers*");

    await logActivity({
      actorId: user.id,
      action: "UPDATE",
      entityType: "Center",
      entityId: updatedCenter.id,
      metadata: { name: updatedCenter.name },
    });

    return NextResponse.json(updatedCenter);
  } catch (error) {
    return handleApiError("Admin Center PUT", error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.CENTERS_MANAGE);
    assertCenterAccess(user, params.id);

    const deletedCenter = await prisma.center.delete({ where: { id: params.id } });

    await invalidateCachePattern("public:centers*");
    await invalidateCachePattern("public:portfolio*");

    await logActivity({
      actorId: user.id,
      action: "DELETE",
      entityType: "Center",
      entityId: params.id,
      metadata: { name: deletedCenter.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError("Admin Center DELETE", error);
  }
}
