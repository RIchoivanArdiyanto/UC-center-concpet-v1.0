import { NextResponse } from "next/server";
import { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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


const ALLOWED_STATUS = Object.values(LeadStatus) as string[];

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.LEADS_MANAGE);

    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Lead tidak ditemukan.");
    assertCenterAccess(user, existing.centerId);

    const { status } = await readJson<{ status?: string }>(req);

    // Status di luar enum sebelumnya lolos ke Prisma dan muncul sebagai 500
    // generik. Sekarang divalidasi lebih dulu.
    if (!status || !ALLOWED_STATUS.includes(status)) {
      throw new ApiError(400, `Status harus salah satu dari: ${ALLOWED_STATUS.join(", ")}.`);
    }

    const updated = await prisma.lead.update({
      where: { id: params.id },
      data: {
        status: status as LeadStatus,
        // handledById menunjuk AdminUser sungguhan. Dengan login backdoor lama
        // (id fiktif) update ini selalu gagal foreign key.
        handledById: user.id,
      },
    });

    await logActivity({
      actorId: user.id,
      action: "UPDATE",
      entityType: "Lead",
      entityId: updated.id,
      metadata: { status: updated.status, name: updated.name },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError("Admin Lead PUT", error);
  }
}
