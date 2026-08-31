import React from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCachedData, setCachedData } from "@/lib/cache";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoMarquee } from "@/components/public/logo-marquee";
import { ArrowRight, Building, Award, Users, ShieldCheck, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const defaultFallbackCenters = [
  {
    id: "c1",
    name: "Center for Innovation & Tech Transfer",
    slug: "center-for-innovation",
    tagline: "Mendorong Akselerasi Riset & Komersialisasi Teknologi Masa Depan",
    logoUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop",
    _count: { projects: 18 },
    expertiseTags: [
      { tag: { id: "t1", name: "Inovasi Teknologi", colorHex: "#0b64b4" } },
      { tag: { id: "t2", name: "Pemasaran Digital", colorHex: "#d97706" } },
    ],
  },
  {
    id: "c2",
    name: "Business Strategy & Transformation Center",
    slug: "business-strategy-center",
    tagline: "Mitra Strategis Pendampingan Transformasi Bisnis Berkelanjutan",
    logoUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop",
    _count: { projects: 24 },
    expertiseTags: [
      { tag: { id: "t3", name: "Manajemen Strategis", colorHex: "#233e95" } },
      { tag: { id: "t4", name: "Kebijakan Publik", colorHex: "#003366" } },
    ],
  },
  {
    id: "c3",
    name: "Urban & Creative Design Institute",
    slug: "urban-creative-design",
    tagline: "Pusat Studi Desain Kreatif, Arsitektur Berkelanjutan & Media",
    logoUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200&h=200&fit=crop",
    _count: { projects: 15 },
    expertiseTags: [
      { tag: { id: "t5", name: "Desain & Kreatif", colorHex: "#7c3aed" } },
    ],
  },
];

const defaultFallbackProjects = [
  {
    id: "p1",
    title: "Transformasi Digital dan Otomatisasi Perbankan Nasional",
    slug: "transformasi-digital-bank-nasional",
    summary: "Pendampingan integrasi sistem AI & otomatisasi pelayanan nasabah pada 500+ cabang bank di Indonesia.",
    coverImageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=500&fit=crop",
    center: { name: "Center for Innovation & Tech Transfer" },
    expertiseTags: [
      { tag: { id: "t1", name: "Inovasi Teknologi", colorHex: "#0b64b4" } },
    ],
  },
  {
    id: "p2",
    title: "Penyusunan Masterplan Penerapan ESG Korporasi Energi",
    slug: "penyusunan-masterplan-esg-bumn",
    summary: "Perumusan kerangka kerja tata kelola lingkungan dan sosial untuk pencapaian Net Zero Emission 2050.",
    coverImageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop",
    center: { name: "Business Strategy & Transformation Center" },
    expertiseTags: [
      { tag: { id: "t3", name: "Manajemen Strategis", colorHex: "#233e95" } },
    ],
  },
];

const defaultPartnerLogos = [
  { id: "l1", name: "PT Ciputra Development Tbk", logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80" },
  { id: "l2", name: "PT Telkom Indonesia", logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300&q=80" },
  { id: "l3", name: "PT PLN (Persero)", logoUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80" },
  { id: "l4", name: "Bank Mandiri", logoUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&q=80" },
  { id: "l5", name: "Sinarmas Group", logoUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=80" },
];

export default async function HomePage() {
  let centers: any[] = [];
  let highlightedProjects: any[] = [];
  let partnerLogos: any[] = [];

  const siteSettings: Record<string, string> = { ...DEFAULT_SITE_SETTINGS };

  try {
    const dbSettings = await prisma.siteSetting.findMany();
    for (const s of dbSettings) {
      if (typeof s.value === "string") {
        siteSettings[s.key] = s.value;
      }
    }
  } catch (e) {
    console.warn("DB offline during settings query");
  }

  try {
    centers = (await getCachedData<any[]>("public:centers:homepage")) || [];
    if (centers.length === 0) {
      centers = await prisma.center.findMany({
        where: { isPublished: true },
        take: 6,
        include: {
          expertiseTags: { include: { tag: true } },
          _count: { select: { projects: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      if (centers.length > 0) {
        await setCachedData("public:centers:homepage", centers, 3600);
      }
    }
  } catch (e) {
    console.warn("DB offline during homepage center query");
  }

  try {
    highlightedProjects = (await getCachedData<any[]>("public:portfolio:homepage")) || [];
    if (highlightedProjects.length === 0) {
      highlightedProjects = await prisma.portfolioProject.findMany({
        where: { isPublished: true, isHighlighted: true },
        take: 3,
        include: {
          center: { select: { name: true } },
          expertiseTags: { include: { tag: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
      if (highlightedProjects.length > 0) {
        await setCachedData("public:portfolio:homepage", highlightedProjects, 3600);
      }
    }
  } catch (e) {
    console.warn("DB offline during homepage portfolio query");
  }

  try {
    partnerLogos = await prisma.clientLogo.findMany({
      orderBy: { sortOrder: "asc" },
    });
  } catch (e) {
    console.warn("DB offline during partner logos query");
  }

  // Fast Fallback Guarantee
  const finalCenters = centers.length > 0 ? centers : defaultFallbackCenters;
  const finalProjects = highlightedProjects.length > 0 ? highlightedProjects : defaultFallbackProjects;
  const finalLogos = partnerLogos.length > 0 ? partnerLogos : defaultPartnerLogos;

  return (
    <div className="space-y-20 pb-20">
      {/* Dynamic Hero Section */}
      <section className="relative pt-12 lg:pt-20 overflow-hidden bg-gradient-to-b from-white to-[#f9f9ff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Dynamic Headlines & Action */}
            <div className="animate-slide-left space-y-6 text-left lg:col-span-7">
              <h1 className="text-display text-[#003366]">
                {siteSettings.hero_headline}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {siteSettings.hero_subheadline}
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/center" className="group">
                  <Button size="lg" className="btn-sheen shadow-lg hover:shadow-xl">
                    <span>Jelajahi Center</span>
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="outline" size="lg">
                    Lihat Portfolio
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Dynamic Hero Image */}
            <div className="animate-slide-right relative delay-2 lg:col-span-5">
              {/* Bidang warna di belakang foto memberi kedalaman tanpa
                  menambah aset gambar baru. */}
              <div
                aria-hidden="true"
                className="absolute -right-4 -top-4 hidden h-24 w-24 rounded-2xl bg-[#0b64b4]/10 lg:block"
              />
              <div className="group relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border-4 border-white shadow-2xl lg:max-w-none">
                <Image
                  src={siteSettings.hero_image_url}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  className="media-zoom object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Trust Strip Counter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-rise delay-3 grid grid-cols-2 gap-8 divide-y divide-blue-800 rounded-2xl bg-[#003366] p-8 text-white shadow-xl md:grid-cols-4 md:divide-x md:divide-y-0">
          <div className="flex flex-col items-center text-center p-2">
            <Building className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-3xl sm:text-4xl font-extrabold text-white">{siteSettings.stat1_number}</span>
            <span className="text-xs sm:text-sm text-slate-300 font-medium mt-1 uppercase tracking-wider">{siteSettings.stat1_label}</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 pt-6 md:pt-2">
            <Award className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-3xl sm:text-4xl font-extrabold text-white">{siteSettings.stat2_number}</span>
            <span className="text-xs sm:text-sm text-slate-300 font-medium mt-1 uppercase tracking-wider">{siteSettings.stat2_label}</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 pt-6 md:pt-2">
            <Users className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-3xl sm:text-4xl font-extrabold text-white">{siteSettings.stat3_number}</span>
            <span className="text-xs sm:text-sm text-slate-300 font-medium mt-1 uppercase tracking-wider">{siteSettings.stat3_label}</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 pt-6 md:pt-2">
            <ShieldCheck className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-3xl sm:text-4xl font-extrabold text-white">{siteSettings.stat4_number}</span>
            <span className="text-xs sm:text-sm text-slate-300 font-medium mt-1 uppercase tracking-wider">{siteSettings.stat4_label}</span>
          </div>
        </div>
      </section>

      {/* Bento Grid: Center of Excellence */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#0b64b4]">Spesialisasi Multidisiplin</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#003366] mt-1">Center of Excellence</h2>
          </div>
          <Link href="/center" className="text-sm font-semibold text-[#0b64b4] hover:text-[#233e95] flex items-center gap-1">
            <span>Lihat Semua Center</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {finalCenters.map((center: any, index: number) => (
            <Card
              key={center.id}
              className="card-lift animate-rise flex flex-col justify-between group"
              style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center text-[#003366] font-bold text-lg">
                    {center.logoUrl ? (
                      <Image
                        src={center.logoUrl}
                        alt={center.name}
                        fill
                        sizes="48px"
                        className="media-zoom object-cover"
                      />
                    ) : (
                      center.name.charAt(0)
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {center._count?.projects || 0} Proyek
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#111c2d] group-hover:text-[#0b64b4] transition-colors line-clamp-2">
                    {center.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {center.tagline || "Pusat unggulan kepakaran dan konsultasi terapan."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {center.expertiseTags?.map((et: any) => (
                    <Badge key={et.tag.id} colorHex={et.tag.colorHex}>
                      {et.tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0b64b4]">
                <span>Detail & Layanan</span>
                <Link href={`/center/${center.slug}`} className="hover:underline flex items-center">
                  <span>Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Infinite Scrolling Logo Marquee Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pt-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0b64b4]">Kepercayaan Industri</span>
          <h3 className="text-xl font-bold text-[#003366]">Mitra Perusahaan & Korporasi Kerja Sama</h3>
        </div>

        {/* Continuous Left Marquee Banner */}
        <LogoMarquee logos={finalLogos} />
      </section>

      {/* Featured Portfolio Section */}
      <section className="bg-white py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#0b64b4]">Portofolio Unggulan</span>
            <h2 className="text-3xl font-extrabold text-[#003366]">Dampak Realisasi Kerja Sama</h2>
            <p className="text-slate-600 text-sm">
              Rangkaian proyek nyata bersama BUMN, kementerian, dan perusahaan swasta terkemuka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {finalProjects.map((project: any, index: number) => (
              <Card
                key={project.id}
                className="card-lift animate-rise group flex flex-col justify-between"
                style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
              >
                <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                  {project.coverImageUrl ? (
                    <Image
                      src={project.coverImageUrl}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Cover Image
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-3 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase text-[#0b64b4] tracking-wider">
                      {project.center?.name}
                    </span>
                    <h3 className="text-base font-bold text-[#111c2d] line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {project.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {project.expertiseTags?.map((et: any) => (
                      <Badge key={et.tag.id} colorHex={et.tag.colorHex}>
                        {et.tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link href="/portfolio">
              <Button variant="outline" size="lg">
                <span>Lihat Semua Proyek</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
