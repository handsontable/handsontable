# Handsontable documentation

We treat documentation as an integral part of the Handsontable developer experience.

View the documentation's latest production version at [handsontable.com/docs](https://handsontable.com/docs).

We update the documentation:
- With every Handsontable version release.
- Whenever there's something new to add or improve.

**See also:**

* [Documentation editing guidelines](./README-EDITING.md)
* [Documentation deployment guidelines](./README-DEPLOYMENT.md)

## Getting started with Handsontable documentation

To start a local Handsontable documentation server:

1. From the `docs` directory, install the documentation dependencies:
    ```bash
    npm install
    ```
2. Start your local documentation server:
   ```bash
   npm run dev
   ```
3. In your browser, go to: http://localhost:4321/docs/.

> **Note:** Content collection files (`.md` in `content/`) are cached by Astro's data store. After editing `.md` content files, restart the dev server with `npm run dev -- --force` to see changes. CSS and JS changes are picked up by HMR automatically.

## Documentation npm scripts

From the `docs` directory, you can run the following npm scripts:

* `npm run dev` - Starts a local documentation server at `localhost:4321/docs/`.
* `npm run start` - Alias for `npm run dev`.
* `npm run build` - Builds the documentation output into `dist/`.
* `npm run preview` - Previews the built documentation locally.
* `npm run docs:lint` - Runs ESLint on `src/` and `content/` directories.
* `npm run docs:lint:fix` - Runs ESLint on `src/` and `content/` directories and auto-fixes problems.
* `npm run docs:visual-test` - Runs Playwright visual regression tests.
* `npm run docs:visual-test:update-screenshot` - Updates Playwright visual regression screenshots.

## Handsontable documentation directory structure

```bash
docs                            # All documentation files
├── src                         # Astro/Starlight source files
│   ├── assets                  # Static assets (images, etc.)
│   ├── components              # Astro components (Header, Footer, Sidebar, etc.)
│   ├── content                 # Starlight content configuration
│   ├── plugins                 # Custom plugins (framework-loader, vuepress-preprocessor, rehype plugins)
│   ├── scripts                 # Build and utility scripts
│   ├── styles                  # CSS stylesheets (custom.css, interactive-example.css)
│   ├── content.config.ts       # Content collection configuration
│   └── sidebar.mjs             # Sidebar configuration
├── content                     # The documentation content files
│   ├── api                     # The API reference output, generated automatically from JSDoc
│   ├── guides                  # The guides' source files: Markdown content
│   ├── recipes                 # Recipe pages
│   └── sidebars.js             # Legacy sidebars configuration
├── public                      # Static assets served as-is (images, fonts, etc.)
├── deploy                      # Cloudflare Pages build scripts (multi-version site assembly)
├── cloudflare                  # Cloudflare Pages worker (redirects/rewrites) and project scripts
├── tests                       # Playwright visual test specs
├── astro.config.mjs            # Astro configuration
├── tsconfig.json               # TypeScript configuration
├── playwright.config.ts        # Playwright test configuration
├── README-DEPLOYMENT.md        # Documentation deployment guidelines
├── README-EDITING.md           # Documentation editing guidelines
└── README.md                   # The file you're looking at right now!
```

## Handsontable documentation branches structure

Each documentation version has its own production branch from which the deployment is happening. The documentation branches are created using the following pattern `prod-docs/<MAJOR.MINOR>`. The `prod-docs/latest` branch contains all files necessary for the Cloudflare Pages deployment.

The documentation branches are created and updated automatically by the `stable-publish` job in `.github/workflows/publish.yml`. Depending on the Handsontable release version, two scenarios may happen:
1. Patch release:
    * Check out the existing `prod-docs/<MAJOR.MINOR>` branch;
    * Update the docs changelog and regenerate API content via `npm run docs:api`;
    * Commit and push the changes to the origin;
2. Major or Minor release:
    * Create a new Docs branch, e.g. `prod-docs/13.0`, from the version tag (after the release branch is merged to `master`);
    * Update the docs changelog and generate API content via `npm run docs:api`;
    * Commit and push the changes to the origin;

The prod-docs/latest branch is automatically recreated by the CI/CD pipeline whenever a patch or release update is applied to the latest documentation version. This branch triggers a GitHub workflow that initiates a rebuild and deploys to Cloudflare Pages on each push or when a new branch `prod-docs/<MAJOR.MINOR>` is created.

Committing directly to the Documentation production branch triggers GitHub workflow that deploys the changes to Cloudflare Pages. The exception is the `develop` branch that holds the changes for the "next" version. The staging version can be deployed only [manually](./README-DEPLOYMENT.md#manually-deploying-the-documentation-to-the-staging-environment).

```bash
[branch] `prod-docs/12.0`       # All documentation files related to documentation 12.0
  docs
  ├── src                       # Astro/Starlight source files
  ├── content                   # The documentation content files
  └── deploy                    # Cloudflare Pages build scripts
[branch] `prod-docs/12.1`       # All documentation files related to documentation 12.1
  docs
  ├── src                       # Astro/Starlight source files
  ├── content                   # The documentation content files
  └── deploy                    # Cloudflare Pages build scripts
[branch] `develop`              # All documentation files related to the "next" documentation version
  docs
  ├── src                       # Astro/Starlight source files
  ├── content                   # The documentation content files
  └── deploy                    # Cloudflare Pages build scripts
```
