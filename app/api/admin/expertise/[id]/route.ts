import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import { ApiError, handleApiError, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis.
export const dynamic = "force-dynamic";

/**
 * Hapus tag keahlian.
 *
 * Sebelumnya tag hanya bisa DIBUAT, tidak pernah bisa dihapus — tidak ada
 * endpoint maupun tombolnya (ikon Trash2 sempat diimpor di halaman admin tapi
 * tidak pernah dirender). Akibatnya satu tag salah ketik akan tampil selamanya
 * pada deretan filter di halaman Portfolio publik.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.EXPERTISE_MANAGE);

    const tag = await prisma.expertiseTag.findUnique({
      where: { id: params.id },
      include: { _count: { select: { centers: true, projects: true } } },
    });
    if (!tag) throw new ApiError(404, "Tag tidak ditemukan.");

    // Menghapus tag yang masih menempel akan mencabutnya diam-diam dari setiap
    // center/proyek yang memakainya (relasinya onDelete: Cascade). Lebih baik
    // ditolak dengan angka yang jelas agar admin sadar dampaknya.
    const used = tag._count.centers + tag._count.projects;
    if (used > 0) {
      throw new ApiError(
        409,
        `Tag "${tag.name}" masih dipakai ${tag._count.centers} center dan ` +
          `${tag._count.projects} proyek. Lepaskan dulu dari data tersebut.`
      );
    }

    await prisma.expertiseTag.delete({ where: { id: params.id } });

    await invalidateCachePattern("public:*");

    await logActivity({
      actorId: user.id,
      action: "DELETE",
      entityType: "ExpertiseTag",
      entityId: params.id,
      metadata: { name: tag.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError("Admin Expertise DELETE", error);
  }
}
