# Docs deployment guidelines

This page covers guidelines for deploying the [Handsontable docs](https://handsontable.com/docs).

## About docs deployment

A [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure) with the largest version number gets automatically tagged as the docs' `:latest` version.

Our server configuration watches for images tagged as [`:latest`](./README-EDITING.md#editing-the-latest-docs-version), and automatically refreshes after detecting a newer version.

## Docs deployment

To deploy the docs from the console:

1. When deploying for the first time, log in to the GitHub Container Registry (ghcr.io):
    ```bash
    docker login --registry docker.pkg.github.com
    ```
    * Login: Your GitHub account email
    * Password: PAT with the `write:packages` permission: https://github.com/settings/tokens/new

2. Deploy the docs:
    ```bash
    npm run docs:docker:build
    # npm run docs:docker:build:production # Production build

    docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
    ```

### Deploying the docs from GitHub Actions

GitHub Actions deploys the docs automatically for each commit pushed to the `develop` branch.

### Manual deployment

You can deploy the docs manually, from any branch:

1. On a GitHub repository, select the **Actions** tab.
2. On the left, select **Documentation**.
3. On the right, select **Run workflow**.
4. Select the required branch.
5. Run the workflow.

GitHub Actions pushes the following tags to the GitHub Container Registry:

* `:latest` - our server configuration watches for images with this tag.
* `:[COMMIT_HASH]` - a backup.

### Reverting a deployment

To revert a docs deployment, run:

    ```bash
    docker pull docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:[COMMIT_HASH]

    docker tag docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:[COMMIT_HASH] docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
    
    docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
    ```

## Production environment:

Coming soon.