import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { createServer } from 'http-server';
import JasmineReporter from 'jasmine-terminal-reporter';

const require = createRequire(import.meta.url);
const { computeRunId, readRunIdInputsFromEnv } = require('../../.config/helper/run-id');

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
  // `http-server`'s wrapper object proxies `.listen()` and `.close()` but does
  // not forward events. The real `http.Server` lives on `.server` -- attach
  // listeners there.
  const emitter = server.server || server;

  return new Promise((resolve, reject) => {
    let port = startPort;

    const attempt = () => {
      let handleError;
      const handleListening = () => {
        emitter.off('error', handleError);
        resolve(port);
      };

      handleError = (err) => {
        emitter.off('listening', handleListening);

        if (err.code === 'EADDRINUSE' && port < startPort + PORT_ATTEMPTS - 1) {
          port += 1;
          attempt();

          return;
        }
        reject(err);
      };

      emitter.once('error', handleError);
      emitter.once('listening', handleListening);
      server.listen(port);
    };

    attempt();
  });
}

const IS_CI = process.env.CI;
const IS_TTY = process.stdout.isTTY;
const CI_DOTS_PER_LINE = 120;

// Separate positional args (runner HTML path) from flag args (--random,
// --verbose, --seed=..., --hotVersion=...). Without this split, a flag-only
// invocation like `test:e2e.puppeteer -- --random` would treat `--random`
// as the HTML path.
const allArgs = process.argv.slice(2);
const argvPath = allArgs.find(arg => !arg.startsWith('-'));
const flagArgs = allArgs.filter(arg => arg.startsWith('-'));
const flags = flagArgs.join(' ');

// Resolve which HTML runner to open. An explicit argv path wins (used by the
// watch script and dev tooling). Without it, fall back to the per-run HTML
// emitted by `test:e2e.dump`, whose filename is derived from the same
// `--testPathPattern` + `--theme` inputs so parallel runs don't collide.
const runIdInputs = readRunIdInputsFromEnv();
const originalPath = argvPath || `test/E2ERunner-${computeRunId(runIdInputs)}.html`;
let htmlPath = originalPath;
let verboseReporting = false;

// Fail fast if the runner HTML is missing. Without this, `page.goto` receives
// a 404/directory listing and Jasmine never starts -- the process would hang
// silently after the "Started Puppeteer" line.
if (!fs.existsSync(originalPath)) {
  /* eslint-disable no-console */
  console.log(
    `Runner HTML not found at ${originalPath}. Did \`test:e2e.dump\` run with the same `
    + '`--testPathPattern` / `--theme` values?'
  );
  process.exit(1);
}

verboseReporting = flags.includes('verbose');

if (flags) {
  const seed = flags.match(/(--seed=)\d{1,}/g);
  const random = flagArgs.includes('--random');
  const hotVersionMatch = flags.match(/--hotVersion=([^\s,]+)/);
  const params = [];

  verboseReporting = flagArgs.includes('--verbose');

  if (seed) {
    params.push(`seed=${seed[0].replace('--seed=', '')}`);
  }
  if (seed || random) {
    params.push('random=true');
  }
  if (hotVersionMatch) {
    params.push(`hotVersion=${hotVersionMatch[1]}`);
  }

  // Support --spec=<pattern> to filter test files at runtime (e.g., --spec=i18n or --spec="i18n/index").
  const specFlag = flagArgs.find(a => a.startsWith('--spec='));

  if (specFlag) {
    const specPattern = specFlag.replace('--spec=', '');

    params.push(`spec=${encodeURIComponent(specPattern)}`);
    console.log(`Filtering tests with pattern: ${specPattern}`);
  }

  if (params.length > 0) {
    htmlPath = `${originalPath}?${params.join('&')}`;
  }
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
console.log(
  `Runner: ${originalPath} (testPathPattern: ${runIdInputs.testPathPattern || '<all>'},`
  + ` theme: ${runIdInputs.theme})`
);

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
  verbosity: (IS_TTY && !verboseReporting) ? 1 : 4,
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

page.on('console', (msg) => {
  if (msg.text().startsWith('DEBUG')) {
    /* eslint-disable no-console */
    console.log('[BROWSER]', msg.text());
  }
});

const packagePath = path.relative(rootPath, process.cwd());

try {
  await page.goto(`http://localhost:${PORT}/${packagePath}/${htmlPath}`);
} catch (error) {
  /* eslint-disable no-console */
  console.log(error);
  await cleanup(1);
}
