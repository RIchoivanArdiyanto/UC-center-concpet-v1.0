import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import { uniqueSlug } from "@/lib/slug";
import { handleApiError, readJson, requireAdmin, requireField } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    await requireAdmin(PERMISSIONS.ARTICLES_VIEW);

    const articles = await prisma.article.findMany({
      include: {
        category: true,
        author: { select: { name: true, email: true } },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(articles);
  } catch (error) {
    return handleApiError("Admin Articles GET", error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin(PERMISSIONS.ARTICLES_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    const title = (requireField(body.title, "Judul artikel") as string).trim();
    const content = requireField(body.content, "Konten artikel") as string;

    const slug = await uniqueSlug(
      title,
      async (candidate) => (await prisma.article.count({ where: { slug: candidate } })) > 0,
      "artikel"
    );

    const isPublished = body.status === "PUBLISHED";
    const attachments: any[] = Array.isArray(body.attachments) ? body.attachments : [];

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        summary: body.summary ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        categoryId: body.categoryId || null,
        status: isPublished ? "PUBLISHED" : "DRAFT",
        publishedAt: isPublished ? new Date() : null,
        seoTitle: body.seoTitle ?? null,
        seoDescription: body.seoDescription ?? null,
        // authorId menunjuk AdminUser sungguhan. Sebelumnya login memakai id
        // fiktif "super-admin-default-id" sehingga create artikel selalu gagal
        // foreign key dan dibalas 500.
        authorId: user.id,
        attachments: attachments.length
          ? {
              create: attachments.map((att) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileSizeBytes: att.fileSizeBytes ?? null,
                mimeType: att.mimeType ?? null,
              })),
            }
          : undefined,
      },
    });

    await invalidateCachePattern("public:articles*");

    await logActivity({
      actorId: user.id,
      action: isPublished ? "PUBLISH" : "CREATE",
      entityType: "Article",
      entityId: article.id,
      metadata: { title: article.title, status: article.status },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    return handleApiError("Admin Articles POST", error);
  }
}
