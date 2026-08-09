#!/usr/bin/env bash
set -euo pipefail

# Restore một bản backup đã mã hoá. CẢNH BÁO: ghi đè dữ liệu hiện có — chỉ chạy
# nhắm vào DB trống, hoặc đã tự backup thêm một lần nữa trước đó.
#
# Dùng:
#   ./scripts/restore.sh /root/backups/lagroup-20260809-020000.sql.gz.enc   # database
#   ./scripts/restore.sh /root/backups/uploads-20260809-020000.tar.gz.enc   # file CV
# Script tự nhận loại theo tên file.
#
# Backup chưa restore thử được là backup không tồn tại — bắt buộc chạy thật một
# lần vào DB trống trước khi coi là đã có backup.

cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.prod}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

ENC_FILE="${1:?Cần truyền đường dẫn file .enc}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:?Thiếu biến BACKUP_ENCRYPTION_KEY — điền vào .env.prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
PLAIN_FILE="${ENC_FILE%.enc}"

DC="docker compose --env-file $ENV_FILE -f $COMPOSE_FILE"

openssl enc -d -aes-256-cbc -pbkdf2 \
  -in "$ENC_FILE" -out "$PLAIN_FILE" -pass env:BACKUP_ENCRYPTION_KEY
trap 'rm -f "$PLAIN_FILE"' EXIT

case "$PLAIN_FILE" in
  *.sql.gz)
    POSTGRES_USER="${POSTGRES_USER:?Thiếu biến POSTGRES_USER — điền vào .env.prod}"
    POSTGRES_DB="${POSTGRES_DB:?Thiếu biến POSTGRES_DB — điền vào .env.prod}"
    gunzip -c "$PLAIN_FILE" | $DC exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"
    ;;
  *.tar.gz)
    UPLOADS_VOL="$(docker volume ls -q | grep -E '_uploads$' | head -1 || true)"
    [ -n "$UPLOADS_VOL" ] || { echo "Không tìm thấy volume *_uploads — chạy stack lên trước." >&2; exit 1; }
    docker run --rm -v "$UPLOADS_VOL":/data -v "$(cd "$(dirname "$PLAIN_FILE")" && pwd)":/backup alpine \
      tar xzf "/backup/$(basename "$PLAIN_FILE")" -C /data
    ;;
  *)
    echo "Không nhận ra loại file: $PLAIN_FILE (mong đợi .sql.gz.enc hoặc .tar.gz.enc)" >&2
    exit 1
    ;;
esac

echo "Restore xong từ $(basename "$ENC_FILE")"
