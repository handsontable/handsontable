Install by command `npm install`
Install browsers by command `npx playwright install`

Test file must have `.spec.js` in the name of file.
Test files must be stored in `tests` folder  (it can contain subfolders).

Launch by command `npm run test` to run all of tests with all of wrappers in all of browsers.
Launch by command `npm run upload` to upload all of screenshots (it doesn't work on local yet - only CI currently).
Launch by command `npx playwright test {{ name of file }}` in `./visual-test` folder to run specific test, e.g. `npx playwright test mouse-wheel`

After test screenshots will appear in `tests/screenshots`.

Is you want to make screenshot, just copy-paste this line anywhere:
`await page.screenshot({ path: helpers.screenshotPath() });`
From now it will take care about names, browsers, wrappers and path automatically.
If you want to make screenshot of specific element, just put locator instead of `page`, e.g.:
`await dropdownMenu.screenshot({ path: helpers.screenshotPath() });`