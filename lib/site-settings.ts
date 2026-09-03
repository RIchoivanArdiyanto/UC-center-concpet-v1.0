// ============================================================================
//  Konten situs yang dikelola dari panel admin (tabel SiteSetting).
//
//  Blok default ini sebelumnya disalin identik di app/(public)/page.tsx dan
//  app/api/admin/homepage/route.ts. Begitu salah satunya diedit, tampilan
//  publik dan form admin bisa menampilkan teks default yang berbeda. Sekarang
//  satu sumber untuk semuanya — termasuk untuk merender form di panel admin.
// ============================================================================

export type SiteSettings = Record<string, string>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  // ── Hero beranda ──────────────────────────────────────────────────────────
  hero_headline: "Menghubungkan Riset Akademik & Inovasi Industri Terdepan",
  hero_subheadline:
    "UC Centers menghadirkan solusi kolaboratif melalui riset terapan berstandar internasional, konsultasi bisnis strategis, dan program pelatihan SDM profesional.",
  hero_image_url:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&q=80",

  // ── Trust strip ───────────────────────────────────────────────────────────
  stat1_number: "12",
  stat1_label: "CENTER OF EXCELLENCE",
  stat2_number: "500+",
  stat2_label: "PROYEK SELESAI",
  stat3_number: "300+",
  stat3_label: "MITRA KORPORASI",
  stat4_number: "20",
  stat4_label: "TAHUN PENGALAMAN",

  // ── Informasi kontak ──────────────────────────────────────────────────────
  // Dipakai bersama oleh kartu "Informasi Kantor Pusat" di /kontak dan blok
  // kontak di footer, supaya keduanya tidak pernah berbeda isi.
  contact_address: "Jl. CitraLand Boulevard, Made, Sambikerep, Surabaya, Jawa Timur 60219",
  contact_phone: "(031) 7451699",
  contact_email: "contact@uccenters.id",
  contact_hours: "Senin – Jumat: 08:00 – 17:00 WIB",
  contact_map_title: "UC Centers Headquarters",
  contact_map_subtitle: "Surabaya, Indonesia",
  // Titik peta di halaman Kontak. Nilai bawaan menunjuk kawasan CitraLand
  // Surabaya dan HANYA PERKIRAAN — ganti dengan koordinat gedung yang tepat
  // lewat panel admin.
  contact_map_lat: "-7.2839",
  contact_map_lng: "112.6318",
  // Kosongkan untuk memakai tautan Google Maps yang dibentuk dari koordinat.
  contact_map_url: "",
  // Kode sematan dari Google Maps ("Share → Embed a map"). Bila diisi, inilah
  // yang tampil; koordinat di atas hanya jadi cadangan.
  contact_map_embed: "",

  // ── Footer ────────────────────────────────────────────────────────────────
  footer_description:
    "Ekosistem terintegrasi pusat keunggulan riset terapan, konsultasi bisnis strategis, dan pengembangan kapasitas SDM profesional.",
  // Satu bidang per baris. Disimpan sebagai teks berbaris, bukan tabel
  // tersendiri: daftarnya pendek, tidak punya relasi ke data lain, dan tidak
  // perlu diurutkan/dicari — tabel baru hanya menambah kerumitan.
  footer_expertise: [
    "Riset & Transfer Teknologi",
    "Strategi & Transformasi Bisnis",
    "Kebijakan Publik & Governance",
    "Kemitraan & Akselerasi Industri",
  ].join("\n"),

  // ── Media sosial ──────────────────────────────────────────────────────────
  // Kosongkan salah satu untuk menyembunyikan ikonnya dari situs publik.
  social_instagram: "",
  social_youtube: "",
};

/**
 * Definisi form pengaturan di panel admin.
 *
 * Ditaruh di sini, bukan ditulis ulang sebagai puluhan `useState` di halaman
 * admin, supaya menambah satu pengaturan baru cukup dengan menambah satu baris
 * di file ini — form, nilai default, dan payload simpan ikut menyesuaikan.
 */
export type SettingField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "email" | "image";
  placeholder?: string;
  hint?: string;
  /** Lebar penuh pada grid dua kolom. */
  wide?: boolean;
};

export const SETTING_SECTIONS: {
  section: string;
  description: string;
  fields: SettingField[];
}[] = [
  {
    section: "Hero Beranda",
    description: "Judul, deskripsi, dan gambar utama di bagian paling atas beranda.",
    fields: [
      { key: "hero_headline", label: "Judul Utama", wide: true },
      { key: "hero_subheadline", label: "Deskripsi Pendukung", type: "textarea", wide: true },
      { key: "hero_image_url", label: "Foto Utama Hero", type: "image", wide: true },
    ],
  },
  {
    section: "Trust Strip",
    description: "Empat angka capaian yang tampil di bawah hero.",
    fields: [
      { key: "stat1_number", label: "Angka 1" },
      { key: "stat1_label", label: "Keterangan 1" },
      { key: "stat2_number", label: "Angka 2" },
      { key: "stat2_label", label: "Keterangan 2" },
      { key: "stat3_number", label: "Angka 3" },
      { key: "stat3_label", label: "Keterangan 3" },
      { key: "stat4_number", label: "Angka 4" },
      { key: "stat4_label", label: "Keterangan 4" },
    ],
  },
  {
    section: "Informasi Kontak",
    description:
      "Dipakai bersama oleh kartu di halaman Kontak dan blok kontak di footer — cukup diubah sekali di sini.",
    fields: [
      { key: "contact_address", label: "Alamat Utama", type: "textarea", wide: true },
      { key: "contact_phone", label: "Telepon" },
      { key: "contact_email", label: "Email Resmi", type: "email" },
      { key: "contact_hours", label: "Jam Operasional", wide: true },
      { key: "contact_map_title", label: "Judul pada Kartu Peta" },
      { key: "contact_map_subtitle", label: "Keterangan pada Kartu Peta" },
      {
        key: "contact_map_embed",
        label: "Sematan Google Maps",
        type: "textarea",
        wide: true,
        placeholder: '<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>',
        hint:
          "Cara termudah: buka Google Maps → cari lokasi → tombol Bagikan → tab " +
          "'Sematkan peta' → Salin HTML, lalu tempel di sini. Boleh seluruh kode " +
          "<iframe>. Bila diisi, peta Google inilah yang tampil lengkap dengan " +
          "tombol rute dan 'Open in Maps' miliknya sendiri.",
      },
      {
        key: "contact_map_lat",
        label: "Titik Peta — Lintang (latitude)",
        hint: "Cadangan bila kolom sematan di atas dikosongkan. Di Google Maps: klik kanan pada lokasi, lalu klik angka yang muncul. Angka PERTAMA.",
      },
      {
        key: "contact_map_lng",
        label: "Titik Peta — Bujur (longitude)",
        hint: "Angka KEDUA dari hasil klik kanan tadi.",
      },
      {
        key: "contact_map_url",
        label: "Tautan Google Maps (opsional)",
        type: "url",
        wide: true,
        placeholder: "https://maps.app.goo.gl/...",
        hint: "Kosongkan untuk memakai tautan yang dibentuk otomatis dari koordinat di atas.",
      },
    ],
  },
  {
    section: "Footer",
    description:
      "Teks yang tampil di bagian bawah setiap halaman publik.",
    fields: [
      {
        key: "footer_description",
        label: "Deskripsi Singkat UC Centers",
        type: "textarea",
        wide: true,
        hint: "Paragraf di bawah logo pada footer.",
      },
      {
        key: "footer_expertise",
        label: "Bidang Keahlian",
        type: "textarea",
        wide: true,
        hint: "Satu bidang per baris. Baris kosong diabaikan; hapus semua baris untuk menyembunyikan kolom ini dari footer.",
      },
    ],
  },
  {
    section: "Media Sosial",
    description:
      "Isi alamat lengkap profilnya. Kolom yang dikosongkan tidak akan tampil di situs.",
    fields: [
      {
        key: "social_instagram",
        label: "Instagram",
        type: "url",
        placeholder: "https://instagram.com/uccenters",
        hint: "Kosongkan untuk menyembunyikan ikon Instagram.",
      },
      {
        key: "social_youtube",
        label: "YouTube",
        type: "url",
        placeholder: "https://youtube.com/@uccenters",
        hint: "Kosongkan untuk menyembunyikan ikon YouTube.",
      },
    ],
  },
];

/** Semua kunci yang boleh disimpan lewat panel. */
export const SETTING_KEYS = SETTING_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
