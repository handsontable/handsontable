---
id: 6fv7kuj6
title: Testing
metaTitle: Testing - JavaScript Data Grid | Handsontable
description: Run one or multiple tests, using Handsontable's ready-made commands for Jasmine and Puppeteer.
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
  id: y3wp74jh
  metaTitle: Testing - React Data Grid | Handsontable
searchCategory: Guides
category: Tools and building
---

# Testing

Run one or multiple tests, using Handsontable's ready-made commands for Jasmine and Puppeteer.

[[toc]]

## Test in browser

To run the Jasmine tests in your browser, go to the following pages:

- **<YOUR\_LOCALHOST\_ADDRESS>/test/E2ERunner.html** - Handsontable end-to-end test suite
- **<YOUR\_LOCALHOST\_ADDRESS>/test/MobileRunner.html** - Handsontable mobile test suite
- **<YOUR\_LOCALHOST\_ADDRESS>/src/3rdparty/walkontable/test/SpecRunner.html** - Walkontable test suite

## Test with NPM (CLI)

To run Jasmine tests in your command line (using Puppeteer), first install all necessary dependencies by executing `npm install`. After the `NPM` finishes fetching required modules, your workspace is ready to test.

To run all tests from the monorepo's root directory, use the following command:
- `npm run test`

To run individual tests, go to the `/handsontable` directory, and use the following commands:
- `npm run test` - runs all test cases (Handsontable and Walkontable).
- `npm run test:unit` - runs all unit tests.
- `npm run test:walkontable` - runs only Walkontable tests.
- `npm run test:e2e` - runs all end-to-end tests.
- `npm run run test:e2e --testPathPattern=selection` - runs only end-to-end tests and suites matching the filename "selection".
- `npm run run test:unit --testPathPattern=array` - runs only unit tests and suites matching the filename "array".
- `npm run run test:e2e.dump` - generates the `test/E2ERunner.html` file which can by executed in the browser environment (Chrome, Firefox etc.) to check if tests passes.
- `npm run run test:e2e.dump -- --watch` - generates the `E2ERunner.html` file on every change detected in test files. It can be helpful for debugging proposes.

## Test specific themes
To run the E2E tests with a theme different than "classic", you can use the `--theme` flag.
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

## Related guides

<div class="boxes-list gray">

- [Building](@/guides/tools-and-building/custom-builds/custom-builds.md)

::: only-for javascript

- [Packages](@/guides/tools-and-building/packages/packages.md)

:::

</div>
