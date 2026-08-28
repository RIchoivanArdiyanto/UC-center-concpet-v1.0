import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/redis";
import { logActivity } from "@/lib/activity-log";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = (session.user as any).id;
    const role = (session.user as any).role;
    const userCenterId = (session.user as any).centerId;

    // Hard Rule: Enforce CENTER_ADMIN scoping
    if (role === "CENTER_ADMIN" && userCenterId !== params.id) {
      return NextResponse.json({ error: "Forbidden: Access limited to assigned center." }, { status: 403 });
    }

    const body = await req.json();
    const { name, tagline, logoUrl, heroMediaType, heroMediaUrl, aboutContent, profilePdfUrl, isPublished, tagIds } = body;

    // Update center and tags transactionally
    const updatedCenter = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.centerExpertise.deleteMany({ where: { centerId: params.id } });
        if (tagIds.length > 0) {
          await tx.centerExpertise.createMany({
            data: tagIds.map((tagId: string) => ({ centerId: params.id, tagId })),
          });
        }
      }

      return tx.center.update({
        where: { id: params.id },
        data: {
          name,
          tagline,
          logoUrl,
          heroMediaType,
          heroMediaUrl,
          aboutContent,
          profilePdfUrl,
          isPublished,
        },
      });
    });

    // Explicit Cache Invalidation
    await invalidateCachePattern("public:centers*");

    // Explicit Activity Logging
    await logActivity({
      actorId,
      action: "UPDATE",
      entityType: "Center",
      entityId: updatedCenter.id,
      metadata: { name: updatedCenter.name },
    });

    return NextResponse.json(updatedCenter);
  } catch (error: any) {
    console.error("[Admin Center PUT Error]:", error);
    return NextResponse.json({ error: "Failed to update center." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actorId = (session.user as any).id;
    const role = (session.user as any).role;
    const userCenterId = (session.user as any).centerId;

    if (role === "CENTER_ADMIN" && userCenterId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deletedCenter = await prisma.center.delete({
      where: { id: params.id },
    });

    // Explicit Cache Invalidation
    await invalidateCachePattern("public:centers*");

    // Explicit Activity Logging
    await logActivity({
      actorId,
      action: "DELETE",
      entityType: "Center",
      entityId: params.id,
      metadata: { name: deletedCenter.name },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Center DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete center." }, { status: 500 });
  }
}
