const puppeteer = require('puppeteer');
const http = require('http');
const ecstatic = require('ecstatic');
const JasmineReporter = require('jasmine-terminal-reporter');

const PORT = 8086;
const DEFAULT_INACTIVITY_TIMEOUT = 10000;

const [,, originalPath, flags] = process.argv;
let path = originalPath;

if (!originalPath) {
  /* eslint-disable no-console */
  console.log('The `path` argument is missing.');

  return;
}

if (flags) {
  const seed = flags.match(/(--seed=)\d{1,}/g);
  const random = flags.includes('random');
  const params = [];

  if (seed) {
    params.push(`seed=${seed[0].replace('--seed=', '')}`);
  }
  if (seed || random) {
    params.push('random=true');
  }

  path = `${path}?${params.join('&')}`;
}

const cleanupFactory = (browser, server) => async(exitCode) => {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
  process.exit(exitCode);
};

(async() => {
  const browser = await puppeteer.launch({
    timeout: DEFAULT_INACTIVITY_TIMEOUT,
    // devtools: true, // Turn it on to debug the tests.
    headless: false,
    // Puppeteer by default hide the scrollbars in headless mode (https://github.com/GoogleChrome/puppeteer/blob/master/lib/Launcher.js#L86).
    // To prevent this the custom arguments are provided.
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless', '--disable-gpu', '--mute-audio'],
  });

  const page = await browser.newPage();
  // To emulate slower CPU you can uncomment next two lines. Docs: https://chromedevtools.github.io/devtools-protocol/tot/Emulation#method-setCPUThrottlingRate
  // const client = await page.target().createCDPSession();
  // await client.send('Emulation.setCPUThrottlingRate', { rate: 2 });

  page.setCacheEnabled(false);
  page.setViewport({
    width: 1200,
    height: 1000,
  });

  const server = http.createServer(ecstatic({
    root: `${__dirname}/../..`,
    showDir: true,
    autoIndex: true,
  }));
  const cleanup = cleanupFactory(browser, server);

  server.listen(PORT);

  const reporter = new JasmineReporter({
    colors: 1,
    cleanStack: 1,
    verbosity: 4,
    listStyle: 'flat',
    activity: true,
    isVerbose: false,
    includeStackTrace: true,
  });
  let errorCount = 0;

  await page.exposeFunction('jasmineStarted', (specInfo) => {
    if (specInfo.order.random) {
      process.stdout.write(`Randomized with seed ${specInfo.order.seed}\n`);
    }

    reporter.jasmineStarted(specInfo);
  });
  await page.exposeFunction('jasmineSpecStarted', () => {});
  await page.exposeFunction('jasmineSuiteStarted', suite => reporter.suiteStarted(suite));
  await page.exposeFunction('jasmineSuiteDone', () => reporter.suiteDone());
  await page.exposeFunction('jasmineSpecDone', (result) => {
    if (result.failedExpectations.length) {
      errorCount += result.failedExpectations.length;
    }
    reporter.specDone(result);
  });
  await page.exposeFunction('jasmineDone', async() => {
    reporter.jasmineDone();

    await cleanup(errorCount === 0 ? 0 : 1);
  });

  page.on('pageerror', async(msg) => {
    /* eslint-disable no-console */
    console.log(msg);
    await cleanup(1);
  });

  try {
    await page.goto(`http://localhost:${PORT}/${path}`);
  } catch (error) {
    /* eslint-disable no-console */
    console.log(error);
    cleanup(1);
  }
})();
