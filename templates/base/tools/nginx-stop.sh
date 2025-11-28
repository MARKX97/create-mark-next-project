#!/usr/bin/env bash
set -euo pipefail

GREEN=$'\033[32m'
YELLOW=$'\033[33m'
RED=$'\033[31m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

info() {
  printf "%b%s%b\n" "${YELLOW}${BOLD}" "$1" "${RESET}"
}

success() {
  printf "%b%s%b\n" "${GREEN}${BOLD}" "$1" "${RESET}"
}

error() {
  printf "%b%s%b\n" "${RED}${BOLD}" "$1" "${RESET}" >&2
}

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
PREFIX_DIR="$ROOT_DIR/tools/nginx-root"

PID_FILE="$PREFIX_DIR/logs/nginx.pid"

if [ ! -f "$PID_FILE" ]; then
  info "No pid file found at $PID_FILE. nginx already stopped?"
  exit 0
fi

PID=$(cat "$PID_FILE")
info "Stopping project-local nginx (pid=$PID)..."
kill "$PID" || true
sleep 0.2
if ps -p "$PID" > /dev/null 2>&1; then
  info "nginx still running; sending TERM..."
  kill -TERM "$PID" || true
  sleep 0.2
fi

if ! ps -p "$PID" > /dev/null 2>&1; then
  success "nginx stopped."
  rm -f "$PID_FILE" || true
else
  error "Failed to stop nginx (pid=$PID)."
  exit 1
fi
