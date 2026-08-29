import React from "react";
import { Card } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/get-site-settings";
import { ContactForm } from "./contact-form";
import { MapPin, Phone, Mail, Clock, Instagram, Youtube } from "lucide-react";

// Informasi kontak dibaca dari database setiap request, jadi perubahan dari
// panel admin langsung terlihat tanpa build ulang.
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await getSiteSettings();

  const infoRows = [
    { icon: MapPin, label: "Alamat Utama", value: s.contact_address },
    { icon: Phone, label: "Telepon", value: s.contact_phone },
    { icon: Mail, label: "Email Resmi", value: s.contact_email },
    { icon: Clock, label: "Jam Operasional", value: s.contact_hours },
  ].filter((row) => row.value?.trim());

  const socials = [
    { icon: Instagram, label: "Instagram", href: s.social_instagram },
    { icon: Youtube, label: "YouTube", href: s.social_youtube },
  ].filter((item) => item.href?.trim());

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-[#0b64b4]">
          Hubungi Kami
        </span>
        <h1 className="text-3xl font-extrabold text-[#003366] sm:text-4xl">
          Diskusi &amp; Inisiasi Kerja Sama
        </h1>
        <p className="text-sm text-slate-600">
          Sampaikan permohonan konsultasi, riset bersama, atau pelatihan terorganisir
          kepada tim pakar UC Centers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <Card className="space-y-6 p-6 sm:p-8 lg:col-span-7">
          <div>
            <h2 className="text-xl font-bold text-[#003366]">Formulir Konsultasi</h2>
            <p className="mt-1 text-xs text-slate-500">
              Kolom bertanda <span className="text-rose-500">*</span> wajib diisi.
            </p>
          </div>

          <ContactForm />
        </Card>

        <div className="space-y-6 lg:col-span-5">
          <Card className="space-y-6 bg-gradient-to-br from-[#003366] to-[#233e95] p-6 text-white sm:p-8">
            <h2 className="text-xl font-bold text-white">Informasi Kantor Pusat</h2>

            <div className="space-y-4 text-sm text-slate-200">
              {infoRows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-blue-300" />
                  <div className="min-w-0">
                    <div className="font-semibold text-white">{label}</div>
                    {label === "Email Resmi" ? (
                      <a
                        href={`mailto:${value}`}
                        className="mt-0.5 block break-words underline-offset-2 hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-0.5 break-words">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {socials.length > 0 && (
              <div className="border-t border-white/15 pt-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Ikuti Kami
                </div>
                <div className="mt-3 flex items-center gap-3">
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
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-2 border border-slate-200 bg-white p-4 text-center">
            <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border bg-slate-100">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70" />
              <div className="relative z-10 flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-md backdrop-blur-sm">
                <MapPin className="h-7 w-7 text-[#0b64b4]" />
                <span className="text-xs font-bold text-[#003366]">{s.contact_map_title}</span>
                <span className="text-[10px] text-slate-500">{s.contact_map_subtitle}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
