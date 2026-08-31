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

        # Legacy VuePress builds from mid-14.x through 17.0 render the
        # "newer version available" banner at the bottom of the page, where
        # readers miss it (PRO-1303). These builds are never rebuilt, so
        # inject a CSS override that moves the banner to the top. The script
        # self-gates on the broken layout, leaving older top-banner themes
        # and bannerless pages byte-identical.
        node injectBannerTopCss.mjs "./docs/docs/$version"
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
