// ============================================================================
//  Seed UC Centers — dijalankan otomatis oleh docker/entrypoint.sh setiap
//  kontainer `app` start. Karena itu seluruh operasi WAJIB idempoten:
//  memakai upsert / guard, tidak boleh `create` polos yang menggandakan baris.
// ============================================================================
import { PrismaClient, HeroMediaType, ArticleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  ALL_PERMISSIONS,
  DEFAULT_CENTER_ADMIN_PERMISSIONS,
} from "../lib/permissions";
import { DEFAULT_SITE_SETTINGS } from "../lib/site-settings";

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin@uccenters.id")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Password123!";
const ADMIN_USERNAME = (process.env.SEED_ADMIN_USERNAME || "superadmin").trim().toLowerCase();

async function main() {
  console.log("[seed] Mulai seeding database UC Centers...");

  // ── 1. Role bawaan ────────────────────────────────────────────────────────
  // Daftar permission-nya di-sync dari lib/permissions.ts setiap seed jalan,
  // supaya menu yang baru ditambahkan otomatis terbuka untuk Super Admin tanpa
  // perlu diklik manual di panel.
  const superAdminRole = await prisma.role.upsert({
    where: { slug: "super-admin" },
    update: { permissions: ALL_PERMISSIONS, scope: "ALL_CENTERS", isSystem: true },
    create: {
      id: "role_super_admin",
      name: "Super Admin",
      slug: "super-admin",
      description: "Akses penuh ke seluruh center dan pengaturan sistem.",
      scope: "ALL_CENTERS",
      permissions: ALL_PERMISSIONS,
      isSystem: true,
    },
  });

  await prisma.role.upsert({
    where: { slug: "center-admin" },
    update: { scope: "OWN_CENTER", isSystem: true },
    // Permission role ini sengaja TIDAK ditimpa saat update: begitu admin
    // menyesuaikannya lewat panel, seed berikutnya tidak boleh mengembalikannya.
    create: {
      id: "role_center_admin",
      name: "Center Admin",
      slug: "center-admin",
      description: "Mengelola konten center yang ditugaskan saja.",
      scope: "OWN_CENTER",
      permissions: DEFAULT_CENTER_ADMIN_PERMISSIONS,
      isSystem: true,
    },
  });

  // ── 2. Super Admin ────────────────────────────────────────────────────────
  // passwordHash ikut di-update supaya SEED_ADMIN_PASSWORD di .env selalu jadi
  // sumber kebenaran. Sebelumnya `update: {}` membuat perubahan password di
  // .env diam-diam diabaikan pada database yang sudah ada isinya.
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, roleId: superAdminRole.id, isActive: true },
    create: {
      name: "Super Administrator",
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });
  console.log(`[seed] Admin siap: ${superAdmin.email} (username: ${superAdmin.username})`);

  // ── 3. Expertise tags ─────────────────────────────────────────────────────
  const tagsData = [
    { name: "Inovasi Teknologi", slug: "inovasi-teknologi", colorHex: "#0b64b4" },
    { name: "Manajemen Strategis", slug: "manajemen-strategis", colorHex: "#233e95" },
    { name: "Kebijakan Publik", slug: "kebijakan-publik", colorHex: "#003366" },
    { name: "Desain & Kreatif", slug: "desain-kreatif", colorHex: "#7c3aed" },
    { name: "Kesehatan & Biomedis", slug: "kesehatan-biomedis", colorHex: "#059669" },
    { name: "Pemasaran Digital", slug: "pemasaran-digital", colorHex: "#d97706" },
  ];

  const tagsMap = new Map<string, { id: string }>();
  for (const tag of tagsData) {
    const created = await prisma.expertiseTag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, colorHex: tag.colorHex },
      create: tag,
    });
    tagsMap.set(tag.slug, created);
  }
  const tagId = (slug: string): string => {
    const t = tagsMap.get(slug);
    if (!t) throw new Error(`[seed] ExpertiseTag "${slug}" tidak ditemukan`);
    return t.id;
  };

  // ── 4. Logo klien global (marquee Beranda) ────────────────────────────────
  // ClientLogo tidak punya kolom unique selain id sehingga upsert tak bisa
  // dipakai. Versi lama memakai `create` polos, jadi setiap restart kontainer
  // menambah 5 logo duplikat. Sekarang dijaga berdasarkan nama.
  const globalLogos = [
    { name: "PT Ciputra Development Tbk", logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80" },
    { name: "PT Telkom Indonesia", logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&q=80" },
    { name: "PT PLN (Persero)", logoUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80" },
    { name: "Bank Mandiri", logoUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&q=80" },
    { name: "Sinarmas Group", logoUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=80" },
  ];

  for (let i = 0; i < globalLogos.length; i++) {
    const item = globalLogos[i];
    const existing = await prisma.clientLogo.findFirst({
      where: { name: item.name, centerId: null },
    });
    if (existing) {
      await prisma.clientLogo.update({
        where: { id: existing.id },
        data: { logoUrl: item.logoUrl, sortOrder: i + 1 },
      });
    } else {
      await prisma.clientLogo.create({
        data: { name: item.name, logoUrl: item.logoUrl, sortOrder: i + 1 },
      });
    }
  }

  // ── 5. Centers ────────────────────────────────────────────────────────────
  const centersSeed = [
    {
      slug: "center-for-innovation",
      name: "Center for Innovation & Tech Transfer",
      tagline: "Mendorong Akselerasi Riset & Komersialisasi Teknologi Masa Depan",
      logoUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop",
      heroMediaType: HeroMediaType.IMAGE,
      heroMediaUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop",
      aboutContent:
        "<p>Center for Innovation &amp; Tech Transfer berkomitmen penuh dalam menghubungkan hasil riset akademik tingkat tinggi dengan industri riil. Kami mengelola akselerasi startup berbasis teknologi, paten riset, dan transfer teknologi skala nasional maupun internasional.</p>",
      services: [
        { title: "Komersialisasi Riset & Paten", description: "Pendampingan lisensi paten dan inkubasi teknologi tinggi.", sortOrder: 1 },
        { title: "Inkubasi Startup Deep-Tech", description: "Program pembimbingan startup tahap awal hingga siap investasi.", sortOrder: 2 },
      ],
      tags: ["inovasi-teknologi", "pemasaran-digital"],
      team: [
        { name: "Dr. Andi Wijaya", role: "Director", email: "andi.wijaya@uccenters.id", sortOrder: 1 },
        { name: "Rina Kusuma, M.T.", role: "Head of Tech Transfer", email: "rina.kusuma@uccenters.id", sortOrder: 2 },
      ],
    },
    {
      slug: "business-strategy-center",
      name: "Business Strategy & Transformation Center",
      tagline: "Mitra Strategis Pendampingan Transformasi Bisnis Berkelanjutan",
      logoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop",
      heroMediaType: HeroMediaType.VIDEO,
      heroMediaUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      aboutContent:
        "<p>Pusat Studi Strategi Bisnis memberikan konsultasi eksekutif untuk korporasi skala menengah hingga multinasional. Fokus kami mencakup restrukturisasi organisasi dan ESG.</p>",
      services: [
        { title: "Konsultasi Perencanaan Strategis", description: "Penyusunan peta jalan korporasi jangka panjang 5-10 tahun.", sortOrder: 1 },
        { title: "Asesmen & Pelaporan ESG", description: "Pemetaan risiko keberlanjutan dan penyusunan laporan ESG.", sortOrder: 2 },
      ],
      tags: ["manajemen-strategis", "kebijakan-publik"],
      team: [{ name: "Prof. Sari Handayani", role: "Lead Strategist", email: "sari.handayani@uccenters.id", sortOrder: 1 }],
    },
    {
      // Center ke-3 ditambahkan agar isi database nyata cocok dengan data
      // fallback statis di app/(public)/page.tsx dan /portfolio.
      slug: "urban-creative-design",
      name: "Urban & Creative Design Institute",
      tagline: "Pusat Studi Desain Kreatif, Arsitektur Berkelanjutan & Media",
      logoUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200&h=200&fit=crop",
      heroMediaType: HeroMediaType.IMAGE,
      heroMediaUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=600&fit=crop",
      aboutContent:
        "<p>Urban &amp; Creative Design Institute menggabungkan riset arsitektur berkelanjutan, desain produk, dan media kreatif untuk menghadirkan solusi ruang kota yang manusiawi.</p>",
      services: [
        { title: "Perancangan Kawasan Berkelanjutan", description: "Studi kelayakan dan masterplan kawasan rendah karbon.", sortOrder: 1 },
        { title: "Branding & Media Kreatif", description: "Pengembangan identitas visual institusi dan kampanye publik.", sortOrder: 2 },
      ],
      tags: ["desain-kreatif", "inovasi-teknologi"],
      team: [{ name: "Ir. Bagus Prakoso", role: "Principal Designer", email: "bagus.prakoso@uccenters.id", sortOrder: 1 }],
    },
  ];

  const centerIdBySlug = new Map<string, string>();

  for (const c of centersSeed) {
    const center = await prisma.center.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        tagline: c.tagline,
        logoUrl: c.logoUrl,
        heroMediaType: c.heroMediaType,
        heroMediaUrl: c.heroMediaUrl,
        aboutContent: c.aboutContent,
        isPublished: true,
      },
      create: {
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        logoUrl: c.logoUrl,
        heroMediaType: c.heroMediaType,
        heroMediaUrl: c.heroMediaUrl,
        aboutContent: c.aboutContent,
        isPublished: true,
      },
    });
    centerIdBySlug.set(c.slug, center.id);

    // Relasi & anak tanpa kolom unique alami: tulis ulang penuh supaya tidak
    // menumpuk saat seed dijalankan berkali-kali.
    await prisma.centerExpertise.deleteMany({ where: { centerId: center.id } });
    await prisma.centerExpertise.createMany({
      data: c.tags.map((slug) => ({ centerId: center.id, tagId: tagId(slug) })),
      skipDuplicates: true,
    });

    await prisma.centerService.deleteMany({ where: { centerId: center.id } });
    await prisma.centerService.createMany({
      data: c.services.map((s) => ({ ...s, centerId: center.id })),
    });

    await prisma.teamMember.deleteMany({ where: { centerId: center.id } });
    await prisma.teamMember.createMany({
      data: c.team.map((t) => ({ ...t, centerId: center.id })),
    });
  }

  const centerId = (slug: string): string => {
    const id = centerIdBySlug.get(slug);
    if (!id) throw new Error(`[seed] Center "${slug}" tidak ditemukan`);
    return id;
  };

  // ── 6. Portfolio ──────────────────────────────────────────────────────────
  const projectsSeed = [
    {
      slug: "digitalisasi-rantai-pasok-manufaktur",
      centerSlug: "center-for-innovation",
      title: "Digitalisasi Rantai Pasok Manufaktur Nasional",
      summary: "Implementasi sistem prediksi permintaan berbasis machine learning untuk 42 gudang regional.",
      coverImageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
      tags: ["inovasi-teknologi"],
    },
    {
      slug: "transformasi-esg-korporasi-energi",
      centerSlug: "business-strategy-center",
      title: "Transformasi ESG Korporasi Energi",
      summary: "Penyusunan peta jalan dekarbonisasi dan pelaporan keberlanjutan sesuai standar GRI.",
      coverImageUrl: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&q=80",
      tags: ["manajemen-strategis", "kebijakan-publik"],
    },
    {
      slug: "revitalisasi-kawasan-heritage-kota-lama",
      centerSlug: "urban-creative-design",
      title: "Revitalisasi Kawasan Heritage Kota Lama",
      summary: "Masterplan adaptif untuk kawasan cagar budaya dengan pendekatan wisata berkelanjutan.",
      coverImageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
      tags: ["desain-kreatif"],
    },
  ];

  for (const p of projectsSeed) {
    const project = await prisma.portfolioProject.upsert({
      where: { slug: p.slug },
      update: {
        centerId: centerId(p.centerSlug),
        title: p.title,
        summary: p.summary,
        coverImageUrl: p.coverImageUrl,
        isHighlighted: true,
        isPublished: true,
      },
      create: {
        centerId: centerId(p.centerSlug),
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        coverImageUrl: p.coverImageUrl,
        caseStudyContent: `<p>${p.summary}</p>`,
        isHighlighted: true,
        isPublished: true,
      },
    });

    await prisma.projectExpertise.deleteMany({ where: { projectId: project.id } });
    await prisma.projectExpertise.createMany({
      data: p.tags.map((slug) => ({ projectId: project.id, tagId: tagId(slug) })),
      skipDuplicates: true,
    });
  }

  // ── 7. Kategori & artikel ─────────────────────────────────────────────────
  const category = await prisma.articleCategory.upsert({
    where: { slug: "riset-inovasi" },
    update: { name: "Riset & Inovasi" },
    create: { name: "Riset & Inovasi", slug: "riset-inovasi" },
  });

  const articlesSeed = [
    {
      slug: "peran-universitas-dalam-hilirisasi-riset",
      title: "Peran Universitas dalam Hilirisasi Riset Nasional",
      summary: "Mengapa transfer teknologi kampus menjadi kunci daya saing industri Indonesia.",
      coverImageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
    },
    {
      slug: "membangun-strategi-esg-yang-terukur",
      title: "Membangun Strategi ESG yang Terukur",
      summary: "Kerangka praktis menyusun target keberlanjutan yang bisa diaudit.",
      coverImageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    },
  ];

  for (const a of articlesSeed) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: {
        title: a.title,
        summary: a.summary,
        coverImageUrl: a.coverImageUrl,
        categoryId: category.id,
        status: ArticleStatus.PUBLISHED,
      },
      create: {
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        content: `<p>${a.summary}</p><p>Artikel contoh hasil seeding. Silakan sunting melalui panel admin.</p>`,
        coverImageUrl: a.coverImageUrl,
        categoryId: category.id,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: superAdmin.id,
      },
    });
  }

  // ── 8. Site settings (konten beranda, kontak, media sosial) ───────────────
  // Sumbernya lib/site-settings.ts, jadi menambah pengaturan baru di sana
  // otomatis ikut ter-seed di database yang baru.
  for (const [key, value] of Object.entries(DEFAULT_SITE_SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {}, // jangan timpa perubahan yang dibuat admin lewat panel
      create: { key, value },
    });
  }

  console.log("[seed] Selesai tanpa error.");
}

main()
  .catch((e) => {
    // Versi lama hanya console.error lalu tetap exit 0, sehingga seed yang
    // gagal terlihat "sukses" di log kontainer.
    console.error("[seed] GAGAL:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
