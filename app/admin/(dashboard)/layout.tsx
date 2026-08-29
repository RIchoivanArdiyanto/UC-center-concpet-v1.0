import React from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { NextAuthProvider } from "@/components/admin/session-provider";
import { ToastProvider } from "@/components/ui/toast";

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
