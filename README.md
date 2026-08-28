# UC Centers — Automatic Docker Localhost Setup

Seluruh infrastruktur aplikasi **UC Centers** sudah dikonfigurasi agar dapat langsung berjalan secara otomatis via Docker.

## 🚀 Cara Menjalankan Aplikasi di Localhost

Cukup jalankan perintah standar Docker ini sekali:

```bash
docker compose up -d --build
```

### 🎯 Keunggulan Konfigurasi Docker Ini:
1. **Auto Restart (`restart: always`)**: Setiap kali Docker Desktop / komputer dinyalakan, seluruh kontainer (`app`, `db`, `redis`, `nginx`) akan otomatis menyala di latar belakang tanpa perlu perintah atau build ulang manual.
2. **Auto Migration (`npx prisma migrate deploy`)**: Kontainer `app` akan secara otomatis menjalankan migrasi database PostgreSQL pada saat kontainer pertama kali dinyalakan.
3. **No Port Exposure**: PostgreSQL dan Redis terlindungi di dalam jaringan internal Docker. Hanya port HTTP `80` (Nginx) yang dibuka ke localhost.

---

## 🌐 Alamat Akses Localhost

- **Website Publik**: [http://localhost](http://localhost)
- **Admin Panel**: [http://localhost/admin/login](http://localhost/admin/login)
  - **Email**: `admin@uccenters.id`
  - **Password**: `Password123!`
