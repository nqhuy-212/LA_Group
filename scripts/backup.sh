#!/usr/bin/env bash
set -euo pipefail

# pg_dump -> mã hoá (openssl, không cần cài thêm gói) -> đẩy lên remote rclone
# (B2/Drive) — chạy qua cron hằng đêm trên VPS (xem commands.md). Restore tương
# ứng: scripts/restore.sh. Yêu cầu đã `rclone config` sẵn remote tên $RCLONE_REMOTE.

BACKUP_DIR="${BACKUP_DIR:-/root/backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:?Thiếu biến RCLONE_REMOTE (VD: b2:lahr-backups)}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:?Thiếu biến BACKUP_ENCRYPTION_KEY}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="${BACKUP_DIR}/lagroup-${TIMESTAMP}.sql.gz"
ENC_FILE="${DUMP_FILE}.enc"

mkdir -p "$BACKUP_DIR"

docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "$DUMP_FILE"

openssl enc -aes-256-cbc -pbkdf2 -salt \
  -in "$DUMP_FILE" -out "$ENC_FILE" -pass env:BACKUP_ENCRYPTION_KEY
rm -f "$DUMP_FILE"  # không giữ bản chưa mã hoá trên đĩa

rclone copy "$ENC_FILE" "$RCLONE_REMOTE"

# Giữ 14 bản gần nhất tại chỗ (phòng khi cần restore nhanh không chờ tải remote).
find "$BACKUP_DIR" -name '*.sql.gz.enc' -mtime +14 -delete

echo "Backup xong: $(basename "$ENC_FILE")"
