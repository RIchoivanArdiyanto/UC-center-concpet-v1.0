// ============================================================================
//  Aturan berkas unggahan yang dipakai BERSAMA oleh server dan browser.
//
//  Dipisah dari lib/uploads.ts karena file itu mengimpor `node:path`. Komponen
//  client yang butuh daftar tipe yang diizinkan tidak bisa mengimpor modul
//  Node — webpack gagal dengan "You may need an additional plugin to handle
//  node: URIs". Di sini tidak ada satu pun impor Node.
// ============================================================================

type AllowedType = {
  ext: string;
  maxBytes: number;
  /** Tanda tangan byte awal berkas (magic number). */
  magic: number[][];
};

const MB = 1024 * 1024;

/**
 * Hanya tipe di daftar ini yang diterima. Pengecekan di server TIDAK bersandar
 * pada `file.type` dari browser — nilai itu dikirim klien dan mudah dipalsukan —
 * melainkan pada magic number di awal isi berkas.
 */
export const ALLOWED_TYPES: Record<string, AllowedType> = {
  "image/jpeg": {
    ext: "jpg",
    maxBytes: 5 * MB,
    magic: [[0xff, 0xd8, 0xff]],
  },
  "image/png": {
    ext: "png",
    maxBytes: 5 * MB,
    magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  "image/webp": {
    // RIFF....WEBP — byte 4-7 berisi ukuran sehingga dilewati saat dicocokkan.
    ext: "webp",
    maxBytes: 5 * MB,
    magic: [[0x52, 0x49, 0x46, 0x46]],
  },
  "application/pdf": {
    ext: "pdf",
    maxBytes: 10 * MB,
    magic: [[0x25, 0x50, 0x44, 0x46]],
  },
};

export const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp";
export const ACCEPT_DOCUMENT = "application/pdf";

/** Prefix URL publik; harus sinkron dengan `location /uploads/` di nginx.conf. */
export const UPLOAD_URL_PREFIX = "/uploads";

/** Cocokkan isi berkas dengan tanda tangan tipe yang diklaim. */
export function matchesMagic(bytes: Uint8Array, mime: string): boolean {
  const spec = ALLOWED_TYPES[mime];
  if (!spec) return false;

  const ok = spec.magic.some((sig) => sig.every((b, i) => bytes[i] === b));
  if (!ok) return false;

  // WEBP: setelah "RIFF" + 4 byte ukuran, harus ada "WEBP".
  if (mime === "image/webp") {
    const webp = [0x57, 0x45, 0x42, 0x50];
    return webp.every((b, i) => bytes[8 + i] === b);
  }
  return true;
}

/**
 * Nama berkas selalu dibuat di server dari byte acak — nama asli dari klien
 * tidak pernah dipakai. Ini yang menutup celah path traversal ("../../etc/x")
 * sekaligus menghindari tabrakan nama antar-unggahan.
 */
export function buildStoredName(randomHex: string, ext: string): string {
  return `${randomHex}.${ext}`;
}

/** Folder per bulan agar satu direktori tidak menampung puluhan ribu berkas. */
export function buildRelativeDir(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}/${month}`;
}

export function extensionToMime(ext: string): string {
  switch (ext.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
