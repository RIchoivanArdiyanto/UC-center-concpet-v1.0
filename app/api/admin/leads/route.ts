import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireAdmin, scopeToCenter } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const user = await requireAdmin(PERMISSIONS.LEADS_VIEW);

    const leads = await prisma.lead.findMany({
      where: scopeToCenter(user),
      include: {
        center: { select: { name: true } },
        handledBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (error) {
    return handleApiError("Admin Leads GET", error);
  }
}
