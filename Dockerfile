# Build ONLY the audited secure/ frontend, not the legacy code-editor source.
# No external CDN or network calls are required after initial build.
FROM node:22-alpine AS builder
WORKDIR /app
ENV CI=true
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY secure/ ./secure/
RUN pnpm run build && test -s /app/dist-secure/index.html

# Runtime contains only compiled static assets and unprivileged Nginx.
# No Node interpreter, source tree, SSH, secrets, volumes or database.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist-secure/ /usr/share/nginx/html/
EXPOSE 18090
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:18090/ || exit 1
