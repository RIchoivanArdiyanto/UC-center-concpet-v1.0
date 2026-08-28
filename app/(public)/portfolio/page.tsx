import React from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCachedData, setCachedData } from "@/lib/redis";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/ui/video-player";

export const dynamic = "force-dynamic";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: { center?: string; tag?: string };
}) {
  const centerFilter = searchParams?.center || "";
  const tagFilter = searchParams?.tag || "";

  let data: { projects: any[]; centers: any[]; tags: any[] } = {
    projects: [],
    centers: [],
    tags: [],
  };

  try {
    const cacheKey = `public:portfolio:list:${centerFilter}:${tagFilter}`;
    const cached = await getCachedData<{ projects: any[]; centers: any[]; tags: any[] }>(cacheKey);

    if (cached) {
      data = cached;
    } else {
      const centers = await prisma.center.findMany({
        where: { isPublished: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      });

      const tags = await prisma.expertiseTag.findMany({
        orderBy: { name: "asc" },
      });

      const projects = await prisma.portfolioProject.findMany({
        where: {
          isPublished: true,
          AND: [
            centerFilter ? { center: { slug: centerFilter } } : {},
            tagFilter ? { expertiseTags: { some: { tag: { slug: tagFilter } } } } : {},
          ],
        },
        include: {
          center: { select: { name: true, slug: true } },
          expertiseTags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      data = { projects, centers, tags };
      await setCachedData(cacheKey, data, 3600);
    }
  } catch (err) {
    console.warn("DB connection offline during portfolio render");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3 text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-[#0b64b4]">Showcase Proyek</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003366]">Portfolio Implementasi Industri</h1>
        <p className="text-slate-600 text-sm">
          Bukti nyata kontribusi riset terapan dan konsultasi strategis UC Centers dalam menyelesaikan tantangan nyata di sektor publik dan swasta.
        </p>
      </div>

      {/* Dual-Tier Filter System */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Tier 1: Filter by Center */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Pilih Center:</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <Link
              href="/portfolio"
              className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors ${
                !centerFilter ? "bg-[#003366] text-white border-[#003366]" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Semua Center
            </Link>
            {data.centers.map((c: any) => (
              <Link
                key={c.id}
                href={`/portfolio?center=${c.slug}${tagFilter ? `&tag=${tagFilter}` : ""}`}
                className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors ${
                  centerFilter === c.slug ? "bg-[#0b64b4] text-white border-[#0b64b4]" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Tier 2: Filter by Expertise Tag */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Bidang Keahlian:</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <Link
              href={`/portfolio${centerFilter ? `?center=${centerFilter}` : ""}`}
              className={`px-3 py-1.5 rounded-full border font-medium whitespace-nowrap transition-colors ${
                !tagFilter ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Semua Tag
            </Link>
            {data.tags.map((t: any) => (
              <Link
                key={t.id}
                href={`/portfolio?${centerFilter ? `center=${centerFilter}&` : ""}tag=${t.slug}`}
                className={`px-3 py-1.5 rounded-full border font-medium whitespace-nowrap transition-colors ${
                  tagFilter === t.slug ? "bg-[#233e95] text-white border-[#233e95]" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Project Grid */}
      {data.projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
          <p className="text-slate-500 text-sm font-medium">Tidak ada proyek yang sesuai dengan filter.</p>
          <Link href="/portfolio" className="text-xs font-semibold text-[#0b64b4] hover:underline">
            Reset Semua Filter
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.projects.map((project: any) => (
            <Card key={project.id} className="flex flex-col justify-between hover:-translate-y-1 group">
              <div>
                {/* Image or Video Embed */}
                {project.videoEmbedUrl ? (
                  <VideoPlayer url={project.videoEmbedUrl} title={project.title} />
                ) : (
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
                )}

                <div className="p-6 space-y-3">
                  <span className="text-[11px] font-bold uppercase text-[#0b64b4] tracking-wider block">
                    {project.center?.name}
                  </span>
                  <h3 className="text-lg font-bold text-[#111c2d] line-clamp-2 leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {project.summary}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.expertiseTags?.map((et: any) => (
                      <Badge key={et.tag.id} colorHex={et.tag.colorHex}>
                        {et.tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
