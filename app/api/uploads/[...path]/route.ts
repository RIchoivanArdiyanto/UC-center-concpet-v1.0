import { NextResponse } from "next/server";
import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import { extensionToMime, resolveInsideUploadRoot } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * Penyaji berkas unggahan.
 *
 * Di produksi, Nginx menyajikan `/uploads/` langsung dari volume sehingga
 * request tidak pernah sampai ke sini. Route ini adalah jalur cadangan untuk
 * `npm run dev` (lihat rewrite di next.config.mjs) dan untuk deployment tanpa
 * reverse proxy.
 *
 * Sengaja TIDAK memerlukan sesi: berkas ini memang dipakai di halaman publik
 * (logo center, cover artikel). Yang dijaga di sini adalah batas direktori,
 * bukan siapa yang membaca.
 */
export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const relative = (params.path ?? []).join("/");

  // Tolak segmen kosong / traversal sebelum menyentuh filesystem.
  if (!relative || relative.includes("..") || relative.includes("\0")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const absolute = resolveInsideUploadRoot(relative);
  if (!absolute) return new NextResponse("Not found", { status: 404 });

  try {
    const info = await stat(absolute);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });

    const body = await readFile(absolute);
    const ext = path.extname(absolute).replace(".", "");

    return new NextResponse(body, {
      headers: {
        "Content-Type": extensionToMime(ext),
        // Nama berkas ber-hash dan tidak pernah ditulis ulang, jadi aman
        // di-cache lama.
        "Cache-Control": "public, max-age=31536000, immutable",
        // Cegah browser menebak tipe lain dari isi berkas.
        "X-Content-Type-Options": "nosniff",
        // PDF & gambar dari pengguna tidak boleh dieksekusi sebagai halaman.
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
