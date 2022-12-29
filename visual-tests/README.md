Install by command `npm install`

### Usage

Type `run docker:run` in console to launch Playwright's Docker image.
Launch by command `npm run test` to run all of tests with all of wrappers in all of browsers.
Launch by command `npm run upload` to upload all of screenshots.
Launch by command `npm run all` to run tests and upload files.
NOTE: uploading doesn't work on local yet - only CI currently.
Launch by command `npx playwright test {{ name of file }}` to run specific test, e.g. `npx playwright test mouse-wheel`
Type `exit` to exit Docker.

After test screenshots will appear in `tests/screenshots`.
We use external service for screen comparision (currently it's Argos) - after upload you can find URL to your images in console or Github Actions logs as a result of `Visual testing - upload` job.
Argos compares screenshots from your branch with base branch (currently it is `develop`).
If you open Pull Request and try to merge to the base branch, you will be informed in Github checks section if there are detected some differences between images and merge will be not possible until fix or decision that differences were expected (in Argos there is option `Accept this build`).

### Writing tests

In `tests` folder there is file `.empty-test-template.js` - copy-paste it if you want to add new test, it will make some configuration things faster. There is marked place for your code also.

Test file must have `.spec.js` in the name of file.
Test files must be stored in `tests` folder.
Test filename should describe as much as possible what test is doing - it will be used as a title in logs and in screenshots names, you do not have to define them manually anymore. Example: `./tests/open-dropdown-menu.spec.js`.

Is you want to make screenshot, just copy-paste this line anywhere:
`await page.screenshot({ path: helpers.screenshotPath() });`
From now it will take care about names, browsers, wrappers and path automatically.
If you want to make screenshot of specific element, just put given locator instead of `page`, e.g.:
`await dropdownMenu.screenshot({ path: helpers.screenshotPath() });`