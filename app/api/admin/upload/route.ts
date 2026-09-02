import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError, handleApiError, requireAdmin } from "@/lib/api";
import { checkRateLimit } from "@/lib/cache";
import {
  ALLOWED_TYPES,
  UPLOAD_ROOT,
  UPLOAD_URL_PREFIX,
  buildRelativeDir,
  buildStoredName,
  matchesMagic,
} from "@/lib/uploads";

// Unggahan menulis ke disk, jadi handler ini tidak boleh dijalankan di Edge
// runtime maupun di-cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Cukup butuh sesi admin: hampir semua form konten memakai endpoint ini,
    // jadi tidak diikat ke satu permission tertentu.
    const user = await requireAdmin();

    // Batasi laju unggah per user supaya disk server tidak bisa dipenuhi
    // hanya dengan satu akun yang bocor.
    const { allowed } = await checkRateLimit(`upload:${user.id}`, 60, 3600);
    if (!allowed) {
      throw new ApiError(429, "Terlalu banyak unggahan dalam satu jam. Coba lagi nanti.");
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");

    if (!(file instanceof File)) {
      throw new ApiError(400, "Tidak ada berkas yang dikirim.");
    }

    const spec = ALLOWED_TYPES[file.type];
    if (!spec) {
      throw new ApiError(
        400,
        "Tipe berkas tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF."
      );
    }

    if (file.size === 0) throw new ApiError(400, "Berkas kosong.");
    if (file.size > spec.maxBytes) {
      throw new ApiError(
        413,
        `Ukuran berkas maksimal ${Math.round(spec.maxBytes / (1024 * 1024))} MB.`
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Tipe yang diklaim browser tidak dipercaya begitu saja: isi berkas harus
    // cocok dengan magic number tipe tersebut. Tanpa ini, skrip apa pun bisa
    // diunggah cukup dengan mengaku bertipe image/png.
    if (!matchesMagic(bytes, file.type)) {
      throw new ApiError(400, "Isi berkas tidak cocok dengan tipenya. Berkas ditolak.");
    }

    const relativeDir = buildRelativeDir();
    // Nama dibuat server dari byte acak — nama asli dari klien tidak pernah
    // dipakai, sehingga tidak ada jalan untuk path traversal.
    const storedName = buildStoredName(randomBytes(16).toString("hex"), spec.ext);

    const targetDir = path.join(UPLOAD_ROOT, relativeDir);

    try {
      await mkdir(targetDir, { recursive: true });
      await writeFile(path.join(targetDir, storedName), bytes, { mode: 0o644 });
    } catch (err) {
      // Platform serverless (Vercel, Netlify, Lambda) memberi filesystem
      // read-only. Tanpa penanganan ini, unggahan di sana gagal sebagai 500
      // generik dan admin tidak tahu penyebabnya. Docker/VPS tidak terpengaruh
      // karena /app/uploads adalah volume yang bisa ditulis.
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
        throw new ApiError(
          503,
          "Server ini tidak mengizinkan penyimpanan berkas (filesystem read-only). " +
            "Gunakan tombol \"Pakai URL\" pada kolom gambar, atau jalankan aplikasi " +
            "di server dengan volume penyimpanan."
        );
      }
      throw err;
    }

    return NextResponse.json(
      {
        url: `${UPLOAD_URL_PREFIX}/${relativeDir}/${storedName}`,
        name: file.name,
        size: file.size,
        type: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError("Admin Upload POST", error);
  }
}
