import React from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { NextAuthProvider } from "@/components/admin/session-provider";
import { ToastProvider } from "@/components/ui/toast";

// Halaman admin TIDAK BOLEH di-prerender: isinya bergantung sesi pengguna, dan
// respons-nya sudah ditandai `no-store` di next.config. Selain itu prerender
// membuat build gagal di Vercel — NextAuth membaca `NEXTAUTH_URL ?? VERCEL_URL`,
// dan bila salah satunya berisi string kosong, `??` tidak menangkapnya sehingga
// `new URL("")` melempar "Invalid URL".
export const dynamic = "force-dynamic";


export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-[#f4f6fb] text-[#111c2d]">
          <AdminSidebar />
          <div className="flex min-w-0 flex-grow flex-col">
            <AdminTopbar />
            <main className="flex-grow p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </NextAuthProvider>
  );
}
