#/bin/bash
mkdir -p docs/docs
node getListOrPreviousVerions.mjs > VERSIONS_VARS
source VERSIONS_VARS
rm VERSIONS_VARS
for version in $PREVIOUS_VERSIONS
do
    echo "Building version $version"
    img_id=$(docker create ghcr.io/handsontable/handsontable/handsontable-documentation:v$version)
    docker cp $img_id:/usr/share/nginx/html/docs/$version  ./docs/docs/$version
done

