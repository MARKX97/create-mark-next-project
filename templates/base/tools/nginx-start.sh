#!/usr/bin/env bash
set -euo pipefail

# Start a project-local nginx instance using a self-contained config and prefix.
# This does NOT modify system nginx configuration. Uses port 8081 by default.

GREEN=$'\033[32m'
YELLOW=$'\033[33m'
RED=$'\033[31m'
CYAN=$'\033[36m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

info() {
  printf "%b%s%b\n" "${CYAN}${BOLD}" "$1" "${RESET}"
}

success() {
  printf "%b%s%b\n" "${GREEN}${BOLD}" "$1" "${RESET}"
}

warn() {
  printf "%b%s%b\n" "${YELLOW}${BOLD}" "$1" "${RESET}"
}

error() {
  printf "%b%s%b\n" "${RED}${BOLD}" "$1" "${RESET}" >&2
}

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
NGINX_CONF="$ROOT_DIR/tools/nginx-local-project.conf"
PREFIX_DIR="$ROOT_DIR/tools/nginx-root"

# Auto-detect nginx binary: prefer PATH, then common Homebrew locations
NGINX_BIN="$(command -v nginx || true)"
if [ -z "$NGINX_BIN" ]; then
  if [ -x "/opt/homebrew/bin/nginx" ]; then
    NGINX_BIN="/opt/homebrew/bin/nginx"
  elif [ -x "/opt/homebrew/sbin/nginx" ]; then
    NGINX_BIN="/opt/homebrew/sbin/nginx"
  elif [ -x "/usr/local/sbin/nginx" ]; then
    NGINX_BIN="/usr/local/sbin/nginx"
  elif [ -x "/usr/sbin/nginx" ]; then
    NGINX_BIN="/usr/sbin/nginx"
  else
    NGINX_BIN=""
  fi
fi

mkdir -p "$PREFIX_DIR/logs" "$PREFIX_DIR/conf" "$PREFIX_DIR/temp"

if [ -z "$NGINX_BIN" ] || [ ! -x "$NGINX_BIN" ]; then
  error "nginx binary not found (searched PATH and common locations). Install nginx or set NGINX_BIN."
  exit 1
fi

info "Using nginx binary: $NGINX_BIN"
info "Starting project-local nginx..."
"$NGINX_BIN" -c "$NGINX_CONF" -p "$PREFIX_DIR"
sleep 0.2

if [ -f "$PREFIX_DIR/logs/nginx.pid" ]; then
  PID=$(cat "$PREFIX_DIR/logs/nginx.pid")
  success "nginx started (pid=$PID)"
  info "Serving ${BOLD}${BASE_URL:-http://localhost:8081/next-modern-starter/}${RESET}"
  warn "Stop the server with: pnpm preview:stop"
else
  error "Failed to start nginx, check $PREFIX_DIR/logs/error.log"
  exit 2
fi
