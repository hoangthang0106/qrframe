# QRFrame – static web build from THIS fork; no backend/database.
# pnpm lockfile v9, Node 22 + pinned pnpm release for repeatable installs.
FROM node:22-alpine AS builder
WORKDIR /app
ENV CI=true
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build \
 && test -f .output/public/index.html \
 && test -f .output/public/previewWorker.js \
 && test -f .output/public/thumbnailWorker.js

# Non-root Nginx runtime. Only compiled static assets are copied.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/.output/public/ /usr/share/nginx/html/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
