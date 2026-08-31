import React from "react";
import { ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  url?: string | null;
  title?: string;
  className?: string;
}

/**
 * Hanya penyedia di daftar ini yang boleh dimuat dalam iframe.
 *
 * Versi lama meneruskan URL apa pun ke `src` iframe. Karena URL-nya diisi lewat
 * panel admin, itu berarti halaman publik bisa dipaksa membingkai situs mana
 * pun — jalan mudah untuk halaman phishing yang tampak berasal dari domain UC.
 */
const ALLOWED_EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
]);

/**
 * Ubah URL tontonan biasa menjadi URL embed.
 *
 * Memakai parser URL sungguhan, bukan `url.includes("youtube.com/watch?v=")`
 * seperti sebelumnya — pengecekan substring itu meloloskan alamat seperti
 * `https://situs-lain.com/?x=youtube.com/watch?v=` karena teksnya memang ada.
 */
function toEmbedUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (!ALLOWED_EMBED_HOSTS.has(parsed.hostname)) return null;

  // youtu.be/<id>
  if (parsed.hostname === "youtu.be") {
    const id = parsed.pathname.replace(/^\//, "").split("/")[0];
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
  }

  // youtube.com/watch?v=<id>
  if (parsed.hostname.endsWith("youtube.com") || parsed.hostname.endsWith("youtube-nocookie.com")) {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (parsed.pathname.startsWith("/embed/")) {
      const id = parsed.pathname.slice("/embed/".length).split("/")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    return null;
  }

  // vimeo.com/<id> dan player.vimeo.com/video/<id>
  const vimeoId = parsed.pathname.split("/").filter(Boolean).pop();
  return vimeoId && /^\d+$/.test(vimeoId)
    ? `https://player.vimeo.com/video/${vimeoId}`
    : null;
}

export function VideoPlayer({ url, title = "Video Embed", className = "" }: VideoPlayerProps) {
  if (!url) return null;

  const embedUrl = toEmbedUrl(url);

  // URL di luar penyedia yang diizinkan tidak dibingkai, tapi tetap bisa dibuka
  // pengunjung sebagai tautan biasa — jadi konten tidak hilang begitu saja.
  if (!embedUrl) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 ${className}`}
      >
        <p className="text-xs text-slate-600">
          Video ini berasal dari sumber yang tidak didukung untuk disematkan.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-[#0b64b4] hover:underline"
        >
          Buka video
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-md ${className}`}
    >
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        // Batasi kemampuan frame seminimal yang dibutuhkan pemutar video.
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
