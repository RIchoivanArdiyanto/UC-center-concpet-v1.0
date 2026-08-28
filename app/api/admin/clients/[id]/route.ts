import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actorId = (session.user as any).id;
    const deleted = await prisma.clientLogo.delete({ where: { id: params.id } });

    await logActivity({
      actorId,
      action: "DELETE",
      entityType: "Center",
      entityId: params.id,
      metadata: { name: deleted.name, type: "ClientLogo" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete client logo." }, { status: 500 });
  }
}
