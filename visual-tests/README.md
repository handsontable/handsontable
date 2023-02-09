# Handsontable visual testing

To avoid unintended changes to Handsontable's UI, we use visual regression testing.

## Overview

We run visual tests automatically by using the following tools:

| Tool                                                                   | Description                                                                                                                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [Playwright](https://playwright.dev/docs/intro)                        | An open-source testing framework backed by Microsoft. We use it to write and run visual tests.                                                  |
| [Argos](https://argos-ci.com/docs/visual-testing)                      | An external visual testing service. We use it to compare screenshots.                                                                           |
| [GitHub Actions](https://github.com/handsontable/handsontable/actions) | A CI platform. We use it to automate our [test workflow](https://github.com/handsontable/handsontable/blob/develop/.github/workflows/test.yml). |

On pushing a commit to a pull request's feature branch:
1. The [Visual tests Linter](https://github.com/handsontable/handsontable/actions/workflows/visual-tests-linter.yml)
   workflow checks the code of each visual test.
2. The [Tests](https://github.com/handsontable/handsontable/blob/develop/.github/workflows/test.yml) workflow runs all
   of Handsontable's tests.
3. If all the tests pass successfully, the [Visual tests](https://github.com/handsontable/handsontable/blob/develop/.github/workflows/test.yml#L432-L502) job runs the visual tests and uploads the resulting screenshots to Argos.<br>
   You can find the Argos URL in the logs of the [Tests](https://github.com/handsontable/handsontable/blob/develop/.github/workflows/test.yml) workflow.
4. Argos compares the feature branch screenshots against the `develop` branch screenshots (so-called "golden screenshots").
5. If Argos detects differences between the screenshots, the **Visual tests** check in GitHub prevents you from merging the PR.
   You can either fix the issue, or accept the changes in Argos.

## Run visual tests through GitHub Actions

Our GitHub Actions configuration runs the visual tests automatically, but you can run them manually as well:

1. On GitHub, at the bottom of your PR, find the **Visual tests** check. Select **Details**.
2. On the left, next to the **Visual tests** job, select 🔄.
3. Select **Re-run jobs**.

## Run visual tests locally

You can manually run visual tests on your machine and then upload the resulting screenshots to Argos.

First, prepare your visual testing environment:

1. Make sure your [Docker Desktop](https://www.docker.com/products/docker-desktop/) app is running.
2. Make sure you're using the Node and npm versions mentioned [here](https://handsontable.com/docs/react-data-grid/custom-builds/#build-requirements).
3. From the `./visual-tests/` directory, run `npm install`.
4. In the `./visual-tests/` directory, create a file called `.env`. In the file, add the Argos token:
   ```bash
   ARGOS_TOKEN=xxx
   ```
   Ask your supervisor about the token's value.

To run the visual tests locally:

1. From the `./visual-tests/` directory, run one of the following commands:
   | Command                               | Action                                                                                             |
   | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
   | `npm run test`                        | Run all the visual tests,<br>for all the configured frameworks,<br>for all the supported browsers. |
   | `npx playwright test {{ file name }}` | Run a specific test.<br><br>For example: `npx playwright test mouse-wheel`                         |

   The resulting screenshots are saved in `./visual-tests/screenshots/`.
2. From the `./visual-tests/` directory, run `npm run upload`.
3. Open the Argos URL displayed in the terminal.

## Add visual tests

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
4. Keep your file in the `./visual-tests/tests/` directory.

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