# Documentation deployment guidelines

This page covers guidelines for deploying the [Handsontable documentation](https://handsontable.com/docs).

## About documentation deployment

A [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure) with the largest version number gets automatically tagged as the documentation's `:latest` version.

Our server configuration watches for images tagged as [`:latest`](./README-EDITING.md#editing-the-latest-docs-version), and automatically refreshes after detecting a newer version.

### Docker settings

Before generating the documentation, set [Docker's runtime memory limit](https://docs.docker.com/docker-for-mac/).

The recommended runtime memory limit is 8 GB. It allows us to generate 4 documentation versions at a time.

## Deploying the documentation

Handsontable's [GitHub Actions setup](https://github.com/handsontable/handsontable/actions) deploys the documentation based on the following Docker image tags:

| Docker image tag      | Build type | Triggered by                                          | Used for                                                                                                                                   |
| --------------------- | ---------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `:[COMMIT_HASH]`      | Staging    | A push that changes `docs/**` on any branch           | [Manual local deployment](#deploying-the-documentation-locally-at-a-specific-commit)                                                       |
| `:latest`             | Staging    | A push that changes `docs/**` on the `develop` branch | Automatic staging deployment<br><br>[Manual staging deployment](#manually-deploying-the-documentation-to-the-staging-environment)          |
| `:production`         | Production | A push that changes `docs/**` on the `develop` branch | Automatic production deployment<br><br>[Manual production deployment](#manually-deploying-the-documentation-to-the-production-environment) |
| `:prod-[COMMIT_HASH]` | Production | A push that changes `docs/**` on the `develop` branch | Automatic production deployment backup                                                                                                     |

### Deploying the documentation locally at a specific commit

To deploy the documentation locally, at a specific commit:

```bash
npm run docs:review [COMMIT_HASH]
```

### Manually deploying the documentation to the staging environment

To deploy the documentation to the [staging environment](https://dev.handsontable.com/docs), from GitHub Actions:

1. Go to [github.com/handsontable/handsontable/actions](https://github.com/handsontable/handsontable/actions).
2. Select the **Docs Staging Deployment** workflow.
3. Select the **Run workflow** drop-down.
4. Select the branch that you want to deploy.
5. Select **Run workflow**.

To deploy the documentation to the [staging environment](https://dev.handsontable.com/docs), from the command line:

1. When deploying for the first time, log in to the GitHub Container Registry (ghcr.io):
    ```bash
    docker login --registry docker.pkg.github.com
    ```
    * Login: Your GitHub account email
    * Password: PAT with the `write:packages` permission: https://github.com/settings/tokens/new
2. Deploy the documentation:
    ```bash
    npm run docs:docker:build

    docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
    ```

### Manually deploying the documentation to the production environment

To deploy the documentation to the [production environment](https://handsontable.com/docs), from GitHub Actions:

1. Go to [github.com/handsontable/handsontable/actions](https://github.com/handsontable/handsontable/actions).
2. Select the **Docs Production Deployment** workflow.
3. Select the **Run workflow** drop-down.
4. Select the branch that you want to deploy.
5. Select **Run workflow**.

To deploy the documentation to the [production environment](https://handsontable.com/docs), from the command line:

1. When deploying for the first time, log in to the GitHub Container Registry (ghcr.io):
    ```bash
    docker login --registry docker.pkg.github.com
    ```
    * Login: Your GitHub account email
    * Password: PAT with the `write:packages` permission: https://github.com/settings/tokens/new

2. Deploy the documentation:
    ```bash
    npm run docs:docker:build:production

    docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
    ```

### Reverting a production deployment

To revert a production deployment to a previous version:

1. Pull a previously-deployed Docker image of your choice, tagged with `[COMMIT_HASH]`:
    ```bash
    docker pull docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:prod-[COMMIT_HASH]
    ```
2. Make the `production` Docker tag refer to your `[COMMIT_HASH]` version:
    ```bash
    docker tag docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:prod-[COMMIT_HASH] docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:production
    ```
3. Push the `production` Docker image (which is your `[COMMIT_HASH]` version now) back to the registry:
    ```bash
    docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:production
    ```
