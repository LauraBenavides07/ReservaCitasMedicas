FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN pnpm install --prod && pnpm store prune

FROM base AS build
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm run build && pnpm prune --prod && pnpm store prune

FROM node:20-alpine AS runtime
RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app
WORKDIR /app
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package*.json ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/configs || exit 1
CMD ["node", "dist/src/main"]
