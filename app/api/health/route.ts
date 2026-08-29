import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Dipakai healthcheck Docker (app & nginx). Tetap balas 200 selama proses
// Next.js hidup; status database dilaporkan terpisah agar kontainer tidak
// dianggap unhealthy hanya karena DB sedang restart.
export async function GET() {
  let database = "up";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }

  return NextResponse.json({
    status: "ok",
    database,
    timestamp: new Date().toISOString(),
  });
}
