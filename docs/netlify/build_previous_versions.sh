#/bin/bash
mkdir -p docs/docs
versions="9.0 11.0 11.1 12.0 12.1 12.2 12.3 12.4 13.0 14.0 14.1 14.2 14.3 14.4 14.5 14.6 15.0"
for version in $versions
do
    img_id=$(docker create ghcr.io/handsontable/handsontable/handsontable-documentation:v$version)
    docker cp $img_id:/usr/share/nginx/html/docs/$version  ./docs/docs/$version
done

