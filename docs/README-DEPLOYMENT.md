# Docs deployment guidelines

This page covers guidelines for deploying the Handsontable docs.

## About docs deployment

Our server configurations watch changes for `latest` tag for an image. Refresh itself If detect newer version.

## Docs versioning

To release a new version of the Handsontable docs:

* From the `handsontable/docs` directory, run the following command:

```bash
npm run docs:version <semver.version>
# for example:
# npm run docs:version 9.0
```

To remove an existing version of the Handsontable docs:

* Remove the docs version's [directory](./README.md#handsontable-docs-directory-structure):

```bash
rm -rf ./<semver.version>
```

## From the console

**Once:**

Login into ghcr:
 * Login: email used for GH Account
 * Pass: PAT with `write:packages` permission: https://github.com/settings/tokens/new

```bash
docker login --registry docker.pkg.github.com
```

**Deploy:**

```bash
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

```bash
docker pull docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:[COMMIT_HASH]
docker tag docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:[COMMIT_HASH] docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
```

## Production environment:

Doesn't exists yet.
