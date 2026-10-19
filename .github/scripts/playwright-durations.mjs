#!/usr/bin/env node

/**
 * Summarizes one Playwright leg's JSON report into its durations file: the leg's wall-clock, workers
 * and counts, and the milliseconds of every spec file and test. `e2e.yml` runs it after every
 * Playwright leg, red or green, and uploads the file as `playwright-durations-<leg>`; the test-health
 * collector draws the "Where the time goes" section of its page from those files. A leg that runs in
 * shards runs it once per shard, with `--shard <i>/<n>` as the run step passed it to Playwright, and
 * uploads each part as `playwright-durations-<leg>-s<i>`; the collector folds the parts back into the leg.
 *
 * Never fails a leg. A leg without a report (Playwright never ran, or did not finish writing it) ends with a
 * `::notice`, a report that cannot be read with a `::warning`, and both exit 0 without a file (the
 * upload step ignores the missing file). Only the caller's own mistake, a missing `--leg` or a `--shard`
 * that is not `<i>/<n>`, exits 2.
 *
 * All decisions live in `./lib/playwright-durations.mjs`, which is pure and unit-tested.
 *
 * Usage, from the repository root:
 *   node .github/scripts/playwright-durations.mjs --leg classic-min
 *     [--shard 2/3]
 *     [--report tests/test-results/report.json]
 *     [--out tests/test-results/playwright-durations.json]
 *
 * The run id and attempt come from `GITHUB_RUN_ID` and `GITHUB_RUN_ATTEMPT` when set.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { PLAYWRIGHT_DURATIONS_FILE, parseShardFlag, summarizePlaywrightReport } from './lib/playwright-durations.mjs';
import { PLAYWRIGHT_JSON_REPORT } from './lib/test-health.mjs';

const TITLE = 'Playwright durations';

/**
 * A workflow command's message, escaped the way the runner reads it, so a newline in an error cannot
 * start a second command.
 *
 * @param {string} text The message.
 * @returns {string} The escaped message.
 */
function commandData(text) {
  return String(text).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

let options;

try {
  ({ values: options } = parseArgs({
    options: {
      leg: { type: 'string' },
      shard: { type: 'string' },
      report: { type: 'string', default: `tests/${PLAYWRIGHT_JSON_REPORT}` },
      out: { type: 'string', default: `tests/${PLAYWRIGHT_DURATIONS_FILE}` },
    },
  }));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(2);
}

if (!options.leg) {
  process.stderr.write('Missing --leg (the leg the artifact is named after, e.g. classic-min)\n');
  process.exit(2);
}

let shard = null;

if (options.shard !== undefined) {
  try {
    shard = parseShardFlag(options.shard);
  } catch (error) {
    process.stderr.write(`Bad --shard: ${error.message}\n`);
    process.exit(2);
  }
}

if (!existsSync(options.report)) {
  process.stdout.write(`::notice title=${TITLE}::${commandData(`No ${options.report}: Playwright did not finish `
    + `writing it, or never ran, so leg ${options.leg} has no durations to upload.`)}\n`);
} else {
  try {
    const report = JSON.parse(readFileSync(options.report, 'utf8'));
    const summary = summarizePlaywrightReport(report, {
      leg: options.leg,
      runId: process.env.GITHUB_RUN_ID || null,
      runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT) || null,
      shard,
    });
    const text = `${JSON.stringify(summary)}\n`;
    const minutes = ms => (ms / 60000).toFixed(1);
    const specFiles = new Set(summary.files.map(file => file.file)).size;
    const where = shard ? `${summary.leg} shard ${shard.index}/${shard.total}` : summary.leg;

    writeFileSync(options.out, text);
    process.stdout.write(`${where}: ${summary.counts.tests} tests in ${specFiles} spec files: `
      + `${minutes(summary.wallMs)} min wall-clock, ${minutes(summary.summedMs)} min summed over `
      + `${summary.workers ?? '?'} workers. Wrote ${options.out} (${Math.round(Buffer.byteLength(text) / 1024)} KB).`
      + '\n');
  } catch (error) {
    // The summary is an instrument: a report it cannot read must not turn a leg red. The warning
    // says which leg is missing from the page and why.
    process.stdout.write(`::warning title=${TITLE}::${commandData(`Could not summarize ${options.report} for leg `
      + `${options.leg} (${error.message}); this leg has no durations on the test-health page.`)}\n`);
  }
}
