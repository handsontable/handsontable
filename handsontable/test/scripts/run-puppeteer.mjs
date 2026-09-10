import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { createServer } from 'http-server';
import JasmineReporter from 'jasmine-terminal-reporter';
import {
  ISOLATION_PROBE_MAX_FILES,
  annotationLines,
  describeVerdict,
  failedFiles,
  formatPageErrorAnnotation,
  renderSummary,
  specFileFilter,
  toFailedSpec,
  toRecord,
} from './lib/failed-specs.mjs';

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
// A failing spec file re-run alone that takes longer than this is reported as
// unprobeable instead of hanging the job.
const ISOLATION_PROBE_TIMEOUT_MS = 5 * 60 * 1000;
// Where a red run leaves its failed-specs record (gitignored; CI uploads it).
const RESULTS_DIR = 'test/e2e-results';

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
  // Jasmine's boot reads the same `spec` parameter as a filter on spec names, so the pattern has to
  // match both a file path and the names of the specs in it. --specFile=<pattern> filters the files
  // only (e.g. --specFile="core/alter\.spec\.js$"), which is what re-running one file alone needs.
  const specFlag = flagArgs.find(a => a.startsWith('--spec='));
  const specFileFlag = flagArgs.find(a => a.startsWith('--specFile='));

  if (specFlag) {
    const specPattern = specFlag.replace('--spec=', '');

    params.push(`spec=${encodeURIComponent(specPattern)}`);
    console.log(`Filtering tests with pattern: ${specPattern}`);
  }
  if (specFileFlag) {
    const specFilePattern = specFileFlag.replace('--specFile=', '');

    params.push(`specFile=${encodeURIComponent(specFilePattern)}`);
    console.log(`Filtering spec files with pattern: ${specFilePattern}`);
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
const packagePath = path.relative(rootPath, process.cwd());
const runnerUrl = query => `http://localhost:${PORT}/${packagePath}/${originalPath}${query}`;
// The main run's query (`seed`, `random`, `hotVersion`, `spec`), carried into
// the probe runs minus the ordering flags: a file re-run alone runs in its
// natural order, so the verdict describes the file, not one shuffle of it.
// `specFile` (the file filter) is replaced with the probed file's own.
const mainQuery = htmlPath.slice(originalPath.length + 1);
const leg = process.env.HOT_E2E_LEG
  ? `${process.env.HOT_E2E_LEG} (theme: ${runIdInputs.theme})`
  : `theme: ${runIdInputs.theme}`;

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
// Every failed spec of the main run, as data. After the run their files are
// re-run alone (the isolation probe) and the report below names each of them.
const failedSpecs = [];
// 'main' while the whole runner page runs, 'probe' while one failing spec file
// is re-run alone. The bridge callbacks branch on it: a probe run only counts
// its specs and failures into `probe`, and the terminal reporter never sees it.
// `probe` is `null` between probes and after one gave up (timeout, page error):
// a callback that arrives then belongs to a document the probe no longer cares
// about, and is dropped rather than written into the next file's verdict.
let phase = 'main';
let probe = null;

await page.exposeFunction('jasmineStarted', (specInfo) => {
  if (phase === 'probe') {
    return;
  }
  if (specInfo.order.random) {
    process.stdout.write(`Randomized with seed ${specInfo.order.seed}\n`);
  }

  reporter.jasmineStarted(specInfo);
});
await page.exposeFunction('jasmineSpecStarted', () => {});
await page.exposeFunction('jasmineSuiteStarted', (suite) => {
  if (phase === 'main') {
    reporter.suiteStarted(suite);
  }
});
await page.exposeFunction('jasmineSuiteDone', () => {
  if (phase === 'main') {
    reporter.suiteDone();
  }
});
await page.exposeFunction('jasmineSpecDone', (result) => {
  if (phase === 'probe') {
    if (probe !== null) {
      probe.specs += 1;

      if (result.status === 'failed') {
        probe.failed += 1;
      }
    }

    return;
  }
  if (result.failedExpectations.length) {
    errorCount += result.failedExpectations.length;
  }
  if (result.status === 'failed') {
    failedSpecs.push(toFailedSpec(result));
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
  if (phase === 'probe') {
    if (probe !== null) {
      probe.resolve();
    }

    return;
  }
  reporter.jasmineDone();

  await finish();
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

// Overrides the device scale factor (emulates a non-100% browser zoom / fractional DPR) for the
// current page. Pass 1 (or a falsy value) to restore the default. Used by tests that must
// reproduce sub-pixel rendering bugs which only manifest when devicePixelRatio is not an integer.
//
// This goes through `page.setViewport` rather than a raw `Emulation.setDeviceMetricsOverride` /
// `clearDeviceMetricsOverride` pair on purpose: the CDP "clear" call would also drop Puppeteer's
// own viewport override (the width/height set at launch), reverting the window to the browser
// default size and breaking later specs that rely on the window as the scrollable element.
// `page.setViewport` keeps the current dimensions and only changes the scale factor.
await page.exposeFunction('setDeviceScaleFactor', async(scaleFactor) => {
  const viewport = page.viewport() ?? { width: 1280, height: 720 };

  await page.setViewport({
    ...viewport,
    deviceScaleFactor: scaleFactor || 1,
  });
});

page.on('pageerror', async(msg) => {
  if (phase === 'probe') {
    if (probe !== null) {
      probe.error = `page error: ${String(msg).split('\n')[0]}`;
      probe.resolve();
    }

    return;
  }
  /* eslint-disable no-console */
  console.log(msg);

  // An uncaught error aborts the whole run, so the specs after it never ran.
  // Say so on the checks tab, and keep what did fail before it. Whatever the
  // report does, the process must still exit 1: a throw here would be handed
  // to the page and leave the browser open until the job times out.
  try {
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.error(formatPageErrorAnnotation(String(msg), leg));
    }
    if (failedSpecs.length > 0) {
      report(new Map(), { aborted: true });
    }
  } catch (error) {
    console.error('The failure report could not be written:', error);
  } finally {
    await cleanup(1);
  }
});

page.on('console', (msg) => {
  if (msg.text().startsWith('DEBUG')) {
    /* eslint-disable no-console */
    console.log('[BROWSER]', msg.text());
  }
});

/**
 * Re-runs one failing spec file alone by reloading the runner page with a
 * `specFile=` filter that selects only that file. The bridge callbacks count that
 * run's specs and failures into `probe`; a page error, a navigation error, or a
 * timeout ends the run with an error verdict instead.
 *
 * Every write is guarded by `probe === mine`: after a timeout or a page error
 * the old document is still alive for a moment and its late callbacks — a
 * `jasmineDone`, a rejected `goto` — must not land in the next file's verdict.
 * The document is unloaded before the next probe for the same reason.
 *
 * @param {string} file The repo-relative spec file.
 * @returns {Promise<{failed: number, specs: number, error?: string}>} The verdict for the file.
 */
async function probeFile(file) {
  const query = new URLSearchParams(mainQuery);

  query.delete('random');
  query.delete('seed');
  query.set('specFile', specFileFilter(file));

  const mine = { failed: 0, specs: 0, error: null, resolve: () => {} };

  probe = mine;

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (probe === mine) {
        mine.error = `timed out after ${ISOLATION_PROBE_TIMEOUT_MS / 1000}s`;
        mine.resolve();
      }
    }, ISOLATION_PROBE_TIMEOUT_MS);

    mine.resolve = () => {
      clearTimeout(timer);
      resolve();
    };

    page.goto(runnerUrl(`?${query.toString()}`)).catch((error) => {
      if (probe === mine) {
        mine.error = `navigation failed: ${error.message || error}`;
        mine.resolve();
      }
    });
  });

  // Nothing from this document may reach the next probe: forget it, then unload it.
  probe = null;
  await page.goto('about:blank').catch(() => {});

  return mine.error
    ? { failed: mine.failed, specs: mine.specs, error: mine.error }
    : { failed: mine.failed, specs: mine.specs };
}

/**
 * Re-runs each failing spec file alone, up to `ISOLATION_PROBE_MAX_FILES` of
 * them, to tell a failure caused by the specs that ran before it from one
 * that fails by itself.
 *
 * @param {string[]} files The repo-relative spec files that had failures.
 * @returns {Promise<Map<string, {failed: number, error?: string}>>} The verdict per probed file.
 */
async function runIsolationProbes(files) {
  const verdicts = new Map();
  const targets = files.slice(0, ISOLATION_PROBE_MAX_FILES);

  if (targets.length === 0) {
    return verdicts;
  }

  console.log(`\nRe-running ${targets.length} failing spec file(s) alone, to tell a failure caused by the `
    + 'specs that ran before it from one that fails by itself:');
  phase = 'probe';

  for (const file of targets) {
    // Sequential on purpose: the probes share the one page.
    // eslint-disable-next-line no-await-in-loop
    const verdict = await probeFile(file);

    verdicts.set(file, verdict);
    console.log(`  ${file}: ${describeVerdict(verdict)}`);
  }

  return verdicts;
}

/**
 * Writes the report of a red run: the JSON record in `test/e2e-results/`, the
 * `::error` annotations (on GitHub Actions, capped at what it shows), and the
 * Markdown step summary (when the job provides one).
 *
 * @param {Map<string, {failed: number, specs: number, error?: string}>} probes The isolation verdicts per file.
 * @param {object} [options] Options.
 * @param {boolean} [options.aborted] Whether an uncaught page error ended the run before the probes.
 */
function report(probes, { aborted = false } = {}) {
  const runId = computeRunId(runIdInputs);
  // An aborted run skipped its files because of the abort, not because of the cap.
  const skippedFiles = aborted ? 0 : Math.max(0, failedFiles(failedSpecs).length - probes.size);
  const recordPath = path.join(RESULTS_DIR, `failed-specs-${runId}.json`);
  const record = toRecord({ leg, theme: runIdInputs.theme, runId, aborted }, failedSpecs, probes);

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
  console.log(`\nFailed-specs record: ${recordPath}`);

  if (process.env.GITHUB_ACTIONS === 'true') {
    annotationLines(failedSpecs, leg, probes).forEach(line => console.error(line));
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      renderSummary(failedSpecs, leg, probes, skippedFiles, { aborted }),
    );
  }
}

/**
 * Ends the main run: a green run exits at once; a red one re-runs the failing
 * files alone, reports, and exits 1. The exit is in a `finally`: this is the
 * body of the `jasmineDone` binding, and Puppeteer hands a throw from a binding
 * back to the page, so without it a full disk or a read-only workspace would
 * leave the browser open until the job times out instead of failing.
 */
async function finish() {
  if (failedSpecs.length === 0) {
    await cleanup(errorCount === 0 ? 0 : 1);

    return;
  }

  try {
    const probes = await runIsolationProbes(failedFiles(failedSpecs));

    report(probes);
  } catch (error) {
    console.error('The failure report could not be written:', error);
  } finally {
    await cleanup(1);
  }
}

try {
  await page.goto(runnerUrl(htmlPath.slice(originalPath.length)));
} catch (error) {
  /* eslint-disable no-console */
  console.log(error);
  await cleanup(1);
}
