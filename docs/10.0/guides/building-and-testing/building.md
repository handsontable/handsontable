---
title: Building process
metaTitle: Building process - Guide - Handsontable Documentation
permalink: /10.0/building
canonicalUrl: /building
tags:
  - custom build
  - bundling
  - contributing
---

# Building process

[[toc]]

## Overview

This guide provides detailed steps for building Handsontable and outlines the tasks that are available to be run.

## Introduction

From version `8.3.2` onward, the `handsontable` repository is configured as a monorepo, and consist of four packages:

1. `handsontable` (stored at `.` - the root directory)
2. `@handsontable/angular` (stored at `./wrappers/angular`)
3. `@handsontable/react` (stored at `./wrappers/react`)
4. `@handsontable/vue` (stored at `./wrappers/vue`)

Although the packages are versioned with the same number and are released together, they all have their own build and testing processes.

We're using [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) (introduced in `npm@7`) to manage the monorepo. Because of some crucial bugfixes in the later versions, the Handsontable monorepo requires using **`npm@7.1.1+`**.

The build process uses [Webpack](https://webpack.js.org/) and [Babel](https://babeljs.io/) as well as npm tasks listed in [package.json](https://github.com/handsontable/handsontable/blob/master/package.json).

During this process, the source files located in the `src/*` directory are transformed into the output files:

* `./dist/handsontable.js`
* `./dist/handsontable.css`
* `./dist/handsontable.full.js`
* `./dist/handsontable.full.css`
* `./dist/handsontable.full.min.js`
* `./dist/handsontable.full.min.css`
* `./dist/languages/*`

More info about dist packages can be found [here](https://github.com/handsontable/handsontable/blob/master/dist/README.md.

It is advised that you never modify the files mentioned above. Instead, make changes in the `src/` directory and then run a proper build. This is especially important if you want to contribute your changes back to Handsontable by making a pull request.

## npm tasks

Currently, the following tasks are available for building Handsontable:

* `npm run test` - runs several tasks in this order:
  * `npm run lint` - check if changes applied to the source code adhere to [our code style](https://github.com/handsontable/handsontable/blob/master/.eslintrc.js).
  * `npm run test:unit` - runs the test suite in node environment. It uses [Jest](https://facebook.github.io/jest/) as a test runner.
  * `npm run test:types` - runs the tests which check if the code follows TypeScript definition.
  * `npm run test:walkontable` - runs a single build of Walkontable (the Handsontable renderer engine) followed by Jasmine test suite and executes in [Puppeteer](https://github.com/GoogleChrome/puppeteer).
  * `npm run test:e2e` - runs a single build of Handsontable followed by Jasmine test suite and by using the generated bundle `/dist/handsontable.js` executes it in [Puppeteer](https://github.com/GoogleChrome/puppeteer).
  * `npm run test:production` - runs a single build followed by Jasmine test suite and by using generated minified bundle `/dist/handsontable.full.min.js` executes it in [Puppeteer](https://github.com/GoogleChrome/puppeteer).
* `npm run build` - runs a single build but without the code quality checking. It internally executes these tasks:
  * `npm run build:commonjs` - transpiles files into the `CommonJS` format. These files are published into NPM repository later.
  * `npm run build:es` - transpiles files into the `import/export` format. These files are published into NPM repository later.
  * `npm run build:umd` - creates the bundles (`dist/handsontable.js`, `dist/handsontable.css`, `dist/handsontable.full.js` and `dist/handsontable.full.css`) which are compatible with UMD (Universal Module Definition).
  * `npm run build:umd.min` - creates the minified bundles (`dist/handsontable.min.js`, `dist/handsontable.min.css`, `dist/handsontable.min.full.js` and `dist/handsontable.min.full.css`) which are compatible with UMD (Universal Module Definition).
  * `npm run build:languages` - creates the bundles containing language sets (i.e. `dist/languages/de-DE.js`, `dist/languages/all.js`) which are compatible with UMD (Universal Module Definition). More information about languages can be found [here](@/guides/internationalization/internationalization-i18n.md).
  * `npm run build:languages.min` - creates the minified bundles containing language sets (i.e. `dist/languages/de-DE.min.js`, `dist/languages/all.min.js`) which are compatible with UMD (Universal Module Definition). More information about languages can be found [here](@/guides/internationalization/internationalization-i18n.md).
* `npm run watch` - watches for changes in source directory and runs a build when a change is observed. For faster rebuild when a change is observed, the watcher triggers the file-building task without minify.

## NPM tasks for the framework-specific wrappers.

Each of the wrappers has its own framework-specific build environment and scripts. The build process can be triggered by either navigating the the wrapper directory (e.g. `./wrappers/react-handsontable/` and running:

*   `npm run build`

Or by utilizing one of the helper scripts in the root directory:

*   `npm run in` - Runs a command for the specified project. For Example:  
    `npm run in angular build` - runs the `build` command for the `@handsontable/angular` project.  
    Shorthands are also available - the aforementioned command works as `npm run in angular build` as well.
*   `npm run all` - Runs a command for all the packages. For example:  
    `npm run all build` will run the `build` command for all the defined packages.  
    The order in which the packages are executed is defined in the `./scripts/run-all.mjs` script.

## Running your first build

To run your own build, follow the below steps:

1. Install Node.js (available for Windows, macOS, and Linux). This will also install NPM - Node Package Manager, which handles all the dependencies. Handsontable requires **Node.js >=15.11.0** and npm **>=7.1.1** for building and testing.
2. Clone the Handsontable repository on your local disk and go to the directory where you cloned it.
3. Run `npm install` to download all the dependencies defined in `package.json`. The dependencies will be downloaded into a new directory `node_modules`, which is ignored by Git.
4. **Run `npm run build` to make your first build!**
