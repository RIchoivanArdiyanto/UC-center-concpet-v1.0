#!/usr/bin/env bash
# ============================================================================
#  Backup database UC Centers (MySQL) + berkas unggahan.
#
#  Jalankan dari root project:
#     ./deploy/backup-db.sh
#
#  Otomatis tiap malam lewat cron (lihat deploy/setup-server.sh).
# ============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

# Baca kredensial dari .env tanpa membocorkannya ke daftar proses.
if [[ ! -f .env ]]; then
  echo "[backup] .env tidak ditemukan di $PROJECT_DIR" >&2
  exit 1
fi
set -a; source .env; set +a

DB_NAME="${DB_NAME:-uccenters}"
DB_USER="${DB_USER:-uccenters}"

mkdir -p "$BACKUP_DIR"

SQL_FILE="$BACKUP_DIR/uccenters-$STAMP.sql.gz"
echo "[backup] Dump database -> $SQL_FILE"

# --single-transaction membuat dump konsisten TANPA mengunci tabel, jadi situs
# tetap bisa diakses selama backup berjalan (InnoDB).
# Password dikirim lewat variabel lingkungan di dalam kontainer, bukan lewat
# argumen -p, supaya tidak terlihat di `ps`.
docker compose exec -T \
  -e MYSQL_PWD="$DB_PASSWORD" \
  db mysqldump \
    --single-transaction \
    --quick \
    --routines \
    --events \
    --default-character-set=utf8mb4 \
    -u "$DB_USER" \
    "$DB_NAME" \
  | gzip -9 > "$SQL_FILE"

# Dump yang gagal di tengah jalan tetap menghasilkan berkas .gz kecil yang
# tampak "berhasil". Diperiksa isinya sebelum dianggap sah.
if ! gzip -t "$SQL_FILE" 2>/dev/null; then
  echo "[backup] GAGAL: berkas dump rusak, dihapus." >&2
  rm -f "$SQL_FILE"
  exit 1
fi

if ! zcat "$SQL_FILE" | tail -5 | grep -q "Dump completed"; then
  echo "[backup] GAGAL: dump tidak selesai sempurna, dihapus." >&2
  rm -f "$SQL_FILE"
  exit 1
fi

# Berkas unggahan tidak ada di database — kalau tidak ikut dicadangkan, seluruh
# gambar dan PDF hilang saat pemulihan.
UPLOADS_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"
echo "[backup] Arsip berkas unggahan -> $UPLOADS_FILE"
docker compose exec -T app tar -czf - -C /app uploads > "$UPLOADS_FILE" || {
  echo "[backup] PERINGATAN: gagal mengarsipkan uploads." >&2
  rm -f "$UPLOADS_FILE"
}

echo "[backup] Membuang cadangan lebih tua dari $RETENTION_DAYS hari"
find "$BACKUP_DIR" -name 'uccenters-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz'   -mtime "+$RETENTION_DAYS" -delete

echo "[backup] Selesai. Ukuran: $(du -h "$SQL_FILE" | cut -f1) (db)"
echo "[backup] CATATAN: salin isi $BACKUP_DIR ke penyimpanan LAIN."
echo "         Cadangan yang hanya ada di server yang sama ikut hilang"
echo "         bila server itu rusak."
