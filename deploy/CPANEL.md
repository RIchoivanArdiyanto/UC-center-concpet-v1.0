# Deploy ke cPanel (tanpa Docker)

Panduan ini untuk hosting cPanel yang **tidak menyediakan Docker**. Semua
berkas pendukungnya ada di folder `deploy/cpanel/`.

Sudah diuji: aplikasi berjalan penuh tanpa Docker maupun Nginx, memakai
database hasil impor SQL — termasuk login panel, data center, pengurus,
layanan, dan konten footer.

---

## 0. Tanyakan dulu ke penyedia hosting

Tiga hal ini **wajib ada**. Bila salah satunya tidak tersedia, aplikasi tidak
akan bisa jalan dan Anda perlu VPS, bukan shared hosting:

| Syarat | Cara mengecek di cPanel |
|---|---|
| **Node.js 18.17 atau lebih baru** (disarankan 20/22) | Menu **Setup Node.js App** — lihat daftar versi |
| **MySQL 8.0** (atau MariaDB 10.5+) | Menu **MySQL® Databases** |
| **Boleh menjalankan proses Node yang hidup terus** | Ada menu **Setup Node.js App** = biasanya boleh |

Yang **tidak** wajib tapi sangat memudahkan:

- **Terminal / SSH** — tanpa ini, migrasi database dilakukan lewat impor SQL
  (sudah disiapkan, lihat langkah 3).
- **Git Version Control** — kalau ada, kode bisa ditarik langsung dari GitHub.

> **Kalau hosting-nya hanya PHP tanpa Node.js**, aplikasi ini tidak bisa
> dipasang di sana sama sekali. Next.js membutuhkan runtime Node; tidak ada
> jalan pintas. Pilihannya: pindah ke VPS murah, atau minta hosting
> mengaktifkan Node.js App.

---

## 1. Siapkan database

**MySQL® Databases** di cPanel:

1. **Create New Database** — mis. `uccxxx_uccenters`
2. **Add New User** — mis. `uccxxx_ucadmin`, dengan password kuat
3. **Add User To Database** → pilih keduanya → centang **ALL PRIVILEGES**

Catat ketiganya; cPanel menambahkan awalan nama akun Anda secara otomatis.

> Langkah ke-3 mudah terlewat. Tanpa itu, aplikasi tampil memakai data contoh
> bawaan dan `/api/health` melaporkan `database: "down"` — persis yang terjadi
> saat pengujian panduan ini disusun.

---

## 2. Unggah kode

**Pilihan A — Git (lebih baik, bisa `git pull` saat ada perbaikan):**
Menu **Git™ Version Control** → Create → isi URL repositori → pilih folder
tujuan, mis. `/home/uccxxx/uccenters`.

**Pilihan B — ZIP:**
Unduh ZIP dari GitHub → **File Manager** → unggah → **Extract**.

Setelah itu, **salin berkas startup ke root aplikasi**:

```
deploy/cpanel/server.js   →   server.js
```

Passenger mencari berkas ini di root, bukan di dalam `deploy/cpanel/`.

---

## 3. Impor database

### Bila TIDAK punya Terminal/SSH (paling umum di shared hosting)

Buka **phpMyAdmin** → pilih database Anda → tab **Import** → unggah berurutan:

1. `deploy/cpanel/01-schema.sql` — membuat 17 tabel
2. `deploy/cpanel/02-seed.sql` — mengisi data awal

Hasilnya setara dengan menjalankan `prisma migrate deploy` + `npm run seed`.

> `01-schema.sql` juga membuat tabel `_prisma_migrations` dan mencatat migrasi
> pertama sebagai sudah diterapkan. Itu penting: tanpa catatan tersebut,
> migrasi berikutnya akan mencoba membuat ulang tabel yang sudah ada dan gagal.

### Bila punya Terminal/SSH

```bash
npx prisma migrate deploy && npm run seed
```

---

## 4. Atur aplikasi Node

**Setup Node.js App** → **Create Application**:

| Kolom | Isi |
|---|---|
| Node.js version | 20 atau 22 |
| Application mode | Production |
| Application root | folder tempat kode diunggah |
| Application URL | domain/subdomain tujuan |
| Application startup file | `server.js` |

Lalu tambahkan **Environment Variables** (tombol *Add Variable*):

| Nama | Nilai |
|---|---|
| `DATABASE_URL` | `mysql://USER:PASSWORD@localhost:3306/NAMADB` |
| `NEXTAUTH_SECRET` | acak, minimal 32 karakter |
| `NEXTAUTH_URL` | `https://domain-anda.ac.id` |
| `NODE_ENV` | `production` |
| `BUILD_TARGET` | `cpanel` |
| `UPLOAD_DIR` | `/home/USERNAME/uccenters/uploads` |

Beberapa catatan yang menentukan berhasil-tidaknya:

- **`BUILD_TARGET=cpanel` wajib.** Tanpa itu build menghasilkan mode
  *standalone* milik Docker, dan Passenger memunculkan peringatan
  `"next start" does not work with "output: standalone"`.
- **`NEXTAUTH_SECRET` wajib diisi.** Aplikasi menolak melayani request di mode
  produksi bila kosong atau kurang dari 32 karakter. Untuk membuatnya:
  `openssl rand -base64 32`, atau situs pembuat kata sandi acak.
- **`NEXTAUTH_URL` harus domain HTTPS sungguhan.** Bila salah, login berhasil
  tetapi langsung terlempar keluar karena URL callback-nya tidak cocok.
- **`UPLOAD_DIR` pakai path absolut**, di luar folder yang bisa diakses web.

---

## 5. Pasang dependensi & build

Di halaman **Setup Node.js App**, klik **Run NPM Install**.

Lalu jalankan build. Bila ada tombol *Run JS script*, pilih `build`. Bila
tidak ada, gunakan Terminal:

```bash
cd ~/uccenters && BUILD_TARGET=cpanel npm run build
```

> **Build memerlukan memori.** Bila prosesnya terbunuh di tengah jalan
> ("Killed" / keluar tanpa pesan), jatah memori akun Anda kurang. Jalan
> keluarnya: build di komputer sendiri (`BUILD_TARGET=cpanel npm run build`),
> lalu unggah folder `.next` hasilnya ke server.

Terakhir: **Restart** aplikasi.

---

## 6. Setelah hidup

1. Buka `https://domain-anda/api/health` — harus menampilkan
   `"database": "up"`. Bila `"down"`, `DATABASE_URL` salah atau langkah
   *Add User To Database* terlewat.
2. Masuk ke `https://domain-anda/panel/login` dengan `superadmin` /
   `Password123!`.
3. **Segera ganti password itu** lewat menu Users & Hak Akses. Hash bawaannya
   tertulis di berkas `02-seed.sql` yang ada di repositori publik Anda.
4. Aktifkan **AutoSSL** di cPanel agar situs memakai HTTPS.

---

## Yang berbeda dari deployment Docker

| Hal | Docker | cPanel |
|---|---|---|
| Rate limit login | Aplikasi **+ Nginx** (10/menit) | Hanya aplikasi (8 per 15 menit) |
| Rate limit API | Nginx 120/menit | Tidak ada |
| Penyajian `/uploads` | Nginx langsung dari volume | Lewat proses Node |
| Header keamanan | Nginx + aplikasi | Aplikasi (`next.config.mjs`) |
| Backup otomatis | `deploy/backup-db.sh` + cron | Fitur Backup milik cPanel |
| Konsistensi lingkungan | Terjamin oleh image | Bergantung versi Node hosting |

Header keamanan, seluruh pemeriksaan hak akses, sanitasi HTML, validasi
unggahan, dan rate limit login **tetap berjalan** — semuanya ada di dalam
aplikasi, bukan di Nginx.

Yang benar-benar hilang adalah **lapisan pertahanan kedua di tepi jaringan**:
banjir request ke API tidak lagi tertahan sebelum mencapai Node. Untuk situs
profil seperti ini umumnya cukup, tetapi bila nanti trafiknya besar,
pertimbangkan Cloudflare di depan domain sebagai penggantinya.
