import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { slugify } from "@/lib/slug";
import { handleApiError, readJson, requireAdmin, requireField } from "@/lib/api";
import { PERMISSIONS, parsePermissions, sanitizePermissions } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    // Daftar role juga dibutuhkan form "Tambah User", jadi cukup salah satu izin.
    const user = await requireAdmin();
    if (
      !user.permissions.includes(PERMISSIONS.ROLES_MANAGE) &&
      !user.permissions.includes(PERMISSIONS.USERS_MANAGE)
    ) {
      return NextResponse.json({ error: "Tidak memiliki hak akses." }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });

    // `permissions` bertipe Json di MySQL, jadi dinormalkan jadi array string
    // sebelum dikirim — panel admin mengharapkannya sudah berupa array.
    return NextResponse.json(
      roles.map((role) => ({ ...role, permissions: parsePermissions(role.permissions) }))
    );
  } catch (error) {
    return handleApiError("Admin Roles GET", error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin(PERMISSIONS.ROLES_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    const name = (requireField(body.name, "Nama role") as string).trim();
    const scope = body.scope === "ALL_CENTERS" ? "ALL_CENTERS" : "OWN_CENTER";
    const permissions = sanitizePermissions(body.permissions);

    const role = await prisma.role.create({
      data: {
        name,
        slug: slugify(name) || `role-${Date.now()}`,
        description: body.description?.trim() || null,
        scope,
        // Disimpan sebagai Json; sanitizePermissions sudah membuang kunci
        // yang tidak dikenal sebelum sampai ke sini.
        permissions,
        // Role buatan admin tidak pernah menjadi role sistem, jadi selalu bisa
        // dihapus lagi bila salah buat.
        isSystem: false,
      },
    });

    await logActivity({
      actorId: user.id,
      action: "CREATE",
      entityType: "Role",
      entityId: role.id,
      metadata: { name: role.name, scope: role.scope, permissions: permissions.length },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return handleApiError("Admin Roles POST", error);
  }
}
