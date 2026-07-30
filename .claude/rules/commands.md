# Lệnh thường dùng

```bash
# Frontend (thư mục frontend/)
npm run dev         # chạy dev server Next.js
npm run build        # build production (output: 'standalone')
npm run lint         # kiểm tra lint
npm run typecheck    # kiểm tra type (script riêng, không lồng vào build)

# Backend (thư mục backend/)
uvicorn app.main:app --reload   # chạy dev server FastAPI
alembic revision --autogenerate -m "..."   # tạo migration khi đổi model
alembic upgrade head             # áp migration

# Hạ tầng (VPS)
docker compose up -d --build              # chạy toàn bộ stack (web)
docker compose --profile automation up -d # bật thêm n8n khi cần
docker stats                              # theo dõi RAM/CPU từng container
```

(Cập nhật danh sách này ngay khi cấu trúc project thực tế có thay đổi — đừng để mục này lệch với repo.)
