# Handsontable visual testing

To avoid unintended changes to Handsontable's UI, we use visual regression testing.

## Overview

We run visual tests automatically by using the following tools:

| Tool                                                                   | Description                                                                                                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Playwright](https://playwright.dev/docs/intro)                        | An open-source testing framework backed by Microsoft. We use it to write and run visual tests.                                                          |
| [Argos](https://argos-ci.com/docs/visual-testing)                      | An external visual testing service. We use it to compare screenshots.                                                                                   |
| [GitHub Actions](https://github.com/handsontable/handsontable/actions) | GitHub's CI platform. We use it to automate our [test workflows](https://github.com/handsontable/handsontable/blob/develop/.github/workflows/test.yml). |

When you push changes to a GitHub pull request:
1. The [Visual tests linter](https://github.com/handsontable/handsontable/actions/workflows/visual-tests-linter.yml)
   workflow checks the code of each visual test.
2. The [Tests](https://github.com/handsontable/handsontable/blob/develop/.github/workflows/test.yml) workflow runs all
   of Handsontable's tests.
3. After all tests pass successfully, the [Visual tests](https://github.com/handsontable/handsontable/blob/develop/.github/workflows/test.yml#L432-L502)
   job runs the visual tests and uploads the resulting screenshots to Argos.
4. Argos compares your feature branch screenshots against the reference branch (`develop`) screenshots
   (so-called "reference", "baseline" or "golden" screenshots).

If Argos spots differences between two corresponding screenshots,
the **Visual tests** check on on your pull request fails, and you can't merge your changes to `develop`. In that case:
1. Open the log of the **Visual tests** job:<br>
   At the bottom of your pull request, find the **Visual tests** check. Select **Details**.
2. Open the Argos URL and [review the differences](https://argos-ci.com/docs/visual-testing#reviewing-visual-changes).
   You can:
      - [Reject the modified screenshots](https://argos-ci.com/docs/visual-testing#-reject-a-build-workflow), update your code,
        and [re-run the visual tests](#run-visual-tests-through-github-actions).
      - [Accept the modified screenshots](https://argos-ci.com/docs/visual-testing#-approving-a-build).
        You can then merge your changes to `develop`.
        As a result, the modified screenshots become the new baseline.

## Visual tests structure

Visual tests are divided into:

   - multi-frameworks: tests run on Chromium using classic, horizon, horizon-dark, main and main-dark themes against Handsontable instance created in:
      - Vanilla JS
      - Angular
      - React
      - React (functional)
      - Vue 2
      - Vue 3
   - cross-browser: tests run against vanilla JS Handsontable instance using:
      - Chromium
      - Firefox
      - Webkit

   There is a separate Playwright config for cross-browser tests: `playwright-cross-browser.config.ts`

## Visual tests demos

All the test examples are available at `examples/next/visual-tests` and configured to be served from `localhost:8082`

There main demo available for all frameworks is served on `/`. There are additional demos available only for vanilla JS (to be used with cross-browser tests):

- `/cell-types-demo`,
- `/arabic-rtl-demo`,
- `/custom-style-demo`,
- `/merged-cells-demo`,
- `/nested-headers-demo`,
- `/nested-rows-demo`,

## Run visual tests through GitHub Actions

Our GitHub Actions configuration runs the visual tests automatically, but you can run them manually as well:

1. On GitHub, at the bottom of your pull request, find the **Visual tests** check. Select **Details**.
2. On the left, next to the **Visual tests** job, select 🔄.
3. Select **Re-run jobs**.

## Run visual tests locally

You can manually run visual tests on your machine and then upload the resulting screenshots to Argos.

First, prepare your local visual testing environment:

1. Make sure you're using the Node and npm versions mentioned [here](https://handsontable.com/docs/react-data-grid/custom-builds/#build-requirements).
2. From the `./visual-tests/` directory, run `npm install`.
3. In the `./visual-tests/` directory, create a file called `.env`. In the file, add the Argos token:
   ```bash
   ARGOS_TOKEN=xxx
   ```
   Ask your supervisor about the token's value.

To run the visual tests locally:

1. From the `./visual-tests/` directory, run one of the following commands:
   | Command                               | Action                                                                                             |
   | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
   | `npm run test`                        | Run multi-framework visual tests,<br>for all the configured frameworks,<br>using Chromium only. |
   | `npm run test:cross-browser`                        | Run cross-browser visual tests,<br>using vanilla JS framework,<br>for all the supported browsers. <br> You can pass the test name to run a single cross-browser test: `npm run test:cross-browser borders`|
   | `npx playwright test {{ file name }}` | Run a specific test.<br><br>For example: `npx playwright test mouse-wheel`                         |

   The resulting screenshots are saved in `./visual-tests/screenshots/`.
2. From the `./visual-tests/` directory, run `npm run upload`.
3. Open the Argos URL displayed in the terminal.

## Write a new visual test

To add a new visual test:

1. On your machine, in the `./visual-tests/tests/` directory, create a new `.spec.ts` file.<br>
   Give your file a descriptive name. This name is later used in test logs and screenshot names.
      - ✅ Good: `open-dropdown-menu.spec.ts`.
      - ❌ Bad: `my-test-1.spec.ts`.
2. Copy the template code from `./visual-tests/tests/.empty-test-template.ts` into your file.
3. Write your test. For more information, see:
      - [Playwright's docs](https://playwright.dev/docs/writing-tests)
      - [Helpers](#helpers)
      - [Take screenshots](#take-screenshots)
4. Push your changes to a pull request.<br>
   The [Visual tests linter](https://github.com/handsontable/handsontable/actions/workflows/visual-tests-linter.yml)
   workflow checks the code of your test.

### Take screenshots

To capture a [screenshot](https://playwright.dev/docs/screenshots) and save it to a file,
add this line anywhere in your test:

```js
await page.screenshot({ path: helpers.screenshotPath() });
```

In each test, you can take as many screenshots as you want. For example:

```js
await cell.click();
await page.screenshot({ path: helpers.screenshotPath() });
await anotherCell.click();
await page.screenshot({ path: helpers.screenshotPath() });
```

To take a screenshot of a specific element of Handsontable,
use Playwright's [`locator()`](https://playwright.dev/docs/locators#locate-by-css-or-xpath) method. For example:

```js
const dropdownMenu = page.locator(helpers.selectors.dropdownMenu);

await dropdownMenu.screenshot({ path: helpers.screenshotPath() });
```

For cross-browser tests we are using
```js
  await page.screenshot({ path: helpers.screenshotMultiUrlPath(testFileName, url, suffix) });
```
for easier screenshot identification.

### Helpers

To write tests faster, use the custom helper functions and variables stored in the `./visual-tests/src/helpers.ts` file.

#### `modifier`

Returns the current modifier key: `Ctrl` for Windows or `Meta` for Mac.

```js
// copy the contents of the selected cell
await page.keyboard.press(`${helpers.modifier}+c`);
```

#### `isMac`

Returns `true` if the test runs on Mac.

```js
if (helpers.isMac) {
  // do something
}
```

#### `findCell()`

Returns the specified cell.

Syntax: `findCell({ row: number, cell: number, cellType: 'td / th' })`.

```js
const cell = helpers.tbody.locator(helpers.findCell({ row: 2, cell: 2, cellType: 'td' }));

await cell.click();
```

#### `findDropdownMenuExpander()`

Returns the button that expands the dropdown menu
(also known as [column menu](https://handsontable.com/docs/react-data-grid/column-menu/)) of the specified column.

Syntax: `findDropdownMenuExpander({ col: number })`.

```js
// select the column menu button of the second column
const changeTypeButton = table.locator(helpers.findDropdownMenuExpander({ col: 2 }));

await changeTypeButton.click();
```
