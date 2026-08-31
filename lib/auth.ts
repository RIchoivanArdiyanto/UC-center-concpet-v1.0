import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/cache";
import { parsePermissions } from "@/lib/permissions";

/**
 * NEXTAUTH_SECRET tidak lagi punya nilai cadangan hardcoded. Rahasia yang
 * ikut ter-commit di source sama saja dengan tidak ada rahasia: siapa pun yang
 * membaca repo bisa menempa cookie sesi admin. Di produksi aplikasi menolak
 * melayani request tanpa env ini; saat `npm run dev` dipakai nilai khusus
 * development yang jelas tidak boleh dipakai di server.
 */
function resolveSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET wajib diisi minimal 32 karakter di produksi. Generate dengan: openssl rand -base64 32"
    );
  }
  return "dev-only-insecure-secret-do-not-use-in-production";
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email atau Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const identifier = credentials?.identifier?.trim().toLowerCase();
        const password = credentials?.password;
        if (!identifier || !password) return null;

        // Rate limit di lapisan autentikasi, bukan cuma di route terpisah yang
        // tidak dipakai form login. Tanpa ini password admin bisa ditebak
        // sebanyak-banyaknya lewat /api/auth/callback/credentials.
        const ip =
          req?.headers?.["x-forwarded-for"]?.toString().split(",")[0].trim() || "unknown";
        const { allowed } = await checkRateLimit(`login:${ip}:${identifier}`, 8, 900);
        if (!allowed) {
          throw new Error("Terlalu banyak percobaan login. Coba lagi dalam 15 menit.");
        }

        // Login boleh pakai email ATAU username.
        const user = await prisma.adminUser.findFirst({
          where: {
            isActive: true,
            OR: [{ email: identifier }, { username: identifier }],
          },
          include: { role: true },
        });

        // Tetap jalankan bcrypt walau user tidak ada supaya waktu respons untuk
        // "user tidak ada" dan "password salah" tidak bisa dibedakan.
        const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu";
        const isValid = await bcrypt.compare(password, hash);
        if (!user || !isValid) return null;

        await prisma.adminUser
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => {});

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          centerId: user.centerId,
          roleId: user.roleId,
          roleName: user.role.name,
          roleSlug: user.role.slug,
          scope: user.role.scope,
          permissions: parsePermissions(user.role.permissions),
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.id = u.id as string;
        token.username = u.username as string;
        token.centerId = u.centerId as string | null;
        token.roleId = u.roleId as string;
        token.roleName = u.roleName as string;
        token.scope = u.scope as "ALL_CENTERS" | "OWN_CENTER";
        token.permissions = u.permissions as string[];
      }

      // Perubahan role/permission harus terasa tanpa menunggu sesi 8 jam habis.
      // Tanpa refresh ini, mencabut hak akses seseorang tidak berefek sampai ia
      // logout — celah yang berbahaya untuk panel yang bisa membuat user baru.
      if (!user && token.id) {
        const fresh = await prisma.adminUser
          .findUnique({ where: { id: token.id as string }, include: { role: true } })
          .catch(() => null);

        if (!fresh || !fresh.isActive) return {};

        token.centerId = fresh.centerId;
        token.roleId = fresh.roleId;
        token.roleName = fresh.role.name;
        token.scope = fresh.role.scope;
        token.permissions = parsePermissions(fresh.role.permissions);
        token.name = fresh.name;
        token.email = fresh.email;
        token.username = fresh.username;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        Object.assign(session.user, {
          id: token.id,
          username: token.username,
          centerId: token.centerId ?? null,
          roleId: token.roleId,
          roleName: token.roleName,
          scope: token.scope,
          permissions: token.permissions ?? [],
        });
      }
      return session;
    },
  },
  // Sengaja getter, bukan nilai biasa: `next build` mengimpor modul ini dengan
  // NODE_ENV=production padahal secret produksi memang belum ada saat build.
  // Sebagai getter, pengecekannya baru berjalan saat request pertama masuk.
  get secret() {
    return resolveSecret();
  },
};
