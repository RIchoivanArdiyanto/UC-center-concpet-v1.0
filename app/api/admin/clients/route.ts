import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  try {
    const clients = await prisma.clientLogo.findMany({
      include: {
        center: { select: { name: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(clients);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch client logos." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actorId = (session.user as any).id;
    const body = await req.json();
    const { name, logoUrl, centerId } = body;

    if (!name || !logoUrl) {
      return NextResponse.json({ error: "Nama perusahaan dan URL logo (JPG/PNG/WEBP) wajib diisi." }, { status: 400 });
    }

    const clientLogo = await prisma.clientLogo.create({
      data: {
        name,
        logoUrl,
        centerId: centerId || null,
      },
    });

    await logActivity({
      actorId,
      action: "CREATE",
      entityType: "Center",
      entityId: clientLogo.id,
      metadata: { name: clientLogo.name, type: "ClientLogo" },
    });

    return NextResponse.json(clientLogo, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create client logo." }, { status: 500 });
  }
}
