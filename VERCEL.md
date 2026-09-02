# Deploy ke Vercel (untuk revisi / pratinjau)

Panduan ini untuk **pratinjau yang bisa dibuka kapan saja**, bukan produksi
akhir. Produksi tetap di server UC lewat Docker — lihat `README.md`.

---

## Langkah

### 1. Siapkan database MySQL yang bisa diakses internet

Vercel tidak menjalankan container, jadi MySQL harus di-host terpisah.
Yang punya paket gratis dan kompatibel MySQL 8:

| Layanan | Catatan |
|---|---|
| **TiDB Cloud Serverless** | Gratis permanen, protokol MySQL. Paling pas untuk pratinjau |
| **Aiven for MySQL** | Ada paket gratis, MySQL asli |
| **Railway** | Mudah, tapi kredit gratisnya terbatas per bulan |

Catat connection string-nya. Bentuknya:

```
mysql://USER:PASSWORD@HOST:PORT/NAMADB
```

> **Wajib tambahkan `?connection_limit=1`** di akhir. Setiap request di Vercel
> berjalan di instance terpisah dan masing-masing membuka koneksi sendiri.
> Tanpa batas ini, database cepat kehabisan slot koneksi dan situs mulai
> membalas error pada jam ramai.

Hasil akhirnya:

```
mysql://USER:PASSWORD@HOST:PORT/NAMADB?connection_limit=1&sslaccept=strict
```

### 2. Import repo ke Vercel

Vercel → **Add New → Project** → pilih repo `UC-center-concpet-v1.0`.
Framework terdeteksi otomatis sebagai Next.js. **Jangan ubah** Build Command —
`vercel-build` di `package.json` sudah menjalankan migrasi lalu build.

### 3. Isi Environment Variables

| Variabel | Nilai |
|---|---|
| `DATABASE_URL` | connection string dari langkah 1 |
| `NEXTAUTH_SECRET` | hasil `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL Vercel Anda, mis. `https://uc-centers.vercel.app` |

`NEXTAUTH_URL` baru diketahui setelah deploy pertama. Deploy dulu, salin
URL-nya, isikan, lalu **Redeploy**. Tanpa nilai yang benar, login admin gagal
karena URL callback-nya tidak cocok.

### 4. Isi data awal (sekali saja)

Migrasi sudah otomatis jalan saat build, tetapi data awal (akun admin, center
contoh, konten beranda) belum. Jalankan dari komputer Anda:

```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/NAMADB" npm run seed
```

Setelah itu login memakai `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` di
`.env` Anda (bawaan: `superadmin` / `Password123!`). **Segera ganti
passwordnya lewat panel** — URL Vercel bersifat publik.

---

## Yang TIDAK berfungsi di Vercel

**Unggah berkas.** Filesystem serverless bersifat read-only, jadi tombol unggah
gambar/PDF akan membalas pesan bahwa penyimpanan tidak tersedia. Ini bukan bug
— aplikasi memang mendeteksinya dan memberi tahu, bukan gagal diam-diam.

Gunakan tombol **"Pakai URL"** di setiap kolom gambar sebagai gantinya. Semua
fitur lain berjalan penuh: panel admin, role & hak akses, form kontak,
activity log, peta.

Kalau nanti unggahan memang dibutuhkan di Vercel, perlu ditambahkan
penyimpanan objek (Vercel Blob / S3) — bilang saja, itu perubahan terpisah.

**Rate limit lebih lemah.** Pembatas laju login menyimpan hitungannya di memori
proses. Di Vercel setiap instance punya memorinya sendiri, jadi batasnya tidak
seketat di Docker. Cukup untuk pratinjau; di server UC (satu container) tetap
bekerja penuh.

---

## Hubungannya dengan deployment Docker

Tidak ada yang rusak. `output: "standalone"` yang dibutuhkan Dockerfile
dimatikan otomatis saat build di Vercel lewat variabel `VERCEL`, dan menyala
lagi di mana pun selain itu. Satu repo, dua target deploy, tanpa cabang
terpisah.
