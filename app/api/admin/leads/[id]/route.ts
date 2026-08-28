import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actorId = (session.user as any).id;
    const role = (session.user as any).role;
    const userCenterId = (session.user as any).centerId;

    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    if (role === "CENTER_ADMIN" && userCenterId && existing.centerId !== userCenterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status } = await req.json();

    const updated = await prisma.lead.update({
      where: { id: params.id },
      data: {
        status,
        handledById: actorId,
      },
    });

    await logActivity({
      actorId,
      action: "UPDATE",
      entityType: "Lead",
      entityId: updated.id,
      metadata: { status: updated.status, name: updated.name },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update lead status." }, { status: 500 });
  }
}
