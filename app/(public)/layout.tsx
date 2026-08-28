import React from "react";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#111c2d]">
      <PublicNavbar />
      <main className="flex-grow">{children}</main>
      <PublicFooter />
    </div>
  );
}
