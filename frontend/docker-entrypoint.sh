#!/bin/sh
# Replace API_URL placeholder with runtime env var
API_URL="${API_URL:-http://localhost:8080/api}"
find /usr/share/nginx/html -name 'index.html' -exec sed -i "s|%%API_URL%%|${API_URL}|g" {} +
exec nginx -g 'daemon off;'
