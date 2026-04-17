import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http-server';
import JasmineReporter from 'jasmine-terminal-reporter';

const DEFAULT_PORT = 8086;
const PORT_ATTEMPTS = 100;

/**
 * Binds `server` to the first free port starting at `startPort`. Uses a
 * bind-and-retry loop rather than a separate probe so there is no window in
 * which another process can grab the port between the check and the bind.
 *
 * @param {object} server The server to bind (a `net.Server`-compatible instance).
 * @param {number} startPort The preferred port to start from.
 * @returns {Promise<number>} The port the server is now listening on.
 */
function listenOnFreePort(server, startPort) {
  return new Promise((resolve, reject) => {
    let port = startPort;

    const attempt = () => {
      let handleError;
      const handleListening = () => {
        server.off('error', handleError);
        resolve(port);
      };

      handleError = (err) => {
        server.off('listening', handleListening);

        if (err.code === 'EADDRINUSE' && port < startPort + PORT_ATTEMPTS - 1) {
          port += 1;
          attempt();

          return;
        }
        reject(err);
      };

      server.once('error', handleError);
      server.once('listening', handleListening);
      server.listen(port);
    };

    attempt();
  });
}

const IS_CI = process.env.CI;
const CI_DOTS_PER_LINE = 120;

const [,, originalPath, ...flagArgs] = process.argv;
const flags = flagArgs.join(' ');
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
  const hotVersionMatch = flags.match(/--hotVersion=([^\s,]+)/);
  const params = [];

  verboseReporting = flags.includes('verbose');

  if (seed) {
    params.push(`seed=${seed[0].replace('--seed=', '')}`);
  }
  if (seed || random) {
    params.push('random=true');
  }
  if (hotVersionMatch) {
    params.push(`hotVersion=${hotVersionMatch[1]}`);
  }

  htmlPath = `${htmlPath}?${params.join('&')}`;
}

const cleanupFactory = (browser, server) => async(exitCode) => {
  await browser.close();
  server.close();
  process.exit(exitCode);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(`${__dirname}`, '../../..');

const server = createServer({
  root: rootPath,
  showDir: true,
  autoIndex: true,
});

const PORT = await listenOnFreePort(server, DEFAULT_PORT);

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

const cleanup = cleanupFactory(browser, server);

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

await page.exposeFunction('getEventListeners', async(selector) => {
  const { root } = await cdpClient.send('DOM.getDocument');
  const { nodeId } = await cdpClient.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector,
  });
  const resolvedNode = await cdpClient.send('DOM.resolveNode', { nodeId });

  return cdpClient.send('DOMDebugger.getEventListeners', {
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
