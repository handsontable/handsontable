# Handsontable documentation

We treat documentation as an integral part of the Handsontable developer experience.

That's why Handsontable comes with a vibrant, frequently-updated documentation portal.

View the documentation's latest production version at [handsontable.com/docs](https://handsontable.com/docs).

## Documentation overview

The Handsontable documentation is made up of three main sections:
- **Guides**: Carefully-written implementation guides.
- **Examples**: Code examples covering real-life use cases.
- **API reference**: API reference, automatically generated from the source code of each respective Handsontable version.

We update the documentation:
- With every Handsontable version release.
- Whenever there's something new to add to improve.

**See also:**

* [Documentation editing guidelines](./README-EDITING.md)
* [Documentation deployment guidelines](./README-DEPLOYMENT.md)

## Getting started with Handsontable documentation

To start a local Handsontable documentation server:

1. From the `docs` directory, install the documentation dependencies:
    ```bash
    npm install
    ```
2. Generate the API reference:
   ```bash
   npm run docs:api
   ```
3. Start your local documentation server:
   ```bash
   npm run docs:start
   ```
4. In your browser, go to: http://localhost:8080/docs/.

## Documentation npm scripts:

From the `docs` directory, you can run the following npm scripts:

* `npm run docs:start` – Starts a local documentation server at `localhost:8080/docs/`.
* `npm run docs:start:no-cache` – Starts a local documentation server without cache.
* `npm run docs:api` – Generates the Handsontable API reference into `/content/api`.
* `npm run docs:build` – Builds the documentation output into `/.vuepress/dist`.
* `npm run docs:docker:build` – Builds a Docker image for the staging environment (includes the docs for the `next` version).
* `npm run docs:docker:build:staging` – Builds a Docker image for the staging environment (includes the docs for the `next` version).
* `npm run docs:docker:build:production` – Builds a Docker image for the production environment (excludes the docs for the `next` version).
* `npm run docs:check-links` – Checks for broken links (first, run `npm run docs:build`). You can also run it for a specific URL (e.g. `npm run docs:check-links https://handsontable.com`).
* `npm run docs:lint` – Runs ESLint on the `/next/` directory's content.
* `npm run docs:lint:fix` – Runs ESLint on the `/next/` directory's content and auto-fixes problems.
* `npm run docs:scripts:link-assets` – Prepares the `next` documentation version's CSS and JavaScript.
* `npm run docs:review [COMMIT_HASH]` – Deploys the documentation locally at a `[COMMIT_HASH]` commit.

## Handsontable documentation directory structure

```bash
docs                            # All documentation files
├── .vuepress                   # All VuePress files
│   ├── components              # Vue components
│   ├── containers              # Markdown containers
│   │   ├── examples            # Code examples container
│   │   └── sourceCodeLink.js   # `source-code-link` container.
│   ├── handsontable-manager    # A module that runs Handsontable examples in different Handsontable versions
│   ├── plugins                 # VuePress plugins
│   ├── public                  # The documentation's public (static) assets
│   ├── theme                   # Theme overwrites and customizations
│   ├── tools                   # Our custom documentation tools
│   │   ├── check-links.js      # The documentation's link checker
│   │   ├── jsdoc-convert       # JSDoc-to-Markdown converter
│   │   ├── utils.js            # Tools utilities
│   │   └── version             # A tool that creates new documentation versions
│   ├── config.js               # VuePress configuration
│   ├── docs-links.js           # Lets us link within the currently-selected docs version with `@` (e.g. [link](@/guides/path/file.md).)
│   ├── enhanceApp.js           # VuePress app-level enhancements
│   ├── helpers.js              # Common helpers that set up sidebars and the documentation version picker
│   └── highlight.js            # Code highlight configuration
├── docker                      # Docker configuration
│   ├── ...                     # Docker configuration files
│   └── redirects.conf          # File that allows create custom redirects for documentation
├── content                     # The documentation content files
│   ├── api                     # The API reference output, generated automatically from JSDoc. Do not edit for "next" Docs version!
│   ├── examples                # The Handsontable examples
│   ├── guides                  # The guides' source files: Markdown content
│   └── sidebars.js             # Sidebars configuration
├── README-DEPLOYMENT.md        # Documentation deployment guidelines
├── README-EDITING.md           # Documentation editing guidelines
└── README.md                   # The file you're looking at right now!
```

## Handsontable documentation branches structure

Each documentation version has its own production branch from which the deployment is happening. The documentation branches are created using the following pattern `prod-docs/<MAJOR.MINOR>`.

The documentation branches are created automatically once the Handsontable release script finishes its job. Depending on the library release version, two scenarios may happen:
1. Patch release:
    * Regenerate Docs content for the API by executing `npm run docs:api`;
    * Commit and push the changes to the origin;
2. Major or Minor release:
    * Create a new Docs branch, e.g. `prod-docs/13.0` from the `develop` branch (after the release branch is merged to the `develop` branch);
    * Generate Docs content for the API by executing `npm run docs:api`;
    * Commit and push the changes to the origin;

Committing directly to the Documentation production branch triggers GitHub workflow that deploys the changes to the server. The exception is the `develop` branch that holds the changes for the "next" version. The staging version can be deployed only [manually](./README-DEPLOYMENT.md#manually-deploying-the-documentation-to-the-staging-environment).

```bash
[branch] `prod-docs/12.0`       # All documentation files related to documentation 12.0
  docs
  ├── .vuepress                 # All VuePress files
  ├── content                   # The documentation content files
  └── docker                    # Docker configuration
[branch] `prod-docs/12.1`       # All documentation files related to documentation 12.1
  docs
  ├── .vuepress                 # All VuePress files
  ├── content                   # The documentation content files
  └── docker                    # Docker configuration
[branch] `develop`              # All documentation files related to the "next" documentation version
  docs
  ├── .vuepress                 # All VuePress files
  ├── content                   # The documentation content files
  └── docker                    # Docker configuration
```
