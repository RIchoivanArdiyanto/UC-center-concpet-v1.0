import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimitKey = `${ip}:${email}`;

    // Redis Rate Limiting Check
    const rateLimit = await checkRateLimit(rateLimitKey, 5, 900); // 5 attempts per 15 minutes
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login yang gagal. Silakan coba lagi dalam 15 menit." },
        { status: 429 }
      );
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Kredensial tidak valid." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Kredensial tidak valid." }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error: any) {
    console.error("[Login API Error]:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
