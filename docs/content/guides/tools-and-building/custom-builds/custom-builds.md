---
type: how-to
title: Custom builds
metaTitle: Custom builds - JavaScript Data Grid | Handsontable
description: Handsontable's building process transforms the source files located in the code repository into dedicated packages.
permalink: /custom-builds
canonicalUrl: /custom-builds
tags:
  - building
  - bundling
  - contributing
react:
  metaTitle: Custom builds - React Data Grid | Handsontable
angular:
  metaTitle: Custom builds - Angular Data Grid | Handsontable
vue:
  metaTitle: Custom builds - Vue Data Grid | Handsontable
searchCategory: Guides
category: Tools and building
---
Handsontable's building process transforms the source files located in the code repository into dedicated packages.

[[toc]]

## Overview

### Monorepo

The Handsontable repository is a monorepo that contains the following projects:

| Project                 | Location                  | Description                                                                                          |
| ----------------------- |---------------------------|------------------------------------------------------------------------------------------------------|
| `handsontable`          | `/handsontable`           | Main Handsontable project                                                                            |
| `@handsontable/react-wrapper`  | `/wrappers/react-wrapper` | [React wrapper](@/react/guides/getting-started/introduction/introduction.md) |
| `@handsontable/angular-wrapper` | `/wrappers/angular-wrapper`       | [Angular (v16+) wrapper](@/angular/guides/getting-started/introduction/introduction.md)              |
| `@handsontable/vue3`    | `/wrappers/vue3`          | [Vue wrapper](@/vue/guides/getting-started/installation/installation.md)      |

Handsontable releases all projects together, under the same version number.
But each project has its own [building](#build-processes) and [testing](@/guides/tools-and-building/testing/testing.md) processes.

### Build processes

The building processes transform the source files located in the `/handsontable/src/` directory into the following output files:

- `/handsontable/dist/`
    - handsontable UMD files, including minified versions
    - the language file
    - the themes and variables files
- `/handsontable/styles/`
    - modern theme CSS files, including minified versions
- `handsontable/tmp/`
    - ESM, CommonJS and UMD builds, type definition files etc.

::: tip

Don't modify the output files mentioned above. Instead, make changes in the `/handsontable/src/` directory and then run a selected [build](#build-the-packages). This is especially important if you want to contribute your changes back to Handsontable through a pull request.

For more information on the distribution packages, see [this file](https://github.com/handsontable/handsontable/blob/master/handsontable/dist/README.md).

:::

### Build requirements

Handsontable building processes require:

- [Node.js](https://nodejs.org/) (version defined in `.nvmrc` in the root of the repository)
- [pnpm](https://pnpm.io/) (in version relevant to the one defined in the `packageManager` field of the root's `package.json`)
- [npm](https://www.npmjs.com/) (version corresponding to the Node.js version)
- Node modules installed through `pnpm install` (e.g. [Rspack](https://rspack.dev/) and [Babel](https://babeljs.io/))

### `package.json` files

Each Handsontable [project](#monorepo) has its own building processes defined in its own `package.json` file. Apart from that, the root directory has its own `package.json` file as well:

| File                                   | Holds tasks for building:                           |
|----------------------------------------|-----------------------------------------------------|
| `/package.json`                        | - All the packages at once<br>- Individual packages |
| `/handsontable/package.json`           | The JavaScript package                              |
| `/wrappers/react-wrapper/package.json` | The React package                      |
| `/wrappers/angular-wrapper/package.json`       | The Angular (v16+) package                          |
| `/wrappers/vue3/package.json`          | The Vue package                                   |

## Run your first build

To run your first build:

1. Install [Node.js](https://nodejs.org/).
2. Install [pnpm](https://pnpm.io/) (the repository package manager). <br>The version should correspond to the one defined in the `packageManager` field of the root's `package.json`.
3. Clone the [Handsontable repository](https://github.com/handsontable/handsontable).
4. From the root directory, run `pnpm install`.<br>pnpm installs all required dependencies, including for the `docs` and `examples` workspaces.
5. From the root directory, run `pnpm run build`.<br>The script builds all Handsontable packages.

## Build the packages

You can either build all the packages at once, or build each package individually.

### Build all the packages

To build all the packages at once:

1. Make sure you meet the [build requirements](#build-requirements).
2. Go to the root directory.
3. Run `npm run build`.<br>The script builds the following packages:
     - The JavaScript package
     - The React package
     - The Angular package _**<small>(deprecated)</small>**_
     - The Angular (v16+) package
     - The Vue 2 package
     - The Vue 3 package
     - A code examples package
     - Visual-tests package

### Build the JavaScript package

To build the JavaScript package:

1. Make sure you meet the [build requirements](#build-requirements).
2. Go to `/handsontable`.
3. Run `npm run build`.<br>Only the JavaScript package builds.

To build the JavaScript package from the root directory:

1. Make sure you meet the [build requirements](#build-requirements).
2. Go to the root directory.
3. Run `npm run in handsontable build`.<br>Only the JavaScript package builds.

#### JavaScript build tasks

From the `/handsontable` directory, you can also run individual JavaScript `build` tasks:

::: details JavaScript build tasks

`npm run build:commonjs`

  - Transpiles the files into the CommonJS format.

`npm run build:es`

  - Transpiles the files into the ESM format.

`npm run build:umd`

  - Creates the following bundles compatible with the Universal Module Definition:
    - `/handsontable/dist/handsontable.js`
    - `/handsontable/dist/handsontable.full.js`
    - `/handsontable/styles/*` - non-minified theme CSS files

`npm run build:umd.min`

  - Creates the minified bundles compatible with the Universal Module Definition:
    - `/handsontable/dist/handsontable.min.js`
    - `/handsontable/dist/handsontable.min.full.js`
    - `/handsontable/styles/*` - minified theme CSS files

`npm run build:walkontable`

  - Builds Walkontable, an essential part of Handsontable that's responsible for the rendering process.

`npm run build:languages`

  - Creates the [language](@/guides/internationalization/language/language.md) bundles compatible with the Universal Module Definition, for example:
    - `/handsontable/dist/languages/de-DE.js`
    - `/handsontable/dist/languages/all.js`

`build:languages.es`

  - Creates the [language](@/guides/internationalization/language/language.md) bundles compatible with the ESM format, for example:
    - `languages/en-US.mjs`

`npm run build:languages.min`

   - Creates the minified [language](@/guides/internationalization/language/language.md) bundles compatible with the Universal Module Definition, for example:
     - `/handsontable/dist/languages/de-DE.min.js`
     - `/handsontable/dist/languages/all.min.js`

:::

### Build the React package

To build the React package:

1. Make sure you meet the [build requirements](#build-requirements).
2. Go to `/wrappers/react-wrapper`.
3. Run `npm run build`.<br>Only the React package builds.

To build the React package from the root directory:

1. Make sure you meet the [build requirements](#build-requirements).
2. Go to the root directory.
3. Run `npm run in react-wrapper build`.<br>Only the React package builds.

#### React build tasks

From the React wrapper directory, you can also run individual React `build` tasks:

::: details React build tasks

`npm run build:commonjs`

  - Transpiles the files into the CommonJS format.
  - Places the output in `/commonjs/react-handsontable.js`

`npm run build:umd`

  - Creates the following bundles compatible with the Universal Module Definition:
    - `/dist/react-handsontable.js`
    - `/dist/react-handsontable.js.map`

`npm run build:es`

  - Transpiles the files into the ESM format.
  - Places the output in `/es/react-handsontable.mjs`

`npm run build:min`

  - Creates the minified bundles:
    - `/dist/react-handsontable.min.js`
    - `/dist/react-handsontable.min.js.map`

:::

### Build the Angular package

To build the Angular package:

1. Make sure you meet the [build requirements](#build-requirements).
2. Go to `/wrappers/angular-wrapper`.
3. Run `npm run build`.<br>Only the Angular package builds.

To build the Angular package from the root directory:

1. Make sure you meet the [build requirements](#build-requirements).
2. Go to the root directory.
3. Run `npm run in angular-wrapper build`.<br>Only the Angular package builds.

#### Angular build tasks

From the `/wrappers/angular-wrapper` directory, You can also run individual Angular `build` tasks:

::: details Angular build tasks

`npm run build`

- Builds the `@handsontable/angular-wrapper` package for multiple module systems.
- Places the output in the `/wrappers/angular-wrapper/dist/hot-table/` directory.

:::

### Build the Vue package

To build the Vue package:

1. Make sure you meet the [build requirements](#build-requirements).
2. Go to `/wrappers/vue3`.
3. Run `npm run build`.<br>Only the Vue package builds.

To build the Vue package from the root directory:

1. Make sure you meet the [build requirements](#build-requirements).
2. Go to the root directory.
3. Run `npm run in vue3 build`.<br>Only the Vue package builds.

#### Vue build tasks

From the `/wrappers/vue3` directory, you can also run individual Vue `build` tasks:

::: details Vue build tasks

`npm run build:commonjs`

  - Transpiles the files into the CommonJS format.
  - Places the output in `/wrappers/vue3/commonjs/vue-handsontable.js`

`npm run build:umd`

  - Creates the following bundles compatible with the Universal Module Definition:
    - `/wrappers/vue3/dist/vue-handsontable.js`
    - `/wrappers/vue3/dist/vue-handsontable.js.map`

`npm run build:es`

  - Transpiles the files into the ESM format.
  - Places the output in `/wrappers/vue3/es/vue-handsontable.mjs`

`npm run build:min`

  - Creates the minified bundles:
    - `/wrappers/vue3/dist/vue-handsontable.min.js`
    - `/wrappers/vue3/dist/vue-handsontable.min.js.map`

:::

## Related guides

<div class="boxes-list">

::: only-for javascript

- [Packages](@/guides/tools-and-building/packages/packages.md)

:::

- [Testing](@/guides/tools-and-building/testing/testing.md)

</div>

## Result

You now have a local build of Handsontable. The output files in `handsontable/dist/` and `handsontable/tmp/` reflect your source changes.