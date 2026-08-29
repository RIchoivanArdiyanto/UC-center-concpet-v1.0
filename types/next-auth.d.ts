import type { DefaultSession } from "next-auth";

// Tipe tambahan pada sesi & JWT. Sebelumnya setiap pembacaan role/centerId
// memakai cast `(session.user as any)` yang mematikan pengecekan TypeScript —
// salah ketik nama field baru ketahuan saat runtime, bukan saat build.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      centerId: string | null;
      roleId: string;
      roleName: string;
      scope: "ALL_CENTERS" | "OWN_CENTER";
      permissions: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    centerId?: string | null;
    roleId?: string;
    roleName?: string;
    scope?: "ALL_CENTERS" | "OWN_CENTER";
    permissions?: string[];
  }
}
