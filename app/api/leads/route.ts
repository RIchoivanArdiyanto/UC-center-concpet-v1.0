import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, message, centerId, source } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Nama, email, dan pesan wajib diisi." }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        message,
        centerId: centerId || null,
        source: source || "GENERAL_CONSULTATION",
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error: any) {
    console.error("[Leads POST Error]:", error);
    return NextResponse.json({ error: "Gagal menyalin permohonan lead." }, { status: 500 });
  }
}
