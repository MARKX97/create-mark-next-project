#!/usr/bin/env bash
set -euo pipefail

# Simple verifier for project-local nginx preview
# Fetches root HTML, lists resource links, and checks HTTP status for basePath assets

GREEN=$'\033[32m'
CYAN=$'\033[36m'
YELLOW=$'\033[33m'
RED=$'\033[31m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

section() {
  printf "\n%b%s%b\n" "${CYAN}${BOLD}" "$1" "${RESET}"
}

info() {
  printf "%b%s%b\n" "${YELLOW}${BOLD}" "$1" "${RESET}"
}

success() {
  printf "%b%s%b\n" "${GREEN}${BOLD}" "$1" "${RESET}"
}

failure() {
  printf "%b%s%b\n" "${RED}${BOLD}" "$1" "${RESET}"
}

BASE="http://localhost:8081"
BASEPATH="${NEXT_PREVIEW_BASEPATH:-/next-modern-starter}"
TMPFILE="/tmp/preview.html"

section "Fetching ${BASE}${BASEPATH}/"
curl -sS "${BASE}${BASEPATH}/" -o "$TMPFILE"

info "Head of HTML (first 160 lines)"
sed -n '1,160p' "$TMPFILE"

section "Asset links (dedup)"
grep -Eo 'href="[^"]+|src="[^"]+' "$TMPFILE" | sed 's/^[^\"]*"//' | sort -u

section "Checking up to 20 ${BASEPATH} assets"
links=$(grep -Eo 'href="[^"]+|src="[^"]+' "$TMPFILE" | sed 's/^[^\"]*"//' | sort -u | grep '^/next-modern-starter' | head -n 20 || true)

if [ -z "$links" ]; then
  failure "No ${BASEPATH} asset links found"
else
  while IFS= read -r l; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}${l}")
    if [ "$code" = "200" ]; then
      success "$l -> $code"
    else
      failure "$l -> $code"
    fi
  done <<< "$links"
fi

section "Done"
