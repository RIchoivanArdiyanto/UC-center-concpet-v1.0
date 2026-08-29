// ============================================================================
//  Katalog hak akses (permission).
//
//  Kunci di sini adalah satu-satunya sumber kebenaran: dipakai untuk merender
//  checkbox di panel Role, untuk mengunci menu sidebar, dan untuk menjaga route
//  API. Menambah menu baru berarti menambah kunci di sini, bukan menyebar
//  pengecekan `role === "SUPER_ADMIN"` ke mana-mana seperti sebelumnya.
// ============================================================================

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",

  CENTERS_VIEW: "centers.view",
  CENTERS_MANAGE: "centers.manage",

  PORTFOLIO_VIEW: "portfolio.view",
  PORTFOLIO_MANAGE: "portfolio.manage",

  ARTICLES_VIEW: "articles.view",
  ARTICLES_MANAGE: "articles.manage",

  CLIENTS_MANAGE: "clients.manage",
  EXPERTISE_MANAGE: "expertise.manage",

  LEADS_VIEW: "leads.view",
  LEADS_MANAGE: "leads.manage",

  HOMEPAGE_MANAGE: "homepage.manage",

  ACTIVITY_VIEW: "activity.view",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Dikelompokkan untuk tampilan form Role di panel admin. */
export const PERMISSION_GROUPS: {
  group: string;
  items: { key: Permission; label: string; hint?: string }[];
}[] = [
  {
    group: "Umum",
    items: [{ key: PERMISSIONS.DASHBOARD_VIEW, label: "Lihat dashboard" }],
  },
  {
    group: "Center",
    items: [
      { key: PERMISSIONS.CENTERS_VIEW, label: "Lihat daftar center" },
      { key: PERMISSIONS.CENTERS_MANAGE, label: "Tambah / ubah / hapus center" },
    ],
  },
  {
    group: "Portfolio",
    items: [
      { key: PERMISSIONS.PORTFOLIO_VIEW, label: "Lihat portfolio" },
      { key: PERMISSIONS.PORTFOLIO_MANAGE, label: "Tambah / ubah / hapus proyek" },
    ],
  },
  {
    group: "Artikel",
    items: [
      { key: PERMISSIONS.ARTICLES_VIEW, label: "Lihat artikel" },
      { key: PERMISSIONS.ARTICLES_MANAGE, label: "Tulis / ubah / publikasikan artikel" },
    ],
  },
  {
    group: "Konten & Master Data",
    items: [
      { key: PERMISSIONS.CLIENTS_MANAGE, label: "Kelola logo mitra klien" },
      { key: PERMISSIONS.EXPERTISE_MANAGE, label: "Kelola taksonomi keahlian" },
      { key: PERMISSIONS.HOMEPAGE_MANAGE, label: "Kelola konten beranda" },
    ],
  },
  {
    group: "Leads",
    items: [
      { key: PERMISSIONS.LEADS_VIEW, label: "Lihat permohonan masuk" },
      { key: PERMISSIONS.LEADS_MANAGE, label: "Ubah status & tindak lanjut lead" },
    ],
  },
  {
    group: "Sistem",
    items: [
      { key: PERMISSIONS.ACTIVITY_VIEW, label: "Lihat activity log" },
      {
        key: PERMISSIONS.USERS_MANAGE,
        label: "Kelola user",
        hint: "Membuat akun login untuk orang lain",
      },
      {
        key: PERMISSIONS.ROLES_MANAGE,
        label: "Kelola role & hak akses",
        hint: "Hati-hati: pemilik izin ini dapat memperluas aksesnya sendiri",
      },
    ],
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.key)
);

/** Preset hak akses role bawaan; dipakai seed dan migrasi. */
export const DEFAULT_CENTER_ADMIN_PERMISSIONS: Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.CENTERS_VIEW,
  PERMISSIONS.CENTERS_MANAGE,
  PERMISSIONS.PORTFOLIO_VIEW,
  PERMISSIONS.PORTFOLIO_MANAGE,
  PERMISSIONS.ARTICLES_VIEW,
  PERMISSIONS.ARTICLES_MANAGE,
  PERMISSIONS.LEADS_VIEW,
  PERMISSIONS.LEADS_MANAGE,
];

export function isValidPermission(key: string): key is Permission {
  return (ALL_PERMISSIONS as string[]).includes(key);
}

/** Buang kunci yang tidak dikenal supaya data role tetap bersih. */
export function sanitizePermissions(input: unknown): Permission[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.filter((k): k is Permission => typeof k === "string" && isValidPermission(k))));
}
