import { prisma } from "@/lib/prisma";

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "UNPUBLISH";

// "ClientLogo" ditambahkan karena route clients sebelumnya terpaksa mencatat
// dirinya sebagai "Center" — audit trail jadi menunjuk entitas yang salah.
export type ActivityEntity =
  | "Center"
  | "AdminUser"
  | "Role"
  | "ClientLogo"
  | "Article"
  | "PortfolioProject"
  | "ExpertiseTag"
  | "Lead"
  | "SiteSetting";

export async function logActivity({
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorId: string;
  action: ActivityAction;
  entityType: ActivityEntity;
  entityId: string;
  metadata?: unknown;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        // Kolomnya bertipe Json di Prisma. Versi lama menyimpan hasil
        // JSON.stringify sehingga isinya jadi string berisi JSON (double
        // encoded) dan tidak bisa di-query dengan operator JSON Postgres.
        metadata: metadata === undefined ? undefined : (metadata as never),
      },
    });
  } catch (error) {
    // Kegagalan audit trail tidak boleh menggagalkan aksi utama pengguna.
    console.error("[ActivityLog] Gagal mencatat aktivitas:", error);
  }
}
