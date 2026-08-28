import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ChevronRight, FileDown } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const article = await prisma.article.findUnique({
      where: { slug: params.slug },
      select: { title: true, summary: true, seoTitle: true, seoDescription: true },
    });

    if (!article) return {};

    return {
      title: article.seoTitle || `${article.title} — UC Centers Insight`,
      description: article.seoDescription || article.summary || undefined,
    };
  } catch (err) {
    return {};
  }
}

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  let article: any = null;

  try {
    article = await prisma.article.findUnique({
      where: { slug: params.slug, status: "PUBLISHED" },
      include: {
        category: true,
        author: { select: { name: true } },
        attachments: true,
      },
    });
  } catch (err) {
    console.warn("DB offline during article detail render");
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#003366]">Artikel Tidak Ditemukan</h1>
        <p className="text-sm text-slate-500">Artikel ini belum terbit atau koneksi database sedang offline.</p>
        <Link href="/artikel" className="text-xs font-semibold text-[#0b64b4] hover:underline">
          Kembali ke Artikel & Insights
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/" className="hover:text-[#0b64b4]">Beranda</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/artikel" className="hover:text-[#0b64b4]">Artikel & Insights</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{article.title}</span>
      </nav>

      {/* Header Info */}
      <header className="space-y-4">
        <Badge variant="primary">{article.category?.name || "Artikel"}</Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#003366] leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-slate-200 pb-6 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <User className="w-4 h-4 text-[#0b64b4]" />
              {article.author?.name || "Tim Pakar UC Centers"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
            </span>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {article.coverImageUrl && (
        <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-slate-200">
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 800px"
            className="object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <div
        className="prose prose-slate max-w-none text-slate-800 leading-relaxed prose-headings:font-bold prose-headings:text-[#003366] prose-a:text-[#0b64b4] text-base"
        dangerouslySetInnerHTML={{ __html: article.content || "" }}
      />

      {/* Attachments Section */}
      {article.attachments?.length > 0 && (
        <section className="pt-8 border-t border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-[#003366]">Dokumen & Lampiran Terkait</h3>
          <div className="space-y-2">
            {article.attachments.map((att: any) => (
              <a
                key={att.id}
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-[#0b64b4] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0b64b4] flex items-center justify-center font-bold">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#111c2d] group-hover:text-[#0b64b4] transition-colors">
                      {att.fileName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {att.fileSizeBytes ? `${Math.round(att.fileSizeBytes / 1024)} KB` : "PDF / Document"}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#0b64b4] group-hover:underline">Unduh File</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
