---
title: Building
metaTitle: Building - Guide - Handsontable Documentation
permalink: /next/building
canonicalUrl: /building
tags:
  - custom build
  - bundling
  - contributing
---

# Building

Learn how to build Handsontable packages, using the available npm tasks.

[[toc]]

## About building

Get an overview of Handsontable's building processes.

### Monorepo

The [Handsontable repository](https://github.com/handsontable/handsontable) is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that contains the following projects:

| Project                 | Location             | Description                                                                |
| ----------------------- | -------------------- | -------------------------------------------------------------------------- |
| `handsontable`          | `./handsontable`     | Main Handsontable project                                                  |
| `@handsontable/angular` | `./wrappers/angular` | [Angular wrapper](@/guides/integrate-with-angular/angular-installation.md) |
| `@handsontable/react`   | `./wrappers/react`   | [React wrapper](@/guides/integrate-with-react/react-installation.md)       |
| `@handsontable/vue`     | `./wrappers/vue`     | [Vue 2 wrapper](@/guides/integrate-with-vue/vue-installation.md)           |

All the projects are released together, under the same version number.
But each project has its own [building](#building-processes) and [testing](@/guides/building-and-testing/testing.md) processes.

### Building processes

The building processes transform the source files located in the `./handsontable/src/` directory into the following output files:

* `./handsontable/dist/handsontable.js`
* `./handsontable/dist/handsontable.css`
* `./handsontable/dist/handsontable.full.js`
* `./handsontable/dist/handsontable.full.css`
* `./handsontable/dist/handsontable.full.min.js`
* `./handsontable/dist/handsontable.full.min.css`
* `./handsontable/dist/languages/*`

::: tip
Don't modify the output files mentioned above. Instead, make changes in the `./handsontable/src/` directory and then run a selected [build](#building-the-packages). This is especially important if you want to contribute your changes back to Handsontable through a pull request.

For more information on the distribution packages, see [this file](https://github.com/handsontable/handsontable/blob/master/dist/README.md).
:::

### Building requirements

Handsontable building processes require:
- [Node.js](https://nodejs.org/) (version **15.11**+)
- [npm](https://www.npmjs.com/) (version **7.17**+)
- Node modules installed through `npm install` (e.g. [webpack](https://webpack.js.org/) and [Babel](https://babeljs.io/))

### `package.json` files

Each Handsontable [project](#about-building) has its own [building](#building-the-packages) processes defined in its own `package.json` file. Apart from that, the root directory has its own `package.json` file as well:

| File                              | Holds tasks for building:                           |
| --------------------------------- | --------------------------------------------------- |
| `./package.json`                  | - All the packages at once<br>- Individual packages |
| `./handsontable/package.json`     | The JavaScript package                              |
| `./wrappers/angular/package.json` | The Angular package                                 |
| `./wrappers/react/package.json`   | The React package                                   |
| `./wrappers/vue/package.json`     | The Vue package                                     |

## Running your first build

To run your first build:
1. Install [Node.js](https://nodejs.org/) (version **15.11**+).
2. Install [npm](https://www.npmjs.com/) (version **7.17**+).
3. Clone the [Handsontable repository](https://github.com/handsontable/handsontable).
4. From the root directory, run `npm install`.<br>All the required dependencies get installed.
5. From the root directory, run `npm run build`.<br>All the Handsontable packages get built.

## Building the packages

You can either build all the packages at once, or build each package individually.

### Building all the packages

To build all the packages at once:
1. Make sure you meet the [building requirements](#building-requirements).
2. Go to the root directory.
3. Run `npm run build`.<br>The script builds the following packages:
     - The JavaScript package
     - The Angular package
     - The React package
     - The Vue package
     - A code examples package

### Building the JavaScript package

To build the JavaScript package:
1. Make sure you meet the [building requirements](#building-requirements).
2. Go to `./handsontable`.
3. Run `npm run build`.<br>Only the JavaScript package builds.

To build the JavaScript package from the root directory:
1. Make sure you meet the [building requirements](#building-requirements).
2. Go to the root directory.
3. Run `npm run in handsontable build`.<br>Only the JavaScript package builds.

#### JavaScript build tasks

From the `./handsontable` directory, you can also run individual JavaScript `build` tasks:

::: details JavaScript build tasks
`npm run build:commonjs`
  - Transpiles files into the CommonJS format.

`npm run build:es`
  - Transpiles files into the ESM format.

`npm run build:umd`
  - Creates the following bundles compatible with the Universal Module Definition:
    - `./handsontable/dist/handsontable.js`
    - `./handsontable/dist/handsontable.css`
    - `./handsontable/dist/handsontable.full.js`
    - `./handsontable/dist/handsontable.full.css`

`npm run build:umd.min`
  - Creates the minified bundles compatible with the Universal Module Definition:
    - `./handsontable/dist/handsontable.min.js`
    - `./handsontable/dist/handsontable.min.css`
    - `./handsontable/dist/handsontable.min.full.js`
    - `./handsontable/dist/handsontable.min.full.css`

`npm run build:walkontable`
  - Builds Walkontable, an essential part of Handsontable that's responsible for the rendering process.

`npm run build:languages`
  - Creates the [language](@/guides/internationalization/internationalization-i18n.md) bundles compatible with the Universal Module Definition, for example:
    - `./handsontable/dist/languages/de-DE.js`
    - `./handsontable/dist/languages/all.js`

`build:languages.es`
  - Creates the [language](@/guides/internationalization/internationalization-i18n.md) bundles compatible with the ESM format, for example:
    - `languages/en-US.mjs`

`npm run build:languages.min`
   - Creates the minified [language](@/guides/internationalization/internationalization-i18n.md) bundles compatible with the Universal Module Definition, for example:
     - `./handsontable/dist/languages/de-DE.min.js`
     - `./handsontable/dist/languages/all.min.js`
:::

### Building the Angular package

To build the Angular package:
1. Make sure you meet the [building requirements](#building-requirements).
3. Go to `./wrappers/angular`.
4. Run `npm run build`.<br>Only the Angular package builds.

To build the Angular package from the root directory:
1. Make sure you meet the [building requirements](#building-requirements).
2. Go to the root directory.
3. Run `npm run in angular build`.<br>Only the Angular package builds.

#### Angular build tasks

From the `./wrappers/angular` directory, You can also run individual Angular `build` tasks:

::: details Angular build tasks
`npm run build`
  - Builds the `@handsontable/angular` package for multiple module systems, and places the result in the `./wrappers/angular/dist/hot-table` directory.
:::

### Building the React package

To build the React package:
1. Make sure you meet the [building requirements](#building-requirements).
2. Go to `./wrappers/react`.
3. Run `npm run build`.<br>Only the React package builds.

To build the React package from the root directory:
1. Make sure you meet the [building requirements](#building-requirements).
2. Go to the root directory.
3. Run `npm run in react build`.<br>Only the React package builds.

#### React build tasks

From the `./wrappers/react` directory, you can also run individual React `build` tasks:

::: details React build tasks
`npm run build:commonjs`
  - Transpiles files into the CommonJS format.
  - Places the output in `./wrappers/react/commonjs/react-handsontable.js`

`npm run build:umd`
  - Creates the following bundles compatible with the Universal Module Definition:
    - `./wrappers/react/dist/react-handsontable.js`
    - `./wrappers/react/dist/react-handsontable.css`
    - `./wrappers/react/dist/react-handsontable.full.js`
    - `./wrappers/react/dist/react-handsontable.full.css`

`npm run build:es`
  - Transpiles files into the ESM format.
  - Places the output in `./wrappers/react/es/react-handsontable.js`

`npm run build:min`
  - Creates the minified bundles:
    - `./wrappers/react/dist/react-handsontable.min.js`
    - `./wrappers/react/dist/react-handsontable.min.css`
    - `./wrappers/react/dist/react-handsontable.min.full.js`
    - `./wrappers/react/dist/react-handsontable.min.full.css`
:::

### Building the Vue package

To build the Vue package:
1. Make sure you meet the [building requirements](#building-requirements).
2. Go to `./wrappers/vue`.
3. Run `npm run build`.<br>Only the Vue package builds.

To build the Vue package from the root directory:
1. Make sure you meet the [building requirements](#building-requirements).
2. Go to the root directory.
3. Run `npm run in vue build`.<br>Only the Vue package builds.

#### Vue build tasks

From the `./wrappers/vue` directory, you can also run individual Vue `build` tasks:

::: details Vue build tasks
`npm run build:commonjs`
  - Transpiles files into the CommonJS format.
  - Places the output in `./wrappers/vue/commonjs/vue-handsontable.js`

`npm run build:umd`
  - Creates the following bundles compatible with the Universal Module Definition:
    - `./wrappers/vue/dist/vue-handsontable.js`
    - `./wrappers/vue/dist/vue-handsontable.css`
    - `./wrappers/vue/dist/vue-handsontable.full.js`
    - `./wrappers/vue/dist/vue-handsontable.full.css`

`npm run build:es`
  - Transpiles files into the ESM format.
  - Places the output in `./wrappers/vue/es/vue-handsontable.js`

`npm run build:min`
  - Creates the minified bundles:
    - `./wrappers/vue/dist/vue-handsontable.min.js`
    - `./wrappers/vue/dist/vue-handsontable.min.css`
    - `./wrappers/vue/dist/vue-handsontable.min.full.js`
    - `./wrappers/vue/dist/vue-handsontable.min.full.css`
:::