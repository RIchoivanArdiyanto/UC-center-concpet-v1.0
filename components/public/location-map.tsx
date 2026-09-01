import React from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { parseGoogleMapEmbed } from "@/lib/map-embed";

interface LocationMapProps {
  /** Kode sematan dari Google Maps ("Share → Embed a map"). Diutamakan. */
  embed?: string;
  latitude: string;
  longitude: string;
  title: string;
  subtitle: string;
  /** Tautan tujuan tombol "Buka di Maps". Kosong = dibentuk dari koordinat. */
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
 * Peta lokasi kantor di halaman Kontak.
 *
 * Dua sumber peta, dipakai berurutan:
 *
 * 1. **Sematan Google Maps** — hasil tombol "Share → Embed a map". Tidak
 *    memerlukan API key, dan tampilannya sudah lengkap: kartu nama tempat,
 *    rating, tombol "Open in Maps", dan tombol rute. Karena tombol-tombol itu
 *    milik Google sendiri, iframe-nya dibiarkan interaktif penuh dan TIDAK
 *    ditutup lapisan tautan — menutupinya justru mematikan fungsi yang
 *    diinginkan.
 * 2. **OpenStreetMap** dari koordinat, sebagai cadangan bila admin belum
 *    menempel kode sematan. Peta ini tidak punya tombol sendiri, jadi seluruh
 *    areanya dijadikan tautan ke Google Maps.
 *
 * Bila keduanya kosong/salah, yang tampil kartu alamat biasa — bukan peta yang
 * menunjuk titik acak di tengah laut.
 */
export function LocationMap({
  embed,
  latitude,
  longitude,
  title,
  subtitle,
  mapUrl,
  address,
}: LocationMapProps) {
  const googleEmbed = parseGoogleMapEmbed(embed);
  const lat = parseCoordinate(latitude, 90);
  const lng = parseCoordinate(longitude, 180);

  // Format resmi Google Maps: membuka aplikasi Maps di ponsel, situsnya di
  // desktop.
  const target =
    mapUrl?.trim() ||
    (lat !== null && lng !== null
      ? `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`
      : address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : null);

  // ── 1. Sematan Google Maps ────────────────────────────────────────────────
  if (googleEmbed) {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <iframe
            title={`Peta lokasi ${title}`}
            src={googleEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="h-64 w-full border-0"
          />
        </div>

        {target && (
          <a
            href={target}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0b64b4] transition hover:border-[#0b64b4] hover:bg-blue-50"
          >
            <MapPin className="h-3.5 w-3.5" />
            Buka di Google Maps
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  // ── 2. Cadangan: OpenStreetMap dari koordinat ─────────────────────────────
  if (lat !== null && lng !== null) {
    const d = 0.004;
    const bbox = [lng - d, lat - d, lng + d, lat + d].join("%2C");
    const osmSrc =
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
      `&layer=mapnik&marker=${lat}%2C${lng}`;

    return (
      <div className="group relative overflow-hidden rounded-lg border border-slate-200">
        <iframe
          title={`Peta lokasi ${title}`}
          src={osmSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-56 w-full border-0 grayscale-[15%] transition-[filter] duration-500 group-hover:grayscale-0"
        />

        {target && (
          <a
            href={target}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka lokasi ${title} di Google Maps`}
            className="absolute inset-0 flex items-end justify-center p-3 transition-colors duration-300 hover:bg-[#003366]/10 focus-visible:bg-[#003366]/10"
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
        )}
      </div>
    );
  }

  // ── 3. Tidak ada data peta sama sekali ────────────────────────────────────
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
      <MapPin className="mx-auto h-7 w-7 text-[#0b64b4]" />
      <div className="mt-2 text-sm font-bold text-[#003366]">{title}</div>
      {address && <p className="mt-1 text-xs text-slate-500">{address}</p>}
      <p className="mt-2 text-[11px] text-slate-400">Titik peta belum diatur.</p>
    </div>
  );
}
