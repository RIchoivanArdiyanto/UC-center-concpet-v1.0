"use client";

import React, { useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { Check, ChevronDown, Copy, Mail } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  photoUrl: string | null;
};

/**
 * Daftar Pengurus Center di halaman center.
 *
 * Anggota yang punya email bisa diklik untuk membuka alamatnya beserta tombol
 * salin, sehingga daftar tetap ringkas saat anggotanya banyak.
 *
 * CATATAN: ini murni pilihan tampilan, BUKAN penyembunyian. Email tetap ikut
 * terkirim di payload halaman dan terbaca oleh siapa pun yang membuka source.
 * Jangan isi kolom email di panel admin untuk alamat yang memang tidak boleh
 * dipublikasikan.
 */
export function TeamList({ members }: { members: TeamMember[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyEmail = async (member: TeamMember) => {
    if (!member.email) return;

    try {
      await navigator.clipboard.writeText(member.email);
    } catch {
      // clipboard API butuh konteks aman (HTTPS/localhost). Di HTTP biasa
      // dipakai cara lama lewat elemen sementara agar tombolnya tetap berfungsi.
      const helper = document.createElement("textarea");
      helper.value = member.email;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      document.body.removeChild(helper);
    }

    setCopiedId(member.id);
    window.setTimeout(() => setCopiedId((id) => (id === member.id ? null : id)), 2000);
  };

  return (
    <ul className="divide-y divide-slate-100">
      {members.map((member) => {
        const isOpen = openId === member.id;
        const hasEmail = Boolean(member.email);

        return (
          <li key={member.id} className="py-3.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => hasEmail && setOpenId(isOpen ? null : member.id)}
              aria-expanded={hasEmail ? isOpen : undefined}
              // Anggota tanpa email tidak interaktif — jangan beri isyarat bisa
              // diklik kalau tidak ada yang akan terbuka.
              disabled={!hasEmail}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg text-left transition",
                hasEmail ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
                "-mx-2 px-2 py-1.5"
              )}
            >
              {/* 64px, sebelumnya 40px — pada 40px wajah orang praktis tidak
                  terlihat, padahal justru itu isi utama blok ini. */}
              <span className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-blue-50 text-lg font-bold text-[#003366]">
                {member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </span>

              <span className="min-w-0 flex-grow">
                <span className="block truncate text-[15px] font-bold text-[#111c2d]">
                  {member.name}
                </span>
                <span className="block truncate text-[13px] text-slate-500">{member.role}</span>
              </span>

              {hasEmail && (
                <ChevronDown
                  className={clsx(
                    "h-4 w-4 flex-shrink-0 text-slate-400 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              )}
            </button>

            {hasEmail && isOpen && (
              <div className="ml-[76px] mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <Mail className="h-3.5 w-3.5 flex-shrink-0 text-[#0b64b4]" />
                <a
                  href={`mailto:${member.email}`}
                  className="min-w-0 flex-grow truncate text-xs text-slate-700 underline-offset-2 hover:text-[#0b64b4] hover:underline"
                >
                  {member.email}
                </a>
                <button
                  type="button"
                  onClick={() => copyEmail(member)}
                  aria-label={`Salin email ${member.name}`}
                  title="Salin email"
                  className="flex flex-shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-[#0b64b4] hover:text-[#0b64b4]"
                >
                  {copiedId === member.id ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
