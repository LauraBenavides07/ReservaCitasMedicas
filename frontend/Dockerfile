FROM node:20-alpine AS build
RUN npm install -g pnpm
WORKDIR /app
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm run build && pnpm store prune

FROM nginx:alpine AS runtime
RUN apk add --no-cache gettext && \
    addgroup -g 1001 -S app && adduser -S app -u 1001 -G app && \
    rm -f /etc/nginx/conf.d/default.conf && \
    mkdir -p /tmp/nginx && chown app:app /tmp/nginx
COPY --from=build --chown=app:app /app/dist/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1
USER app
ENTRYPOINT ["/docker-entrypoint.sh"]
