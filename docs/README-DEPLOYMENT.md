# Deployment

Our server configurations watch changes for `latest` tag for an image. Refresh itself If detect newer version.

## From the console

**Once:**

Login into ghcr:
 * Login: email used for GH Account
 * Pass: PAT with `write:packages` permission: https://github.com/settings/tokens/new

```shell script
docker login --registry docker.pkg.github.com
```

**Deploy:**

```shell script
docker build -t docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest .
docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
```

## From GH Action

It happens automatically for each commit pushed into the `develop` branch.

## Manually from GH Action

It is able to run manually deployment from any branch. To perform a deployment manually:

1. Go into `Actions` tab in a repo,
2. On the left-hend side, select `documentation`,
3. On the right-hand side, click `Run workflow`
4. Select branch,
5. Run workflow.

## Revert automatically deployment

GH Action pushes two tags into GHCR:
* `:latest` - which is observers by a server.
* `:[COMMIT_HASH]` - which is a backup.

To revert deployment:

```shell script
docker pull docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:[COMMIT_HASH]
docker tag docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:[COMMIT_HASH] docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
```

## Production environment:

Doesn't exists yet.
