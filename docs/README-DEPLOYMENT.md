# Documentation deployment guidelines

This page covers guidelines for deploying the [Handsontable documentation](https://handsontable.com/docs).

## About documentation deployment

A [`<semver.version>` directory](./README.md#handsontable-docs-directory-structure) with the largest version number gets automatically tagged as the documentation's `:latest` version.

Our server configuration watches for images tagged as [`:latest`](./README-EDITING.md#editing-the-latest-docs-version), and automatically refreshes after detecting a newer version.

### Docker settings

Before generating the documentation, set [Docker's runtime memory limit](https://docs.docker.com/docker-for-mac/).

The recommended runtime memory limit is 8 GB. It allows us to generate 4 documentation versions at a time.

## Deploying the documentation from the command line

To deploy the documentation from the command line:

1. When deploying for the first time, log in to the GitHub Container Registry (ghcr.io):
    ```bash
    docker login --registry docker.pkg.github.com
    ```
    * Login: Your GitHub account email
    * Password: PAT with the `write:packages` permission: https://github.com/settings/tokens/new

2. Deploy the documentation:
    ```bash
    npm run docs:docker:build # Staging build
    # npm run docs:docker:build:production # Production build

    docker push docker.pkg.github.com/handsontable/handsontable/handsontable-documentation:latest
    ```

## Deploying the documentation from GitHub Actions

GitHub Actions pushes the Docker images with a build of the docs automatically to GitHub Container Registry. Some of these images are automatically deployed.

The list of the image tags used:

| Docker image tag      | Type of build | Triggered by                              | Used for                                                        |
|-----------------------|---------------|-------------------------------------------|-----------------------------------------------------------------|
| `:latest`             | Staging       | Push to `develop` that changes 'docs/**'  | Deployments to the staging server, that listens to this tag    |
| `:[COMMIT_HASH]`      | Staging       | Push to any branch that changes 'docs/**' | Local test deployments                                          |
| `:production`         | Production    | Push to `develop`                         | Deployments to the production server, that listens to this tag |
| `:prod-[COMMIT_HASH]` | Production    | Push to `develop`                         | Backups of the production server                                |

### Launching local version for indeed commit

While GitHub Actions pushes `:[COMMIT_HASH]` to the GitHub Container Registry each time when modified the `/docs/**`
path. It is available to review these changes locally by launching local version:

```bash
docker create -p 8000:80 --name docs ghcr.io/handsontable/handsontable/handsontable-documentation:[COMMIT_HASH]
docker start docs
docker exec docs sh -c 'mv html docs && mkdir html && mv docs html'   # needed to fix paths for Nginx
start http://localhost:8000/docs/index.html                           # opens default browser
```

### Deploying the documentation to the staging environment

To deploy the documentation to the staging environment:

1. Go to [github.com/handsontable/handsontable/actions](https://github.com/handsontable/handsontable/actions).
2. Select the **Docs Staging Deployment** workflow.
3. Select the **Run workflow** drop-down.
4. Select the branch that you want to deploy.
5. Select **Run workflow**.

### Deploying the documentation to the production environment

To deploy the documentation to the production environment:

1. Go to [github.com/handsontable/handsontable/actions](https://github.com/handsontable/handsontable/actions).
2. Select the **Docs Production Deployment** workflow.
3. Select the **Run workflow** drop-down.
4. Select the branch that you want to deploy.
5. Select **Run workflow**.

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
