import { ApiError } from "@/lib/api";

export type TeamMemberInput = {
  name: string;
  role: string;
  email: string | null;
  photoUrl: string | null;
  sortOrder: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEAM = 50;

/**
 * Bersihkan dan validasi daftar anggota tim yang dikirim form admin.
 *
 * Dipakai bersama oleh route POST dan PUT center — tanpa ini keduanya akan
 * menulis validasi yang sama dua kali dan berisiko menyimpang satu sama lain.
 * Urutan tampil ditentukan dari posisi di array, bukan dari nilai sortOrder
 * yang dikirim klien, supaya tidak ada urutan ganda atau bolong.
 */
export function normalizeTeam(input: unknown): TeamMemberInput[] {
  if (!Array.isArray(input)) return [];

  if (input.length > MAX_TEAM) {
    throw new ApiError(400, `Jumlah anggota tim maksimal ${MAX_TEAM} orang.`);
  }

  return input
    .map((raw, index) => {
      const item = (raw ?? {}) as Record<string, unknown>;
      const name = String(item.name ?? "").trim();
      const role = String(item.role ?? "").trim();
      const email = String(item.email ?? "").trim().toLowerCase();

      // Baris yang benar-benar kosong dilewati diam-diam: form menyisakan baris
      // kosong saat pengguna menambah lalu batal mengisinya.
      if (!name && !role && !email) return null;

      if (!name) throw new ApiError(400, `Nama anggota tim ke-${index + 1} wajib diisi.`);
      if (!role) throw new ApiError(400, `Jabatan "${name}" wajib diisi.`);
      if (email && !EMAIL_RE.test(email)) {
        throw new ApiError(400, `Format email "${name}" tidak valid.`);
      }

      return {
        name,
        role,
        email: email || null,
        photoUrl: String(item.photoUrl ?? "").trim() || null,
        sortOrder: index + 1,
      };
    })
    .filter((item): item is TeamMemberInput => item !== null);
}
