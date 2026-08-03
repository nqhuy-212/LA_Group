# Build image nhẹ cho production — build ở CI/máy dev rồi push, VPS chỉ pull
# (RAM 4GB dễ OOM khi build, xem tech-stack.md). Pin đúng Python 3.11 (.python-version).
FROM python:3.11-slim

WORKDIR /app

# psycopg2-binary + bcrypt đã có wheel manylinux sẵn — không cần build-essential.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

RUN useradd --create-home --uid 1000 appuser && \
    mkdir -p /uploads && chown appuser:appuser /uploads
USER appuser

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

# Áp migration trước khi chạy — an toàn để lặp lại (idempotent), phù hợp triển
# khai 1 instance duy nhất (không có nhiều container cùng chạy migration song song).
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
