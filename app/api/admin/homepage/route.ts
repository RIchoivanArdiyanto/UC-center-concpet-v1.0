import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateCachePattern } from "@/lib/cache";
import { logActivity } from "@/lib/activity-log";
import { ApiError, handleApiError, readJson, requireAdmin } from "@/lib/api";
import { PERMISSIONS } from "@/lib/permissions";
import {
  DEFAULT_SITE_SETTINGS,
  SETTING_KEYS,
  type SiteSettings,
} from "@/lib/site-settings";

// Semua endpoint admin membaca sesi dari cookie, jadi tidak pernah bisa
// dirender statis. Ditandai eksplisit supaya Next tidak mencobanya saat build
// dan memenuhi log dengan "Dynamic server usage".
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany();
    const result: SiteSettings = { ...DEFAULT_SITE_SETTINGS };

    for (const item of settings) {
      if (typeof item.value === "string") {
        result[item.key] = item.value;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    // Beranda tetap bisa tampil dengan nilai default walau DB sedang mati.
    console.warn("[Admin Homepage GET] DB tidak terbaca, memakai nilai default:", error);
    return NextResponse.json(DEFAULT_SITE_SETTINGS);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin(PERMISSIONS.HOMEPAGE_MANAGE);
    const body = await readJson<Record<string, unknown>>(req);

    // Hanya kunci yang memang dikenal aplikasi yang boleh ditulis. Tanpa
    // whitelist ini, siapa pun yang punya izin kelola beranda bisa menyisipkan
    // baris SiteSetting sembarangan ke database.
    const entries = Object.entries(body).filter(
      ([key, value]) => typeof value === "string" && SETTING_KEYS.includes(key)
    );
    if (entries.length === 0) {
      throw new ApiError(400, "Tidak ada konfigurasi yang dikenali dari data yang dikirim.");
    }

    // Versi lama membungkus tiap upsert dengan `.catch(() => {})` lalu tetap
    // membalas { success: true } — penyimpanan yang gagal terlihat berhasil di
    // panel admin. Sekarang seluruh key ditulis dalam satu transaksi: kalau ada
    // yang gagal, tidak ada yang tersimpan sebagian dan error dibalas apa adanya.
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value: value as string },
          create: { key, value: value as string },
        })
      )
    );

    await invalidateCachePattern("public:*");

    await logActivity({
      actorId: user.id,
      action: "UPDATE",
      entityType: "SiteSetting",
      entityId: "homepage",
      metadata: { keys: entries.map(([k]) => k) },
    });

    return NextResponse.json({ success: true, settings: Object.fromEntries(entries) });
  } catch (error) {
    return handleApiError("Admin Homepage POST", error);
  }
}
