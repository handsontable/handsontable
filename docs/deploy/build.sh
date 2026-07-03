#!/bin/bash
# Local full build of the multi-version docs site (current + previous versions),
# assembled into ./docs ready to deploy to Cloudflare Pages.
#
# Requires GITHUB_TOKEN in the environment: build_previous_versions.sh and the
# worker substitution below both call getListOrPreviousVersions.mjs, which
# authenticates its GitHub GraphQL query with it.
set -euo pipefail

rm -rf docs
mkdir -p docs/docs
cd ..
BUILD_MODE=preview npm run build
cd deploy
cp -r ../dist/. docs/docs/

# Place 404.html at the publish root so the host serves it automatically for
# all unmatched routes (no redirect rule needed) - mirrors build_current_version.sh.
cp ../dist/404.html docs/404.html

./build_previous_versions.sh

# Mirrors "Add Cloudflare worker to production deploy" in docs-production.yml:
# substitute the latest-version placeholder so rule 1b works locally too, and
# always write the worker - a build published without it silently falls back
# to _redirects and every worker-only redirect breaks.
node getListOrPreviousVersions.mjs > VERSIONS_VARS
source VERSIONS_VARS
rm VERSIONS_VARS
if printf '%s' "${LATEST_VERSION:-}" | grep -Eq '^[0-9]+\.[0-9]+$'; then
    sed "s/__LATEST_DOCS_VERSION__/${LATEST_VERSION}/g" ../cloudflare/_worker.js > docs/_worker.js
else
    cp ../cloudflare/_worker.js docs/_worker.js
fi
test -f docs/_worker.js

# Preview the assembled site locally, or deploy it to a non-production
# Cloudflare Pages branch for manual review, e.g.:
#   npx wrangler pages deploy docs --project-name handsontable-docs-staging --branch <your-branch-slug>
# Do not deploy straight to the production branch label from a local run -
# this script has none of the CI pipeline's safeguards (matching Docker image
# versions, the worker tripwire enforced as a hard failure) behind it.
