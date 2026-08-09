#!/usr/bin/env bash
set -euo pipefail

# Backup hằng đêm: pg_dump + volume uploads -> mã hoá (openssl, có sẵn trên mọi
# VPS Linux) -> đẩy lên remote rclone (B2/Drive). Chạy qua cron, xem VPS.md §8.
# Restore tương ứng: scripts/restore.sh.
#
# Backup PHẢI gồm cả `uploads`: DB chỉ lưu ĐƯỜNG DẪN tới file CV, không lưu nội
# dung. Mất volume uploads = mọi bản ghi application trỏ tới file không tồn tại,
# và đó là dữ liệu cá nhân của ứng viên (NĐ13/2023) không thể tạo lại.

cd "$(dirname "$0")/.."

# Cron chạy với môi trường gần như rỗng — phải tự nạp .env.prod, nếu không thì
# ${POSTGRES_USER}/${POSTGRES_DB} không tồn tại và `set -u` sẽ abort ngay.
ENV_FILE="${ENV_FILE:-.env.prod}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/root/backups}"
RCLONE_REMOTE="${RCLONE_REMOTE:?Thiếu biến RCLONE_REMOTE (VD: b2:lahr-backups) — điền vào .env.prod}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:?Thiếu biến BACKUP_ENCRYPTION_KEY — điền vào .env.prod}"
POSTGRES_USER="${POSTGRES_USER:?Thiếu biến POSTGRES_USER — điền vào .env.prod}"
POSTGRES_DB="${POSTGRES_DB:?Thiếu biến POSTGRES_DB — điền vào .env.prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

DC="docker compose --env-file $ENV_FILE -f $COMPOSE_FILE"

mkdir -p "$BACKUP_DIR"

encrypt_and_ship() {
  local plain="$1" enc="$1.enc"
  openssl enc -aes-256-cbc -pbkdf2 -salt \
    -in "$plain" -out "$enc" -pass env:BACKUP_ENCRYPTION_KEY
  rm -f "$plain"  # không giữ bản chưa mã hoá trên đĩa
  rclone copy "$enc" "$RCLONE_REMOTE"
  echo "  -> $(basename "$enc") ($(du -h "$enc" | cut -f1))"
}

# --- 1. Database ---
DUMP_FILE="${BACKUP_DIR}/lagroup-${TIMESTAMP}.sql.gz"
$DC exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$DUMP_FILE"
encrypt_and_ship "$DUMP_FILE"

# --- 2. Volume uploads (file CV ứng viên) ---
# Tên volume thật do compose đặt là "<tên-project>_uploads"; project mặc định lấy
# theo tên thư mục nên đừng hardcode — dò từ danh sách volume đang có.
UPLOADS_VOL="$(docker volume ls -q | grep -E '_uploads$' | head -1 || true)"
if [ -n "$UPLOADS_VOL" ]; then
  UPLOADS_FILE="${BACKUP_DIR}/uploads-${TIMESTAMP}.tar.gz"
  docker run --rm -v "$UPLOADS_VOL":/data:ro -v "$BACKUP_DIR":/backup alpine \
    tar czf "/backup/$(basename "$UPLOADS_FILE")" -C /data .
  encrypt_and_ship "$UPLOADS_FILE"
else
  echo "CẢNH BÁO: không tìm thấy volume *_uploads — CV ứng viên KHÔNG được backup!" >&2
fi

# Giữ 14 ngày tại chỗ (phòng khi cần restore nhanh không chờ tải từ remote).
find "$BACKUP_DIR" -name '*.enc' -mtime +14 -delete

echo "Backup xong: $TIMESTAMP"
