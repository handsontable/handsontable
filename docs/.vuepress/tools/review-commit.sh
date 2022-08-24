docker rm --force handsontable-docs    # remove if a container by that name if already extsts
docker create -p 8000:80 --name handsontable-docs ghcr.io/handsontable/handsontable/handsontable-documentation:$1
docker start handsontable-docs
echo 'Docs started at http://localhost:8000/docs/next/'
