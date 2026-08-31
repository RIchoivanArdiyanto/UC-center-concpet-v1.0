import React from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, FileText, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams?: { cat?: string };
}) {
  const categoryFilter = searchParams?.cat || "";

  let categories: any[] = [];
  let articles: any[] = [];

  try {
    categories = await prisma.articleCategory.findMany({
      orderBy: { name: "asc" },
    });

    articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        ...(categoryFilter ? { category: { slug: categoryFilter } } : {}),
      },
      include: {
        category: true,
        author: { select: { name: true } },
        _count: { select: { attachments: true } },
      },
      orderBy: { publishedAt: "desc" },
      // Tanpa batas, halaman ini memuat SELURUH artikel yang pernah terbit
      // dalam satu request — makin lama makin berat dan akhirnya timeout.
      take: 30,
    });
  } catch (err) {
    console.warn("DB connection offline during articles render");
  }

  const featuredArticle = articles[0];
  const regularArticles = articles.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header & Categories */}
      <div className="space-y-6 text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-[#0b64b4]">Wawasan & Berita</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003366]">Artikel & Publications</h1>
        <p className="text-slate-600 text-sm">
          Analisis strategis, laporan riset terbaru, dan artikel opini dari para pakar UC Centers.
        </p>

        {/* Category Chips */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 text-xs">
          <Link
            href="/artikel"
            className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
              !categoryFilter ? "bg-[#003366] text-white border-[#003366]" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Semua Kategori
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/artikel?cat=${c.slug}`}
              className={`px-3 py-1.5 rounded-full border font-medium transition-colors ${
                categoryFilter === c.slug ? "bg-[#0b64b4] text-white border-[#0b64b4]" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Article Card */}
      {featuredArticle && !categoryFilter && (
        <Card className="card-lift animate-rise group overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 relative aspect-video lg:aspect-auto min-h-[260px]">
              {featuredArticle.coverImageUrl ? (
                <Image
                  src={featuredArticle.coverImageUrl}
                  alt={featuredArticle.title}
                  fill
                  priority
                  sizes="(max-width: 1200px) 100vw, 60vw"
                  className="media-zoom object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                  No Cover
                </div>
              )}
            </div>

            <div className="lg:col-span-5 p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{featuredArticle.category?.name || "Artikel"}</Badge>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 5 mnt baca
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#111c2d] hover:text-[#0b64b4] transition-colors leading-snug">
                  <Link href={`/artikel/${featuredArticle.slug}`}>{featuredArticle.title}</Link>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {featuredArticle.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#0b64b4]" />
                  <span>{featuredArticle.author?.name || "Tim UC Centers"}</span>
                </div>
                <Link href={`/artikel/${featuredArticle.slug}`} className="font-bold text-[#0b64b4] hover:underline flex items-center gap-1">
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Article Grid */}
      {articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 space-y-3">
          <p className="text-slate-500 text-sm font-medium">Belum ada artikel publikasi terdaftar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(categoryFilter ? articles : regularArticles).map((article, index) => (
            <Card
              key={article.id}
              className="card-lift animate-rise flex flex-col justify-between group"
              style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
            >
              <div>
                <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                  {article.coverImageUrl ? (
                    <Image
                      src={article.coverImageUrl}
                      alt={article.title}
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

                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="neutral">{article.category?.name || "Umum"}</Badge>
                    {article._count?.attachments > 0 && (
                      <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                        <FileText className="w-3 h-3" /> PDF
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#111c2d] group-hover:text-[#0b64b4] transition-colors line-clamp-2 leading-snug">
                    <Link href={`/artikel/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("id-ID") : "-"}
                </span>
                <Link href={`/artikel/${article.slug}`} className="font-semibold text-[#0b64b4] hover:underline">
                  Baca Artikel
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
