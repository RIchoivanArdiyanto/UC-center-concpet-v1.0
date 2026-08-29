#!/bin/sh
# ---------------------------------------------------------------------------
#  Startup kontainer app:
#    1. migrate deploy  -> bikin/menyamakan skema PostgreSQL (idempoten)
#    2. seed            -> isi admin + data awal (idempoten, aman diulang)
#    3. exec CMD        -> jalankan server Next.js sebagai PID 1
# ---------------------------------------------------------------------------
set -e

PRISMA_CLI="node ./node_modules/prisma/build/index.js"

echo "[entrypoint] Menjalankan migrasi database..."
$PRISMA_CLI migrate deploy

if [ "${SKIP_SEED}" = "true" ]; then
  echo "[entrypoint] SKIP_SEED=true — seeding dilewati."
else
  echo "[entrypoint] Menjalankan seed..."
  node seed-dist/prisma/seed.js
fi

echo "[entrypoint] Menyalakan server Next.js pada port ${PORT:-3000}..."
exec "$@"
