"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut, ShieldCheck, Building2 } from "lucide-react";

// Judul halaman diambil dari path supaya topbar selalu menunjukkan posisi
// pengguna. Sebelumnya topbar hanya berisi kotak pencarian yang tidak
// terhubung ke apa pun — kolom hias yang justru menyesatkan.
const PAGE_TITLES: Record<string, string> = {
  "/panel/dashboard": "Dashboard Ringkasan",
  "/panel/centers": "Kelola Center",
  "/panel/portfolio": "Kelola Portfolio",
  "/panel/articles": "Kelola Artikel",
  "/panel/homepage": "Konten Situs & Kontak",
  "/panel/expertise": "Taksonomi Expertise",
  "/panel/clients": "Mitra Client",
  "/panel/leads": "Permohonan Masuk",
  "/panel/users": "Users & Hak Akses",
  "/panel/activity": "Activity Log",
};

function titleFor(pathname: string): string {
  const match = Object.keys(PAGE_TITLES)
    .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : "Panel Admin";
}

export function AdminTopbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const userName = user?.name || "Administrator";
  const roleName = user?.roleName || "—";

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 shadow-sm backdrop-blur sm:px-6">
      <div className="min-w-0 pl-12 lg:pl-0">
        <h1 className="truncate text-base font-bold text-[#111c2d] sm:text-lg">
          {titleFor(pathname)}
        </h1>
      </div>

      <div className="relative flex items-center gap-3" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#233e95] to-[#0b64b4] text-xs font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-bold leading-tight text-[#111c2d]">{userName}</span>
            <span className="block text-[10px] text-slate-500">{roleName}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-pop-in"
          >
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="truncate text-sm font-bold text-[#111c2d]">{userName}</div>
              <div className="truncate text-xs text-slate-500">{user?.email}</div>
              {user?.username && (
                <div className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                  @{user.username}
                </div>
              )}
            </div>

            <div className="space-y-1.5 px-4 py-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-[#0b64b4]" />
                <span>
                  Role: <strong className="text-[#111c2d]">{roleName}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-[#0b64b4]" />
                <span>
                  Lingkup:{" "}
                  <strong className="text-[#111c2d]">
                    {user?.scope === "ALL_CENTERS" ? "Semua center" : "Center yang ditugaskan"}
                  </strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/panel/login" })}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar dari panel
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
