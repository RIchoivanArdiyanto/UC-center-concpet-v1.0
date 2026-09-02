import React from "react";

/**
 * Layout ini ada semata-mata untuk mematikan prerender halaman login.
 *
 * `export const dynamic` TIDAK berlaku bila ditulis di file page yang berisi
 * "use client" — Next mengabaikannya tanpa peringatan apa pun, dan halamannya
 * tetap dibuat statis. Route segment config hanya dihormati pada Server
 * Component, jadi ditaruh di sini.
 *
 * Prerender-nya harus dimatikan karena NextAuth membaca
 * `NEXTAUTH_URL ?? VERCEL_URL`; bila salah satunya berisi string kosong, `??`
 * tidak menangkapnya dan `new URL("")` melempar "Invalid URL" saat build.
 */
export const dynamic = "force-dynamic";

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
