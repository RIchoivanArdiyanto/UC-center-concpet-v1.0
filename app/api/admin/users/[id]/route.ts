import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  ApiError,
  assertStrongPassword,
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
    const actor = await requireAdmin(PERMISSIONS.USERS_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    const existing = await prisma.adminUser.findUnique({
      where: { id: params.id },
      include: { role: true },
    });
    if (!existing) throw new ApiError(404, "User tidak ditemukan.");

    // Penjaga anti-kunci-diri-sendiri: menonaktifkan atau menurunkan role akun
    // sendiri bisa membuat panel tidak punya admin yang bisa masuk lagi.
    const isSelf = existing.id === actor.id;
    if (isSelf && body.isActive === false) {
      throw new ApiError(400, "Anda tidak dapat menonaktifkan akun Anda sendiri.");
    }
    if (isSelf && body.roleId && body.roleId !== existing.roleId) {
      throw new ApiError(400, "Anda tidak dapat mengubah role akun Anda sendiri.");
    }

    let roleId: string | undefined;
    let centerId: string | null | undefined;

    if (body.roleId && body.roleId !== existing.roleId) {
      const role = await prisma.role.findUnique({ where: { id: body.roleId } });
      if (!role) throw new ApiError(400, "Role yang dipilih tidak ditemukan.");
      roleId = role.id;
      centerId =
        role.scope === "ALL_CENTERS" ? null : (body.centerId ?? existing.centerId ?? null);
      if (role.scope === "OWN_CENTER" && !centerId) {
        throw new ApiError(400, `Role "${role.name}" wajib ditugaskan ke salah satu center.`);
      }
    } else if (body.centerId !== undefined) {
      centerId = existing.role.scope === "ALL_CENTERS" ? null : body.centerId || null;
      if (existing.role.scope === "OWN_CENTER" && !centerId) {
        throw new ApiError(400, "User dengan role ini wajib ditugaskan ke salah satu center.");
      }
    }

    // Ganti password bersifat opsional: field kosong berarti "jangan diubah".
    const passwordHash = body.password
      ? await bcrypt.hash(assertStrongPassword(body.password), 12)
      : undefined;

    const updated = await prisma.adminUser.update({
      where: { id: params.id },
      data: {
        name: body.name?.trim(),
        email: body.email?.trim().toLowerCase(),
        username: body.username?.trim().toLowerCase(),
        isActive: body.isActive,
        roleId,
        centerId,
        passwordHash,
      },
      select: { id: true, name: true, username: true, email: true, isActive: true },
    });

    await logActivity({
      actorId: actor.id,
      action: "UPDATE",
      entityType: "AdminUser",
      entityId: updated.id,
      metadata: {
        username: updated.username,
        passwordReset: Boolean(passwordHash),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError("Admin User PUT", error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAdmin(PERMISSIONS.USERS_MANAGE);

    if (params.id === actor.id) {
      throw new ApiError(400, "Anda tidak dapat menghapus akun Anda sendiri.");
    }

    const existing = await prisma.adminUser.findUnique({
      where: { id: params.id },
      include: { role: true },
    });
    if (!existing) throw new ApiError(404, "User tidak ditemukan.");

    // Jangan sampai sistem kehilangan admin terakhir yang bisa mengelola user.
    if (existing.role.permissions.includes(PERMISSIONS.USERS_MANAGE)) {
      const remaining = await prisma.adminUser.count({
        where: {
          isActive: true,
          id: { not: params.id },
          role: { permissions: { has: PERMISSIONS.USERS_MANAGE } },
        },
      });
      if (remaining === 0) {
        throw new ApiError(
          400,
          "Ini satu-satunya user aktif yang dapat mengelola user lain. Buat penggantinya dulu."
        );
      }
    }

    await prisma.adminUser.delete({ where: { id: params.id } });

    await logActivity({
      actorId: actor.id,
      action: "DELETE",
      entityType: "AdminUser",
      entityId: params.id,
      metadata: { username: existing.username },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError("Admin User DELETE", error);
  }
}
