import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http-server';
import JasmineReporter from 'jasmine-terminal-reporter';

const PORT = 8086;
const IS_CI = process.env.CI;
const CI_DOTS_PER_LINE = 120;

const [,, originalPath, flags] = process.argv;
let htmlPath = originalPath;
let verboseReporting = false;

if (!originalPath) {
  /* eslint-disable no-console */
  console.log('The `path` argument is missing.');
  process.exit(1);
}

if (flags) {
  const seed = flags.match(/(--seed=)\d{1,}/g);
  const random = flags.includes('random');
  const params = [];

  verboseReporting = flags.includes('verbose');

  if (seed) {
    params.push(`seed=${seed[0].replace('--seed=', '')}`);
  }
  if (seed || random) {
    params.push('random=true');
  }

  htmlPath = `${htmlPath}?${params.join('&')}`;
}

const cleanupFactory = (browser, server) => async(exitCode) => {
  await browser.close();
  server.close();
  process.exit(exitCode);
};

const browser = await puppeteer.launch({
  // devtools: true, // Turn it on to debug the tests.
  headless: false,
  // Puppeteer by default hide the scrollbars in headless mode (https://github.com/GoogleChrome/puppeteer/blob/master/lib/Launcher.js#L86).
  // To prevent this the custom arguments are provided.
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless', '--disable-gpu', '--mute-audio'],
});

console.log(`Started Puppeteer with version: ${await browser.version()}`);

const page = await browser.newPage();
const cdpClient = await page.createCDPSession();
// To emulate slower CPU you can uncomment next two lines. Docs: https://chromedevtools.github.io/devtools-protocol/tot/Emulation#method-setCPUThrottlingRate
// await cdpClient.send('Emulation.setCPUThrottlingRate', { rate: 2 });

page.setCacheEnabled(false);
page.setViewport({
  width: 1280,
  height: 720,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(`${__dirname}`, '../../..');

const server = createServer({
  root: rootPath,
  showDir: true,
  autoIndex: true,
});
const cleanup = cleanupFactory(browser, server);

server.listen(PORT);

const reporter = new JasmineReporter({
  colors: 1,
  cleanStack: 1,
  verbosity: 4,
  listStyle: 'flat',
  activity: true,
  isVerbose: verboseReporting,
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

  // Break the "dots" output into same-lenghed lines if on CI.
  if (IS_CI) {
    const dotIndex = parseInt(result.id.replace('spec', ''), 10);

    if (dotIndex > 0 && (dotIndex + 1) % CI_DOTS_PER_LINE === 0) {
      process.stdout.write('\n');
    }
  }
});
await page.exposeFunction('jasmineDone', async() => {
  reporter.jasmineDone();

  await cleanup(errorCount === 0 ? 0 : 1);
});

await page.exposeFunction('getEventListeners', async (selector) => {
  const { root } = await cdpClient.send('DOM.getDocument');
  const { nodeId } = await cdpClient.send('DOM.querySelector', {
      nodeId: root.nodeId,
      selector,
  });
  const resolvedNode = await cdpClient.send('DOM.resolveNode', { nodeId });

  return await cdpClient.send('DOMDebugger.getEventListeners', {
    objectId: resolvedNode.object.objectId
  });
});

page.on('pageerror', async(msg) => {
  /* eslint-disable no-console */
  console.log(msg);
  await cleanup(1);
});

const packagePath = path.relative(rootPath, process.cwd());

try {
  await page.goto(`http://localhost:${PORT}/${packagePath}/${htmlPath}`);
} catch (error) {
  /* eslint-disable no-console */
  console.log(error);
  cleanup(1);
}
