# Laporan QA — UC Centers

**Tanggal:** 2 September 2026 · **Penguji:** QA (Claude Opus 5)
**Lingkungan:** Docker · Node 22.23.1 · MySQL 8.0.46 · Next.js 14.2.35
**Target:** `http://localhost:8090` (Docker, identik dengan konfigurasi server)

---

## 1. Ringkasan Eksekutif

| Pengujian | Hasil | Cara menjalankan |
|---|---|---|
| Fungsional end-to-end | **71 / 71 lulus** | `node tests/qa-suite.mjs` |
| Keamanan | **53 / 53 aman** | `node tests/security-suite.mjs` |
| Performa | **Semua di bawah ambang** | `node tests/perf-suite.mjs` |
| Typecheck | Bersih | `npx tsc --noEmit` |
| Lint | 1 peringatan (bukan cacat) | `npx next lint` |

**Kesimpulan: layak dinaikkan ke server**, dengan tiga catatan pra-rilis di
[bagian 7](#7-yang-harus-dikerjakan-sebelum-rilis).

Seluruh angka di dokumen ini berasal dari eksekusi nyata terhadap stack Docker
yang berjalan, bukan perkiraan. Skrip pengujiannya disertakan agar hasilnya
dapat diulang siapa pun.

---

## 2. Bug yang Ditemukan & Diperbaiki

Sembilan cacat ditemukan pada sesi QA ini. Semuanya sudah diperbaiki dan
diverifikasi ulang.

### 2.1 Kritis — Enumerasi akun lewat selisih waktu

**Dampak:** penyerang dapat memastikan username mana yang terdaftar tanpa
menebak password sama sekali, lalu memusatkan serangan hanya ke akun yang ada.

Kode sudah berniat menyamakan waktu respons dengan menjalankan bcrypt walau
user tidak ditemukan, tetapi hash pembandingnya adalah string karangan
(`$2a$12$invalidinvalid…`). bcryptjs menolak format salt yang rusak dan langsung
mengembalikan `false` **dalam 0 ms**, sehingga mitigasinya tidak pernah bekerja.

| | Sebelum | Sesudah |
|---|---|---|
| Username terdaftar | 252 ms | 259 ms |
| Username tidak terdaftar | 5 ms | 475 ms |
| **Selisih** | **50.4×** | **1.83×** |

**Perbaikan:** hash pembanding dibuat dari bcrypt sungguhan (dibuat sekali lalu
dipakai ulang). `lib/auth.ts`.

### 2.2 Tinggi — Tag keahlian tidak bisa dihapus

**Dampak:** satu tag salah ketik akan tampil **selamanya** pada deretan filter
di halaman Portfolio dan Direktori Center publik.

Tidak ada endpoint DELETE maupun tombolnya. Ikon `Trash2` sempat diimpor di
halaman admin tapi tidak pernah dirender — jejak fitur yang tidak pernah selesai.

**Perbaikan:** endpoint `DELETE /api/admin/expertise/[id]` + tombol hapus.
Tag yang masih dipakai center/proyek ditolak dengan angka pemakaiannya, bukan
dihapus diam-diam (relasinya `onDelete: Cascade` — akan mencabut tag dari setiap
data yang memakainya tanpa peringatan).

### 2.3 Tinggi — Permohonan masuk tidak bisa dihapus

**Dampak:** formulir kontak terbuka ke internet. Tanpa cara menghapus, kiriman
spam menumpuk permanen dan menenggelamkan permohonan yang sungguhan.

**Perbaikan:** endpoint DELETE + tombol, dijaga izin `leads.manage` dan lingkup
center. Dialog konfirmasi menyarankan status **CLOSED** lebih dulu bagi yang
hanya ingin menandai selesai tanpa menghapus riwayat.

### 2.4 Sedang — Race condition pada form edit portfolio

**Dampak:** saat mengedit proyek, form dapat menampilkan **center yang salah**.

Dua fetch berjalan bersamaan dalam satu `useEffect`. Bila daftar center selesai
lebih dulu daripada data proyeknya, nilai `centerId` dari closure masih kosong
sehingga pemeriksaan `!centerId` lolos dan center milik proyek tertimpa center
pertama pada daftar.

Datanya sendiri tidak rusak — route PUT mengabaikan `centerId`. Tetapi form
menampilkan informasi yang salah, dan akan berubah menjadi korupsi data begitu
ada yang menambahkan `centerId` ke handler PUT.

**Perbaikan:** nilai bawaan hanya diterapkan untuk proyek baru.

### 2.5 Sedang — 13 kolom isian tanpa nama aksesibel

**Dampak:** pembaca layar tidak menyebutkan nama kolom; mengklik teks label
tidak memfokuskan kolomnya. Melanggar WCAG 1.3.1 dan 3.3.2.

**Perbaikan:** seluruh `<input>` diberi `id` berpasangan `htmlFor`, atau
`aria-label` untuk kolom tanpa label visual. Verifikasi akhir: **0 tersisa**.

### 2.6 Sedang — `npm run lint` tidak bisa dijalankan

ESLint tidak pernah dikonfigurasi. Perintahnya menggantung pada prompt
interaktif dan tidak pernah selesai — artinya tidak ada linting sepanjang
riwayat proyek ini.

**Perbaikan:** `.eslintrc.json` + `eslint` dipasang. Sekarang berjalan dan
menemukan cacat 2.4 di atas.

### 2.7 Rendah — Dependensi tidak terpakai

`tailwind-merge` tidak pernah diimpor sama sekali (dibuang).
`@types/sanitize-html` berada di `dependencies` padahal paket tipe hanya dipakai
saat kompilasi — ikut terinstal di image produksi tanpa guna (dipindah ke
`devDependencies`).

### 2.8 Rendah — Komentar yang menyesatkan

`docker/entrypoint.sh` masih menyebut "skema PostgreSQL" setelah migrasi ke
MySQL. Diperbaiki.

### 2.9 Cacat pada perkakas QA itu sendiri

Dicatat agar tidak terulang, dan karena hasil QA yang salah lebih berbahaya
daripada tidak menguji sama sekali:

- Suite keamanan sempat melaporkan cookie sesi **tidak HttpOnly**. Itu **false
  positive**: rate limiter memblokir login, sehingga yang diperiksa adalah
  respons yang memang tidak memuat cookie. Diperbaiki dengan memastikan
  prasyarat login berhasil sebelum menilai.
- Uji enumerasi sempat mengukur `sleep` 65 detik milik suite sendiri dan
  melaporkan selisih 6500×. Ditulis ulang memakai request mentah.
- Pengujian build lokal sempat memakai `$?` setelah pipe — yang terukur adalah
  status `grep`, bukan `npm`. Build dinyatakan lulus padahal belum diverifikasi.

---

## 3. Pengujian Fungsional — 71/71 Lulus

Setiap fitur diuji lewat **alur nyata**: admin membuat/mengubah data lewat API,
lalu **halaman publik diperiksa** untuk memastikan perubahannya benar muncul.
Menguji sisi admin saja tidak cukup — cacat paling sering justru berada di
sambungan keduanya (filter `isPublished`, relasi yang tidak ikut di-`include`,
cache yang tidak di-invalidasi).

| Kelompok | Uji | Cakupan |
|---|---|---|
| A. Ketersediaan | 8 | Health check, seluruh halaman publik |
| B. Autentikasi | 4 | Tolak anonim, password salah, login username, isi sesi |
| C. Center | 9 | Buat → tampil di direktori & detail; pengurus & layanan tampil; unpublish menyembunyikan; toggle publish tidak menghapus data anak |
| D. Portfolio | 4 | Buat → tampil di portfolio & beranda; unpublish menyembunyikan |
| E. Artikel | 4 | DRAFT tidak bocor ke publik; PUBLISHED tampil; halaman detail |
| F. Taksonomi | 4 | Buat, duplikat 409, hapus ditolak saat dipakai, hapus saat bebas |
| G. Konten & Kontak | 7 | Simpan; kunci asing ditolak; hero, Instagram (kontak + footer), telepon, peta |
| H. Form Kontak | 8 | Kirim, respons tidak bocor, email invalid 400, masuk ke admin, normalisasi email, subjek, ubah status, enum invalid |
| I. User & Hak Akses | 14 | Buat role & user, permission asing dibuang, password lemah ditolak, tidak bisa hapus diri, penegakan izin di 6 endpoint, cegah eskalasi |
| J. Activity Log | 4 | Terbaca, tercatat, filter, metadata JSON asli |
| K. Unggah Berkas | 5 | PNG valid, tersaji publik, Content-Type benar, nosniff, berkas menyamar ditolak |

**Beberapa hasil yang layak disorot:**

- Artikel berstatus DRAFT terbukti **tidak bocor** ke halaman publik.
- Toggle publish center terbukti **tidak menghapus** pengurus maupun layanan —
  ini kelas bug yang mudah muncul karena keduanya ditulis ulang penuh saat
  disimpan.
- Email pengirim dinormalkan ke huruf kecil, dan respons ke pengunjung anonim
  hanya berisi `id` + `createdAt`, bukan seluruh baris.

---

## 4. Pengujian Keamanan — 53/53 Aman

| Area | Uji | Hasil |
|---|---|---|
| Kontrol akses | 12 | Seluruh endpoint admin menolak anonim; `/panel/*` dialihkan ke login |
| Cookie sesi | 3 | HttpOnly ✓, SameSite=Lax ✓, token CSRF ✓ |
| Stored XSS | 6 | `<script>`, `onerror`, `onload`, `javascript:`, iframe pihak ketiga — semua dinetralkan; konten sah tetap tampil |
| SQL Injection | 4 | 5 payload pada pencarian, tabel utuh setelah `DROP TABLE`, login dengan payload gagal |
| Path traversal | 6 | `../`, `..%2f`, `....//`, listing direktori, `.sh`, `.php` — semua ditolak |
| Unggahan berbahaya | 3 | PHP/HTML menyamar PNG, SVG — ditolak lewat pemeriksaan magic number |
| IDOR & eskalasi | 4 | Tidak bisa ubah center orang lain, baca daftar user, naikkan role sendiri, atau buat role |
| Kebocoran info | 4 | Hash password tidak pernah keluar; `X-Powered-By` mati; versi Nginx disembunyikan; galat tanpa stack trace |
| Header keamanan | 6 | X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, noindex & no-store pada panel |
| Rate limit | 2 | Login diblokir pada percobaan ke-5; banjir form publik diblokir pada kiriman ke-10 |
| Enumerasi akun | 1 | Selisih waktu 1.83× (di bawah ambang 3×) |

### Catatan pengerasan tambahan

**Rute panel dipindah** dari `/admin/*` ke `/panel/*` atas permintaan.
Ini menurunkan kebisingan pemindai otomatis yang mencoba `/admin` secara
membabi buta — tetapi **bukan kontrol keamanan**. Yang benar-benar melindungi
panel adalah autentikasi, pemeriksaan izin per-endpoint, dan rate limit di
atas. Jangan memperlakukan nama rute sebagai lapisan pertahanan.

`/center/panel` yang sempat diusulkan **tidak dipakai** karena akan bertabrakan
dengan rute dinamis `/center/[slug]` — center dengan slug `panel` dan halaman
admin akan saling menutup.

---

## 5. Pengujian Performa

12 request per halaman, sesudah pemanasan. **Median** dan **p95** dilaporkan
alih-alih rata-rata, karena rata-rata menyembunyikan request lambat yang justru
paling mengganggu pengguna.

| Halaman | Status | Median | p95 | Ukuran |
|---|---|---|---|---|
| `/` | 200 | 24 ms | 31 ms | 138 KB |
| `/center` | 200 | 17 ms | 18 ms | 65.9 KB |
| `/portfolio` | 200 | 14 ms | 17 ms | 45.5 KB |
| `/artikel` | 200 | 17 ms | 24 ms | 49.8 KB |
| `/kontak` | 200 | 15 ms | 19 ms | 41.4 KB |
| `/panel/login` | 200 | 13 ms | 15 ms | 10.7 KB |
| `/api/health` | 200 | 3 ms | 3 ms | 0.1 KB |
| `/center/[slug]` (relasi terbanyak) | 200 | 16 ms | 17 ms | 45.1 KB |

**Beban bersamaan — 25 pengunjung serentak:** 25/25 berhasil, p95 349 ms,
throughput 71 request/detik.

**Cache & kompresi:** aset statis `public, max-age=31536000, immutable`; HTML
dan aset dikompresi gzip.

**Indikasi N+1:** rasio waktu halaman direktori (banyak center) terhadap halaman
detail (satu center) = **1.29×**. Jauh di bawah ambang 3×, tidak ada tanda query
per baris.

> **Batas keberlakuan angka ini.** Diukur di localhost dengan data seed
> (3 center, 3 proyek, 2 artikel). Angka di server akan lebih tinggi karena ada
> latensi jaringan dan TLS. Yang bisa disimpulkan dari sini adalah **tidak ada
> masalah struktural** (tidak ada N+1, cache dan kompresi bekerja) — bukan bahwa
> situs akan selalu 30 ms bagi pengunjung.

---

## 6. Evaluasi Usability

Penilaian ahli memakai heuristik Nielsen. **Ini bukan SUS** — SUS memerlukan
responden nyata; instrumennya siap pakai di [`SUS-KUESIONER.md`](SUS-KUESIONER.md).

| Heuristik | Penilaian | Bukti |
|---|---|---|
| Visibilitas status sistem | **Baik** | Toast pada 11 halaman, skeleton saat memuat, spinner unggah, indikator "Tersalin" |
| Kecocokan dengan dunia nyata | **Baik** | Seluruh label berbahasa Indonesia; istilah teknis dihindari ("Pengurus Center", bukan "Team Member") |
| Kendali & kebebasan pengguna | **Baik** | Dialog konfirmasi pada 7 halaman, tombol Batal di setiap modal, Escape menutup dialog |
| Konsistensi & standar | **Baik** | Kelas `.field` seragam; `RepeatableList` dipakai bersama Pengurus & Layanan sehingga tidak menyimpang |
| Pencegahan kesalahan | **Baik** | Tombol hapus dinonaktifkan bila tag masih dipakai; tidak bisa menghapus akun sendiri; password lemah ditolak sebelum tersimpan |
| Pengenalan, bukan pengingatan | **Baik** | Petunjuk cara menyalin koordinat dari Google Maps ditulis di bawah kolomnya |
| Fleksibilitas | **Cukup** | Ada pencarian & filter; belum ada aksi massal maupun pintasan papan tik |
| Desain minimalis | **Baik** | Panel dikelompokkan per seksi; menu disembunyikan bila tidak berizin |
| Pemulihan dari galat | **Baik** | Pesan galat asli dari server ditampilkan (duplikat → 409, validasi → 400), bukan "Gagal" generik |
| Bantuan & dokumentasi | **Cukup** | README lengkap; belum ada bantuan dalam aplikasi |

**Aksesibilitas terukur:** 0 input tanpa nama aksesibel (dari 13), indikator
fokus keyboard global, `prefers-reduced-motion` dihormati, 30 berkas memakai
breakpoint responsif.

> Catatan pada `prefers-reduced-motion`: elemen beranimasi dimulai dari
> `opacity: 0`. Mematikan animasinya saja akan membuat konten **hilang total**,
> jadi opacity ikut dikembalikan. Ini kesalahan yang umum terjadi.

---

## 7. Yang Harus Dikerjakan Sebelum Rilis

Tiga hal ini **di luar jangkauan pengujian otomatis** dan hanya bisa Anda
lakukan di server:

1. **Ganti seluruh kredensial contoh** di `.env` server: `NEXTAUTH_SECRET`
   (`openssl rand -base64 32`), `DB_PASSWORD`, `DB_ROOT_PASSWORD`, dan
   `SEED_ADMIN_PASSWORD`. Setelah admin pertama dibuat, set `SKIP_SEED=true`.
2. **Pasang TLS dan firewall** — `sudo ./deploy/setup-server.sh <domain> <email>`.
   Tanpa HTTPS, password admin dikirim sebagai teks polos.
3. **Uji pemulihan backup** ke database percobaan. Backup yang belum pernah
   diuji belum tentu bisa dipakai.

### Keterbatasan yang diketahui (bukan cacat, tetapi perlu Anda putuskan)

| Hal | Keterangan |
|---|---|
| **Artikel bersifat global** | Tabel `Article` tidak punya `centerId`, sedangkan izin `articles.manage` termasuk bawaan Center Admin. Pengurus Center A dapat menyunting artikel Center B. Perlu migrasi bila tiap center harus terpisah. |
| **Logo mitra belum tersaring per center** | Tabelnya punya `centerId` tapi belum difilter. Aman selama izin `clients.manage` tidak diberikan ke Center Admin. |
| **Dashboard menampilkan angka global** | Center Admin melihat total seluruh center, bukan hanya miliknya. |
| **Rate limit bersifat per-proses** | Disimpan di memori. Cukup untuk satu kontainer seperti sekarang; bila di-scale ke beberapa replica, batasnya melemah. |
| **`npm audit`: 2 kerentanan tinggi** | Keduanya pada `postcss` yang menjadi dependensi transitif Next.js dan **hanya dipakai saat build**, bukan saat melayani request. Eksploitasinya memerlukan CSS dari sumber tak tepercaya — tidak terjadi di sini karena seluruh CSS ditulis sendiri. Perbaikannya memerlukan Next.js 16 (perubahan besar). |

---

## 8. Cara Mengulang Pengujian

Semua skrip berdiri sendiri, tanpa dependensi tambahan.

```bash
docker compose up -d --build
```

```bash
node tests/qa-suite.mjs
```

```bash
node tests/security-suite.mjs
```

```bash
node tests/perf-suite.mjs
```

Menguji server yang sudah live:

```bash
BASE_URL=https://uccenters.uc.ac.id node tests/qa-suite.mjs
```

Seluruh suite membersihkan data ujinya sendiri dan keluar dengan kode 1 bila ada
kegagalan, sehingga bisa langsung dipakai di CI.

> **Suite keamanan sengaja memicu rate limit.** Setelah dijalankan, login
> terblokir sekitar 15 menit. Untuk membukanya kembali:
> `docker compose restart app`.
