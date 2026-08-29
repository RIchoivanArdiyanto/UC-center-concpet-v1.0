// ============================================================================
//  Helper bersama untuk seluruh route handler di app/api/**.
//
//  Sebelumnya setiap route mengulang blok yang sama: ambil session, cek null,
//  balas 401, baca role lewat `(session.user as any)`, lalu try/catch besar yang
//  memetakan SEMUA error jadi 500 dengan pesan generik ("Failed to create tag.")
//  — termasuk yang seharusnya 409 (duplikat) atau 404. Modul ini menyatukannya
//  sekaligus menegakkan permission per-endpoint.
// ============================================================================
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import type { Permission } from "@/lib/permissions";

export type AdminSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  username: string;
  centerId: string | null;
  roleId: string;
  roleName: string;
  scope: "ALL_CENTERS" | "OWN_CENTER";
  permissions: string[];
};

/** Error dengan status HTTP yang sengaja dipilih; ditangkap `handleApiError`. */
export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Pastikan request datang dari admin yang login DAN punya permission yang
 * dibutuhkan. Permission dicek di server — menyembunyikan menu di sidebar saja
 * tidak menghalangi siapa pun memanggil endpoint-nya langsung.
 */
export async function requireAdmin(...required: Permission[]): Promise<AdminSessionUser> {
  const session = await getServerSession(authOptions);
  const user = session?.user as AdminSessionUser | undefined;

  if (!user?.id) {
    throw new ApiError(401, "Sesi tidak valid. Silakan login kembali.");
  }

  const missing = required.filter((p) => !user.permissions?.includes(p));
  if (missing.length > 0) {
    throw new ApiError(403, "Anda tidak memiliki hak akses untuk tindakan ini.");
  }

  return user;
}

export function hasPermission(user: AdminSessionUser, permission: Permission): boolean {
  return user.permissions?.includes(permission) ?? false;
}

/**
 * Filter `where` untuk membatasi role ber-scope OWN_CENTER ke center miliknya.
 * `field` adalah kolom penunjuk center pada model terkait ("id" untuk Center,
 * "centerId" untuk model anaknya).
 */
export function scopeToCenter(
  user: AdminSessionUser,
  field: "id" | "centerId" = "centerId"
): Record<string, string> {
  if (user.scope === "OWN_CENTER" && user.centerId) {
    return { [field]: user.centerId };
  }
  // Scope OWN_CENTER tanpa centerId = belum ditugaskan ke center mana pun.
  // Dikembalikan filter yang tidak pernah cocok, bukan `{}` yang justru
  // membuka seluruh data.
  if (user.scope === "OWN_CENTER") {
    return { [field]: "__unassigned__" };
  }
  return {};
}

/** Tolak akses ke center di luar milik user ber-scope OWN_CENTER. */
export function assertCenterAccess(user: AdminSessionUser, centerId: string | null): void {
  if (user.scope !== "OWN_CENTER") return;
  if (!user.centerId || user.centerId !== centerId) {
    throw new ApiError(403, "Akses dibatasi pada center yang ditugaskan kepada Anda.");
  }
}

/** Wajib ada dan bukan string kosong. */
export function requireField<T>(value: T | undefined | null, label: string): T {
  if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
    throw new ApiError(400, `${label} wajib diisi.`);
  }
  return value;
}

/**
 * Aturan password minimum untuk akun admin. Ditaruh di sini (bukan di file
 * route) karena Next.js App Router hanya mengizinkan handler HTTP diekspor dari
 * route.ts, dan aturan ini dipakai oleh endpoint create user maupun reset
 * password.
 */
export function assertStrongPassword(password: unknown): string {
  if (typeof password !== "string" || password.length < 8) {
    throw new ApiError(400, "Password minimal 8 karakter.");
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new ApiError(400, "Password harus memuat huruf kecil, huruf besar, dan angka.");
  }
  return password;
}

/** Baca body JSON; body kosong / bukan JSON dibalas 400, bukan 500. */
export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Body request harus berupa JSON yang valid.");
  }
}

/**
 * Satu-satunya tempat error route diterjemahkan jadi HTTP response.
 * Memetakan kode error Prisma yang umum ke status yang benar.
 */
export function handleApiError(scope: string, error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = (error.meta?.target as string[] | undefined)?.join(", ");
        return NextResponse.json(
          {
            error: target
              ? `Nilai ${target} sudah dipakai. Gunakan yang lain.`
              : "Data dengan nilai unik yang sama sudah ada.",
          },
          { status: 409 }
        );
      }
      case "P2003":
        return NextResponse.json(
          { error: "Data terkait tidak ditemukan atau masih dipakai record lain." },
          { status: 409 }
        );
      case "P2025":
        return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
    }
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    console.error(`[${scope}] Database tidak dapat dihubungi:`, error);
    return NextResponse.json(
      { error: "Database sedang tidak dapat dihubungi. Coba lagi sebentar lagi." },
      { status: 503 }
    );
  }

  console.error(`[${scope}]`, error);
  return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
}
