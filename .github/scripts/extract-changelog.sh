#!/usr/bin/env bash
set -euo pipefail

# extract-changelog.sh <version-or-prefix> [changelog-path]
#
# Extracts the changelog content for a specific version from CHANGELOG.md.
# The version argument is matched as a prefix against version headers (## [VERSION...]).
# Uses literal string matching to safely handle dots, hyphens, etc. in version strings.
#
# Examples:
#   ./extract-changelog.sh 16.3.0-rc1    → matches "## [16.3.0-rc1] - ..."
#   ./extract-changelog.sh 16.3.0-rc     → matches the first "## [16.3.0-rc*] - ..." entry
#   ./extract-changelog.sh 16.3.0        → matches "## [16.3.0] - ..."

VERSION="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CHANGELOG_PATH="${2:-$REPO_ROOT/CHANGELOG.md}"

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version-or-prefix> [changelog-path]" >&2
  exit 1
fi

if [ ! -f "$CHANGELOG_PATH" ]; then
  echo "Error: CHANGELOG.md not found at: $CHANGELOG_PATH" >&2
  exit 1
fi

# Extract content between the matching version header and the next version header.
# Uses index() for literal string matching ("starts with") rather than regex,
# so special characters in version strings (dots, hyphens) are handled safely.
CONTENT=$(awk -v version="$VERSION" '
  BEGIN { header = "## [" version }
  !found && index($0, header) == 1 { found = 1; next }
  found && /^## \[/ { exit }
  found { print }
' "$CHANGELOG_PATH")

if [ -z "$CONTENT" ]; then
  echo "Error: No changelog entry found for version: $VERSION" >&2
  exit 1
fi

# Strip leading and trailing blank lines
printf '%s\n' "$CONTENT" | awk '
  /[^ \t]/ { found = 1 }
  found { lines[++n] = $0 }
  END {
    while (n > 0 && lines[n] ~ /^[[:space:]]*$/) n--
    for (i = 1; i <= n; i++) print lines[i]
  }
'
