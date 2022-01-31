docker rm --force handsontable-docs    # remove if a container by that name if already extsts
docker create -p 8000:80 --name handsontable-docs ghcr.io/handsontable/handsontable/handsontable-documentation:$1
docker start handsontable-docs
docker exec handsontable-docs sh -c 'mv html docs && mkdir html && mv docs html'   # needed to fix paths for Nginx
echo 'Docs started at http://localhost:8000/docs/index.html'
