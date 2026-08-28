import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setCachedData } from "@/lib/redis";

const DEFAULT_SETTINGS = {
  hero_headline: "Menghubungkan Riset Akademik & Inovasi Industri Terdepan",
  hero_subheadline: "UC Centers menghadirkan solusi kolaboratif melalui riset terapan berstandar internasional, konsultasi bisnis strategis, dan program pelatihan SDM profesional.",
  hero_image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&q=80",
  stat1_number: "12",
  stat1_label: "CENTER OF EXCELLENCE",
  stat2_number: "500+",
  stat2_label: "PROYEK SELESAI",
  stat3_number: "300+",
  stat3_label: "MITRA KORPORASI",
  stat4_number: "20",
  stat4_label: "TAHUN PENGALAMAN",
};

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany();
    const result: Record<string, any> = { ...DEFAULT_SETTINGS };

    for (const item of settings) {
      result[item.key] = item.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Upsert each setting key into SiteSetting table
    for (const [key, value] of Object.entries(body)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      }).catch(() => {});
    }

    // Invalidate public homepage cache so changes reflect instantly
    await setCachedData("public:settings:homepage", body, 3600);

    return NextResponse.json({ success: true, settings: body });
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal menyimpan konfigurasi beranda." }, { status: 500 });
  }
}
