import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { ApiError, handleApiError, readJson, requireAdmin } from "@/lib/api";
import { PERMISSIONS, parsePermissions, sanitizePermissions } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.ROLES_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    const existing = await prisma.role.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Role tidak ditemukan.");

    const permissions =
      body.permissions === undefined ? undefined : sanitizePermissions(body.permissions);

    // Penjaga anti-kunci-diri-sendiri: kalau admin mencabut izin kelola role
    // dari role yang sedang ia pakai, tidak ada lagi yang bisa mengembalikannya.
    if (
      existing.id === user.roleId &&
      permissions !== undefined &&
      !permissions.includes(PERMISSIONS.ROLES_MANAGE)
    ) {
      throw new ApiError(
        400,
        "Anda tidak boleh mencabut izin 'Kelola role & hak akses' dari role yang sedang Anda pakai."
      );
    }

    // Role sistem boleh diubah hak aksesnya, tapi lingkup dan namanya dikunci
    // supaya arti "Super Admin" tidak berubah diam-diam.
    const updated = await prisma.role.update({
      where: { id: params.id },
      data: {
        name: existing.isSystem ? undefined : body.name?.trim(),
        description: body.description === undefined ? undefined : body.description?.trim() || null,
        scope: existing.isSystem
          ? undefined
          : body.scope === "ALL_CENTERS"
            ? "ALL_CENTERS"
            : body.scope === "OWN_CENTER"
              ? "OWN_CENTER"
              : undefined,
        permissions,
      },
    });

    await logActivity({
      actorId: user.id,
      action: "UPDATE",
      entityType: "Role",
      entityId: updated.id,
      metadata: {
        name: updated.name,
        permissions: parsePermissions(updated.permissions).length,
      },
    });

    return NextResponse.json({ ...updated, permissions: parsePermissions(updated.permissions) });
  } catch (error) {
    return handleApiError("Admin Role PUT", error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.ROLES_MANAGE);

    const existing = await prisma.role.findUnique({
      where: { id: params.id },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) throw new ApiError(404, "Role tidak ditemukan.");

    if (existing.isSystem) {
      throw new ApiError(400, "Role bawaan sistem tidak dapat dihapus.");
    }
    if (existing._count.users > 0) {
      throw new ApiError(
        409,
        `Role masih dipakai ${existing._count.users} user. Pindahkan user tersebut ke role lain dulu.`
      );
    }

    await prisma.role.delete({ where: { id: params.id } });

    await logActivity({
      actorId: user.id,
      action: "DELETE",
      entityType: "Role",
      entityId: params.id,
      metadata: { name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError("Admin Role DELETE", error);
  }
}
