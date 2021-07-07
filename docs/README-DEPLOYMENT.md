# Documentation deployment guidelines

This page covers guidelines for deploying the [Handsontable documentation](https://handsontable.com/docs).

## About documentation deployment

A [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure) with the largest version number gets automatically tagged as the documentation' `:latest` version.

Our server configuration watches for images tagged as [`:latest`](./README-EDITING.md#editing-the-latest-docs-version), and automatically refreshes after detecting a newer version.

## Docker settings

Before generating the documentation, set [Docker's runtime memory limit](https://docs.docker.com/docker-for-mac/).

The recommended runtime memory limit is 8 GB. It allows us to generate 4 documentation versions at a time.

## Deploying the documentation using the command line

To deploy the documentation using the command line:

1. When deploying for the first time, log in to the GitHub Container Registry (ghcr.io):
    ```bash
    docker login --registry docker.pkg.github.com
    ```
    * Login: Your GitHub account email
    * Password: PAT with the `write:packages` permission: https://github.com/settings/tokens/new

2. Deploy the documentation:
    ```bash
    npm run docs:docker:build
    # npm run docs:docker:build:production # Production build

    docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
    ```

## Deploying the documentation from GitHub Actions

GitHub Actions deploys the documentation automatically after each commit pushed to the `develop` branch.

GitHub Actions pushes the following tags to the GitHub Container Registry:

* `:latest` - the server configuration watches for images with this tag.
* `:[COMMIT_HASH]` - a backup.

### Manually deploying the documentation from GitHub Actions

You can deploy the documentation manually, from any branch:

1. On a GitHub repository, select the **Actions** tab.
2. On the left, select **Documentation**.
3. On the right, select **Run workflow**.
4. Select the required branch.
5. Run the workflow.

## Production environment

Coming soon.