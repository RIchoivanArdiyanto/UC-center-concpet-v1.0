import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password wajib diisi");
        }

        const inputEmail = credentials.email.trim().toLowerCase();
        const inputPassword = credentials.password;

        // Default Super Admin Fallback (guarantees instant login even if DB is offline/unseeded)
        if (inputEmail === "admin@uccenters.id" && inputPassword === "Password123!") {
          return {
            id: "super-admin-default-id",
            name: "Super Administrator",
            email: "admin@uccenters.id",
            role: "SUPER_ADMIN",
            centerId: null,
          };
        }

        try {
          const user = await prisma.adminUser.findUnique({
            where: { email: inputEmail },
          });

          if (user && user.isActive) {
            const isValid = await bcrypt.compare(inputPassword, user.passwordHash);
            if (isValid) {
              await prisma.adminUser.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
              }).catch(() => {});

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                centerId: user.centerId,
              };
            }
          }
        } catch (err) {
          console.warn("[Auth Warning] DB offline or query failed, falling back to credentials validation.");
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.centerId = (user as any).centerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).centerId = token.centerId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "uc_centers_super_secret_jwt_key_32_chars_min",
};
