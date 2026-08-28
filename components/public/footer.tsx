import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-[#003366] text-white border-t border-blue-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-blue-800/80">
          {/* Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-white border border-amber-400/40 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
                <Image
                  src="/logo-uc.png"
                  alt="UC Logo"
                  width={40}
                  height={40}
                  style={{ width: "40px", height: "40px", objectFit: "contain" }}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  UC Centers
                </span>
                <span className="text-[10px] text-blue-300 uppercase tracking-widest font-semibold -mt-1">
                  Universitas Ciputra
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Ekosistem terintegrasi pusat keunggulan riset terapan, konsultasi bisnis strategis, dan pengembangan kapasitas SDM profesional.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white tracking-wider uppercase">Tautan Cepat</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/" className="hover:text-blue-300 transition-colors">Beranda</Link>
              </li>
              <li>
                <Link href="/center" className="hover:text-blue-300 transition-colors">Direktori Center</Link>
              </li>
              <li>
                <Link href="/portfolio" className="hover:text-blue-300 transition-colors">Portfolio Proyek</Link>
              </li>
              <li>
                <Link href="/artikel" className="hover:text-blue-300 transition-colors">Artikel & Insights</Link>
              </li>
              <li>
                <Link href="/kontak" className="hover:text-blue-300 transition-colors">Kontak Kami</Link>
              </li>
            </ul>
          </div>

          {/* Core Areas */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white tracking-wider uppercase">Bidang Keahlian</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Riset & Transfer Teknologi</li>
              <li>Strategi & Transformasi Bisnis</li>
              <li>Kebijakan Publik & Governance</li>
              <li>Kemitraan & Akselerasi Industri</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white tracking-wider uppercase">Kantor Pusat</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <span>Jl. CitraLand Boulevard, Surabaya, Jawa Timur 60219</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>(031) 7451699</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>contact@uccenters.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} UC Centers — Universitas Ciputra. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/admin/login" className="hover:text-white flex items-center gap-1 transition-colors">
              <span>Admin Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
