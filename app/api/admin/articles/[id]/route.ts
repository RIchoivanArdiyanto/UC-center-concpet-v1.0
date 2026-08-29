import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import { ApiError, handleApiError, readJson, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.ARTICLES_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    const existing = await prisma.article.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError(404, "Artikel tidak ditemukan.");

    const isNowPublished = body.status === "PUBLISHED" && existing.status !== "PUBLISHED";
    const attachments: any[] | undefined = Array.isArray(body.attachments)
      ? body.attachments
      : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      if (attachments !== undefined) {
        await tx.articleAttachment.deleteMany({ where: { articleId: params.id } });
        if (attachments.length > 0) {
          await tx.articleAttachment.createMany({
            data: attachments.map((att) => ({
              articleId: params.id,
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSizeBytes: att.fileSizeBytes ?? null,
              mimeType: att.mimeType ?? null,
            })),
          });
        }
      }

      return tx.article.update({
        where: { id: params.id },
        data: {
          title: body.title,
          summary: body.summary,
          content: body.content,
          coverImageUrl: body.coverImageUrl,
          // `body.categoryId || null` mengizinkan pengosongan kategori dari form.
          categoryId: body.categoryId === undefined ? undefined : body.categoryId || null,
          status: body.status,
          publishedAt: isNowPublished ? new Date() : existing.publishedAt,
          seoTitle: body.seoTitle,
          seoDescription: body.seoDescription,
        },
      });
    });

    await invalidateCachePattern("public:articles*");

    await logActivity({
      actorId: user.id,
      action: isNowPublished ? "PUBLISH" : "UPDATE",
      entityType: "Article",
      entityId: updated.id,
      metadata: { title: updated.title, status: updated.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError("Admin Article PUT", error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAdmin(PERMISSIONS.ARTICLES_MANAGE);

    const deleted = await prisma.article.delete({ where: { id: params.id } });

    await invalidateCachePattern("public:articles*");

    await logActivity({
      actorId: user.id,
      action: "DELETE",
      entityType: "Article",
      entityId: params.id,
      metadata: { title: deleted.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError("Admin Article DELETE", error);
  }
}
