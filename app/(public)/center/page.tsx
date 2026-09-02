import React from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCachedData, setCachedData } from "@/lib/cache";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CenterDirectoryPage({
  searchParams,
}: {
  searchParams?: { q?: string; tag?: string; sort?: string };
}) {
  const query = searchParams?.q || "";
  const tagFilter = searchParams?.tag || "";
  const sort = searchParams?.sort || "newest";

  let data: { centers: any[]; tags: any[] } = { centers: [], tags: [] };

  try {
    const cacheKey = `public:centers:dir:${query}:${tagFilter}:${sort}`;
    const cached = await getCachedData<{ centers: any[]; tags: any[] }>(cacheKey);
    if (cached) {
      data = cached;
    } else {
      const tags = await prisma.expertiseTag.findMany({
        orderBy: { name: "asc" },
      });

      let orderBy: any = { createdAt: "desc" };
      if (sort === "a-z") orderBy = { name: "asc" };
      if (sort === "z-a") orderBy = { name: "desc" };

      const centers = await prisma.center.findMany({
        where: {
          isPublished: true,
          AND: [
            query
              ? {
                  OR: [
                    // `mode: "insensitive"` khusus PostgreSQL dan ditolak MySQL.
                    // Tidak diperlukan di sini: kolasi utf8mb4_unicode_ci yang
                    // dipakai database ini sudah membandingkan tanpa
                    // membedakan huruf besar-kecil.
                    { name: { contains: query } },
                    { tagline: { contains: query } },
                    { aboutContent: { contains: query } },
                  ],
                }
              : {},
            tagFilter
              ? {
                  expertiseTags: {
                    some: { tag: { slug: tagFilter } },
                  },
                }
              : {},
          ],
        },
        include: {
          expertiseTags: { include: { tag: true } },
          services: { take: 3 },
          _count: { select: { projects: true, team: true } },
        },
        orderBy,
        // Batasi agar direktori tidak memuat seluruh isi tabel sekaligus.
        take: 60,
      });

      data = { centers: centers as any, tags: tags as any };
      await setCachedData(cacheKey, data, 3600);
    }
  } catch (e) {
    console.warn("DB offline during render");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#0b64b4]">Eksplorasi Kepakaran</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003366]">Direktori Center of Excellence</h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Temukan pusat studi dan keunggulan spesifik yang sesuai dengan kebutuhan riset, konsultasi bisnis, maupun pengembangan SDM organisasi Anda.
        </p>
      </div>

      {/* Sticky Filter & Search Bar */}
      <div className="sticky top-[80px] z-30 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-md border border-slate-200 space-y-4">
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <label htmlFor="cari-center" className="sr-only">
              Cari center, bidang kepakaran, atau kata kunci
            </label>
            <input
              id="cari-center"
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Cari center, bidang kepakaran, atau kata kunci..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500 hidden sm:inline-block" />
            <select
              name="sort"
              defaultValue={sort}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0b64b4]"
            >
              <option value="newest">Terbaru</option>
              <option value="a-z">Nama (A-Z)</option>
              <option value="z-a">Nama (Z-A)</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Expertise Tag Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <Link
            href="/center"
            className={`px-3 py-1.5 rounded-full border font-medium whitespace-nowrap transition-colors ${
              !tagFilter ? "bg-[#003366] text-white border-[#003366]" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Semua Expertise
          </Link>
          {data.tags.map((tag: any) => (
            <Link
              key={tag.id}
              href={`/center?tag=${tag.slug}`}
              className={`px-3 py-1.5 rounded-full border font-medium whitespace-nowrap transition-colors ${
                tagFilter === tag.slug
                  ? "bg-[#0b64b4] text-white border-[#0b64b4]"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Directory Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Menampilkan <strong className="text-slate-800">{data.centers.length}</strong> Center</span>
      </div>

      {/* Bento Grid */}
      {data.centers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
          <p className="text-slate-500 text-sm font-medium">Tidak ada center yang cocok dengan pencarian Anda.</p>
          <Link href="/center" className="text-xs font-semibold text-[#0b64b4] hover:underline">
            Reset Filter
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.centers.map((center: any, index: number) => (
            <Card
              key={center.id}
              className="card-lift animate-rise flex flex-col justify-between group"
              style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center text-[#003366] font-bold text-xl">
                    {center.logoUrl ? (
                      <Image
                        src={center.logoUrl}
                        alt={center.name}
                        fill
                        sizes="56px"
                        className="media-zoom object-cover"
                      />
                    ) : (
                      center.name.charAt(0)
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-medium">
                    <div>{center._count?.projects || 0} Proyek</div>
                    <div>{center._count?.team || 0} Pengurus</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#111c2d] group-hover:text-[#0b64b4] transition-colors line-clamp-2">
                    {center.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {center.tagline || "Pusat studi & konsultasi profesional terintegrasi."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {center.expertiseTags?.map((et: any) => (
                    <Badge key={et.tag.id} colorHex={et.tag.colorHex}>
                      {et.tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0b64b4]">
                <span>Profil & Layanan Lengkap</span>
                <Link href={`/center/${center.slug}`} className="hover:underline flex items-center">
                  <span>Lihat Detail</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
