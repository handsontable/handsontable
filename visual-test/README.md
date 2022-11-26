Install by command `npm install`
Install browsers by command `npx playwright install`

Test file must have `.spec.js` in the name of file.
Test files must be stored in `tests` folder  (it can contain subfolders).
Launch by command `npx playwright test` to run all of tests.
Launch by command `npx playwright test {{ name of file }}` to run specific test, e.g. `npx playwright test mouse-wheel`

After test screenshots will appear in `tests/screenshots`.

Is you want to make screenshot, just copy-paste this line anywhere:
`await page.screenshot({ path: helpers.screenshotPath() });`
From now it will take care about names and path automatically.
If you want to make screenshot of specific element, just put locator instead of `page`, e.g.:
`await dropdownMenu.screenshot({ path: helpers.screenshotPath() });`