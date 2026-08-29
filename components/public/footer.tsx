import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, Instagram, Youtube } from "lucide-react";
import { getSiteSettings } from "@/lib/get-site-settings";

// Server component: alamat, telepon, email, dan tautan media sosial dibaca dari
// tabel SiteSetting — sumber yang sama dengan kartu di halaman Kontak, jadi
// keduanya tidak mungkin berbeda isi.
export async function PublicFooter() {
  const s = await getSiteSettings();

  const socials = [
    { icon: Instagram, label: "Instagram", href: s.social_instagram },
    { icon: Youtube, label: "YouTube", href: s.social_youtube },
  ].filter((item) => item.href?.trim());

  return (
    <footer className="border-t border-blue-900 bg-[#003366] pb-12 pt-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-blue-800/80 pb-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-400/40 bg-white p-0.5 shadow-md">
                <Image
                  src="/logo-uc.png"
                  alt="Logo UC Centers"
                  width={40}
                  height={40}
                  style={{ width: "40px", height: "40px", objectFit: "contain" }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  UC Centers
                </span>
                <span className="-mt-1 text-[10px] font-semibold uppercase tracking-widest text-blue-300">
                  Universitas Ciputra
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              Ekosistem terintegrasi pusat keunggulan riset terapan, konsultasi bisnis
              strategis, dan pengembangan kapasitas SDM profesional.
            </p>

            {socials.length > 0 && (
              <div className="flex items-center gap-2.5 pt-1">
                {socials.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    // noopener/noreferrer wajib untuk tautan target="_blank":
                    // tanpa itu halaman tujuan bisa mengakses window.opener.
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Tautan cepat */}
          <div className="space-y-3">
            <h4 className="text-base font-bold uppercase tracking-wider text-white">
              Tautan Cepat
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link href="/" className="transition-colors hover:text-blue-300">Beranda</Link></li>
              <li><Link href="/center" className="transition-colors hover:text-blue-300">Direktori Center</Link></li>
              <li><Link href="/portfolio" className="transition-colors hover:text-blue-300">Portfolio Proyek</Link></li>
              <li><Link href="/artikel" className="transition-colors hover:text-blue-300">Artikel &amp; Insights</Link></li>
              <li><Link href="/kontak" className="transition-colors hover:text-blue-300">Kontak Kami</Link></li>
            </ul>
          </div>

          {/* Bidang keahlian */}
          <div className="space-y-3">
            <h4 className="text-base font-bold uppercase tracking-wider text-white">
              Bidang Keahlian
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Riset &amp; Transfer Teknologi</li>
              <li>Strategi &amp; Transformasi Bisnis</li>
              <li>Kebijakan Publik &amp; Governance</li>
              <li>Kemitraan &amp; Akselerasi Industri</li>
            </ul>
          </div>

          {/* Kontak */}
          <div className="space-y-3">
            <h4 className="text-base font-bold uppercase tracking-wider text-white">
              Kantor Pusat
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              {s.contact_address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-blue-400" />
                  <span>{s.contact_address}</span>
                </li>
              )}
              {s.contact_phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 flex-shrink-0 text-blue-400" />
                  <span>{s.contact_phone}</span>
                </li>
              )}
              {s.contact_email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 flex-shrink-0 text-blue-400" />
                  <a href={`mailto:${s.contact_email}`} className="hover:text-blue-300">
                    {s.contact_email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Tautan "Admin Portal" sengaja TIDAK ada di sini. Menautkan panel admin
            dari setiap halaman publik memberi tahu semua pengunjung (termasuk
            pemindai otomatis) di mana letak formulir login. Admin tetap bisa
            masuk lewat /admin/login secara langsung. */}
        <div className="flex flex-col items-center justify-between gap-3 pt-8 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} UC Centers — Universitas Ciputra. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/kontak" className="transition-colors hover:text-white">Hubungi Kami</Link>
            <span className="h-3 w-px bg-slate-600" aria-hidden="true" />
            <Link href="/center" className="transition-colors hover:text-white">Direktori Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
