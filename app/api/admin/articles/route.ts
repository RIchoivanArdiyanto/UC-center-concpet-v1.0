import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const articles = await prisma.article.findMany({
      include: {
        category: true,
        author: { select: { name: true, email: true } },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(articles);
  } catch (error: any) {
    console.error("[Admin Articles GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch articles." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = (session.user as any).id;
    const body = await req.json();
    const { title, summary, content, coverImageUrl, categoryId, status, seoTitle, seoDescription, attachments } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Judul dan konten artikel wajib diisi." }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const article = await prisma.article.create({
      data: {
        title,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        summary,
        content,
        coverImageUrl,
        categoryId: categoryId || null,
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        seoTitle,
        seoDescription,
        authorId: actorId,
        attachments: attachments?.length
          ? {
              create: attachments.map((att: any) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileSizeBytes: att.fileSizeBytes,
                mimeType: att.mimeType,
              })),
            }
          : undefined,
      },
    });

    await logActivity({
      actorId,
      action: status === "PUBLISHED" ? "PUBLISH" : "CREATE",
      entityType: "Article",
      entityId: article.id,
      metadata: { title: article.title, status: article.status },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    console.error("[Admin Articles POST Error]:", error);
    return NextResponse.json({ error: "Failed to create article." }, { status: 500 });
  }
}
