# Handsontable documentation

We treat documentation as an integral part of the Handsontable developer experience.

View the documentation's latest production version at [handsontable.com/docs](https://handsontable.com/docs).

We update the documentation:
- With every Handsontable version release.
- Whenever there's something new to add to improve.

**See also:**

* [Documentation editing guidelines](./README-EDITING.md)
* [Documentation deployment guidelines](./README-DEPLOYMENT.md)

## Getting started with Handsontable documentation

To start a local Handsontable documentation server:

1. From the root directory, build the Handsontable and wrapper packages:
    ```bash
    npm run build
    ```
2. From the `docs` directory, install the documentation dependencies:
    ```bash
    npm install
    ```
3. Generate the API reference:
   ```bash
   npm run docs:api
   ```
4. Start your local documentation server:
   ```bash
   npm run docs:start:no-cache
   ```
5. In your browser, go to: http://localhost:8080/docs/.

## Handsontable documentation code examples

Most code examples in the `content/guides` directory are kept in 2 versions: TS/TSX and JS/JSX. When modifying the code example or adding a new one, you should always update the TS/TSX version and then generate the JS/JSX version:

E.g.:
1. Modify `content/guides/some/example.ts` file.
2. Run `npm run docs:code-examples:generate-js content/guides/some/example.ts` to generate `content/guides/some/example.js`.
3. Commit both `content/guides/some/example.ts` and `content/guides/some/example.js`.

In case of TSX file, the script will generate JSX version of the code example, so the workflow is the same as above.

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
* `npm run docs:test:example-checker` – Runs the tests that checks if all Docs examples work.
* `npm run docs:code-examples:generate-js content/guides/path/to/example.ts` – Generate JS/JSX version of the code example (needs to be run before commiting any change to TS/TSX code example)
* `npm run docs:code-examples:generate-all-js` – Generate all JS/JSX versions of the TS/TSX code examples in content/guides/ directory
* `npm run docs:code-examples:format-all-ts"` – Runs the autoformatter on all TS and TSX example files in the content/guides/ directory

## Handsontable documentation directory structure

```bash
docs                            # All documentation files
├── .vuepress                   # All VuePress files
│   ├── components              # Vue components
│   ├── containers              # Markdown containers
│   │   ├── examples            # Code examples container
│   │   └── sourceCodeLink.js   # `source-code-link` container.
│   ├── handsontable-manager    # A module that runs Handsontable examples in different Handsontable versions and frameworks
│   ├── plugins                 # VuePress plugins
|   |   ├── active-header-links                # Plugin responsible for updating the URL with hash after scrolling the page to the nearest anchor
|   |   ├── dump-docs-data                     # Plugin responsible for generating the all available Docs version and canonical URLs to the JSON file. Then, the file is consumed by other Docs Docker images as source of true about Docs versions and canonicals.
|   |   ├── extend-page-data                   # Plugin responsible for extending `$page` object and rewriting some properties to add framework ID/name
|   |   ├── generate-nginx-redirects           # Plugin responsible for generating nginx redirects
|   |   ├── generate-nginx-variables           # Plugin responsible for generating nginx variables
|   |   ├── markdown-it-header-injection       # Plugin responsible for injecting `<FRAMEWORK NAME> Data Grid` string before the first header
|   |   ├── markdown-it-conditional-container  # Plugin responsible for creating conditional containers used for displaying/hiding blocks of content relevant to specific frameworks
│   ├── public                  # The documentation's public (static) assets
│   ├── theme                   # Theme overwrites and customizations
│   ├── tools                   # Our custom documentation tools
│   │   ├── build.mjs           # Builds the documentation for staging or production
│   │   ├── check-links.js      # The documentation's link checker
│   │   ├── jsdoc-convert       # JSDoc-to-Markdown converter
│   │   ├── utils.js            # Tools utilities
│   ├── config.js               # VuePress configuration
│   ├── docs-links.js           # Lets us link within the currently-selected docs version and framework with `@` (e.g. [link](@/guides/path/file/file.md).)
│   ├── enhanceApp.js           # VuePress app-level enhancements
│   ├── helpers.js              # Common helpers that set up sidebars and the documentation version and framework picker
│   └── highlight.js            # Code highlight configuration
├── docker                      # Docker configuration
│   ├── ...                     # Docker configuration files
│   └── redirects.conf          # File that allows create custom redirects for documentation
├── content                     # The documentation content files
│   ├── api                     # The API reference output, generated automatically from JSDoc. Do not edit for "next" Docs version!
│   ├── guides                  # The guides' source files: Markdown content
│   └── sidebars.js             # Sidebars configuration
├── .build-tmp                  # Temporary directory created for storing symlinked directories, containing .MD files. It's needed for generating multi-frameworked Docs content.
│   ├── javascript-data-grid    # Symbolic link to content directory. Do not edit! Make changes in the source content directory.
│   └── react-data-grid         # As above
├── README-DEPLOYMENT.md        # Documentation deployment guidelines
├── README-EDITING.md           # Documentation editing guidelines
└── README.md                   # The file you're looking at right now!
```

## Handsontable documentation branches structure

Each documentation version has its own production branch from which the deployment is happening. The documentation branches are created using the following pattern `prod-docs/<MAJOR.MINOR>`. The `prod-docs/latest` branch contains all files necessary for Netlify deployment.

The documentation branches are created automatically once the Handsontable release script finishes its job. Depending on the Handsontable release version, two scenarios may happen:
1. Patch release:
    * Checkout to the existing branch;
    * Regenerate Docs content for the API by executing `npm run docs:api`;
    * Commit and push the changes to the origin;
2. Major or Minor release:
    * Create a new Docs branch, e.g. `prod-docs/13.0` from the `develop` branch (after the release branch is merged to the `develop` branch);
    * Generate Docs content for the API by executing `npm run docs:api`;
    * Commit and push the changes to the origin;

The prod-docs/latest branch is automatically recreated by the CI/CD pipeline whenever a patch or release update is applied to the latest documentation version. This branch triggers a GitHub workflow that initiates a rebuild and deploys to Netlify on each push or when a new branch `prod-docs/<MAJOR.MINOR>` is created.

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
