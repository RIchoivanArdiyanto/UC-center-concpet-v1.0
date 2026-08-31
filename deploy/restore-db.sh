#!/usr/bin/env bash
# ============================================================================
#  Pulihkan database UC Centers dari berkas backup.
#
#     ./deploy/restore-db.sh backups/uccenters-20260829-020000.sql.gz
#
#  MENIMPA seluruh isi database saat ini.
# ============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

DUMP_FILE="${1:-}"
if [[ -z "$DUMP_FILE" || ! -f "$DUMP_FILE" ]]; then
  echo "Pakai: $0 <berkas-backup.sql.gz>" >&2
  exit 1
fi

set -a; source .env; set +a
DB_NAME="${DB_NAME:-uccenters}"
DB_USER="${DB_USER:-uccenters}"

echo "PERINGATAN: seluruh isi database '$DB_NAME' akan DITIMPA oleh $DUMP_FILE"
read -r -p "Ketik 'YA' untuk melanjutkan: " CONFIRM
[[ "$CONFIRM" == "YA" ]] || { echo "Dibatalkan."; exit 1; }

echo "[restore] Memulihkan..."
zcat "$DUMP_FILE" | docker compose exec -T \
  -e MYSQL_PWD="$DB_PASSWORD" \
  db mysql --default-character-set=utf8mb4 -u "$DB_USER" "$DB_NAME"

echo "[restore] Selesai. Merestart aplikasi agar koneksinya segar."
docker compose restart app
