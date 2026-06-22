#/bin/bash
# Local full build of the multi-version docs site (current + previous versions),
# assembled into ./docs ready to deploy to Cloudflare Pages.
rm -rf docs
mkdir -p docs/docs
cd ..
BUILD_MODE=preview npm run docs:build
cd deploy
cp -r ../dist/. docs/
./build_previous_versions.sh
cp _redirects docs/_redirects
# Deploy the assembled site to Cloudflare Pages, e.g.:
#   npx wrangler pages deploy docs --project-name handsontable-docs --branch production
