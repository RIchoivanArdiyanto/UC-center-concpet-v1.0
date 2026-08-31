import { ApiError } from "@/lib/api";

export type CenterServiceInput = {
  title: string;
  description: string | null;
  sortOrder: number;
};

const MAX_SERVICES = 30;
const MAX_TITLE = 255;
const MAX_DESCRIPTION = 1000;

/**
 * Bersihkan dan validasi daftar layanan yang dikirim form admin.
 *
 * Dipakai bersama route POST dan PUT center — sama seperti normalizeTeam,
 * supaya validasinya tidak ditulis dua kali dan berisiko menyimpang.
 * Urutan tampil diambil dari posisi di array, bukan dari sortOrder kiriman
 * klien, sehingga tidak ada urutan ganda atau bolong.
 *
 * Panjang dipotong sesuai batas kolom di MySQL (VarChar 255 / 1000). Tanpa ini
 * teks yang kelewat panjang ditolak database dan muncul sebagai error 500 yang
 * membingungkan, bukan pesan validasi yang jelas.
 */
export function normalizeServices(input: unknown): CenterServiceInput[] {
  if (!Array.isArray(input)) return [];

  if (input.length > MAX_SERVICES) {
    throw new ApiError(400, `Jumlah layanan maksimal ${MAX_SERVICES} item.`);
  }

  return input
    .map((raw, index) => {
      const item = (raw ?? {}) as Record<string, unknown>;
      const title = String(item.title ?? "").trim();
      const description = String(item.description ?? "").trim();

      // Baris yang benar-benar kosong dilewati diam-diam: form menyisakan baris
      // kosong saat pengguna menambah lalu batal mengisinya.
      if (!title && !description) return null;

      if (!title) {
        throw new ApiError(400, `Judul layanan ke-${index + 1} wajib diisi.`);
      }
      if (title.length > MAX_TITLE) {
        throw new ApiError(400, `Judul layanan "${title.slice(0, 30)}…" melebihi ${MAX_TITLE} karakter.`);
      }
      if (description.length > MAX_DESCRIPTION) {
        throw new ApiError(
          400,
          `Deskripsi layanan "${title}" melebihi ${MAX_DESCRIPTION} karakter.`
        );
      }

      return {
        title,
        description: description || null,
        sortOrder: index + 1,
      };
    })
    .filter((item): item is CenterServiceInput => item !== null);
}
