#!/usr/bin/env bash
# ============================================================================
#  Penyiapan sekali-jalan server UC: firewall, TLS, dan backup terjadwal.
#
#     sudo ./deploy/setup-server.sh uccenters.uc.ac.id admin@uc.ac.id
#
#  Skrip ini TIDAK menjalankan aplikasi. Jalankan dulu:
#     docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
# ============================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Pakai: sudo $0 <domain> <email-admin>" >&2
  echo "Contoh: sudo $0 uccenters.uc.ac.id admin@uc.ac.id" >&2
  exit 1
fi

if [[ "$EUID" -ne 0 ]]; then
  echo "Jalankan dengan sudo." >&2
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> 1/4 Firewall (ufw)"
apt-get update -qq
apt-get install -y -qq ufw

# Aturan SSH dipasang LEBIH DULU. Menyalakan ufw dengan kebijakan tolak-masuk
# tanpa mengizinkan SSH akan mengunci Anda keluar dari server.
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp

# Port aplikasi (8090), MySQL (3306/3310), dan app (3100) SENGAJA tidak dibuka.
# Kontainer sudah terikat ke 127.0.0.1 lewat docker-compose.prod.yml, dan
# semuanya dijangkau lewat Nginx host di 443.
ufw default deny incoming
ufw default allow outgoing
ufw --force enable
ufw status verbose

echo
echo "PERINGATAN Docker + ufw: Docker menulis aturan iptables sendiri dan bisa"
echo "melewati ufw untuk port yang di-publish ke 0.0.0.0. Itulah sebabnya"
echo "docker-compose.prod.yml mengikat semuanya ke 127.0.0.1. Verifikasi dengan:"
echo "    sudo ss -tlnp | grep -E '3306|3310|8090|3100'"
echo "Semuanya HARUS tampil sebagai 127.0.0.1, bukan 0.0.0.0."

echo
echo "==> 2/4 Nginx host + sertifikat TLS"
apt-get install -y -qq nginx certbot python3-certbot-nginx
mkdir -p /var/www/certbot

sed "s/uccenters\.uc\.ac\.id/$DOMAIN/g" "$PROJECT_DIR/deploy/nginx-host.conf" \
  > /etc/nginx/sites-available/uccenters
ln -sf /etc/nginx/sites-available/uccenters /etc/nginx/sites-enabled/uccenters
rm -f /etc/nginx/sites-enabled/default

# Certbot butuh blok server HTTP yang sudah aktif untuk verifikasi domain,
# sementara blok HTTPS menunjuk sertifikat yang belum ada. Blok HTTPS
# dinonaktifkan sementara agar `nginx -t` lolos.
cp /etc/nginx/sites-available/uccenters /tmp/uccenters-full.conf
awk '/^server \{/{c++} c<2' /tmp/uccenters-full.conf > /etc/nginx/sites-available/uccenters
nginx -t && systemctl reload nginx

certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

cp /tmp/uccenters-full.conf /etc/nginx/sites-available/uccenters
nginx -t && systemctl reload nginx

# Certbot memasang systemd timer perpanjangan otomatis. Nginx perlu di-reload
# setelah sertifikat baru terbit, kalau tidak yang dipakai tetap yang lama.
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'HOOK'
#!/bin/sh
systemctl reload nginx
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
systemctl list-timers 'certbot*' --no-pager || true

echo
echo "==> 3/4 Backup harian"
install -m 0755 "$PROJECT_DIR/deploy/backup-db.sh" /usr/local/bin/uccenters-backup
cat > /etc/cron.d/uccenters-backup <<CRON
# Backup UC Centers tiap hari 02:15 WIB
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
15 2 * * * root cd $PROJECT_DIR && /usr/local/bin/uccenters-backup >> /var/log/uccenters-backup.log 2>&1
CRON
chmod 0644 /etc/cron.d/uccenters-backup

echo
echo "==> 4/4 Selesai"
echo "  Situs   : https://$DOMAIN"
echo "  Backup  : $PROJECT_DIR/backups (harian 02:15, simpan 14 hari)"
echo "  Log     : /var/log/uccenters-backup.log"
echo
echo "MASIH PERLU ANDA LAKUKAN:"
echo "  1. Uji pemulihan backup ke database percobaan. Backup yang belum"
echo "     pernah diuji belum tentu bisa dipakai."
echo "  2. Salin isi folder backups/ ke penyimpanan di LUAR server ini."
echo "  3. Setelah HTTPS stabil beberapa hari, naikkan max-age HSTS di"
echo "     /etc/nginx/sites-available/uccenters."
