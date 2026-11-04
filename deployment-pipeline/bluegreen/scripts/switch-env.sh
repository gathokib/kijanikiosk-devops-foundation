#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
APP_DIR="/opt/kijanikiosk"
NGINX_CONFIG="/etc/nginx/sites-available/default"

case "$TARGET" in
    blue) TARGET_PORT=3000 ;;
    green) TARGET_PORT=3001 ;;
    *)
        echo "Usage: $0 {blue|green}"
        exit 1
        ;;
esac

CURRENT=$(cat "$APP_DIR/.active-env")

if [[ "$TARGET" == "$CURRENT" ]]; then
    echo "Already running $TARGET"
    exit 0
fi

echo "Switching traffic from $CURRENT to $TARGET"

sudo sed -i \
    "s|proxy_pass http://10.0.2.2:[0-9]*;|proxy_pass http://10.0.2.2:${TARGET_PORT};|" \
    "$NGINX_CONFIG"

sudo nginx -t
sudo systemctl reload nginx

echo "$CURRENT" > "$APP_DIR/.previous-env"
echo "$TARGET" > "$APP_DIR/.active-env"

echo "Traffic successfully switched to $TARGET"
