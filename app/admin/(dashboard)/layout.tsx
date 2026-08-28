import React from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { NextAuthProvider } from "@/components/admin/session-provider";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthProvider>
      <div className="flex min-h-screen bg-[#f9f9ff]">
        <AdminSidebar />
        <div className="flex-grow flex flex-col min-w-0">
          <AdminTopbar />
          <main className="p-6 sm:p-8 flex-grow">{children}</main>
        </div>
      </div>
    </NextAuthProvider>
  );
}
