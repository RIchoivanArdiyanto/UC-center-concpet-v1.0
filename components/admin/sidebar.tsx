"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Tags,
  Briefcase,
  FileText,
  Home,
  Users,
  Building,
  ShieldCheck,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = (session?.user as any)?.role || "CENTER_ADMIN";

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Kelola Center", href: "/admin/centers", icon: Building2 },
    { name: "Taksonomi Expertise", href: "/admin/expertise", icon: Tags },
    { name: "Kelola Portfolio", href: "/admin/portfolio", icon: Briefcase },
    { name: "Kelola Artikel", href: "/admin/articles", icon: FileText },
    { name: "Kelola Mitra Client", href: "/admin/clients", icon: Building },
    { name: "Konten Beranda", href: "/admin/homepage", icon: Home },
    { name: "Kelola Leads", href: "/admin/leads", icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === "/admin/dashboard" && pathname === "/admin/dashboard") return true;
    if (href !== "/admin/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside className="w-[260px] bg-[#003366] text-white flex flex-col justify-between flex-shrink-0 min-h-screen border-r border-blue-900 shadow-xl">
      <div className="p-6 space-y-6">
        {/* Brand with UC Emblem */}
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-amber-400/40 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
            <Image
              src="/logo-uc.png"
              alt="UC Emblem"
              width={36}
              height={36}
              style={{ width: "36px", height: "36px", objectFit: "contain" }}
            />
          </div>
          <div>
            <div className="font-extrabold text-lg text-white tracking-tight">UC Centers</div>
            <div className="text-[10px] text-blue-300 uppercase tracking-widest font-semibold">Admin Panel</div>
          </div>
        </Link>

        {/* Role Badge */}
        <div className="px-3 py-2 rounded-lg bg-blue-900/60 border border-blue-800 flex items-center gap-2 text-xs">
          <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div className="truncate">
            <span className="text-slate-300 block text-[10px]">Akses Pengguna:</span>
            <span className="font-bold text-white uppercase tracking-wider">{role}</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-[#1E40AF] text-white shadow-md font-bold"
                    : "text-slate-300 hover:bg-blue-900/40 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-blue-300" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Version Watermark */}
      <div className="p-6 border-t border-blue-900/80 text-[11px] text-slate-400">
        <div>UC Centers Admin</div>
        <div className="text-[10px] text-slate-500 mt-0.5">Versi v2.1.0 System</div>
      </div>
    </aside>
  );
}
