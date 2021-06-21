---
title: Testing process
metaTitle: Testing process - Guide - Handsontable Documentation
permalink: /next/testing
canonicalUrl: /testing
tags:
  - Jasmine
  - CLI
  - unit test
  - end to end test
  - puppeteer
  - spec
  - 
---

# Testing process

[[toc]]

## Testing in browser

To run the Jasmine tests in your browser, go to the following pages:

* **<YOUR\_LOCALHOST\_ADDRESS>/test/E2ERunner.html** - Handsontable end-to-end test suite
* **<YOUR\_LOCALHOST\_ADDRESS>/test/MobileRunner.html** - Handsontable mobile test suite
* **<YOUR\_LOCALHOST\_ADDRESS>/src/3rdparty/walkontable/test/SpecRunner.html** - Walkontable test suite

## Testing with NPM (CLI)

To run Jasmine tests in your command line (using Puppeteer), first install all necessary dependencies by executing `npm install`. After the `NPM` finishes fetching required modules your workspace is ready to test.

* `npm test` - runs all test cases (Handsontable and Walkontable).
* `npm test:unit` - runs all unit tests.
* `npm test:walkontable` - runs only Walkontable tests.
* `npm test:e2e` - runs all end-to-end tests.
* `npm run test:e2e --testPathPattern=selection` - runs only end-to-end tests and suites matching the filename "selection".
* `npm run test:unit --testPathPattern=array` - runs only end-to-end tests and suites matching the filename "array".
* `npm run test:e2e.dump` - generates the `test/E2ERunner.html` file which can by executed in the browser environment (Chrome, Firefox etc.) to check if tests passes.
* `npm run test:e2e.dump -- --watch` - generates the `E2ERunner.html` file on every change detected in test files. It can be helpful for debugging proposes.

## Testing the framework-specific wrappers.

The wrappers contain their own framework-specific testing environments. You can either run the `npm run test` script inside of the wrapper directory, or utilize the `npm run in`/`npm run all` scripts to run the tests from the root.

Keep in mind that running wrapper tests require building the Handsontable (`npm run build`). Once built the wrapper can consume its main dependency. Otherwise, tests will fail.

## Environments settings

* Due to Puppeteer's `setViewer` settings, the size of the window's browser should be at least 1280px wide and 720px tall.
* The scrollbars should be visible. The size of the scrollbar affects `clientWidth` and `clientHeight`, which can interfere visibility and the number of columns and rows.
* The browser window running the test should be on top. Some tests will not pass while running in the background.
* Focus should be on the browser window and the mouse should be still. Moving the mouse or losing focus on the window can interfere with the tests, causing them not to pass.
