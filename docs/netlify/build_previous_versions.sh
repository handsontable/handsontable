#!/bin/bash
# Fail closed: abort on any error, unset variable, or failed pipe stage so a
# partial bundle never reaches production. The deploy that consumes this output
# is gated on this script succeeding.
set -euo pipefail

mkdir -p docs/docs
node getListOrPreviousVersions.mjs > VERSIONS_VARS
source VERSIONS_VARS
rm VERSIONS_VARS

if [ -z "${LATEST_VERSION:-}" ]; then
    echo "ERROR: LATEST_VERSION is empty - aborting docs build." >&2
    exit 1
fi

echo "/docs/$LATEST_VERSION/* /docs/:splat 301" >> _redirects

for version in ${PREVIOUS_VERSIONS:-}
do
    echo "Building version $version"
    img_id=$(docker create "ghcr.io/handsontable/handsontable/handsontable-documentation:v$version")

    # Two image layouts exist. Legacy VuePress images (<= 17.0) nest the site under
    # /usr/share/nginx/html/docs/<version>/. Astro images (>= 17.1) store it flat at
    # /usr/share/nginx/html/docs/. Either way the assembled site needs the version's files under
    # ./docs/docs/<version>/, so try the nested path first and fall back to copying the flat root.
    if docker cp "$img_id:/usr/share/nginx/html/docs/$version" "./docs/docs/$version" 2>/dev/null; then
        echo "  copied nested layout (/docs/$version)"
    else
        docker cp "$img_id:/usr/share/nginx/html/docs" "./docs/docs/$version"
        echo "  copied flat layout (/docs) into /docs/$version"
    fi

    docker rm "$img_id" >/dev/null
done
