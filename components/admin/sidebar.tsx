"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { clsx } from "clsx";
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
  History,
  UserCog,
  Menu,
  X,
} from "lucide-react";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  permission: Permission;
};

type NavSection = { section: string; items: NavItem[] };

// Menu dikelompokkan dan tiap entri membawa permission-nya sendiri, jadi user
// hanya melihat yang benar-benar bisa ia buka. (Penegakan sesungguhnya tetap
// di server — lihat `requireAdmin` di lib/api.ts.)
const NAV: NavSection[] = [
  {
    section: "Ringkasan",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
    ],
  },
  {
    section: "Konten",
    items: [
      { name: "Kelola Center", href: "/admin/centers", icon: Building2, permission: PERMISSIONS.CENTERS_VIEW },
      { name: "Kelola Portfolio", href: "/admin/portfolio", icon: Briefcase, permission: PERMISSIONS.PORTFOLIO_VIEW },
      { name: "Kelola Artikel", href: "/admin/articles", icon: FileText, permission: PERMISSIONS.ARTICLES_VIEW },
      { name: "Konten Situs", href: "/admin/homepage", icon: Home, permission: PERMISSIONS.HOMEPAGE_MANAGE },
    ],
  },
  {
    section: "Master Data",
    items: [
      { name: "Taksonomi Expertise", href: "/admin/expertise", icon: Tags, permission: PERMISSIONS.EXPERTISE_MANAGE },
      { name: "Mitra Client", href: "/admin/clients", icon: Building, permission: PERMISSIONS.CLIENTS_MANAGE },
    ],
  },
  {
    section: "Permohonan",
    items: [
      { name: "Kelola Leads", href: "/admin/leads", icon: Users, permission: PERMISSIONS.LEADS_VIEW },
    ],
  },
  {
    section: "Sistem",
    items: [
      { name: "Users & Hak Akses", href: "/admin/users", icon: UserCog, permission: PERMISSIONS.USERS_MANAGE },
      { name: "Activity Log", href: "/admin/activity", icon: History, permission: PERMISSIONS.ACTIVITY_VIEW },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const permissions = session?.user?.permissions ?? [];
  const roleName = session?.user?.roleName ?? "—";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const visibleSections = NAV.map((s) => ({
    ...s,
    items: s.items.filter((i) => permissions.includes(i.permission)),
  })).filter((s) => s.items.length > 0);

  const content = (
    <>
      <div className="space-y-6 p-6">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-400/40 bg-white p-0.5 shadow-md">
            <Image
              src="/logo-uc.png"
              alt=""
              width={36}
              height={36}
              style={{ width: "36px", height: "36px", objectFit: "contain" }}
            />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-white">UC Centers</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-blue-300">
              Admin Panel
            </div>
          </div>
        </Link>

        <nav className="space-y-5">
          {visibleSections.map((section) => (
            <div key={section.section} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-blue-300/70">
                {section.section}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-white/12 font-semibold text-white"
                        : "text-blue-100/80 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-amber-400"
                      />
                    )}
                    <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          {visibleSections.length === 0 && (
            <p className="px-3 text-xs leading-relaxed text-blue-200/70">
              Role Anda belum diberi hak akses ke menu mana pun. Hubungi administrator.
            </p>
          )}
        </nav>
      </div>

      <div className="border-t border-white/10 p-6">
        <div className="flex items-center gap-2.5 rounded-lg bg-white/8 px-3 py-2.5">
          <ShieldCheck className="h-4 w-4 flex-shrink-0 text-amber-400" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-blue-300/70">Role Anda</div>
            <div className="truncate text-xs font-bold text-white">{roleName}</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Tombol buka menu di layar kecil. Sebelumnya sidebar lebar 260px selalu
          tampil sehingga di ponsel konten utama terdorong keluar layar. */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Buka menu navigasi"
        className="fixed left-4 top-3.5 z-40 rounded-lg bg-[#003366] p-2 text-white shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col justify-between overflow-y-auto border-r border-blue-900/60 bg-[#003366] text-white shadow-xl transition-transform duration-200",
          // `shrink-0` WAJIB: di lg ke atas aside menjadi item flex biasa, dan
          // tanpa ini flexbox memampatkannya begitu konten utama lebar (halaman
          // edit center/artikel) — labelnya terpotong jadi "K...", "Ke...".
          "lg:static lg:z-auto lg:w-[264px] lg:shrink-0 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu navigasi"
          className="absolute right-3 top-3 rounded-lg p-2 text-blue-200 hover:bg-white/10 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        {content}
      </aside>
    </>
  );
}
