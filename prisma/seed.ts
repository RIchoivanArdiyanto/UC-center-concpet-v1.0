import { PrismaClient, AdminRole, HeroMediaType, LeadSource, LeadStatus, ArticleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding UC Centers database...');

  // 1. Create Super Admin User
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@uccenters.id' },
    update: {},
    create: {
      name: 'Super Administrator',
      email: 'admin@uccenters.id',
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  // 2. Create Expertise Tags
  const tagsData = [
    { name: 'Inovasi Teknologi', slug: 'inovasi-teknologi', colorHex: '#0b64b4' },
    { name: 'Manajemen Strategis', slug: 'manajemen-strategis', colorHex: '#233e95' },
    { name: 'Kebijakan Publik', slug: 'kebijakan-publik', colorHex: '#003366' },
    { name: 'Desain & Kreatif', slug: 'desain-kreatif', colorHex: '#7c3aed' },
    { name: 'Kesehatan & Biomedis', slug: 'kesehatan-biomedis', colorHex: '#059669' },
    { name: 'Pemasaran Digital', slug: 'pemasaran-digital', colorHex: '#d97706' },
  ];

  const tagsMap = new Map();
  for (const tag of tagsData) {
    const created = await prisma.expertiseTag.upsert({
      where: { slug: tag.slug },
      update: { colorHex: tag.colorHex },
      create: tag,
    });
    tagsMap.set(tag.slug, created);
  }

  // 3. Create Global Client Logos for Infinite Marquee Banner
  const globalLogos = [
    { name: 'PT Ciputra Development Tbk', logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80' },
    { name: 'PT Telkom Indonesia', logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&q=80' },
    { name: 'PT PLN (Persero)', logoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80' },
    { name: 'Bank Mandiri', logoUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&q=80' },
    { name: 'Sinarmas Group', logoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=80' },
  ];

  for (let i = 0; i < globalLogos.length; i++) {
    const item = globalLogos[i];
    await prisma.clientLogo.create({
      data: {
        name: item.name,
        logoUrl: item.logoUrl,
        sortOrder: i + 1,
      },
    });
  }

  // 4. Create Core Centers
  const center1 = await prisma.center.upsert({
    where: { slug: 'center-for-innovation' },
    update: {},
    create: {
      name: 'Center for Innovation & Tech Transfer',
      slug: 'center-for-innovation',
      tagline: 'Mendorong Akselerasi Riset & Komersialisasi Teknologi Masa Depan',
      logoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop',
      heroMediaType: HeroMediaType.IMAGE,
      heroMediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop',
      aboutContent: `
        <p>Center for Innovation & Tech Transfer berkomitmen penuh dalam menghubungkan hasil riset akademik tingkat tinggi dengan industri riil. Kami mengelola akselerasi startup berbasis teknologi, paten riset, dan transfer teknologi skala nasional maupun internasional.</p>
      `,
      isPublished: true,
      services: {
        create: [
          { title: 'Komersialisasi Riset & Paten', description: 'Pendampingan lisensi paten dan inkubasi teknologi tinggi.', sortOrder: 1 },
          { title: 'Inkubasi Startup Deep-Tech', description: 'Program pembimbingan startup tahap awal hingga siap investasi.', sortOrder: 2 },
        ],
      },
      expertiseTags: {
        create: [
          { tagId: tagsMap.get('inovasi-teknologi').id },
          { tagId: tagsMap.get('pemasaran-digital').id },
        ],
      },
    },
  });

  const center2 = await prisma.center.upsert({
    where: { slug: 'business-strategy-center' },
    update: {},
    create: {
      name: 'Business Strategy & Transformation Center',
      slug: 'business-strategy-center',
      tagline: 'Mitra Strategis Pendampingan Transformasi Bisnis Berkelanjutan',
      logoUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop',
      heroMediaType: HeroMediaType.VIDEO,
      heroMediaUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      aboutContent: `
        <p>Pusat Studi Strategi Bisnis memberikan konsultasi eksekutif untuk korporasi skala menengah hingga multinasional. Fokus kami mencakup restrukturisasi organisasi dan ESG.</p>
      `,
      isPublished: true,
      services: {
        create: [
          { title: 'Konsultasi Perencanaan Strategis', description: 'Penyusunan peta jalan korporasi jangka panjang 5-10 tahun.', sortOrder: 1 },
        ],
      },
      expertiseTags: {
        create: [
          { tagId: tagsMap.get('manajemen-strategis').id },
          { tagId: tagsMap.get('kebijakan-publik').id },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
