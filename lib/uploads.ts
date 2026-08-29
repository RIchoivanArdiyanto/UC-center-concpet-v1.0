// ============================================================================
//  Bagian penyimpanan berkas yang HANYA berjalan di server (butuh `node:path`).
//  Aturan tipe & nama berkas yang dipakai bersama browser ada di
//  lib/upload-constants.ts.
// ============================================================================
import path from "node:path";

export * from "@/lib/upload-constants";

export const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

/**
 * Pastikan path hasil gabungan benar-benar berada di dalam UPLOAD_ROOT.
 * Dipakai endpoint pembaca berkas sebagai lapis pertahanan terakhir terhadap
 * path traversal, setelah penyaringan di level string.
 */
export function resolveInsideUploadRoot(relativePath: string): string | null {
  const resolved = path.resolve(UPLOAD_ROOT, relativePath);
  const root = path.resolve(UPLOAD_ROOT);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}
