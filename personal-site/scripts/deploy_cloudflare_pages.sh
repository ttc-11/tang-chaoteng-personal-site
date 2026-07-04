#!/bin/zsh
set -euo pipefail

PROJECT_NAME="${1:-${CLOUDFLARE_PAGES_PROJECT_NAME:-}}"

if [[ -z "${PROJECT_NAME}" ]]; then
  echo "Missing project name."
  echo "Set CLOUDFLARE_PAGES_PROJECT_NAME or pass it as the first argument."
  exit 1
fi

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "Missing CLOUDFLARE_ACCOUNT_ID."
  exit 1
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN."
  exit 1
fi

python3 scripts/build_static.py
npx wrangler pages deploy dist --project-name="${PROJECT_NAME}"
