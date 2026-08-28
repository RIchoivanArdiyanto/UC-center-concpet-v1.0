import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const centerId = (session.user as any).centerId;

    // CENTER_ADMIN strictly scoped at DB level
    const where = role === "CENTER_ADMIN" && centerId ? { centerId } : {};

    const leads = await prisma.lead.findMany({
      where,
      include: {
        center: { select: { name: true } },
        handledBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch leads." }, { status: 500 });
  }
}
