/**
 * Build untuk Vercel.
 *
 * Migrasi hanya dijalankan bila DATABASE_URL benar-benar diisi. Sebelumnya
 * `vercel-build` memanggil `prisma migrate deploy` tanpa syarat, sehingga
 * deployment pratinjau tanpa database gagal total dengan P1012
 * ("You must provide a nonempty URL").
 *
 * Catatan: menjalankan perintah yang sama di lokal terlihat berhasil karena
 * Prisma diam-diam memuat file .env. Di Vercel file itu tidak ada, jadi
 * pengecekannya harus eksplisit di sini.
 */
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim();

// Placeholder ditolak: lebih baik ketahuan sekarang daripada build "berhasil"
// lalu situsnya kosong karena menunjuk database yang tidak ada.
const isUsable = Boolean(url) && !url.includes("USER:PASSWORD") && url !== "mysql://";

if (isUsable) {
  console.log("[build] DATABASE_URL terdeteksi — menjalankan migrasi.");
  execSync("prisma migrate deploy", { stdio: "inherit" });
} else {
  console.log(
    "[build] DATABASE_URL kosong — migrasi dilewati.\n" +
      "[build] Aplikasi akan tampil memakai data contoh bawaan (mode pratinjau).\n" +
      "[build] Isi DATABASE_URL di Environment Variables bila ingin data nyata."
  );
}

execSync("next build", { stdio: "inherit" });
