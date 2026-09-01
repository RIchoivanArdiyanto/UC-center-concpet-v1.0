/**
 * Validasi URL sematan peta Google.
 *
 * Nilai ini diisi lewat panel admin lalu dipasang sebagai `src` iframe. Tanpa
 * pembatasan host, siapa pun yang bisa menyunting konten dapat membuat halaman
 * publik UC membingkai situs mana pun — persis celah yang sudah ditutup pada
 * pemutar video. Karena itu hanya host Google Maps yang diterima.
 */
const ALLOWED_HOSTS = new Set(["www.google.com", "google.com", "maps.google.com"]);

/**
 * Admin biasanya menyalin SELURUH kode dari tombol "Embed a map", bukan hanya
 * alamatnya. Ambil isi src="..." bila yang ditempel berupa tag iframe.
 */
function extractSrc(raw: string): string {
  const match = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(raw);
  return (match ? match[1] : raw).trim();
}

/**
 * Kembalikan URL sematan yang aman dipakai, atau null bila tidak dikenali.
 *
 * Dua bentuk yang diterima:
 *   - https://www.google.com/maps/embed?pb=...        (hasil "Share → Embed a map")
 *   - https://www.google.com/maps/embed/v1/place?...  (Maps Embed API, pakai key)
 *   - https://maps.google.com/maps?q=...&output=embed (bentuk lama tanpa key)
 */
export function parseGoogleMapEmbed(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;

  let url: URL;
  try {
    url = new URL(extractSrc(input));
  } catch {
    return null;
  }

  // Sematan lewat http polos akan diblokir browser sebagai mixed content di
  // situs HTTPS, jadi ditolak sejak awal daripada tampil sebagai kotak kosong.
  if (url.protocol !== "https:") return null;
  if (!ALLOWED_HOSTS.has(url.hostname)) return null;

  const path = url.pathname;

  if (path === "/maps/embed" || path.startsWith("/maps/embed/")) return url.toString();

  // Bentuk lama: /maps?...&output=embed
  if ((path === "/maps" || path === "/maps/") && url.searchParams.get("output") === "embed") {
    return url.toString();
  }

  return null;
}
