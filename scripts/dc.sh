#!/usr/bin/env bash
set -euo pipefail

# Wrapper cho stack production. LUÔN dùng file này thay cho `docker compose` trần.
#
# Vì sao: `env_file:` trong compose chỉ nạp biến VÀO TRONG container, không dùng cho
# phép thay thế `${...}` ở chính file compose (image:, environment:, healthcheck:).
# Phần đó compose chỉ đọc từ `.env` mặc định hoặc `--env-file`. Thiếu cờ này thì
# `${BACKEND_IMAGE}` rỗng (compose lỗi ngay) và `${POSTGRES_USER}` rỗng ở khối
# `environment:` sẽ ĐÈ LÊN giá trị đúng từ `env_file:` → Postgres init sai user.

cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.prod}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

[ -f "$ENV_FILE" ] || { echo "Không thấy $ENV_FILE — copy từ .env.prod.example rồi điền giá trị thật." >&2; exit 1; }

exec docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
