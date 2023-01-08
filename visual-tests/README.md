## Installation

Install by command `npm install` in `./visual-tests` folder.
Launch `npm run vtests:docker:build` in main project directory or `npm run docker:build` in `./visual-tests` directory to build Docker image.

## Usage

In Github `Visual tests` workflow is launched automatically after `Tests` workflow passed succesfully. In local environment you have to launch it manually.

## Testing

Launch `npm run vtests:test` in main directory or `npm run test` in `./visual-tests` directory to run all of tests with all of wrappers in all of browsers.
Launch by command `npx playwright test {{ name of file }}` in `./visual-tests` directory to run specific test, e.g. `npx playwright test mouse-wheel`

Launch `npm run vtests:docker:build` in main project directory or `npm run docker:build` in `./visual-tests` directory to build Docker image. After tests screenshots will appear in `./visual-tests/tests/screenshots`.

## Upload and compare screenshots

For the screen comparision we use external service (currently it's Argos CI). Argos CI compares screenshots from your branch with the base branch (which currently is `develop`).

In Github screenshots are uploaded automatically after every test. 
In local environment upload won't work until you create `.env` file in `./visual-tests/` directory and set variable `ARGOS_TOKEN` there - ask your teammates or supervisor for its value.

```
ARGOS_TOKEN=xxx
```

After that launch `npm run vtests:upload` in main directory or `npm run upload` in `./visual-tests` directory to upload all of screenshots. Do not worry, you will not overwrite anything - uploading golden screenshots from base branch (if nothing changed in a meanwhile it's `develop`) is not possible on local environment.

After upload you can find URL to your set of images in console or Github Actions logs as a result of `Visual testing - upload` job.

If you open Pull Request and try to merge to the base branch, you will be informed in Github `checks` section if there are detected some differences between images and merge will be not possible until fix or decision that differences were expected (in Argos there is option `Accept this build`).

## Writing tests

In `tests` folder there is file `.empty-test-template.js` - copy-paste it if you want to add new test, it will make some configuration things faster. There is marked place for your code also.

Test file must have `.spec.js` in the name of file.
Test files must be stored in `tests` folder.
Test filename should describe as much as possible what test is doing - it will be used as a title in logs and in screenshots names, you do not have to define them manually anymore. Example: `./tests/open-dropdown-menu.spec.js`.

## Making screenshots

If you want to make screenshot, just copy-paste this line anywhere:
`await page.screenshot({ path: helpers.screenshotPath() });`
From now it will take care about names, browsers, wrappers and paths automatically.

You can make as much screenshots per test as needed (it can be 0 also - we still can test anything without screenshots too), for example:

```
await cell.click();
await page.screenshot({ path: helpers.screenshotPath() });
await anotherCell.click();
await page.screenshot({ path: helpers.screenshotPath() });
```

If you want to make screenshot of specific element, just use given locator instead of `page`, e.g.:

```
const dropdownMenu = page.locator(helpers.selectors.dropdownMenu);
await dropdownMenu.screenshot({ path: helpers.screenshotPath() });
```

## Helpers

There are prepared few helpers, you can find them in `/imports/helpers`. Helpers are loaded automatically (if you use `.empty-test-template` file). Not all of them will be necessary for you in writing tests, but for sure few of them would make work easier:

### modifier
Returns modifier key - CTRL / Meta depending on system. It can be useful e.g. if you want to copy-paste something.

Example:
```
// copy cell content
await page.keyboard.press(`${helpers.modifier}+c`);
```

### isMac
Returns information if test is launched on Mac or not.

Example:
```
if (helpers.isMac) {
  // do something
}
```

### findDropdownMenuExpander({ col: number })
Returns button to expand dropdown menu in column specified by number.

Example:
```
const changeTypeButton = table.locator(helpers.findDropdownMenuExpander({ col: 2 }));
await changeTypeButton.click();
```

### findCell(options = { row: number, cell: number, cellType: 'td / th' }) {
Returns given cell in main table. You can specify row, column and type of cell `td` or `th`.

Example:
```
const cell = helpers.tbody.locator(helpers.findCell({ row: 2, cell: 2, cellType: 'td' }));
await cell.click();
```

## External docs:
As a testing tool we decided to use Playwright: https://playwright.dev/docs/intro
As a service comparing screenshots we have chosen Argos: https://argos-ci.com/docs/visual-testing
