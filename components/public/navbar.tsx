"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultationModal } from "@/components/public/consultation-modal";

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Direktori Center", href: "/center" },
    { name: "Portfolio Proyek", href: "/portfolio" },
    { name: "Artikel & Berita", href: "/artikel" },
    { name: "Kontak", href: "/kontak" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-[80px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo with Fixed 48x48 Dimensions */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-500/40 shadow-md group-hover:scale-105 transition-transform flex-shrink-0 bg-white flex items-center justify-center p-0.5">
              <Image
                src="/logo-uc.png"
                alt="Universitas Ciputra Logo"
                width={44}
                height={44}
                priority
                style={{ width: "44px", height: "44px", objectFit: "contain" }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-[#003366] tracking-tight group-hover:text-[#0b64b4] transition-colors">
                UC Centers
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest -mt-1">
                Universitas Ciputra
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "text-[#0b64b4] bg-blue-50/80 font-semibold"
                    : "text-[#111c2d] hover:text-[#0b64b4] hover:bg-slate-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* CTA & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsConsultationOpen(true)}
              className="hidden sm:inline-flex"
            >
              <span>Konsultasi</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 animate-fade-in shadow-xl">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-[#0b64b4] bg-blue-50 font-semibold"
                    : "text-[#111c2d] hover:bg-slate-50"
                }`}
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
                <ArrowRight className="w-4 h-4 ml-1.5" />
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
