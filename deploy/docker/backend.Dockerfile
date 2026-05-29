# Build desde la raíz del monorepo: docker compose -f docker-compose.yml -f docker-compose.prod.yml build
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY notification-service/package.json ./notification-service/

FROM base AS deps
RUN pnpm install --frozen-lockfile --filter backend...

FROM base AS build
RUN pnpm install --frozen-lockfile --filter backend...
COPY backend ./backend
WORKDIR /app/backend
RUN pnpm run build

FROM node:20-alpine AS runtime
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app
WORKDIR /app/backend
COPY --from=build --chown=app:app /app/node_modules /app/node_modules
COPY --from=build --chown=app:app /app/backend/node_modules ./node_modules
COPY --from=build --chown=app:app /app/backend/dist ./dist
COPY --from=build --chown=app:app /app/backend/package.json ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/configs || exit 1
CMD ["node", "dist/src/main"]

FROM build AS migrate
WORKDIR /app/backend
ENTRYPOINT ["pnpm", "run", "migration:run"]
