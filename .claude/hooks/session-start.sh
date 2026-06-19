#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 600000}'

# Activate pnpm via corepack (Node 22 + pnpm 10.30.2 as declared in package.json)
corepack enable 2>/dev/null || true
corepack prepare pnpm@10.30.2 --activate 2>/dev/null || true

cd "$CLAUDE_PROJECT_DIR"

# Install all workspace dependencies from lockfile
pnpm install --frozen-lockfile

