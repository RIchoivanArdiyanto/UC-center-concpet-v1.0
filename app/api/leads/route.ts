import { NextResponse } from "next/server";
import { LeadSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/cache";
import { ApiError, handleApiError, readJson, requireField } from "@/lib/api";

const ALLOWED_SOURCE = Object.values(LeadSource) as string[];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    // Endpoint publik tanpa autentikasi — sebelumnya sama sekali tidak dibatasi
    // sehingga tabel Lead bisa dibanjiri submit otomatis.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const { allowed } = await checkRateLimit(`lead:${ip}`, 10, 3600);
    if (!allowed) {
      throw new ApiError(429, "Terlalu banyak permohonan dari jaringan ini. Coba lagi nanti.");
    }

    const body = await readJson<Record<string, any>>(req);

    const name = (requireField(body.name, "Nama") as string).trim();
    const email = (requireField(body.email, "Email") as string).trim().toLowerCase();
    const message = (requireField(body.message, "Pesan") as string).trim();

    if (!EMAIL_RE.test(email)) {
      throw new ApiError(400, "Format email tidak valid.");
    }

    const source: LeadSource = ALLOWED_SOURCE.includes(body.source)
      ? (body.source as LeadSource)
      : LeadSource.GENERAL_CONSULTATION;

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        message,
        subject: body.subject?.trim()?.slice(0, 200) || null,
        phone: body.phone?.trim() || null,
        centerId: body.centerId || null,
        source,
      },
      // Jangan kembalikan seluruh baris ke pengunjung anonim.
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    return handleApiError("Leads POST", error);
  }
}
