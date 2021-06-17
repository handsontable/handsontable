# Handsontable docs

Handsontable comes with a vibrant, regularly-updated documentation portal.

View the documentation's latest production version at https://handsontable.com/docs.

**See also:**

* [Docs editing guidelines](./README-EDITING.md)
* [Docs deployment guidelines](./README-DEPLOYMENT.md)

## Getting started with Handsontable docs

To start a local Handsontable docs server:

1. Make sure you're running [Node.js](https://nodejs.org/en/) 14+ and [npm](https://www.npmjs.com/) 7.5+.
2. From the `handsontable/docs` directory, install the docs dependencies:
    ```bash
    npm install
    ```
3. From the `handsontable/docs` directory, generate the API reference:
   ```bash
   npm run docs:api
   ```   
4. From the `handsontable/docs` directory, start your local docs server:
   ```bash
   npm run docs:start
   ```
5. In your browser, go to: http://localhost:8080/docs/.

## Handsontable docs npm scripts:

From the `handsontable/docs` directory, you can run the following npm scripts:

* `npm run docs:start` – Starts a local docs server at http://localhost:8080/docs/.
* `npm run docs:start:no-cache` – Starts a local docs server without cache.
* `npm run docs:api` - Generates the Handsontable API reference into `/next/api`.
* `npm run docs:build` - Builds the docs output into `/.vuepress/dist` and checks for broken links.
* `npm run docs:build:no-check-links` – Builds the docs output into `/.vuepress/dist`.
* `npm run docs:docker:build` – Builds a Docker image for the staging environment.
* `npm run docs:docker:build:staging` – Builds a Docker image for the staging environment.
* `npm run docs:docker:build:production` – Builds a Docker image for the production environment.
* `npm run docs:version <semver.version>` – Creates a new docs version in a `/<semver.version>/` directory.
* `npm run docs:check-links` – Checks for broken links.
* `npm run docs:lint` – Runs ESLint on the `/next/` directory's content.
* `npm run docs:lint:fix` – Runs ESLint on the `/next/` directory's content and auto-fixes problems.
* `npm run docs:assets:next` – Prepares the `/next/` docs version's CSS and JavaScript.

## Handsontable docs directory structure


```bash
docs                            # All documentation files
├── .vuepress                   # All VuePress files
│   ├── components              # Vue components
│   ├── config.js               # VuePress configuration
│   ├── containers              # Markdown containers `:::`
│   │   ├── examples            # Code ex. container `::: example #exampleId .class :preset --html 1 --js 2`
│   │   ├── sourceCodeLink.js   # Add link "Source Code" on the right, `::: source-code-link [URL]`
│   ├── dist                    # The docs output. Both the docs and the API reference are built into this folder.
│   ├── docs-links.js
│   ├── enhanceApp.js           # VuePress app-level enhancements
│   ├── handsontable-manager    # Lets api run any example in any handsontable version with selected preset.
│   ├── helpers.js              # Common helpers to get sidebars and list of versions
│   ├── highlight.js            # Code highlight configuration
│   ├── public                  # Public assets 
│   ├── theme                   # Theme overwrites and customizations
│   └── tools
│       ├── check-links.js      # Tool which check all links in the documentation
│       ├── jsdoc-convert       # Tool used for converting jsdoc to markdown
│       ├── test.html
│       ├── utils.js            # Utilities for tools
│       └── version             # Tool used for rollup a new version
├── README-DEPLOYMENT.md        # Docs editing guidelines
├── README-EDITING.md           # Docs deployment guidelines
├── README.md                   # The file you're looking at right now!
├── docker                      # Docker configuration
├── next                        # The next version of documentation, unavailable on production build.
│   ├── api                     # The API reference files, generated automatically from JsDoc. Do not edit!
│   ├── examples
│   ├── guides                  # The docs source files: Markdown content
│   └── sidebars.js
└── SEMVER.NUMBER               # Version of documentation, for instance 8.4, 8.5
```