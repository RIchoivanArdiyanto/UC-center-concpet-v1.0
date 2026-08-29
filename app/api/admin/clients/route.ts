import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import { handleApiError, readJson, requireAdmin, requireField } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    await requireAdmin(PERMISSIONS.CLIENTS_MANAGE);

    const clients = await prisma.clientLogo.findMany({
      include: { center: { select: { name: true } } },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    return handleApiError("Admin Clients GET", error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin(PERMISSIONS.CLIENTS_MANAGE);
    const body = await readJson<Record<string, any>>(req);

    const name = (requireField(body.name, "Nama perusahaan") as string).trim();
    const logoUrl = (requireField(body.logoUrl, "URL logo") as string).trim();

    // sortOrder sebelumnya selalu 0 sehingga urutan marquee acak; sekarang logo
    // baru ditaruh di akhir daftar.
    const last = await prisma.clientLogo.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const clientLogo = await prisma.clientLogo.create({
      data: {
        name,
        logoUrl,
        centerId: body.centerId || null,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });

    await invalidateCachePattern("public:centers*");

    await logActivity({
      actorId: user.id,
      // Sebelumnya dicatat sebagai entityType "Center" sehingga audit trail
      // menunjuk entitas yang salah.
      action: "CREATE",
      entityType: "ClientLogo",
      entityId: clientLogo.id,
      metadata: { name: clientLogo.name },
    });

    return NextResponse.json(clientLogo, { status: 201 });
  } catch (error) {
    return handleApiError("Admin Clients POST", error);
  }
}
