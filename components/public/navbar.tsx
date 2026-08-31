"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultationModal } from "@/components/public/consultation-modal";

const NAV_LINKS = [
  { name: "Beranda", href: "/" },
  { name: "Direktori Center", href: "/center" },
  { name: "Portfolio Proyek", href: "/portfolio" },
  { name: "Artikel & Berita", href: "/artikel" },
  { name: "Kontak", href: "/kontak" },
];

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Header menipis dan bayangannya menguat begitu halaman digulir — isyarat
  // halus bahwa konten sedang bergerak di belakangnya.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu mobile sebelumnya tetap terbuka setelah pindah halaman, menutupi
  // konten yang baru dimuat.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Kunci gulir badan halaman selama menu mobile terbuka.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setMobileMenuOpen(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onEsc);
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur-md transition-[height,box-shadow,border-color] duration-300",
          scrolled
            ? "h-[68px] border-slate-200 shadow-md"
            : "h-[80px] border-transparent shadow-sm"
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-500/40 bg-white p-0.5 shadow-md transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo-uc.png"
                alt="Logo Universitas Ciputra"
                width={44}
                height={44}
                priority
                style={{ width: "44px", height: "44px", objectFit: "contain" }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#003366] transition-colors group-hover:text-[#0b64b4]">
                UC Centers
              </span>
              <span className="-mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Universitas Ciputra
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex lg:gap-2">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "nav-underline rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "font-semibold text-[#0b64b4]"
                      : "font-medium text-[#111c2d] hover:text-[#0b64b4]"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsConsultationOpen(true)}
              className="btn-sheen hidden sm:inline-flex"
            >
              <span>Konsultasi</span>
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:hidden"
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="animate-fade-in space-y-1 border-b border-slate-200 bg-white px-4 pb-6 pt-2 shadow-xl md:hidden">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${i * 40}ms` }}
                className={clsx(
                  "animate-rise block rounded-lg px-4 py-2.5 text-base transition-colors",
                  isActive(link.href)
                    ? "bg-blue-50 font-semibold text-[#0b64b4]"
                    : "font-medium text-[#111c2d] hover:bg-slate-50"
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2">
              <Button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsConsultationOpen(true);
                }}
                className="w-full justify-center"
              >
                <span>Konsultasi Layanan</span>
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </header>

      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      />
    </>
  );
}
