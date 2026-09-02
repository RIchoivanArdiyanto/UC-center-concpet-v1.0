import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";
import { getCachedData, setCachedData } from "@/lib/cache";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/ui/video-player";
import { CenterDetailActions } from "./actions";
import { TeamList } from "./team-list";
import { ChevronRight, CheckCircle2, Users, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CenterDetailPage({ params }: { params: { slug: string } }) {
  let center: any = null;

  try {
    const cacheKey = `public:centers:detail:${params.slug}`;
    center = await getCachedData<any>(cacheKey);

    if (!center) {
      center = await prisma.center.findUnique({
        where: { slug: params.slug, isPublished: true },
        include: {
          expertiseTags: { include: { tag: true } },
          services: { orderBy: { sortOrder: "asc" } },
          team: { orderBy: { sortOrder: "asc" } },
          clientLogos: { orderBy: { sortOrder: "asc" } },
          projects: {
            where: { isPublished: true },
            include: { expertiseTags: { include: { tag: true } } },
            take: 3,
          },
        },
      });

      if (center) {
        await setCachedData(cacheKey, center, 3600);
      }
    }
  } catch (err) {
    console.warn("DB connection offline during center detail render");
  }

  if (!center) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#003366]">Center Tidak Ditemukan</h1>
        <p className="text-sm text-slate-500">Center ini tidak tersedia atau database belum terkoneksi.</p>
        <Link href="/center" className="text-xs font-semibold text-[#0b64b4] hover:underline">
          Kembali ke Direktori
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Breadcrumb & Hero */}
      <section className="bg-gradient-to-b from-white to-[#f9f9ff] pt-8 pb-12 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/" className="hover:text-[#0b64b4]">Beranda</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/center" className="hover:text-[#0b64b4]">Direktori</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-semibold truncate max-w-xs sm:max-w-none">{center.name}</span>
          </nav>

          {/* Hero Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#003366] font-bold text-2xl overflow-hidden shadow-sm">
                  {center.logoUrl ? (
                    <Image src={center.logoUrl} alt={center.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    center.name?.charAt(0) || "C"
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold text-[#003366]">{center.name}</h1>
                  <p className="text-sm font-semibold text-[#0b64b4] mt-0.5">{center.tagline}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {center.expertiseTags?.map((et: any) => (
                  <Badge key={et.tag.id} colorHex={et.tag.colorHex}>
                    {et.tag.name}
                  </Badge>
                ))}
              </div>

              {/* Action Buttons Client Wrapper */}
              <CenterDetailActions
                centerId={center.id}
                centerName={center.name}
                profilePdfUrl={center.profilePdfUrl}
              />
            </div>

            {/* Media Highlight (Image or Video Embed) */}
            <div className="lg:col-span-4">
              {center.heroMediaType === "VIDEO" && center.heroMediaUrl ? (
                <VideoPlayer url={center.heroMediaUrl} title={center.name} />
              ) : center.heroMediaUrl ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-200">
                  <Image
                    src={center.heroMediaUrl}
                    alt={center.name}
                    fill
                    sizes="(max-width: 1200px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-2xl font-bold text-[#003366]">Tentang Center</h2>
            <div
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base"
              // Dibersihkan di server — lihat catatan di lib/sanitize.ts.
              dangerouslySetInnerHTML={{
                __html:
                  sanitizeRichText(center.aboutContent) ||
                  "<p>Informasi detail mengenai center ini sedang dalam peremajaan.</p>",
              }}
            />

            {/* Services Grid */}
            {center.services?.length > 0 && (
              <div className="pt-6 space-y-6 border-t border-slate-200">
                <h3 className="text-xl font-bold text-[#003366]">Layanan & Kepakaran Utama</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {center.services.map((service: any) => (
                    <Card key={service.id} className="p-5 border-l-4 border-l-[#0b64b4]">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0b64b4] flex items-center justify-center font-bold text-sm mb-3">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-base text-[#111c2d] mb-1">{service.title}</h4>
                      <p className="text-xs text-slate-600">{service.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info & Team */}
          <div className="lg:col-span-4 space-y-6">
            {/* Team Members */}
            {center.team?.length > 0 && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Users className="w-5 h-5 text-[#0b64b4]" />
                  <h3 className="font-bold text-base text-[#111c2d]">Pengurus Center</h3>
                </div>
                {/* Klik nama anggota untuk membuka emailnya beserta tombol salin. */}
                <TeamList members={center.team} />
              </Card>
            )}

            {/* Client Logos */}
            {center.clientLogos?.length > 0 && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building2 className="w-5 h-5 text-[#0b64b4]" />
                  <h3 className="font-bold text-base text-[#111c2d]">Mitra Strategis</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {center.clientLogos.map((client: any) => (
                    <div key={client.id} className="relative aspect-[3/1] bg-slate-50 border rounded-lg p-2 flex items-center justify-center">
                      <Image src={client.logoUrl} alt={client.name} fill sizes="100px" className="object-contain p-1" />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
