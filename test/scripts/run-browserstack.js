/* eslint-disable no-console */

const { Builder, By } = require('selenium-webdriver');
const http = require('http');
const ecstatic = require('ecstatic');
const browserstack = require('browserstack-local');

const bsLocal = new browserstack.Local();

const startBrowserstackLocal = async() => {
  return new Promise((resolve) => {
    bsLocal.start({ key: process.env.BROWSERSTACK_ACCESS_KEY, force: true, verbose: true }, () => {
      console.log('Started BrowserStackLocal');
      resolve();
    });
  });
};

const PORT = 8080;

const path = 'test/E2ERunner.html';

(async() => {
  await startBrowserstackLocal();

  const server = http.createServer(ecstatic({
    root: `${__dirname}/../..`,
    showDir: true,
    autoIndex: true,
  }));

  server.listen(PORT);

  const capabilities = {
    os: 'OS X',
    os_version: 'Catalina',
    browserName: 'Chrome',
    browser_version: '80.0',
    'browserstack.local': 'true',
    'browserstack.selenium_version': '3.5.2',
    'browserstack.user': process.env.BROWSERSTACK_USERNAME,
    'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
    name: 'Sample Test'
  };

  const driver = new Builder()
    .usingServer('http://hub-cloud.browserstack.com/wd/hub')
    .withCapabilities(capabilities)
    .build();
  await driver.manage().setTimeouts({ implicit: 1000 * 60 * 10 });

  let exitCode = 0;

  try {
    console.log('Starting the test');
    await driver.get(`http://localhost:${PORT}/${path}`);

    try {
      const webElement = await driver.findElement(By.css('.jasmine-bar'));
      const className = await webElement.getAttribute('class');
      if (className.indexOf('jasmine-errored') > -1) {
        // fail
        console.log('FAIL');
        // todo report by REST API using https://www.npmjs.com/package/browserstack
      } else {
        // success
        console.log('SUCCESS');
      }
    } catch (e) {
      console.log('TESTS DID NOT FINISH IN TIME');
    }

  } catch (e) {
    console.log('Problem with getting the URL');
    console.error(e);
    exitCode = 1;

  } finally {
    console.log('Finished testing, quitting the WebDriver');
    bsLocal.stop(async() => {
      await driver.quit();
      console.log('WebDriver quitted');
      process.exit(exitCode);
    });
  }
})();
