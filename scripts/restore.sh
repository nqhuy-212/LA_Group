#!/usr/bin/env bash
set -euo pipefail

# Restore một bản backup đã mã hoá vào Postgres. CẢNH BÁO: ghi đè dữ liệu hiện có
# trong DB đích — chỉ chạy nhắm vào DB trống hoặc đã tự backup thêm một lần nữa.
# Dùng: BACKUP_ENCRYPTION_KEY=... scripts/restore.sh <file.sql.gz.enc>
#
# Backup chưa restore thử được là backup không tồn tại — bắt buộc chạy kịch bản
# này thật một lần vào DB trống trước khi coi P9 là xong (xem docs/PLAN.md DoD).

ENC_FILE="${1:?Cần truyền đường dẫn file .sql.gz.enc}"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:?Thiếu biến BACKUP_ENCRYPTION_KEY}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DUMP_FILE="${ENC_FILE%.enc}"

openssl enc -d -aes-256-cbc -pbkdf2 \
  -in "$ENC_FILE" -out "$DUMP_FILE" -pass env:BACKUP_ENCRYPTION_KEY

gunzip -c "$DUMP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U "${POSTGRES_USER}" "${POSTGRES_DB}"

rm -f "$DUMP_FILE"
echo "Restore xong từ $(basename "$ENC_FILE")"
