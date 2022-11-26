Install by command `npm install`
Install browsers by command `npx playwright install`

Launch test by command `npx playwright test` to launch all of tests from folder `tests`
Launch by command `npx playwright test {{ name of file from folder tests without .spec.js }}` to run specific test, e.g. `npx playwright test mouse-wheel`

After test screenshots will appear in `tests/screenshots`

Is you want to make screenshot, just copy-paste this line anywhere:
`await page.screenshot({ path: helpers.screenshotPath() });`
It will take care about names and path automatically.
If you want to make screenshot of specific element, just put locator instead of `page`, e.g.:
`await dropdownMenu.screenshot({ path: helpers.screenshotPath() });`