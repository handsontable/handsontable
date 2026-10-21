---
type: how-to
title: Testing
metaTitle: Testing | Handsontable DataGrid for JavaScript
description: Run one or multiple tests, using Handsontable DataGrid's ready-made commands for Jasmine and Puppeteer.
permalink: /testing
canonicalUrl: /testing
tags:
  - Jasmine
  - CLI
  - unit test
  - end to end test
  - puppeteer
  - spec
react:
  metaTitle: Testing | Handsontable DataGrid for React
angular:
  metaTitle: Testing | Handsontable DataGrid for Angular
vue:
  metaTitle: Testing | Handsontable DataGrid for Vue
searchCategory: Guides
category: Tools and building
menuTag: updated
---
Handsontable DataGrid has three test pipelines: unit tests (Jest), E2E tests (Puppeteer/Jasmine), and Walkontable tests. Run them when contributing to the core library or verifying a fix.

[[toc]]

## Test in browser

To run the Jasmine tests in your browser, go to the following pages:

- **<YOUR\_LOCALHOST\_ADDRESS>/test/E2ERunner.html** - Handsontable end-to-end test suite
- **<YOUR\_LOCALHOST\_ADDRESS>/test/MobileRunner.html** - Handsontable mobile test suite
- **<YOUR\_LOCALHOST\_ADDRESS>/src/3rdparty/walkontable/test/SpecRunner.html** - Walkontable test suite

## Test with NPM (CLI)

To run Jasmine tests in your command line (using Puppeteer), first install all necessary dependencies by executing `pnpm install`. After pnpm finishes fetching required modules, your workspace is ready to test.

To run all tests from the monorepo's root directory, use the following command:
- `npm run test`

To run individual tests, go to the `/handsontable` directory, and use the following commands:
- `npm run test` - runs all test cases (Handsontable and Walkontable).
- `npm run test:unit` - runs all unit tests.
- `npm run test:walkontable` - runs only Walkontable tests.
- `npm run test:e2e` - runs all end-to-end tests.
- `npm run test:e2e --testPathPattern=selection` - runs only end-to-end tests and suites matching the filename "selection".
- `npm run test:unit --testPathPattern=array` - runs only unit tests and suites matching the filename "array".
- `npm run test:e2e.dump` - generates the `test/E2ERunner.html` file which can by executed in the browser environment (Chrome, Firefox etc.) to check if tests passes.
- `npm run test:e2e.dump -- --watch` - generates the `E2ERunner.html` file on every change detected in test files. It can be helpful for debugging proposes.

## Test specific themes
To run the E2E tests with a theme, you need to use the `--theme` flag.
For example, to run all the E2E tests using the "main" theme, you can use the following command:
```
npm run test:e2e --theme=main
```

The `--theme` flag can be used along the `--testPathPattern` flag to run only specific tests with a specific theme.
For example, to run only the E2E tests with "selection" in the filename and the "main" theme enabled, you can use the following command:
```
npm run test:e2e --theme=main --testPathPattern=selection
```

Note: As for version `15.1.0`, the `--theme` flag is available just for the "main" theme.

## Test the framework-specific wrappers.

The wrappers contain their own framework-specific testing environments. You can either run the `npm run test` script inside of the wrapper directory, or utilize the `npm run in`/`npm run all` scripts to run the tests from the root.

Keep in mind that running wrapper tests require building the Handsontable (`npm run build`). Once built the wrapper can consume its main dependency. Otherwise, tests will fail.

## Environments settings

- Due to Puppeteer's `setViewer` settings, the size of the window's browser should be at least 1280px wide and 720px tall.
- The scrollbars should be visible. The size of the scrollbar affects `clientWidth` and `clientHeight`, which can interfere visibility and the number of columns and rows.
- The browser window running the test should be on top. Some tests will not pass while running in the background.
- Focus should be on the browser window and the mouse should be still. Moving the mouse or losing focus on the window can interfere with the tests, causing them not to pass.

## Visual testing

To avoid unintended changes to Handsontable's UI, we use automated visual regression testing.

Learn more on our [GitHub](https://github.com/handsontable/handsontable/blob/develop/visual-tests/README.md).

## Test import and export in Jest or Vitest

This section is for your own application's tests. The `ImportFile` and `ExportFile` plugins run under Jest and Vitest once the environment provides the browser APIs they use.

The built-in [XLSX engine](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md) needs four globals: `CompressionStream`, `DecompressionStream`, `TextEncoder`, and `TextDecoder`. Every browser Handsontable DataGrid supports provides them. Jest's `jsdom` environment lacks all four, and Jest 27's `node` environment lacks `CompressionStream` and `DecompressionStream`; the plugins then reject with a message that names the missing globals. Jest's `node` environment provides all four from Jest 28 on, and Vitest's `jsdom` and `happy-dom` environments provide them in the default `forks` and `threads` pools (not in `vmThreads` or `vmForks`). Building a grid under jsdom also needs `ResizeObserver` and `IntersectionObserver` stubs.

To run the engine under Jest's `jsdom` environment, assign the globals from Node.js in a `setupFiles` module:

```javascript
const { CompressionStream, DecompressionStream } = require('node:stream/web');
const { TextEncoder, TextDecoder } = require('node:util');

Object.assign(globalThis, { CompressionStream, DecompressionStream, TextEncoder, TextDecoder });
```

In jsdom before 28.1 (Jest 30 ships 26.1), `Blob` has no `arrayBuffer()` method, so `importFromBlob()` fails with any engine. Call `importFromArrayBuffer()` with the file's `ArrayBuffer` instead, or add the method in the same module:

```javascript
if (typeof Blob.prototype.arrayBuffer !== 'function') {
  Blob.prototype.arrayBuffer = function arrayBuffer() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
```

A download also needs `URL.createObjectURL`, which jsdom lacks. Mock it together with `URL.revokeObjectURL`, because the plugin revokes the URL from a timer 100 ms after the download:

```javascript
URL.createObjectURL = jest.fn(() => 'blob:mock'); // vi.fn() in Vitest
URL.revokeObjectURL = jest.fn();
```

Keep the grids you export under jsdom small and give the test a longer timeout: every export under jsdom is slow, not only the first (2,000 rows by 10 columns took about 45 seconds per export under Jest 29, 200 rows about 3 seconds). Headless Chromium exports 20,000 rows by 10 columns in under half a second.

To inject ExcelJS under Jest 29 with `jest-environment-jsdom`, set `testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] }`, or loading it fails with `SyntaxError: Unexpected token 'export'`.

## Result

Your tests ran and reported pass or fail results. A green test suite confirms your change does not introduce regressions.

## Related guides

<div class="boxes-list">

- [Building](@/guides/tools-and-building/custom-builds/custom-builds.md)
- [XLSX engines](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md)

::: only-for javascript

- [Packages](@/guides/tools-and-building/packages/packages.md)

:::

</div>
