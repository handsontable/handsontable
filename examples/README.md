# Code examples

This folder contains all code examples used by Handsontable for documentation, blog posts, and other purposes. Each example is a self-contained project that demonstrates specific Handsontable features.

Examples are organized by Handsontable version. Within a version, they are grouped by category. The most important category is `docs`, which powers the Handsontable documentation website. The `next` directory contains work-in-progress examples for the upcoming Handsontable release.

To see a deployed example, visit its URL. See [Live on production](#live-on-production) to learn about the URL structure.

To run an example locally, see [How to run an arbitrary code example](#how-to-run-an-arbitrary-code-example).

## Contents

- [Folder structure](#folder-structure)
- [Live on production](#live-on-production)
- [Creating new examples](#creating-new-examples)
- [Deployment](#deployment)
  - [Automatic deployment](#automatic-deployment)
  - [Manual deployment](#manual-deployment)
- [Editing existing examples](#editing-existing-examples)
- [Copying an example to a separate repo](#copying-an-example-to-a-separate-repo)
- [Development](#development)
  - [How to run an arbitrary code example](#how-to-run-an-arbitrary-code-example)
- [Testing](#testing)
  - [How to run tests for an arbitrary code example](#how-to-run-tests-for-an-arbitrary-code-example)
  - [How to run tests for the versioned code examples locally](#how-to-run-tests-for-the-versioned-code-examples-locally)

## Folder structure

Within the `/examples` directory, there are all the code examples created for specific Handsontable versions, plus the `templates` folder, which contains base projects for creating new code examples.

A path to a specific example follows this convention:

`/examples/<version_number>/<category>/<framework>/<example_path>`

- `<version_number>` - the distributed version of Handsontable (e.g. `13.1.0`) or `next` for the development version.
- `<category>` - category of the code examples. The main category is `docs` (examples from the documentation). The `visual-tests` category contains examples used for visual regression testing.
- `<framework>` - the framework name: `js`, `ts`, `react-wrapper`, `angular-wrapper`, or `vue3`.
- `<example_path>` - path to the specific code example. The folder name identifies the example and is used as a URL segment. It should be consistent across all frameworks.

Example path: `examples/<version_number>/docs/js/basic-example`

The `examples` directory is defined as an npm workspace, as is each `<framework>` directory within it. This allows sharing dependencies across all framework-specific examples.

Dependency sharing is defined by a shared lockfile (`/examples/<version_number>/<category>/<framework>/package-lock.json`) for all examples within each framework. The `examples:install` script manages dependency versions in these shared lockfiles. An individual example can still have its own lockfile (created when running `npm install` inside the example folder), but it is ignored via `/examples/.gitignore`.

## Live on production

All code examples are available online. The base URL is:

`https://examples.handsontable.com/examples/`

The URL to a specific example follows the same convention as the folder structure:

`https://examples.handsontable.com/examples/<version_number>/<category>/<framework>/<example_path>/`

Example URL: `https://examples.handsontable.com/examples/<version_number>/docs/js/basic-example/`

For more details, see the [Folder structure](#folder-structure) section.

**Note:** The `https://examples.handsontable.com/examples/` URL is not CORS-enabled. If that is a problem, you can use the GitHub Pages equivalent: https://handsontable.github.io/handsontable

## Creating new examples

Read the [Templates Guideline](./templates/README.md) for detailed information about creating new code examples.

## Deployment

### Automatic deployment

Merging a feature branch to `develop` automatically triggers the CI/CD pipeline, which deploys all changed examples to GitHub Pages. The examples become available at their existing URLs immediately after the pipeline completes.

This covers the most common case: publishing edits to existing examples after a code review.

### Manual deployment

You can also trigger deployment manually using the [**Code Examples Deployment**](https://github.com/handsontable/handsontable/actions/workflows/code-examples.yml) workflow in GitHub Actions.

**When to use manual deployment:**

- Deploying a brand-new set of examples for a new Handsontable release (requires the new version to already be published to npm).
- Redeploying examples from a specific branch without merging to `develop` first.
- Overwriting already-deployed examples to fix a mistake without creating a new commit.
- Verifying how examples look on GitHub Pages before merging.

**How to trigger the workflow:**

1. Open the [Code Examples Deployment](https://github.com/handsontable/handsontable/actions/workflows/code-examples.yml) workflow in GitHub Actions.
2. Click **Run workflow**.
3. Enter the `<version_number>` of the Handsontable version you want to deploy.
4. Click **Run workflow** to start the deployment.

When deploying a new version, a folder is created at `/examples/<version_number>` with Handsontable version pinned to `<version_number>`. The deployed examples are available at the URL described in the [Live on production](#live-on-production) section.

**Note:** Dispatching the workflow overwrites existing examples on the `gh-pages` branch, even when they originate from a branch other than `develop`.

## Editing existing examples

To edit code examples that are already live in `/examples/<version_number>`:

1. Edit the code examples within the `/examples/<version_number>` directory.
2. Commit and push the changes to the repo.
3. Merge your feature branch to `develop`. The [automatic deployment](#automatic-deployment) pipeline will publish the changes to GitHub Pages.

## Copying an example to a separate repo

You can copy any example into a new Git repository by copying its folder. Because the monorepo workspace may place symbolic links inside `node_modules`, remove that folder before copying and regenerate it in the target location.

```bash
# Clone the repo if you haven't already
git clone https://github.com/handsontable/handsontable.git

# Navigate to the example you want to copy, e.g.:
cd examples/<version_number>/docs/js/basic-example

# Remove node_modules (may contain monorepo symlinks)
rm -rf node_modules

# Copy the example to a sibling folder of the monorepo
cp -r . ../../../../../../forked-example

# Go to the copy
cd ../../../../../../forked-example

# Optionally initialize a new Git repo
git init
git add .
git commit -m "initial commit"

# Install dependencies and start the example
npm install
npm run start
```

## Development

Run the following commands from the **root** of the repository (not the `examples` subdirectory):

0. **`npm run examples:version <version_number>`** - Creates a new directory at `examples/<version_number>` and populates it with code examples based on `examples/next`, with the `handsontable` and `@handsontable/<framework_name>` dependencies pinned to the provided `<version_number>`.

   *(Optional - only needed when creating a new set of examples for a new Handsontable version.)*

1. **`npm run examples:install <version_number>`** - Installs dependencies for all examples matching `<version_number>`, using the internal workspace logic.

   - For the `next` version: after installing, the script creates symlinks to the local builds needed for examples to work:
     - All `next` examples symlink to the local `handsontable` build.
     - Framework-based examples symlink to their respective wrapper builds (`@handsontable/<framework_name>`).
     - Symlinks are created in `examples/next/docs/<framework_name>/node_modules`.
     - Angular examples also require additional symlinks inside each individual example's `node_modules` directory.
   - For a semver version: only `handsontable` and `@handsontable/angular-wrapper` are symlinked in the Angular examples' `node_modules`.

2. **`npm run examples:build <version_number>`** - Builds each example in `/examples/<version_number>` and copies the production output to `/examples/tmp/<version_number>`. The path within `/examples/tmp` follows the [Folder structure](#folder-structure) convention.

3. **`npm run examples:start`** - Starts `http-server` at `/examples/tmp` on port `8080`. Example URL: `http://localhost:8080/<version_number>/docs/js/basic-example/`

**Important:** The `next` examples depend on local builds of `handsontable` and the wrappers. Build all root-level packages (for example, by running `npm run all build`) before running the examples build script.

### How to run an arbitrary code example

Navigate to the example's project directory, then run `npm install` followed by `npm run start`. This installs all dependencies and starts a development server. Open http://localhost:8080 to view the example.

## Testing

Each code example has its own test specs in the `spec` directory.

> Templates contain one **failing test** added to prompt developers to write passing tests for new examples.

### How to run tests for an arbitrary code example

1. Start the development server: `npm run start`.
2. Once the app is running, execute `npm run test` to run the tests for that example.

### How to run tests for the versioned code examples locally

1. Ensure examples exist in `examples/<version_number>` and are built with `npm run examples:build <version_number>`.
2. Run `npm run examples:test <version_number>`. This runs `npm run test` for each code example.
