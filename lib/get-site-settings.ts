import { prisma } from "@/lib/prisma";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings";

/**
 * Baca pengaturan situs untuk komponen server (beranda, kontak, footer).
 *
 * Nilai dari database ditumpuk di atas default, jadi kunci yang belum pernah
 * disimpan admin tetap punya isi. Database yang sedang mati tidak membuat
 * halaman publik gagal render — cukup jatuh ke nilai default.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const settings: SiteSettings = { ...DEFAULT_SITE_SETTINGS };

  try {
    const rows = await prisma.siteSetting.findMany();
    for (const row of rows) {
      // Kolomnya bertipe Json; hanya nilai string yang dipakai sebagai teks.
      if (typeof row.value === "string") settings[row.key] = row.value;
    }
  } catch (error) {
    console.warn("[SiteSettings] Database tidak terbaca, memakai nilai default:", error);
  }

  return settings;
}
