# Website

This website is built using [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator.

## Installation

```console
yarn install
```

## Local Development

```console
yarn start
```

This command starts a local development server and open up a browser window. Most changes are reflected live without having to restart the server.

## Build

```console
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

```console
GIT_USER=<Your GitHub username> USE_SSH=true yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## Docker integration

### Local run;

Build an image:

```console
docker -t docs-md .
```

Run services:

```console
docker-compose up -d &&  docker-compose logs -f --tail=100
```

Visit page: [http://localhost:8080](http://localhost:8080)

Stop services:

```console
docker-compose stop
```

### Auto refresh from GitHub Container Registry:


Login into GHCR, as a password should be used [Personal Access Token](https://github.com/settings/tokens)

```console
docker login --registry docker.pkg.github.com
```

Run services: (it might require changing volume path in docker-compose.ghcr.yml because it dependent on a username)

```console
docker-compose -f docker-compose.ghcr.yml up -d &&  docker-compose logs -f --tail=100
```

Visit page: [http://localhost:8080](http://localhost:8080)

Update service from localhost:

```console
docker build -t docker.pkg.github.com/handsontable/docs-md/handsontable-docs:latest .
docker push docker.pkg.github.com/handsontable/docs-md/handsontable-docs:latest
```

Update service from GH Action: each push into master will build&push new version of image, and it will be automatically refreshed here.

Stop services:

```console
docker-compose -f docker-compose.ghcr.yml
```

## Versioning

### Next version:

* Next version is available only when `NODE_ENV === 'development'`. 
* It is available under url: `/docs/next`.
* In a repo it is placed into `./docs/` directory.

#### Publishing next version as current:

`yarn run docusaurus docs:version 8.3.0`, where `8.3.0` it is a version number. 

### Current (latest) version:

* Latest version is available under url `/docs/`.
* In a repo it is last version folder in `/versioned_docs/version-*`

### Legacy versions

* Latest version is available under url `/docs/*`.
* In a repo it is placed into `/versioned_docs/version-*`

### Versioning documentation:

https://v2.docusaurus.io/docs/versioning/

## Development features

if `NODE_ENV=development` during building:

* it is possible to show next documentation version `/docs/next`
* debug plugin is enabled: `/docs/__docusaurus/debug`
