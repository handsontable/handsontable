# Handsontable docs

Handsontable comes with a vibrant, frequently-updated documentation portal.

View the docs' latest production version at [handsontable.com/docs](https://handsontable.com/docs).

## About Handsontable docs

We treat the docs as an integral part of the Handsontable developer experience.

The Handsontable docs are made up of three main sections:
- **Guides**: Carefully-written implementation guides.
- **Examples**: Code examples covering real-life use cases.
- **API reference**: Full API reference, automatically generated from the source code of a required Handsontable version.

We update the docs:
- With every Handsontable version release
- Whenever there's something new to add to improve!

**See also:**

* [Docs editing guidelines](./README-EDITING.md)
* [Docs deployment guidelines](./README-DEPLOYMENT.md)

## Getting started with Handsontable docs

To start a local Handsontable docs server:

1. Make sure you're running [Node.js](https://nodejs.org/en/) 14+ and [npm](https://www.npmjs.com/) 7+.
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

* `npm run docs:start` – Starts a local docs server at `localhost:8080/docs/`.
* `npm run docs:start:no-cache` – Starts a local docs server without cache.
* `npm run docs:api` – Generates the Handsontable API reference into `/next/api`.
* `npm run docs:build` – Builds the docs output into `/.vuepress/dist` and checks for broken links.
* `npm run docs:build:no-check-links` – Builds the docs output into `/.vuepress/dist`.
* `npm run docs:docker:build` – Builds a Docker image for the staging environment.
* `npm run docs:docker:build:staging` – Builds a Docker image for the staging environment.
* `npm run docs:docker:build:production` – Builds a Docker image for the production environment.
* `npm run docs:version <semver.version>` – Creates a new docs version in a new `/<semver.version>/` directory.
* `npm run docs:check-links` – Checks for broken links.
* `npm run docs:lint` – Runs ESLint on the `/next/` directory's content.
* `npm run docs:lint:fix` – Runs ESLint on the `/next/` directory's content and auto-fixes problems.
* `npm run docs:assets:next` – Prepares the `next` docs version's CSS and JavaScript.

## Handsontable docs directory structure

```bash
docs                            # All documentation files
├── .vuepress                   # All VuePress files
│   ├── components              # Vue components
│   ├── containers              # Markdown containers `:::`
│   │   ├── examples            # Code ex. container `::: example #exampleId .class :preset --html 1 --js 2`
│   │   └── sourceCodeLink.js   # Add link "Source Code" on the right, `::: source-code-link [URL]`
│   ├── handsontable-manager    # A module that runs the Handsontable examples in different Handsontable versions
│   ├── public                  # The docs' public (static) assets
│   ├── theme                   # Theme overwrites and customizations
│   ├── tools                   # Our custom docs tools
│   │   ├── check-links.js      # The docs' link checker
│   │   ├── jsdoc-convert       # JSDoc-to-Markdown converter
│   │   ├── utils.js            # Tools utilities
│   │   └── version             # A tool that creates new docs versions
│   ├── config.js               # VuePress configuration
│   ├── docs-links.js
│   ├── enhanceApp.js           # VuePress app-level enhancements
│   ├── helpers.js              # Common helpers that set up sidebars and the docs version picker
│   ├── highlight.js            # Code highlight configuration
├── docker                      # Docker configuration
├── next                        # The docs' next version, unavailable on the production environment
│   ├── api                     # The API reference output, generated automatically from JSDoc. Do not edit!
│   ├── examples                # The Handsontable examples
│   ├── guides                  # The guides' source files: Markdown content
│   └── sidebars.js             # Sidebars configuration
├── <semver.version>            # Multiple <semver.version> versions of the docs (for example, 8.4 or 9.0).
├── README-DEPLOYMENT.md        # Docs deployment guidelines
├── README-EDITING.md           # Docs editing guidelines
└── README.md                   # The file you're looking at right now!
```