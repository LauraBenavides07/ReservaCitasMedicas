#!/bin/sh
set -e

BACKEND_URL="${BACKEND_URL:-http://backend:3000}"
export BACKEND_URL

envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /tmp/nginx/nginx.conf
cat /tmp/nginx/nginx.conf > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
