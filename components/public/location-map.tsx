import React from "react";
import { MapPin, ExternalLink } from "lucide-react";

interface LocationMapProps {
  latitude: string;
  longitude: string;
  title: string;
  subtitle: string;
  /** Tautan tujuan saat peta diklik. Kosong = dibentuk dari koordinat. */
  mapUrl?: string;
  address?: string;
}

/** Koordinat wajar: lintang -90..90, bujur -180..180. */
function parseCoordinate(value: string, limit: number): number | null {
  const num = Number.parseFloat(String(value).trim());
  if (!Number.isFinite(num) || Math.abs(num) > limit) return null;
  return num;
}

/**
 * Peta lokasi kantor.
 *
 * Petanya disematkan dari OpenStreetMap, bukan Google Maps: embed resmi Google
 * memerlukan API key berbayar yang harus dijaga kuotanya, sementara OSM bisa
 * dipakai tanpa kunci apa pun. Yang diklik pengguna tetap membuka Google Maps,
 * karena di situlah rute dan ulasan tersedia.
 *
 * Sebelumnya blok ini hanya hiasan titik-titik dengan tulisan nama kantor —
 * tidak menunjukkan lokasi apa pun dan tidak bisa diklik.
 */
export function LocationMap({
  latitude,
  longitude,
  title,
  subtitle,
  mapUrl,
  address,
}: LocationMapProps) {
  const lat = parseCoordinate(latitude, 90);
  const lng = parseCoordinate(longitude, 180);

  // Koordinat kosong/salah tidak boleh membuat halaman menampilkan peta di
  // tengah laut. Ditampilkan kartu alamat biasa sebagai gantinya.
  if (lat === null || lng === null) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <MapPin className="mx-auto h-7 w-7 text-[#0b64b4]" />
        <div className="mt-2 text-sm font-bold text-[#003366]">{title}</div>
        {address && <p className="mt-1 text-xs text-slate-500">{address}</p>}
        <p className="mt-2 text-[11px] text-slate-400">
          Titik peta belum diatur.
        </p>
      </div>
    );
  }

  // Kotak pandang peta. Delta kecil = zoom cukup dekat untuk mengenali gedung
  // tanpa kehilangan konteks jalan sekitarnya.
  const d = 0.004;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join("%2C");
  const embedSrc =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${lat}%2C${lng}`;

  // Format resmi Google Maps: membuka aplikasi Maps di ponsel dan situsnya di
  // desktop. Bila admin mengisi tautan sendiri (mis. halaman tempat yang sudah
  // terverifikasi), tautan itu yang dipakai.
  const target =
    mapUrl?.trim() ||
    `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-slate-200">
      <iframe
        title={`Peta lokasi ${title}`}
        src={embedSrc}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-56 w-full border-0 grayscale-[15%] transition-[filter] duration-500 group-hover:grayscale-0"
      />

      {/*
        Lapisan tautan menutupi seluruh peta agar bagian mana pun bisa diklik.
        Konsekuensinya peta tidak bisa digeser/di-zoom di tempat — itu memang
        disengaja: di halaman kontak, tujuan pengguna adalah membuka rute, dan
        peta yang bisa digeser justru menjebak gulir halaman di ponsel.
      */}
      <a
        href={target}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Buka lokasi ${title} di Google Maps`}
        className="absolute inset-0 flex items-end justify-center bg-[#003366]/0 p-3 transition-colors duration-300 hover:bg-[#003366]/10 focus-visible:bg-[#003366]/10"
      >
        <span className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-0.5">
          <MapPin className="h-5 w-5 flex-shrink-0 text-[#0b64b4]" />
          <span className="min-w-0 flex-grow text-left">
            <span className="block truncate text-xs font-bold text-[#003366]">{title}</span>
            <span className="block truncate text-[10px] text-slate-500">{subtitle}</span>
          </span>
          <span className="flex flex-shrink-0 items-center gap-1 text-[11px] font-semibold text-[#0b64b4]">
            Buka Maps
            <ExternalLink className="h-3 w-3" />
          </span>
        </span>
      </a>
    </div>
  );
}
