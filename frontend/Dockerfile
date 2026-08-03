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
