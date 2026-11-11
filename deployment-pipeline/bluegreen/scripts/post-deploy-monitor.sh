#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/kijanikiosk"
ACTIVE_FILE="$APP_DIR/.active-env"
PREVIOUS_FILE="$APP_DIR/.previous-env"

DURATION="${1:-60}"
INTERVAL=2

timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

get_port() {
    case "$1" in
        blue) echo 3000 ;;
        green) echo 3001 ;;
        *) return 1 ;;
    esac
}

ACTIVE=$(cat "$ACTIVE_FILE")
PREVIOUS=$(cat "$PREVIOUS_FILE")
PORT=$(get_port "$ACTIVE")

echo "[$(timestamp)] [MONITOR] Watching $ACTIVE on port $PORT for ${DURATION}s"

START=$(date +%s)
END=$((START + DURATION))

while [[ $(date +%s) -lt $END ]]; do
    if ! curl -fsS --max-time 2 "http://10.0.2.2:$PORT/health" >/dev/null; then
        echo "[$(timestamp)] [MONITOR FAIL] Health check failed for $ACTIVE"
        echo "[$(timestamp)] [MONITOR FAIL] ROLLBACK TRIGGERED"

        bash "$APP_DIR/scripts/switch-env.sh" "$PREVIOUS"

        echo "[$(timestamp)] [ROLLBACK] Returned traffic to $PREVIOUS"
        exit 1
    fi

    sleep "$INTERVAL"
done

echo "[$(timestamp)] [MONITOR PASS] $ACTIVE remained healthy for ${DURATION}s"
