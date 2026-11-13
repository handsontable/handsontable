---
type: how-to
title: Testing
metaTitle: Testing | Handsontable DataGrid for JavaScript
description: Test your app with Handsontable DataGrid in Jest or Vitest, or run the core library's own Jasmine and Puppeteer tests.
permalink: /testing
canonicalUrl: /testing
tags:
  - Jasmine
  - CLI
  - unit test
  - end to end test
  - puppeteer
  - spec
  - jest
  - vitest
  - jsdom
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
To test your own application in Jest or Vitest, see [Test your app in Jest or Vitest](#test-your-app-in-jest-or-vitest).

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

## Test your app in Jest or Vitest

Jest and Vitest run your tests in jsdom, which has no layout engine and lacks some browser APIs that Handsontable calls. Without a few stubs, a test that builds a grid fails at startup, renders only some columns, or takes seconds to run. This section is for your own application's tests.

### Stub the missing browser APIs

Add a setup file that provides what jsdom lacks. The stubs below do nothing, which is enough for tests that check data, settings, and rendered text.

Install jsdom support first. Jest 28 and later needs the `jest-environment-jsdom` package, and Vitest needs the `jsdom` package. Jest 27 bundles jsdom 16.

In Jest, add the file to `setupFiles` and set `testEnvironment` to `jsdom`:

```javascript
// jest.setup.js
const { webcrypto } = require('node:crypto');

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = () => {};
document.execCommand = () => true;

if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}
```

In Vitest, add the file to `test.setupFiles` and set `test.environment` to `jsdom`. A Vitest setup file is an ES module, so import `webcrypto` instead of calling `require()`:

```javascript
// vitest.setup.js
import { webcrypto } from 'node:crypto';

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Element.prototype.scrollIntoView = () => {};
document.execCommand = () => true;

if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}
```

Each stub covers one failure:

| Stub | What fails without it |
| --- | --- |
| `ResizeObserver` | Creating a grid throws `ResizeObserver is not defined`. |
| `IntersectionObserver` | Creating a grid throws `IntersectionObserver is not defined`. jsdom has no layout, so Handsontable treats every new grid as hidden and observes when it becomes visible. |
| `Element.prototype.scrollIntoView` | Moving the selection with a key throws `element.scrollIntoView is not a function`. The error comes after the key press, not from it. |
| `document.execCommand` | `copy` and `cut` throw `this.hot.rootDocument.execCommand is not a function`. |
| `crypto.getRandomValues` | Creating a grid throws `Cannot read properties of undefined (reading 'getRandomValues')`. This happens in jsdom before version 20, which Jest 27 and 28 ship. |

With the `execCommand` stub, `copy()` and `cut()` run no hooks and write nothing to the clipboard, and `Ctrl`+`Enter` in the editor inserts no line break. Test clipboard behavior and multiline editing in a real browser.

### Set the grid options for jsdom

Set three options on the grids you create in tests:

- [`renderAllColumns: true`](@/api/options.md#renderallcolumns). jsdom has no layout, so the grid sees a viewport of zero width and renders only a few columns. This option renders every column.
- [`renderAllRows: true`](@/api/options.md#renderallrows). With no `height` set, jsdom renders only a few rows, and not always the first ones: Jest 29 renders the last three, and Jest 30 renders the first two. So `getCell(0, 0)` can return `null`. A pixel `height` renders every row. Set the option everywhere, so a test doesn't depend on the grid's height or on the runner.
- [`injectCoreCss: false`](@/api/options.md#injectcorecss). By default, Handsontable adds its stylesheet to the page, and jsdom spends a long time on every grid it builds there. It took 6 to 15 seconds per grid on jsdom 20 and older (Jest 29 and earlier), and about 2 seconds on jsdom 26. With the option set to `false`, a grid builds in about 0.1 seconds. Tests that check data, settings, and cell text don't need the core styles.

A grid with 5,000 rows took about 2.5 seconds to build with these options on jsdom 20.

With these options set, hooks and renderers run as in a browser. For example, `afterRenderer` fires for each rendered cell.

The snippets below show where the options go. Your own data, imports, and module registration stay as in your app.

::: only-for javascript

```javascript
const hot = new Handsontable(container, {
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  data,
  renderAllColumns: true,
  renderAllRows: true,
  injectCoreCss: false,
});
```

:::

::: only-for react

```jsx
<HotTable
  // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
  data={data}
  renderAllColumns={true}
  renderAllRows={true}
  injectCoreCss={false}
/>
```

:::

::: only-for angular

```typescript
gridSettings: GridSettings = {
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  renderAllColumns: true,
  renderAllRows: true,
  injectCoreCss: false,
};
```

```html
<hot-table [data]="data" [settings]="gridSettings" />
```

:::

::: only-for vue

```vue
<script setup>
const hotSettings = {
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  data,
  renderAllColumns: true,
  renderAllRows: true,
  injectCoreCss: false,
};
</script>

<template>
  <HotTable :settings="hotSettings" />
</template>
```

:::

Keep these options out of your production components. Define them once in your test helpers, and pass them in from the test through the settings or props your component already accepts.

::: only-for react

In React, for example, let the component forward an optional `gridOptions` prop to `HotTable`:

```jsx
// OrdersGrid.jsx
export function OrdersGrid({ data, gridOptions = {} }) {
  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      data={data}
      {...gridOptions}
    />
  );
}
```

Then pass the test options from the test:

```jsx
// OrdersGrid.test.jsx
const jsdomGridOptions = { renderAllColumns: true, renderAllRows: true, injectCoreCss: false };

render(<OrdersGrid data={data} gridOptions={jsdomGridOptions} />);
```

:::

In released versions up to 18.1.2, `injectCoreCss: false` applies to the main grid only. The first time a test opens a dropdown or autocomplete editor, the context menu, or a Filters menu, Handsontable injects the stylesheet anyway, and that step is slow. In a measurement on version 18.1.2, opening a dropdown editor took about 40 seconds on jsdom 20 and about 6 seconds on jsdom 26. Opening the context menu took about 6 seconds and about 1 second. If your suite gets slow because of them, test those features in a real browser.

### Know what jsdom cannot test

jsdom does not calculate sizes or positions. Everything that depends on them behaves differently from a browser, or can't be tested:

- Column widths, row heights, and the number of rendered rows and columns.
- Scroll position and scrolling to a selected cell.
- Where an editor, menu, or comment appears on the page.
- Frozen areas and sticky headers.
- Mouse gestures, such as drag-fill with the fill handle, selecting by dragging, and resizing by dragging.

Test these in a real browser, with a tool such as Playwright. Use Jest or Vitest for what jsdom handles well: data, settings, hooks, validation, and the text of rendered cells.

Grids with features such as `fillHandle` build fine in jsdom with the setup above.

In Playwright, scope a locator to the overlay that owns the cell. `.ht_master` holds the main body, and each frozen area has its own `.ht_clone_*` element, such as `.ht_clone_top` for frozen top rows and `.ht_clone_inline_start` for frozen start columns. To find a cell without relying on the DOM structure, add a test id to it in an `afterRenderer` hook.

### Fix common errors

| What you see | Cause | Fix |
| --- | --- | --- |
| `ResizeObserver is not defined` or `IntersectionObserver is not defined` | jsdom lacks the observer APIs. | Add the stubs. |
| `Cannot read properties of undefined (reading 'getRandomValues')` | jsdom before version 20 has no `crypto`. | Add the `webcrypto` guard. |
| `element.scrollIntoView is not a function`, shown after a key press | jsdom lacks `scrollIntoView`. | Add the stub. In Vitest, this error also ends the run with exit code 1, even when every test passed. |
| `execCommand is not a function` on copy or cut | jsdom lacks `document.execCommand`. | Add the stub. Clipboard hooks still don't run, so test them in a real browser. |
| Only some columns exist in the DOM | jsdom has no layout. | Set `renderAllColumns: true`. |
| Some rows are missing, and `getCell()` returns `null` | A grid with no pixel `height` renders only a few rows in jsdom. | Set `renderAllRows: true`. |
| `Not implemented: window.scrollTo` in Jest, or `Not implemented: Window's scrollTo() method` in Vitest | Selecting a cell or scrolling to one in a grid with no `height` scrolls the page, and jsdom has no `scrollTo`. | Ignore it, because the tests still pass. To remove it, set a pixel `height`, or add `window.scrollTo = () => {};` to the setup file. |
| Each grid takes seconds to build | jsdom processes the core stylesheet for every grid. | Set `injectCoreCss: false`. |
| `Could not parse CSS stylesheet` in the output (version 18.1.2) | jsdom can't parse the default theme stylesheet. | Ignore it. The grid works and the run exits with code 0. |
| `The "ht-theme-main" theme is enabled, but its stylesheets are missing` (version 18.1.2) | jsdom can't parse or apply the theme stylesheet. The message also appears with the default `injectCoreCss`. | Ignore it. Tests that check data, settings, and cell text don't need the styles. |

## Test import and export in Jest or Vitest

This section is for your own application's tests. The `ImportFile` and `ExportFile` plugins run under Jest and Vitest once the environment provides the browser APIs they use. Set up the environment as [Test your app in Jest or Vitest](#test-your-app-in-jest-or-vitest) describes.

The built-in [XLSX engine](@/guides/accessories-and-menus/xlsx-engine/xlsx-engine.md) needs four globals: `CompressionStream`, `DecompressionStream`, `TextEncoder`, and `TextDecoder`. Every browser Handsontable DataGrid supports provides them. Jest's `jsdom` environment lacks all four, and Jest 27's `node` environment lacks `CompressionStream` and `DecompressionStream`; the plugins then reject with a message that names the missing globals. Jest's `node` environment provides all four from Jest 28 on, and Vitest's `jsdom` and `happy-dom` environments provide them in the default `forks` and `threads` pools (not in `vmThreads` or `vmForks`).

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
