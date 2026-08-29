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
  requireField,
} from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    await requireAdmin(PERMISSIONS.USERS_MANAGE);

    const users = await prisma.adminUser.findMany({
      // passwordHash TIDAK PERNAH ikut keluar dari API, walaupun hanya ke admin.
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        centerId: true,
        center: { select: { id: true, name: true } },
        role: { select: { id: true, name: true, slug: true, scope: true, isSystem: true } },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(users);
  } catch (error) {
    return handleApiError("Admin Users GET", error);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(PERMISSIONS.USERS_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    const name = (requireField(body.name, "Nama lengkap") as string).trim();
    const username = (requireField(body.username, "Username") as string).trim().toLowerCase();
    const email = (requireField(body.email, "Email") as string).trim().toLowerCase();
    const roleId = requireField(body.roleId, "Role") as string;
    const password = assertStrongPassword(body.password);

    if (!USERNAME_RE.test(username)) {
      throw new ApiError(
        400,
        "Username 3–32 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip."
      );
    }
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "Format email tidak valid.");

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new ApiError(400, "Role yang dipilih tidak ditemukan.");

    // Role ber-scope OWN_CENTER tanpa center = user yang tidak bisa melihat
    // apa pun. Ditolak di sini supaya tidak jadi akun "hantu" yang
    // membingungkan saat login.
    const centerId = body.centerId || null;
    if (role.scope === "OWN_CENTER" && !centerId) {
      throw new ApiError(400, `Role "${role.name}" wajib ditugaskan ke salah satu center.`);
    }

    const created = await prisma.adminUser.create({
      data: {
        name,
        username,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        roleId,
        centerId: role.scope === "ALL_CENTERS" ? null : centerId,
        isActive: body.isActive ?? true,
      },
      select: { id: true, name: true, username: true, email: true, isActive: true },
    });

    await logActivity({
      actorId: actor.id,
      action: "CREATE",
      entityType: "AdminUser",
      entityId: created.id,
      metadata: { username: created.username, role: role.name },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError("Admin Users POST", error);
  }
}
