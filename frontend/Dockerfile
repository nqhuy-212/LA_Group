# Build ở CI/máy dev rồi push image — KHÔNG build trên VPS (RAM 4GB dễ OOM khi
# build Next, xem tech-stack.md/D5). Pin đúng Node theo .nvmrc.
FROM node:24.18.1-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# D5: production KHÔNG dùng rewrites() (Nginx đảm nhiệm việc route /api/*), nên
# build production không cần INTERNAL_API_URL — next.config.ts đã tự bỏ qua
# rewrites() khi NODE_ENV=production.
#
# SITE_URL truyền vào lúc build để HTML prerender (metadataBase/OG, sitemap, robots)
# mang đúng domain ngay từ đầu. Nó KHÔNG bị đóng băng vào bundle như NEXT_PUBLIC_*
# — container vẫn đọc lại từ env lúc chạy, nên đổi domain chỉ cần sửa .env.prod +
# restart; HTML prerender cũ tự làm mới sau 1 vòng ISR (revalidate 300s).
ARG SITE_URL=http://localhost:3000
ENV SITE_URL=$SITE_URL
RUN npm run build

# Runtime chỉ chứa output `standalone` — nhẹ hơn nhiều so với node_modules đầy đủ.
FROM node:24.18.1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Image node chính thức đã có sẵn user `node` (UID 1000) — dùng lại thay vì tạo
# mới để tránh đụng UID.
USER node

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
