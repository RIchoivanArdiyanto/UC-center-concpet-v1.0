import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = (session.user as any).id;
    const body = await req.json();
    const { title, summary, content, coverImageUrl, categoryId, status, seoTitle, seoDescription, attachments } = body;

    const existing = await prisma.article.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const isNowPublished = status === "PUBLISHED" && existing.status !== "PUBLISHED";

    const updated = await prisma.$transaction(async (tx) => {
      if (attachments !== undefined) {
        await tx.articleAttachment.deleteMany({ where: { articleId: params.id } });
        if (attachments.length > 0) {
          await tx.articleAttachment.createMany({
            data: attachments.map((att: any) => ({
              articleId: params.id,
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSizeBytes: att.fileSizeBytes,
              mimeType: att.mimeType,
            })),
          });
        }
      }

      return tx.article.update({
        where: { id: params.id },
        data: {
          title,
          summary,
          content,
          coverImageUrl,
          categoryId: categoryId || null,
          status,
          publishedAt: isNowPublished ? new Date() : existing.publishedAt,
          seoTitle,
          seoDescription,
        },
      });
    });

    await logActivity({
      actorId,
      action: isNowPublished ? "PUBLISH" : "UPDATE",
      entityType: "Article",
      entityId: updated.id,
      metadata: { title: updated.title, status: updated.status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[Admin Article PUT Error]:", error);
    return NextResponse.json({ error: "Failed to update article." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = (session.user as any).id;
    const deleted = await prisma.article.delete({ where: { id: params.id } });

    await logActivity({
      actorId,
      action: "DELETE",
      entityType: "Article",
      entityId: params.id,
      metadata: { title: deleted.title },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Article DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete article." }, { status: 500 });
  }
}
