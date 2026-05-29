FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY notification-service/package.json ./notification-service/

RUN pnpm install --frozen-lockfile --filter frontend...
COPY frontend ./frontend
WORKDIR /app/frontend
RUN pnpm run build

FROM nginx:alpine AS runtime
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app && \
    rm -f /etc/nginx/conf.d/default.conf && \
    mkdir -p /tmp/nginx && chown app:app /tmp/nginx
COPY --from=build --chown=app:app /app/frontend/dist/frontend/browser /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1
USER app
CMD ["nginx", "-g", "daemon off;"]
