import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


const PAGE_SIZE = 25;

export async function GET(req: Request) {
  try {
    await requireAdmin(PERMISSIONS.ACTIVITY_VIEW);

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const entityType = url.searchParams.get("entityType") || undefined;
    const action = url.searchParams.get("action") || undefined;
    const actorId = url.searchParams.get("actorId") || undefined;

    const where: Prisma.ActivityLogWhereInput = {
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
      ...(actorId ? { actorId } : {}),
    };

    // Log bisa tumbuh sangat besar; selalu dipaginasi agar halaman admin tidak
    // menarik puluhan ribu baris sekaligus.
    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: { actor: { select: { name: true, username: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Nilai unik untuk mengisi dropdown filter.
    const [entityTypes, actions, actors] = await Promise.all([
      prisma.activityLog.findMany({ distinct: ["entityType"], select: { entityType: true } }),
      prisma.activityLog.findMany({ distinct: ["action"], select: { action: true } }),
      prisma.adminUser.findMany({
        where: { activityLogs: { some: {} } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      filters: {
        entityTypes: entityTypes.map((e) => e.entityType).sort(),
        actions: actions.map((a) => a.action).sort(),
        actors,
      },
    });
  } catch (error) {
    return handleApiError("Admin Activity GET", error);
  }
}
