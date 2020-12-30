---
id: tutorial-custom-build
title: Custom build
sidebar_label: Custom build
slug: /tutorial-custom-build
---

*   [NPM tasks](#page-tasks)
*   [Running your first build](#page-running)

The build process is using [Webpack](https://webpack.js.org/), [Babel](https://babeljs.io/) and as well as npm tasks listed in [package.json](https://github.com/handsontable/handsontable/blob/master/package.json). During this process, the source located in the `src/*` directory are transformed into the output files:

*   `./dist/handsontable.js`
*   `./dist/handsontable.css`
*   `./dist/handsontable.full.js`
*   `./dist/handsontable.full.css`
*   `./dist/handsontable.full.min.js`
*   `./dist/handsontable.full.min.css`
*   `./dist/languages/*`

More info about dist packages can be found [here](https://github.com/handsontable/handsontable/blob/master/dist/README.md). It is advised that you never modify the above-mentioned files but rather make changes in the `src/` directory and then run a proper build. This is especially important if you want to contribute your changes back to Handsontable by making a pull request.

### NPM tasks

Currently, the following tasks are available for building Handsontable:

*   `npm run test` - runs several tasks in this order:
    *   `npm run lint` - check if changes applied into source code are valid with [our code style](https://github.com/handsontable/handsontable/blob/master/.eslintrc) (inspired by [Airbnb JavaScript Style](https://github.com/airbnb/javascript)).
    *   `npm run test:unit` - runs the test suite in node environment. It uses [Jest](https://facebook.github.io/jest/) as a test runner.
    *   `npm run test:types` - runs the tests which check if the code follows TypeScript definition.
    *   `npm run test:walkontable` - runs a single build of Walkontable (the Handsontable renderer engine) followed by Jasmine test suite and executes in [Puppeteer](https://github.com/GoogleChrome/puppeteer).
    *   `npm run test:e2e` - runs a single build of Handsontable followed by Jasmine test suite and by using the generated bundle `/dist/handsontable.js` executes it in [Puppeteer](https://github.com/GoogleChrome/puppeteer).
    *   `npm run test:production` - runs a single build followed by Jasmine test suite and by using generated minified bundle `/dist/handsontable.full.min.js` executes it in [Puppeteer](https://github.com/GoogleChrome/puppeteer).
*   `npm run build` - runs a single build but without the code quality checking. It internally executes these tasks:
    *   `npm run build:commonjs` - transpiles files into the `CommonJS` format. These files are published into NPM repository later.
    *   `npm run build:es` - transpiles files into the `import/export` format. These files are published into NPM repository later.
    *   `npm run build:umd` - creates the bundles (`dist/handsontable.js`, `dist/handsontable.css`, `dist/handsontable.full.js` and `dist/handsontable.full.css`) which are compatible with UMD (Universal Module Definition).
    *   `npm run build:umd.min` - creates the minified bundles (`dist/handsontable.min.js`, `dist/handsontable.min.css`, `dist/handsontable.min.full.js` and `dist/handsontable.min.full.css`) which are compatible with UMD (Universal Module Definition).
    *   `npm run build:languages` - creates the bundles containing language sets (i.e. `dist/languages/de-DE.js`, `dist/languages/all.js`) which are compatible with UMD (Universal Module Definition). More information about languages can be found [here](https://handsontable.com/docs/8.2.0/tutorial-internationalization.html).
    *   `npm run build:languages.min` - creates the minified bundles containing language sets (i.e. `dist/languages/de-DE.min.js`, `dist/languages/all.min.js`) which are compatible with UMD (Universal Module Definition). More information about languages can be found [here](https://handsontable.com/docs/8.2.0/tutorial-internationalization.html).
*   `npm run watch` - watches for changes in source directory and runs a build when a change is observed. For faster rebuild when a change is observed, the watcher triggers the file-building task without minify.

### Running your first build

To run your own build, follow the below steps:

1.  Install Node.js (available for Windows, Mac and Linux). This will also install NPM (Node Package Manager) that handles all the dependencies. Handsontable requires **Node.js >=10** and **npm >=6** for building and testing.
2.  Clone the Handsontable repository on your local disk and go to the directory where you cloned it.
3.  Run `npm install` to download all the dependencies defined in `package.json`. The dependencies will be downloaded into a new directory `node_modules`, that is ignored by Git.
4.  **Run `npm run build` to make your first build!**

