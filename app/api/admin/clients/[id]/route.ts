import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import { handleApiError, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.CLIENTS_MANAGE);

    const deleted = await prisma.clientLogo.delete({ where: { id: params.id } });

    await invalidateCachePattern("public:centers*");

    await logActivity({
      actorId: user.id,
      action: "DELETE",
      entityType: "ClientLogo",
      entityId: params.id,
      metadata: { name: deleted.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError("Admin Client DELETE", error);
  }
}
