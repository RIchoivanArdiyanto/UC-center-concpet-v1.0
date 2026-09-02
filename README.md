# UC Centers — Setup Docker Localhost Otomatis

Aplikasi **UC Centers** (Next.js 14 + MySQL 8 + Nginx) berjalan otomatis
lewat Docker. Tidak ada langkah manual selain menyalin `.env`.

---

## 🚀 Menjalankan (Localhost)

```bash
cp .env.example .env
```

```bash
docker compose up -d --build
```

Kontainer `uc-mysql`, `uc-app`, dan `uc-nginx` menyala; database dibuat,
migrasi dijalankan, dan data awal di-seed otomatis.

---

## 🌐 Alamat Akses

| Layanan | Alamat |
|---|---|
| Website publik | <http://localhost:8090> |
| Panel admin | <http://localhost:8090/panel/login> |
| Health check | <http://localhost:8090/api/health> |
| MySQL (DBeaver/Workbench) | `localhost:3310` — db `uccenters`, user `uccenters`, password `uccenters` |
| App langsung (bypass Nginx) | <http://localhost:3100> |

**Login admin pertama** — diatur lewat `.env` (`SEED_ADMIN_USERNAME`,
`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`). Default: username `superadmin`,
password `Password123!`. **Ganti sebelum dipakai di server.**
Login menerima username maupun email.

> **Port sengaja tidak memakai 80/5432.** Blok 8090 / 3310 / 3100 dipilih agar
> tidak bentrok dengan project Docker lain di mesin ini — `gudang-elektronik`
> (3000 / 5433 / 8080) dan `rsudrme` (5434 / 8081–8083). Ganti lewat `WEB_PORT`
> di `.env`, dan sesuaikan juga `NEXTAUTH_URL`.

---

## 🎯 Yang Membuat Setup Ini Otomatis

1. **Auto restart (`restart: unless-stopped`)** — setiap Docker Desktop atau
   komputer dinyalakan, seluruh kontainer menyala sendiri tanpa build ulang.
   Kontainer yang dihentikan manual (`docker compose stop`) tetap dibiarkan mati.
2. **Auto migrate + seed** — `docker/entrypoint.sh` menjalankan
   `prisma migrate deploy` lalu seed sebelum server naik. Keduanya idempoten.
3. **Urutan start terjaga** — `app` menunggu MySQL benar-benar menerima query
   (healthcheck-nya menjalankan `SELECT 1`, bukan sekadar `mysqladmin ping` yang
   sudah balas OK sebelum database siap).
4. **Hanya satu port terbuka** — MySQL berada di jaringan internal Docker.

> Agar benar-benar menyala setelah komputer restart, pastikan Docker Desktop
> ikut autostart: **Settings → General → "Start Docker Desktop when you sign in"**.

---

## 👥 User, Role & Hak Akses

Menu **Sistem → Users & Hak Akses** di panel admin:

Form edit center juga punya blok **Pengurus Center** dan **Layanan & Kepakaran
Utama** — keduanya tampil di halaman center publik dan bisa ditambah,
diurutkan, serta dihapus dari panel.

- **Manajemen User** — buat akun login untuk orang lain (nama, username, email,
  password, role, penugasan center), aktif/nonaktifkan, reset password, hapus.
- **Manajemen Role** — buat role sendiri dan centang hak aksesnya per menu.
  Dua role bawaan (`Super Admin`, `Center Admin`) tidak bisa dihapus, tetapi
  daftar izinnya tetap bisa disesuaikan.

Setiap role punya **lingkup data**: `Semua center` atau `Hanya center yang
ditugaskan`. Lingkup ini ditegakkan di level query database, bukan sekadar
menyembunyikan menu.

Pengaman yang sudah terpasang: tidak bisa menonaktifkan/menghapus akun sendiri,
tidak bisa mencabut izin kelola role dari role yang sedang dipakai, dan tidak
bisa menghapus satu-satunya user yang bisa mengelola user.

Menu **Sistem → Activity Log** menampilkan jejak audit setiap perubahan
(pelaku, aksi, objek, waktu) dengan filter dan paginasi.

---

## 🖼️ Unggah Gambar & Dokumen

Semua form konten (logo center, hero, cover artikel, cover proyek, logo mitra,
foto beranda, PDF profil) memakai pemilih berkas: klik atau seret berkas, lalu
langsung terunggah ke server. Tombol **"Pakai URL"** tetap tersedia bila gambar
memang di-host di tempat lain.

- Tipe yang diterima: JPG, PNG, WEBP (maks 5 MB) dan PDF (maks 10 MB).
- Tipe diverifikasi dari **isi berkas** (magic number), bukan dari label yang
  dikirim browser — berkas yang mengaku PNG tapi isinya skrip akan ditolak.
- Nama berkas dibuat ulang di server dari byte acak, jadi tidak ada celah
  path traversal maupun tabrakan nama.
- Berkas disimpan di volume Docker `uploads_data` (bukan di dalam image),
  sehingga tidak hilang saat build ulang, dan disajikan langsung oleh Nginx.

---

## 🗄️ Database (MySQL 8)

- Skema: [`prisma/schema.prisma`](prisma/schema.prisma).
- Migrasi di `prisma/migrations/`, diterapkan otomatis saat kontainer start.
- Data awal (role, admin, center, tag, portfolio, artikel, konten beranda) dari
  [`prisma/seed.ts`](prisma/seed.ts).
- Data persisten di volume `uc-centers_mysql_data`.

```bash
npx prisma studio
```

Reset total (menghapus semua data dan berkas unggahan):

```bash
docker compose down -v && docker compose up -d --build
```

---

## 🔒 Deploy ke Server UC

Gunakan overlay produksi. **Perhatikan `-f` yang eksplisit** — menyebut file
secara manual membuat Compose tidak memuat `docker-compose.override.yml`, dan
itulah yang menutup port database dari internet:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Sebelum menjalankannya, di `.env` server:

1. **Ganti `NEXTAUTH_SECRET`.** Aplikasi menolak melayani request bila kosong
   atau kurang dari 32 karakter.
   ```bash
   openssl rand -base64 32
   ```
2. **Ganti `DB_PASSWORD` dan `DB_ROOT_PASSWORD`** dari nilai contohnya.
3. **Ganti `SEED_ADMIN_PASSWORD`**, lalu setelah login pertama set
   `SKIP_SEED=true` agar seed tidak menimpa perubahan Anda.
4. **Set `NEXTAUTH_URL`** ke domain HTTPS produksi, mis. `https://uccenters.id`.

### Yang sudah dijaga di sisi aplikasi

| Aspek | Penanganan |
|---|---|
| **Database tidak terekspos** | Overlay produksi menghapus `ports:` pada service `db`; MySQL hanya bisa dihubungi dari jaringan Docker internal. Akses dari luar lewat terowongan SSH: `ssh -L 3310:localhost:3306 user@server -N` |
| **Kontainer web** | Hanya Nginx yang mendengarkan, dan di produksi diikat ke `127.0.0.1` agar hanya reverse proxy host (TLS) yang bisa menjangkaunya |
| **Rahasia** | `NEXTAUTH_SECRET` tanpa nilai cadangan hardcoded; `.env` ada di `.gitignore` |
| **Password** | bcrypt cost 12; minimal 8 karakter dengan huruf besar, kecil, dan angka; hash tidak pernah keluar lewat API |
| **Brute force login** | Rate limit di aplikasi (8 percobaan / 15 menit per IP+identitas) dan di Nginx (10 req/menit ke `/api/auth/`) |
| **Enumerasi akun** | Pesan galat sama untuk user tidak ada / nonaktif / password salah, dan bcrypt tetap dijalankan agar waktu respons tidak membocorkan apa pun |
| **Hak akses** | Dicek di server pada setiap route (`requireAdmin(PERMISSION)`), bukan hanya dengan menyembunyikan menu |
| **Pencabutan akses** | Token sesi disegarkan dari database tiap request; menonaktifkan user langsung memutus sesinya |
| **Unggahan berkas** | Whitelist tipe + verifikasi magic number, batas ukuran, nama dibuat server, disajikan dengan `nosniff` dan CSP sandbox |
| **Header** | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` dimatikan; `/panel/*` diberi `noindex` dan `no-store` |
| **Kontainer** | Proses berjalan sebagai user non-root, `no-new-privileges`, dan filesystem read-only di produksi |

### Penyiapan server: TLS, firewall, backup

Berkas pendukungnya ada di folder `deploy/`. Setelah kontainer berjalan:

```bash
sudo ./deploy/setup-server.sh uccenters.uc.ac.id admin@uc.ac.id
```

Satu perintah itu memasang:

| Bagian | Yang dilakukan |
|---|---|
| **Firewall** | `ufw` hanya membuka SSH, 80, dan 443. Port aplikasi (8090), MySQL (3306/3310), dan app (3100) tidak dibuka — semuanya sudah terikat ke `127.0.0.1` oleh overlay produksi |
| **TLS/HTTPS** | Nginx host + sertifikat Let's Encrypt lewat Certbot, redirect HTTP→HTTPS, TLS 1.2+, HSTS, dan hook reload otomatis setiap sertifikat diperbarui |
| **Backup** | Cron harian 02:15 WIB menjalankan `deploy/backup-db.sh` — `mysqldump --single-transaction` (tidak mengunci tabel, situs tetap jalan) plus arsip berkas unggahan, disimpan 14 hari |

Pemulihan:

```bash
./deploy/restore-db.sh backups/uccenters-20260829-021500.sql.gz
```

> **Docker bisa melewati ufw.** Docker menulis aturan iptables sendiri, sehingga
> port yang di-publish ke `0.0.0.0` tetap terbuka walau ufw menolaknya. Itulah
> sebabnya `docker-compose.prod.yml` mengikat semua port ke `127.0.0.1`.
> Verifikasi setelah deploy — semuanya harus `127.0.0.1`, bukan `0.0.0.0`:
> ```bash
> sudo ss -tlnp | grep -E '3306|3310|8090|3100'
> ```

> **Tiga hal yang tetap harus Anda lakukan sendiri:**
> 1. **Uji pemulihan backup** ke database percobaan. Backup yang belum pernah
>    diuji belum tentu bisa dipakai.
> 2. **Salin folder `backups/` ke penyimpanan di luar server.** Cadangan yang
>    hanya ada di server yang sama ikut hilang bila server itu rusak.
> 3. **Naikkan `max-age` HSTS** di `/etc/nginx/sites-available/uccenters` setelah
>    HTTPS terbukti stabil beberapa hari. Sebelum itu, nilainya sengaja rendah:
>    begitu HSTS terkirim, browser menolak membuka domain lewat HTTP sampai
>    masa berlakunya habis — termasuk saat sertifikatnya bermasalah.

---

## 🛠️ Perintah Operasional

```bash
docker compose ps
```

```bash
docker compose logs -f app
```

```bash
docker compose up -d --build app
```

```bash
docker compose down
```

---

## 🧪 Pengujian

Tiga suite berdiri sendiri, semuanya membersihkan data ujinya sendiri:

```bash
npm run test:qa
```

```bash
npm run test:security
```

```bash
npm run test:perf
```

Ketiganya keluar dengan kode 1 bila ada kegagalan, jadi bisa langsung dipakai
di CI. Instrumen SUS siap pakai ada di
[`docs/SUS-KUESIONER.md`](docs/SUS-KUESIONER.md).

> Suite keamanan sengaja memicu rate limit login. Setelah dijalankan, login
> terblokir ±15 menit — buka kembali dengan `docker compose restart app`.

---

## 📁 Struktur Kode

| Path | Isi |
|---|---|
| `app/(public)/` | Halaman publik (beranda, center, portfolio, artikel, kontak) |
| `app/admin/` | Panel admin (dilindungi `middleware.ts` + NextAuth) |
| `app/api/` | Route handler REST |
| `lib/api.ts` | Guard sesi, pengecekan permission, scoping center, pemetaan error → status HTTP |
| `lib/permissions.ts` | Katalog hak akses — satu sumber untuk menu, form role, dan penjagaan API |
| `lib/uploads.ts` | Aturan penyimpanan berkas (server) |
| `lib/upload-constants.ts` | Aturan tipe berkas yang dipakai bersama browser |
| `lib/cache.ts` | Cache & rate limiter in-memory |
| `lib/slug.ts` | Pembuatan slug URL yang unik |
| `lib/fetch-json.ts` | Pembungkus fetch panel admin yang memunculkan pesan galat server |
| `lib/sanitize.ts` | Pembersih HTML dari editor sebelum dirender ke pengunjung |
| `docker/entrypoint.sh` | Migrate + seed + start server |
| `deploy/` | Skrip server: firewall, TLS/Certbot, backup & restore |

> **Catatan:** Redis sudah dihapus dari stack. Cache dan rate limiting berjalan
> in-memory di dalam proses `app` (lihat `lib/cache.ts`) — cukup untuk
> deployment satu kontainer seperti compose ini.
