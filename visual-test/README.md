Install by command `npm install`
Install browsers `npx playwright install`
Launch test by command `npx playwright test`
After test snapshots will appear in `tests/{{ test }}/snapshots` folder

Is you want to make screenshot, just copy-paste this line anywhere:
`await page.screenshot({ path: screenshotFilePath(screenshots += 1, workerInfo) });`
It will take care about names and path automatically.
If you want to make screenshot of specific element, just put locator instead of `page`, e.g.:
`await dropdownMenu.screenshot({ path: screenshotFilePath(screenshots += 1, workerInfo) });`