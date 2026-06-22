#!/bin/bash
# Fail closed: abort on any error, unset variable, or failed pipe stage so a
# partial bundle never reaches production. The Cloudflare/Netlify deploy steps
# are gated on this script succeeding.
set -euo pipefail

mkdir -p docs/docs
node getListOrPreviousVersions.mjs > VERSIONS_VARS
source VERSIONS_VARS
rm VERSIONS_VARS

if [ -z "${LATEST_VERSION:-}" ]; then
    echo "ERROR: LATEST_VERSION is empty - aborting production docs build." >&2
    exit 1
fi

# Hand the resolved latest version to the "Add Cloudflare worker" workflow
# step. It must match the content layout assembled below (latest version's
# docs at the unversioned /docs root), not the prod-docs/<MAJOR.MINOR> branch
# being deployed - those can differ when hotfixing an older version.
printf '%s' "$LATEST_VERSION" > LATEST_DOCS_VERSION

echo "/docs/$LATEST_VERSION/* /docs/:splat 301" >> _redirects

for version in ${PREVIOUS_VERSIONS:-}
do
    echo "Building version $version"
    img_id=$(docker create "ghcr.io/handsontable/handsontable/handsontable-documentation:v$version")

    # Two image layouts exist. Legacy VuePress images (<= 17.0) nest the site under
    # /usr/share/nginx/html/docs/<version>/. Astro images (>= 17.1) store the site flat at
    # /usr/share/nginx/html/docs/. Either way the assembled site needs the version's files under
    # ./docs/docs/<version>/, so try the nested path first and fall back to copying the flat root.
    if docker cp "$img_id:/usr/share/nginx/html/docs/$version" "./docs/docs/$version" 2>/dev/null; then
        echo "  copied nested layout (/docs/$version)"
    else
        docker cp "$img_id:/usr/share/nginx/html/docs" "./docs/docs/$version"
        echo "  copied flat layout (/docs) into /docs/$version"

        # Astro (>=17.1) images are built with an unversioned base, so every
        # internal href/src is root-relative with no version segment. Rewrite
        # them now that the build is nested under /docs/$version, otherwise
        # any link click on this version resolves to the unversioned root
        # (whatever is currently deployed as latest) instead of staying here.
        node rewriteVersionedPaths.mjs "./docs/docs/$version" "$version"
    fi

    docker rm "$img_id" >/dev/null
done

echo "Building current version $LATEST_VERSION"
img_id=$(docker create "ghcr.io/handsontable/handsontable/handsontable-documentation:v$LATEST_VERSION")
docker cp "$img_id:/usr/share/nginx/html/docs" ./docs

cp _redirects docs/_redirects
cp docs/docs/404.html docs/404.html
