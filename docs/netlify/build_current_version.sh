#/bin/bash
set -euo pipefail
mkdir -p docs/docs
node getListOrPreviousVersions.mjs > VERSIONS_VARS
source VERSIONS_VARS
rm VERSIONS_VARS

if [ -z "${LATEST_VERSION:-}" ]; then
    echo "ERROR: LATEST_VERSION is empty - the version list could not be read from the GitHub API." >&2
    exit 1
fi
echo "/docs/$LATEST_VERSION/* /docs/:splat 301" >> _redirects
for version in $PREVIOUS_VERSIONS
do
    echo "Building version $version"
    img_id=$(docker create ghcr.io/handsontable/handsontable/handsontable-documentation:v$version)
    docker cp $img_id:/usr/share/nginx/html/docs/$version  ./docs/docs/$version
done

echo "Building current version $LATEST_VERSION"
img_id=$(docker create ghcr.io/handsontable/handsontable/handsontable-documentation:v$LATEST_VERSION)
docker cp $img_id:/usr/share/nginx/html/docs  ./docs

cp _redirects docs/_redirects
cp docs/docs/404.html docs/404.html