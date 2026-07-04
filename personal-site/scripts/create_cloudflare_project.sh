#!/bin/zsh
set -euo pipefail

PROJECT_NAME="${1:-${CLOUDFLARE_PAGES_PROJECT_NAME:-}}"
PRODUCTION_BRANCH="${2:-main}"

if [[ -z "${PROJECT_NAME}" ]]; then
  echo "Usage: CLOUDFLARE_PAGES_PROJECT_NAME=<name> bash scripts/create_cloudflare_project.sh"
  echo "   or: bash scripts/create_cloudflare_project.sh <project-name> [production-branch]"
  exit 1
fi

npx wrangler pages project create "${PROJECT_NAME}" --production-branch "${PRODUCTION_BRANCH}"
