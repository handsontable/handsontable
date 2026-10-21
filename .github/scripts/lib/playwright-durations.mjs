/**
 * Where the Playwright E2E time goes: the pure half.
 *
 * Every Playwright leg of `.github/workflows/e2e.yml`, green or red, summarizes its JSON report into
 * one small file (`playwright-durations.json`, uploaded as `playwright-durations-<leg>`): the leg's
 * wall-clock, worker count and test counts, and the milliseconds of every spec file and every test.
 * A leg that runs in shards (`--shard=<i>/<n>`, one job per shard) uploads one such file per shard,
 * `playwright-durations-<leg>-s<i>`, each naming its shard; the collector folds a leg's parts back into
 * one record (`foldShardParts`), with the leg's wall-clock being its longest shard, since the shards run
 * side by side, and `DURATIONS_LEGS` saying how many parts make the leg whole.
 * `test-health.yml` records the files of develop pushes, and only those, into `test-health/durations.json`
 * on `gh-pages`, beside the flake ledger (a pull request's files stay in its own run for 3 days, so its
 * run commits to `gh-pages` only for a flake), and the test-health page draws its "Where the time goes"
 * section from it.
 *
 * Two shapes live here:
 *
 * - The leg summary (`summarizePlaywrightReport`), which the leg writes. It holds every test, so a
 *   later reader can rank spec files and tests without the multi-megabyte report.
 * - The stored document (`mergeDurations`), which keeps, for 30 days, one record per run and leg
 *   (wall-clock, workers, counts) and, for the latest run of each leg, the per-test milliseconds (a
 *   test that failed or was flaky in that run keeps its time from the last run it passed first time in).
 *   Per-file totals for every run would not fit: at a few develop pushes a day, seven legs a push and
 *   270 files a leg, a month is megabytes. The per-test rows of the latest push give every per-file
 *   total that the page and the later phases read.
 *
 * The stored document also carries the budget input a later e2e budget is derived from: per leg, the
 * P50 and P90 of the wall-clock and of the test count over the window, one vote per push (a re-run
 * attempt replaces the leg's earlier attempt). A leg with a test that failed every attempt
 * (`unexpected`), or with no test at all, is left out of those numbers: its time includes the failing
 * tests' retries and timeouts. A leg with only flaky tests counts; one retry is noise next to the
 * run-to-run spread.
 *
 * No I/O in here. `scripts/playwright-durations.mjs` writes a leg's summary; `scripts/test-health-collect.mjs`
 * reads the artifacts and writes the stored document.
 */

export const DURATIONS_VERSION = 1;

/**
 * Where the summary sits inside the `tests` package, beside the JSON report it is made from. The
 * upload in `e2e.yml` names `tests/` plus this path; `__tests__/test-health.test.mjs` asserts it.
 */
export const PLAYWRIGHT_DURATIONS_FILE = 'test-results/playwright-durations.json';

/**
 * How long a run stays in the stored document. Shorter than the flake ledger's 90 days: a duration
 * trend older than a month describes a different suite.
 */
export const DURATIONS_RETENTION_DAYS = 30;

/**
 * The most the stored document may weigh. The per-test rows get at most half of it (past that, the rows
 * of pull-request sources go first, then the oldest legs'), so the run history always keeps the other
 * half; past the cap, the oldest runs go first.
 */
export const DURATIONS_CAP_BYTES = 2 * 1024 * 1024;

/**
 * A test slower than this is listed by name on the page.
 */
export const SLOW_TEST_MS = 3000;

/**
 * How many spec files the page ranks.
 */
export const HEAVIEST_FILES = 30;

/**
 * The legs `e2e.yml` runs, named as their artifacts name them (the six Chromium legs of the theme × bundle
 * matrix and the engines job), and the number of shards each one runs in. A leg over the wall-clock target
 * is split with Playwright's `--shard=<i>/<n>`, one job per shard, and every shard uploads its own part,
 * `playwright-durations-<leg>-s<i>` (an unsharded leg's part carries no suffix). The collector folds a
 * leg's parts into one record, and this table says how many parts make the leg whole: a leg with a part
 * missing is recorded as partial, left out of the budget, and keeps the per-test rows it had. The collector
 * reads every pull request's artifacts, a fork's included, so a part for any other leg, or for a shard past
 * the count here, is noted and skipped rather than stored. `__tests__/playwright-durations.test.mjs` derives
 * the same table from `e2e.yml`'s matrix, so a change to the legs or their shards fails there until this
 * table follows.
 */
export const DURATIONS_LEGS = Object.freeze({
  classic: 2, 'classic-min': 1, engines: 1, horizon: 2, 'horizon-min': 1, main: 3, 'main-min': 1,
});

/**
 * The suffix a shard's artifacts carry after the leg: `-s<index>` (`playwright-durations-main-s2`,
 * `playwright-report-main-s2`). `parseLegArtifact` reads it back.
 */
export const SHARD_SUFFIX = /^(.+?)-s([1-9]\d*)$/;

/**
 * How many slow tests the page lists, slowest first; the section title gives the full count.
 */
export const SLOW_TESTS_SHOWN = 200;

/**
 * The most a leg summary may hold, so a forged or broken artifact cannot grow the stored document or the
 * page without bound: well above the suite today (about 270 spec files, 3,100 tests, titles under 250
 * characters).
 */
const LIMITS = Object.freeze({ projects: 16, name: 100, files: 5000, path: 500, cases: 50000, title: 2000 });
const ISO_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const CASE_STATUSES = ['unexpected', 'flaky', 'skipped'];
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const TITLE_SEPARATOR = ' › ';
const COUNT_KEYS = ['tests', 'skipped', 'flaky', 'unexpected'];

/**
 * @typedef {object} LegSummary
 * @property {number} version `DURATIONS_VERSION`.
 * @property {string} leg The leg, as the artifact names it (`main`, `classic-min`, `engines`).
 * @property {string[]} projects The Playwright projects that ran in the leg, sorted.
 * @property {string|null} runId The workflow run that wrote the summary (`GITHUB_RUN_ID`), or `null` outside CI.
 * @property {number|null} runAttempt Its attempt (`GITHUB_RUN_ATTEMPT`), or `null` outside CI.
 * @property {{index: number, total: number}|null} shard The shard the run was (`--shard=index/total`), or
 * `null` for a leg that runs whole. A summary written before shards existed has no such field; readers take
 * that as `null`.
 * @property {number|null} workers The workers the run used.
 * @property {string} startTime When the run started, ISO 8601.
 * @property {number} wallMs The run's wall-clock, in milliseconds.
 * @property {number} summedMs Every attempt of every test that ran, added up.
 * @property {{tests: number, skipped: number, flaky: number, unexpected: number}} counts `tests` counts the
 * tests that ran (passed, flaky, or failed); `skipped` the rest.
 * @property {Array<{file: string, project: string, tests: number, ms: number, cases: TestCase[]}>} files One
 * entry per spec file and project, heaviest first. `tests` and `ms` cover the tests that ran.
 */

/**
 * @typedef {object} TestCase
 * @property {string} title The title path below the file, joined with ` › ` (the flake ledger's format).
 * @property {number} ms Every attempt added up: what the test cost the leg.
 * @property {'unexpected'|'flaky'|'skipped'} [status] Present unless the test passed first time.
 * @property {number} [retries] Present when the test ran more than once.
 */

/**
 * Whether a value is a finite number at or above zero.
 *
 * @param {unknown} value The value.
 * @returns {boolean} The verdict.
 */
function isAmount(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Whether a value is a UTC time in the form `Date#toISOString` writes. `Date.parse` alone is not enough:
 * it also reads legacy forms with an arbitrarily long `( ... )` comment.
 *
 * @param {unknown} value The value.
 * @returns {boolean} The verdict.
 */
function isIsoTime(value) {
  return typeof value === 'string' && ISO_TIME.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * Whether a value names a shard: `{ index, total }`, integers, 1 ≤ index ≤ total.
 *
 * @param {unknown} value The value.
 * @returns {boolean} The verdict.
 */
function isShard(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Number.isInteger(value.index) && Number.isInteger(value.total) && value.index >= 1 && value.total >= value.index;
}

/**
 * The shard a `--shard` flag names, the form Playwright takes it in: `<index>/<total>`.
 *
 * @param {string} text The flag's value.
 * @returns {{index: number, total: number}} The shard.
 */
export function parseShardFlag(text) {
  const match = /^([1-9]\d*)\/([1-9]\d*)$/.exec(String(text ?? ''));
  const shard = match ? { index: Number(match[1]), total: Number(match[2]) } : null;

  if (!isShard(shard)) {
    throw new Error(`a shard is written <index>/<total> with 1 <= index <= total, as Playwright's --shard takes it; got ${JSON.stringify(text)}`);
  }

  return shard;
}

/**
 * The leg and shard an artifact name's suffix stands for: `main-s2` is shard 2 of `main`, `main-min` the
 * whole `main-min` leg. The artifact name decides, never the file inside it: GitHub keeps artifact names
 * unique within a run, so two parts can never land on one shard.
 *
 * @param {string} suffix The artifact name after `playwright-durations-` (or `playwright-report-`).
 * @returns {{leg: string, shard: number|null}} The leg and the shard index, `null` for an unsharded leg.
 */
export function parseLegArtifact(suffix) {
  const match = SHARD_SUFFIX.exec(suffix);

  return match ? { leg: match[1], shard: Number(match[2]) } : { leg: suffix, shard: null };
}

/**
 * A leg's durations from its Playwright JSON report.
 *
 * The report nests suites: a file-level suite (whose title is the file path) holds the `describe`
 * suites, which hold the specs; a spec holds one test per project. A test's file is the file-level
 * suite's, never a field of the spec or of a nested suite: a test declared through a helper names the
 * helper there, and what costs the leg is the spec file that ran it.
 *
 * @param {object} report The parsed `report.json`.
 * @param {object} options Options.
 * @param {string} options.leg The leg's name, as the artifact names it.
 * @param {string|null} [options.runId] The run that wrote the report.
 * @param {number|null} [options.runAttempt] Its attempt.
 * @param {{index: number, total: number}|null} [options.shard] The shard the run was, when the leg runs in
 * shards (`--shard=index/total`).
 * @returns {LegSummary} The summary.
 */
export function summarizePlaywrightReport(report, { leg, runId = null, runAttempt = null, shard = null } = {}) {
  if (!report || typeof report !== 'object' || !Array.isArray(report.suites)) {
    throw new Error('not a Playwright JSON report (no `suites` array)');
  }
  if (typeof leg !== 'string' || leg === '') {
    throw new Error('the leg name is required');
  }
  if (shard !== null && !isShard(shard)) {
    throw new Error('shard must be null or { index, total } with 1 <= index <= total');
  }

  const { duration, startTime } = report.stats ?? {};

  if (!isAmount(duration)) {
    throw new Error('the report has no stats.duration, so the leg has no wall-clock');
  }
  const started = typeof startTime === 'string' ? Date.parse(startTime) : NaN;

  if (Number.isNaN(started)) {
    throw new Error('the report has no stats.startTime');
  }

  const counts = { tests: 0, skipped: 0, flaky: 0, unexpected: 0 };
  const projects = new Set();
  const byFile = new Map();

  const walk = (suite, file, titles) => {
    const path = suite.title && suite.title !== suite.file ? [...titles, suite.title] : titles;

    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const project = String(test.projectName ?? test.projectId ?? '');
        const results = test.results ?? [];
        const ms = Math.round(results
          .reduce((sum, result) => sum + (isAmount(result.duration) ? result.duration : 0), 0));
        const entry = { title: [...path, spec.title].join(TITLE_SEPARATOR), ms };
        const key = `${file}\u0000${project}`;

        if (test.status === 'unexpected' || test.status === 'flaky' || test.status === 'skipped') {
          entry.status = test.status;
          counts[test.status] += 1;
        }
        if (results.length > 1) {
          entry.retries = results.length - 1;
        }

        if (!byFile.has(key)) {
          byFile.set(key, { file, project, tests: 0, ms: 0, cases: [] });
        }

        const bucket = byFile.get(key);

        bucket.cases.push(entry);
        projects.add(project);

        if (test.status !== 'skipped') {
          counts.tests += 1;
          bucket.tests += 1;
          bucket.ms += ms;
        }
      }
    }

    for (const child of suite.suites ?? []) {
      walk(child, file, path);
    }
  };

  for (const suite of report.suites) {
    walk(suite, String(suite.file ?? suite.title ?? ''), []);
  }

  const files = [...byFile.values()].sort((a, b) => b.ms - a.ms
    || a.file.localeCompare(b.file)
    || a.project.localeCompare(b.project));
  const workers = report.config?.metadata?.actualWorkers ?? report.config?.workers ?? null;
  const attempt = Number(runAttempt);

  return {
    version: DURATIONS_VERSION,
    leg,
    projects: [...projects].sort(),
    runId: runId ? String(runId) : null,
    runAttempt: Number.isInteger(attempt) && attempt > 0 ? attempt : null,
    shard: shard === null ? null : { index: shard.index, total: shard.total },
    workers: isAmount(workers) ? workers : null,
    startTime: new Date(started).toISOString(),
    wallMs: Math.round(duration),
    summedMs: files.reduce((sum, file) => sum + file.ms, 0),
    counts,
    files,
  };
}

/**
 * A leg summary read back from an artifact, checked field by field. Throws with the first field that
 * is wrong, so the collector can note it and skip that leg alone.
 *
 * @param {unknown} value The parsed `playwright-durations.json`.
 * @returns {LegSummary} The same value.
 */
export function parseDurationSummary(value) {
  const fail = (message) => {
    throw new Error(message);
  };

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('not an object');
  }
  if (value.version !== DURATIONS_VERSION) {
    fail(`version ${value.version} is not ${DURATIONS_VERSION}`);
  }
  if (typeof value.leg !== 'string' || value.leg === '') {
    fail('leg must be a non-empty string');
  }
  if (!Array.isArray(value.projects) || value.projects.length > LIMITS.projects
    || value.projects.some(project => typeof project !== 'string' || project.length > LIMITS.name)) {
    fail(`projects must be a list of at most ${LIMITS.projects} names`);
  }
  if (value.runId !== null && !(typeof value.runId === 'string' && /^\d{1,20}$/.test(value.runId))) {
    fail('runId must be a run id (digits) or null');
  }
  if (value.runAttempt !== null && !(Number.isInteger(value.runAttempt) && value.runAttempt > 0)) {
    fail('runAttempt must be a positive integer or null');
  }
  if (value.shard !== undefined && value.shard !== null && !isShard(value.shard)) {
    fail('shard must be null or { index, total } with 1 <= index <= total');
  }
  if (value.workers !== null && !isAmount(value.workers)) {
    fail('workers must be a number or null');
  }
  if (!isIsoTime(value.startTime)) {
    fail('startTime must be an ISO time in UTC (YYYY-MM-DDTHH:MM:SS.sssZ)');
  }

  for (const key of ['wallMs', 'summedMs']) {
    if (!isAmount(value[key])) {
      fail(`${key} must be a non-negative number`);
    }
  }
  for (const key of COUNT_KEYS) {
    if (!Number.isInteger(value.counts?.[key]) || value.counts[key] < 0) {
      fail(`counts.${key} must be a non-negative integer`);
    }
  }
  if (!Array.isArray(value.files) || value.files.length > LIMITS.files) {
    fail(`files must be a list of at most ${LIMITS.files} entries`);
  }

  let cases = 0;

  value.files.forEach((file, index) => {
    const at = `files[${index}]`;

    if (typeof file?.file !== 'string' || file.file === '' || file.file.length > LIMITS.path) {
      fail(`${at}.file must be a path of 1 to ${LIMITS.path} characters`);
    }
    if (typeof file.project !== 'string' || file.project.length > LIMITS.name) {
      fail(`${at}.project must be a name of at most ${LIMITS.name} characters`);
    }
    if (!isAmount(file.tests) || !isAmount(file.ms)) {
      fail(`${at}.tests and ${at}.ms must be non-negative numbers`);
    }
    if (!Array.isArray(file.cases)) {
      fail(`${at}.cases must be a list`);
    }

    cases += file.cases.length;

    if (cases > LIMITS.cases) {
      fail(`more than ${LIMITS.cases} tests`);
    }

    file.cases.forEach((entry, caseIndex) => {
      if (typeof entry?.title !== 'string' || entry.title.length > LIMITS.title) {
        fail(`${at}.cases[${caseIndex}].title must be a string of at most ${LIMITS.title} characters`);
      }
      if (!isAmount(entry.ms)) {
        fail(`${at}.cases[${caseIndex}].ms must be a non-negative number`);
      }
      if (entry.status !== undefined && !CASE_STATUSES.includes(entry.status)) {
        fail(`${at}.cases[${caseIndex}].status must be one of ${CASE_STATUSES.join(', ')}`);
      }
      if (entry.retries !== undefined && !(Number.isInteger(entry.retries) && entry.retries > 0)) {
        fail(`${at}.cases[${caseIndex}].retries must be a positive integer`);
      }
    });
  });

  return value;
}

/**
 * The empty stored document.
 *
 * @param {object} [options] Options.
 * @param {number} [options.retentionDays] Override of `DURATIONS_RETENTION_DAYS`.
 * @param {number} [options.capBytes] Override of `DURATIONS_CAP_BYTES`.
 * @returns {object} The document.
 */
export function emptyDurations({ retentionDays = DURATIONS_RETENTION_DAYS, capBytes = DURATIONS_CAP_BYTES } = {}) {
  return {
    version: DURATIONS_VERSION,
    updatedAt: null,
    retentionDays,
    capBytes,
    slowTestMs: SLOW_TEST_MS,
    budget: { windowDays: retentionDays, from: null, to: null, legs: {} },
    runs: [],
    latest: { sources: [], columns: [], files: {} },
  };
}

/**
 * Throws unless a stored document is absent or of this code's version, older or newer alike: a version bump
 * ships its own migration, and reverting the collector after one must not drop the month of history either.
 *
 * @param {object|null} doc The document as read from `gh-pages`, or `null`.
 */
export function assertDurationsVersion(doc) {
  if (doc !== null && doc?.version !== DURATIONS_VERSION) {
    throw new Error(`durations.json has version ${doc?.version}, and this collector reads and writes version `
      + `${DURATIONS_VERSION}; a version bump ships its own migration instead of rebuilding a month of history`);
  }
}

/**
 * The nearest-rank percentile: the smallest value with at least `p` percent of the values at or
 * below it. Always one of the values, never an interpolation, so a budget derived from it is a
 * duration some run really took.
 *
 * @param {number[]} values The values, in any order.
 * @param {number} p The percentile, 0 to 100.
 * @returns {number|null} The value, or `null` for no values.
 */
export function percentile(values, p) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil((p / 100) * sorted.length)));

  return sorted[rank - 1];
}

/**
 * Whether a run is a push to develop, the line every pull request is measured against. Only these runs
 * are recorded: a pull request's leg files stay in its own run's artifacts, and a manual run on develop
 * (`workflow_dispatch`) is not a commit landing.
 *
 * @param {{branch: string, event: string}} run The run or source.
 * @returns {boolean} The verdict.
 */
export function isDevelopPush(run) {
  return run.branch === 'develop' && run.event === 'push';
}

/**
 * The page a run's attempt has on GitHub, from the run's base page.
 *
 * @param {string} baseUrl The run's page.
 * @param {number} runAttempt The attempt.
 * @returns {string} The attempt's page; the base page for the first attempt.
 */
function attemptUrl(baseUrl, runAttempt) {
  return runAttempt > 1 && baseUrl ? `${baseUrl}/attempts/${runAttempt}` : baseUrl;
}

/**
 * The P50 and P90 of a leg's samples.
 *
 * @param {Array<{wallMs: number, tests: number}>} samples The samples.
 * @returns {{runs: number, wallMs: {p50: number|null, p90: number|null}, tests: {p50: number|null, p90: number|null}}}
 * The statistics; the percentiles are `null` without samples.
 */
function legStatistics(samples) {
  const walls = samples.map(sample => sample.wallMs);
  const tests = samples.map(sample => sample.tests);

  return {
    runs: samples.length,
    wallMs: { p50: percentile(walls, 50), p90: percentile(walls, 90) },
    tests: { p50: percentile(tests, 50), p90: percentile(tests, 90) },
  };
}

/**
 * The shape a leg ran in: how many shards and how many workers. A record from before a change to either
 * measures another thing (a 17-minute unsharded leg on 2 workers beside 5-minute shards on 4), so the
 * budget counts only the records of the leg's latest shape.
 *
 * @param {object} leg A stored leg record.
 * @returns {{shards: number, workers: number|null}} The shape.
 */
function shapeOf(leg) {
  return { shards: leg.shards ?? 1, workers: leg.workers ?? null };
}

/**
 * Whether two shapes are the same.
 *
 * @param {{shards: number, workers: number|null}} a One shape.
 * @param {{shards: number, workers: number|null}} b The other.
 * @returns {boolean} The verdict.
 */
function sameShape(a, b) {
  return a.shards === b.shards && a.workers === b.workers;
}

/**
 * The latest record of each leg over the stored runs (newest first), the last attempt of its run.
 *
 * @param {object[]} runs The stored runs, newest first.
 * @returns {Map<string, object>} The record by leg.
 */
function latestRecords(runs) {
  const latest = new Map();

  for (const run of runs) {
    for (const leg of run.legs) {
      const current = latest.get(leg.leg);

      if (!current || (current.runId === run.runId && leg.runAttempt > current.runAttempt)) {
        latest.set(leg.leg, { ...leg, runId: run.runId });
      }
    }
  }

  return latest;
}

/**
 * The budget input: per leg, P50 and P90 of the wall-clock and the test count over the stored pushes, one
 * vote per push, over the records of the leg's latest shape (shards and workers) only, and how many pushes
 * were left out (a test failed every attempt, none ran, a shard has no part, or another shape).
 *
 * @param {object[]} runs The stored runs, newest first.
 * @param {number} windowDays The retention window.
 * @returns {object} The budget block.
 */
function budgetOf(runs, windowDays) {
  const legs = new Map();
  const latest = latestRecords(runs);
  let from = null;
  let to = null;

  for (const run of runs) {
    // One vote per push: a "Re-run failed jobs" attempt records the leg again, and only its last attempt counts.
    const last = new Map();

    for (const leg of run.legs) {
      from = from === null || Date.parse(leg.at) < Date.parse(from) ? leg.at : from;
      to = to === null || Date.parse(leg.at) > Date.parse(to) ? leg.at : to;

      if (!last.has(leg.leg) || leg.runAttempt > last.get(leg.leg).runAttempt) {
        last.set(leg.leg, leg);
      }
    }

    for (const leg of last.values()) {
      if (!legs.has(leg.leg)) {
        legs.set(leg.leg, { samples: [], excluded: 0, ...shapeOf(latest.get(leg.leg)) });
      }

      const bucket = legs.get(leg.leg);

      if (isLeftOut(leg) || !sameShape(shapeOf(leg), bucket)) {
        bucket.excluded += 1;
      } else {
        bucket.samples.push(leg);
      }
    }
  }

  return {
    windowDays,
    from,
    to,
    legs: Object.fromEntries([...legs.keys()].sort().map(name => [name, {
      ...legStatistics(legs.get(name).samples),
      excluded: legs.get(name).excluded,
      shards: legs.get(name).shards,
      workers: legs.get(name).workers,
    }])),
  };
}

/**
 * Whether a leg record is left out of the budget: a shard of it is missing, a test failed every attempt,
 * or no test ran. Its wall-clock describes something other than the leg (retries and timeouts, or a part
 * of it).
 *
 * @param {object} leg The stored leg record.
 * @returns {boolean} The verdict.
 */
function isLeftOut(leg) {
  return Array.isArray(leg.missing) || leg.unexpected > 0 || leg.tests === 0;
}

/**
 * One leg's summary from the parts its shards uploaded.
 *
 * The shards of a leg run side by side, so the leg's wall-clock is its longest part and its start is
 * the earliest; everything else adds up: the summed time, the counts, and each spec file's tests and
 * cases, which keep their shard's order. The attempt is the latest any part ran in: "Re-run failed
 * jobs" re-runs the red shard alone, and the leg's final state is that shard's new part beside the
 * others' first-attempt parts. An unsharded leg is one part without a shard, read as shard 1 of 1.
 *
 * Two clocks, both kept. `wallMs`, the longest part, is what the leg costs when its shards start
 * together, the number the shard counts are derived from and the budget reads. `shards.spanMs`, from
 * the first part's start to the last part's end, is what a pull request waited when the shards
 * queued: three five-minute shards starting ten minutes apart fold to a five-minute `wallMs` and a
 * twenty-five-minute span.
 *
 * A part for a shard past `total` is noted and skipped (the artifact names are a pull request's, and
 * `DURATIONS_LEGS`, not the file, says how many shards the leg has). A shard with no part leaves the
 * leg partial: `missing` names it, and the caller decides what a partial leg may do. A part without a
 * shard for a leg that runs in shards is an older run's whole leg (a re-run of a push from before the
 * shards): alone, it is recorded as the whole leg it is, with a note; beside shard parts, it is skipped
 * with a note, never read as shard 1.
 *
 * @param {string} leg The leg.
 * @param {LegSummary[]} parts The leg's parts, in any order, each naming its shard (or `null`).
 * @param {number} total How many shards make the leg whole (`DURATIONS_LEGS[leg]`).
 * @returns {{summary: (LegSummary & {shards: {total: number, spanMs: number, parts: object[], missing: number[]}})|null,
 * missing: number[], notes: string[]}} The folded summary (`null` when no part was usable; its `shards.total`
 * is 1 for an unsharded part recorded as a whole leg), the shards that have no part, and notes for the step
 * summary.
 */
export function foldShardParts(leg, parts, total) {
  const notes = [];
  const byIndex = new Map();
  const whole = parts.filter(part => part.shard === null);
  let usable = parts;

  if (total > 1 && whole.length > 0) {
    if (whole.length === parts.length) {
      notes.push(`leg ${leg}: ${whole.length === 1 ? 'an unsharded part' : `${whole.length} unsharded parts`} for a leg `
        + `e2e.yml runs in ${total} shards (a run from before the shards); recorded as a whole leg`);
      total = 1;
    } else {
      notes.push(`leg ${leg}: ${whole.length === 1 ? 'an unsharded part' : `${whole.length} unsharded parts`} beside `
        + `${parts.length - whole.length} shard part(s); the unsharded ${whole.length === 1 ? 'one is' : 'ones are'} skipped`);
      usable = parts.filter(part => part.shard !== null);
    }
  }

  for (const part of usable) {
    const index = part.shard?.index ?? 1;

    if (!(Number.isInteger(index) && index >= 1 && index <= total)) {
      notes.push(`leg ${leg}: a part for shard ${index}, and e2e.yml runs the leg in ${total}; skipped`);
      continue;
    }
    if (part.shard && part.shard.total !== total) {
      notes.push(`leg ${leg}: the part for shard ${index} says ${part.shard.total} shards; e2e.yml runs ${total}`);
    }
    // The artifact names are unique within a run, so one part per index is the rule; a later attempt wins
    // all the same, so a forged pair cannot roll a shard back.
    const current = byIndex.get(index);

    if (!current || ((part.runAttempt ?? 0) - (current.runAttempt ?? 0)
      || Date.parse(part.startTime) - Date.parse(current.startTime)) > 0) {
      byIndex.set(index, part);
    }
  }

  const missing = Array.from({ length: total }, (_, offset) => offset + 1).filter(index => !byIndex.has(index));
  const ordered = [...byIndex.keys()].sort((a, b) => a - b).map(index => [index, byIndex.get(index)]);

  if (ordered.length === 0) {
    return { summary: null, missing, notes };
  }

  const projects = new Set();
  const counts = { tests: 0, skipped: 0, flaky: 0, unexpected: 0 };
  const byFile = new Map();
  const runIds = new Set(ordered.map(([, part]) => part.runId));
  let runAttempt = null;
  let workers = null;
  let startTime = null;
  let lastEnd = 0;
  let wallMs = 0;
  let summedMs = 0;

  for (const [, part] of ordered) {
    part.projects.forEach(project => projects.add(project));
    COUNT_KEYS.forEach((key) => {
      counts[key] += part.counts[key];
    });
    runAttempt = part.runAttempt === null ? runAttempt : Math.max(runAttempt ?? 0, part.runAttempt);
    workers = part.workers === null ? workers : Math.max(workers ?? 0, part.workers);
    startTime = startTime === null || Date.parse(part.startTime) < Date.parse(startTime) ? part.startTime : startTime;
    lastEnd = Math.max(lastEnd, Date.parse(part.startTime) + part.wallMs);
    wallMs = Math.max(wallMs, part.wallMs);
    summedMs += part.summedMs;

    for (const file of part.files) {
      const key = `${file.file}\u0000${file.project}`;

      if (!byFile.has(key)) {
        byFile.set(key, { file: file.file, project: file.project, tests: 0, ms: 0, cases: [] });
      }

      const bucket = byFile.get(key);

      bucket.tests += file.tests;
      bucket.ms += file.ms;
      bucket.cases.push(...file.cases);
    }
  }

  const files = [...byFile.values()].sort((a, b) => b.ms - a.ms
    || a.file.localeCompare(b.file)
    || a.project.localeCompare(b.project));

  return {
    summary: {
      version: DURATIONS_VERSION,
      leg,
      projects: [...projects].sort(),
      runId: runIds.size === 1 ? ordered[0][1].runId : null,
      runAttempt,
      shard: null,
      workers,
      startTime,
      wallMs,
      summedMs,
      counts,
      files,
      shards: {
        total,
        spanMs: Math.max(wallMs, lastEnd - Date.parse(startTime)),
        parts: ordered.map(([index, part]) => ({
          index,
          runAttempt: part.runAttempt,
          startTime: part.startTime,
          workers: part.workers,
          wallMs: part.wallMs,
          summedMs: part.summedMs,
          ...part.counts,
        })),
        missing,
      },
    },
    missing,
    notes,
  };
}

/**
 * The compact form a leg record and a source keep of a sharded leg's parts: one row per part, as
 * `[shard, attempt, wall-clock ms, tests that ran]`.
 *
 * @param {{parts: object[]}} shards The folded summary's `shards`.
 * @param {number} runAttempt The record's attempt, for a part that names none.
 * @returns {Array<[number, number, number, number]>} The rows, by shard.
 */
function partRows(shards, runAttempt) {
  return shards.parts.map(part => [part.index, part.runAttempt ?? runAttempt, part.wallMs, part.tests]);
}

/**
 * The stored per-test rows as maps: the source run of each leg, and each test's milliseconds per
 * column (`<leg>\0<project>`).
 *
 * @param {object} latest The stored `latest` block.
 * @returns {{sources: Map<string, object>, cells: Map<string, Map<string, Map<string, number>>>}} The maps.
 */
function decodeLatest(latest) {
  const sources = new Map((latest?.sources ?? []).map(source => [source.leg, source]));
  const columns = (latest?.columns ?? []).map(column => `${column.leg}\u0000${column.project}`);
  const cells = new Map();

  for (const [file, rows] of Object.entries(latest?.files ?? {})) {
    const titles = new Map();

    for (const [title, ...values] of rows) {
      const byColumn = new Map();

      values.forEach((value, index) => {
        if (value !== null && columns[index] !== undefined) {
          byColumn.set(columns[index], value);
        }
      });
      titles.set(title, byColumn);
    }
    cells.set(file, titles);
  }

  return { sources, cells };
}

/**
 * One leg's cells, keyed by spec file, title and column, before the leg is replaced.
 *
 * @param {{cells: Map}} latest The decoded rows.
 * @param {string} leg The leg.
 * @returns {Map<string, number>} The milliseconds by `JSON.stringify([file, title, column])`.
 */
function cellsOf(latest, leg) {
  const prefix = `${leg}\u0000`;
  const cells = new Map();

  for (const [file, titles] of latest.cells) {
    for (const [title, byColumn] of titles) {
      for (const [column, ms] of byColumn) {
        if (column.startsWith(prefix)) {
          cells.set(JSON.stringify([file, title, column]), ms);
        }
      }
    }
  }

  return cells;
}

/**
 * Drops one leg's source and every cell of its columns.
 *
 * @param {{sources: Map, cells: Map}} latest The decoded rows.
 * @param {string} leg The leg.
 */
function removeLeg(latest, leg) {
  latest.sources.delete(leg);

  const prefix = `${leg}\u0000`;

  for (const [file, titles] of latest.cells) {
    for (const [title, byColumn] of titles) {
      for (const column of byColumn.keys()) {
        if (column.startsWith(prefix)) {
          byColumn.delete(column);
        }
      }
      if (byColumn.size === 0) {
        titles.delete(title);
      }
    }
    if (titles.size === 0) {
      latest.cells.delete(file);
    }
  }
}

/**
 * The stored `latest` block from the decoded maps: sources and columns sorted by leg and project,
 * spec files by path, rows by title, `null` where a test did not run in a column.
 *
 * @param {{sources: Map, cells: Map}} latest The decoded rows.
 * @returns {object} The block.
 */
function encodeLatest(latest) {
  const legs = [...latest.sources.keys()].sort();
  const columns = legs.flatMap(leg => [...latest.sources.get(leg).projects].sort().map(project => ({ leg, project })));
  const keys = columns.map(column => `${column.leg}\u0000${column.project}`);
  const files = [];

  for (const file of [...latest.cells.keys()].sort()) {
    const rows = [...latest.cells.get(file).entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, byColumn]) => [title, ...keys.map(key => byColumn.get(key) ?? null)])
      .filter(row => row.slice(1).some(value => value !== null));

    if (rows.length > 0) {
      files.push([file, rows]);
    }
  }

  // `fromEntries` defines own properties, so a spec file named `__proto__` is a row like any other.
  return { sources: legs.map(leg => latest.sources.get(leg)), columns, files: Object.fromEntries(files) };
}

/**
 * The stored document as text: one run per line and one spec file's rows per line, so a diff of the
 * `gh-pages` commit shows which runs and files moved. Valid JSON that `JSON.parse` reads back as the
 * same document.
 *
 * @param {object} doc The document.
 * @returns {string} The text.
 */
export function serializeDurations(doc) {
  const { runs, latest, ...head } = doc;
  const { files, ...latestHead } = latest;
  const runLines = runs.map(run => JSON.stringify(run));
  const fileLines = Object.keys(files).map(file => `${JSON.stringify(file)}:${JSON.stringify(files[file])}`);

  return `${JSON.stringify(head).slice(0, -1)},\n"runs":[\n${runLines.join(',\n')}\n],\n`
    + `"latest":${JSON.stringify(latestHead).slice(0, -1)},"files":{\n${fileLines.join(',\n')}\n}}}\n`;
}

/**
 * Merges one collected run's leg summaries into the stored document.
 *
 * - A run is one record with a leg entry per leg and attempt. The attempt is the summary's own
 *   (`GITHUB_RUN_ATTEMPT` of the job that wrote it), not the collected run's: a "Re-run failed jobs"
 *   attempt re-runs one leg, the other legs' artifacts of attempt 1 stay on the run, and its
 *   collection reads them again. Keyed by their own attempt, they replace themselves.
 * - Only develop pushes are recorded (`isDevelopPush`); any other run throws, because the collector never
 *   passes one. The per-test rows of a leg come from its latest push (by run id, then attempt), so a late
 *   re-run of an older push never replaces a newer commit's rows. A leg that ran no test supplies none. A cell holds a test's time
 *   from a run where it passed on its first attempt: a test that failed or was flaky in the incoming run
 *   keeps the time the rows last had for it (its own time is retries and timeouts, which the flake ledger
 *   tracks), and a skipped or removed test has no cell.
 * - A sharded leg arrives as one summary per shard (`playwright-durations-<leg>-s<i>`, the collector names
 *   each part's shard from its artifact). The parts are folded into one record (`foldShardParts`): the
 *   leg's wall-clock is its longest part, the counts and the rows add up, and the record keeps a row per
 *   part. A leg with a shard missing is recorded as partial (`missing` names the shards), is left out of
 *   the budget, and keeps the per-test rows it had, like a leg that ran no test.
 * - The summaries are untrusted: a fork's pull request runs its own `e2e.yml`. A leg outside
 *   `DURATIONS_LEGS`, a part for a shard the leg does not have, and a part that claims to start after the
 *   run ended are noted and skipped, so nothing can invent a leg or pin a record past the retention window.
 * - Records older than the retention window go, and so do a leg's rows. The rows get at most half the
 *   cap: past it, the rows of the oldest legs go first. Past the cap, the oldest runs go first, whole.
 * - `updatedAt` moves only when the stored text changed, so a collection that adds nothing leaves
 *   the published file byte-identical, like the flake ledger.
 *
 * @param {object|null} previous The document as read from `gh-pages`, or `null`.
 * @param {LegSummary[]} summaries The run's leg summaries (already checked by `parseDurationSummary`).
 * @param {import('./test-health.mjs').RunContext} run The collected run.
 * @param {object} options Options.
 * @param {Date} options.now The current time.
 * @param {number} [options.retentionDays] Override of `DURATIONS_RETENTION_DAYS`.
 * @param {number} [options.capBytes] Override of `DURATIONS_CAP_BYTES`.
 * A stored document of another version throws: a version bump ships its own migration, and rebuilding
 * from one run would drop the month of history, the way the collector refuses a file it cannot parse.
 *
 * @returns {{doc: object, changed: boolean, added: number, pruned: number, capped: number, recorded: LegSummary[],
 * notes: string[]}} The new document; whether its text changed; how many leg records were new, and how many
 * fell out of the window; how many runs the cap dropped; the summaries it recorded (the ones it did not skip);
 * notes for the step summary (skipped legs, dropped rows and runs).
 */
export function mergeDurations(previous, summaries, run, {
  now,
  retentionDays = DURATIONS_RETENTION_DAYS,
  capBytes = DURATIONS_CAP_BYTES,
}) {
  const notes = [];
  const prior = previous ?? null;

  assertDurationsVersion(prior);

  if (!isDevelopPush(run)) {
    throw new Error(`run ${run.runId} is a ${run.event} run on ${run.branch}; only develop pushes are recorded`);
  }

  const stored = prior ?? emptyDurations({ retentionDays, capBytes });
  const cutoff = now.getTime() - (retentionDays * DAY_MS);
  const headers = new Map();
  const records = new Map();
  const recordKey = (runId, leg, runAttempt) => `${runId}|${leg}|${runAttempt}`;

  for (const storedRun of stored.runs) {
    const { legs, ...header } = storedRun;

    headers.set(header.runId, header);

    for (const leg of legs) {
      records.set(recordKey(header.runId, leg.leg, leg.runAttempt), { runId: header.runId, leg });
    }
  }

  const baseUrl = String(run.runUrl ?? '').replace(/\/attempts\/\d+$/, '');
  const header = {
    runId: run.runId,
    workflow: run.workflow,
    event: run.event,
    branch: run.branch,
    headSha: run.headSha,
    runUrl: baseUrl,
  };
  const latest = decodeLatest(stored.latest);
  const pruneSources = () => {
    for (const [leg, source] of [...latest.sources]) {
      if (!(Date.parse(source.at) >= cutoff)) {
        removeLeg(latest, leg);
      }
    }
  };
  const seenAt = Date.parse(run.seenAt);
  // A leg cannot start after its run ended; an hour of slack covers clock skew between the runner and the API.
  const latestStart = (Number.isNaN(seenAt) ? now.getTime() : seenAt) + HOUR_MS;
  const recorded = [];
  let added = 0;

  headers.set(run.runId, header);

  const partsByLeg = new Map();

  for (const part of summaries) {
    const where = part.shard ? `leg ${part.leg} shard ${part.shard.index}` : `leg ${part.leg}`;

    if (!Object.hasOwn(DURATIONS_LEGS, part.leg)) {
      notes.push(`leg ${JSON.stringify(part.leg.slice(0, 60))}: not a leg e2e.yml runs, skipped`);
      continue;
    }
    if (!(Date.parse(part.startTime) <= latestStart)) {
      notes.push(`${where}: starts at ${part.startTime}, after run ${run.runId} ended, skipped`);
      continue;
    }
    if (part.runId !== null && part.runId !== run.runId) {
      notes.push(`${where}: the durations were written by run ${part.runId}, collected as run ${run.runId}`);
    }
    if (!partsByLeg.has(part.leg)) {
      partsByLeg.set(part.leg, []);
    }
    partsByLeg.get(part.leg).push(part);
  }

  for (const [legName, parts] of [...partsByLeg].sort(([a], [b]) => a.localeCompare(b))) {
    const fold = foldShardParts(legName, parts, DURATIONS_LEGS[legName]);

    notes.push(...fold.notes);

    if (fold.summary === null) {
      continue;
    }

    const { summary, missing } = fold;
    const partial = missing.length > 0;
    // The fold's count, not the table's: an unsharded part alone is recorded as the whole leg it is.
    const total = summary.shards.total;

    if (partial) {
      notes.push(`leg ${legName}: no part for shard${missing.length === 1 ? '' : 's'} ${missing.join(', ')} of ${total}; `
        + 'recorded as partial, left out of the budget, and its per-test rows are the run before\'s');
    }

    recorded.push(summary);

    const ownRun = summary.runId === null || summary.runId === run.runId;
    const runAttempt = ownRun && summary.runAttempt ? summary.runAttempt : run.runAttempt;
    const key = recordKey(run.runId, legName, runAttempt);
    // An unsharded, whole leg keeps the record shape from before shards existed, so its stored text is
    // unchanged; a sharded or partial leg adds its shard count, its span (first start to last end), a row
    // per part, and the missing shards.
    const shardFields = total > 1 || partial
      ? {
        shards: total,
        spanMs: summary.shards.spanMs,
        parts: partRows(summary.shards, runAttempt),
        ...(partial ? { missing } : {}),
      }
      : {};

    if (!records.has(key)) {
      added += 1;
    }

    records.set(key, {
      runId: run.runId,
      leg: {
        leg: legName,
        runAttempt,
        at: summary.startTime,
        workers: summary.workers,
        wallMs: summary.wallMs,
        summedMs: summary.summedMs,
        tests: summary.counts.tests,
        skipped: summary.counts.skipped,
        flaky: summary.counts.flaky,
        unexpected: summary.counts.unexpected,
        ...shardFields,
      },
    });

    // A leg that ran no test (its web server never started, a filter matched nothing) has no rows to give,
    // and must not wipe the rows of the leg's last run that had some; neither may a partial leg, whose
    // missing shard's tests would read as removed.
    if (summary.counts.tests === 0 || partial) {
      continue;
    }

    const source = {
      leg: legName,
      projects: [...summary.projects].sort(),
      runId: run.runId,
      runAttempt,
      runUrl: attemptUrl(baseUrl, runAttempt),
      workflow: run.workflow,
      event: run.event,
      branch: run.branch,
      headSha: run.headSha,
      at: summary.startTime,
      wallMs: summary.wallMs,
      workers: summary.workers,
      tests: summary.counts.tests,
      ...(total > 1 ? { shards: total, spanMs: summary.shards.spanMs, parts: partRows(summary.shards, runAttempt) } : {}),
    };
    const current = latest.sources.get(legName);
    // The later run by id, then the later attempt: run ids follow commit order, so a "Re-run failed jobs"
    // on an older push, days later, never replaces a newer commit's rows. An equal rank is the same
    // execution collected again: the incoming copy wins, which keeps that a no-op.
    const outranked = current !== undefined && (Number(current.runId) - Number(source.runId)
      || current.runAttempt - source.runAttempt) > 0;

    if (!outranked) {
      // A test that failed or was flaky here keeps the time the rows last had for it; every other cell of
      // the leg is replaced, so a test that is gone from the leg loses its row.
      const kept = cellsOf(latest, legName);

      removeLeg(latest, legName);
      latest.sources.set(legName, source);

      for (const file of summary.files) {
        const column = `${legName}\u0000${file.project}`;

        if (!latest.cells.has(file.file)) {
          latest.cells.set(file.file, new Map());
        }

        const titles = latest.cells.get(file.file);

        for (const entry of file.cases) {
          // Passed on the first attempt: no status, and its own time. Failed or flaky: the time it last
          // passed with, if the rows had one. Skipped: it never ran, no cell.
          const ms = entry.status === undefined ? entry.ms : kept.get(JSON.stringify([file.file, entry.title, column]));

          if (entry.status === 'skipped' || ms === undefined) {
            continue;
          }
          if (!titles.has(entry.title)) {
            titles.set(entry.title, new Map());
          }
          titles.get(entry.title).set(column, ms);
        }
      }
    }
  }

  let pruned = 0;

  for (const [key, record] of records) {
    if (!(Date.parse(record.leg.at) >= cutoff)) {
      records.delete(key);
      pruned += 1;
    }
  }
  pruneSources();

  // The rows get at most half the cap, so the run history (the trend and the budget input) always keeps
  // the other half. Past it, the oldest legs' rows go first.
  const rowsBudget = Math.floor(capBytes / 2);
  const shed = [];
  let encodedLatest = encodeLatest(latest);

  while (latest.sources.size > 0 && Buffer.byteLength(JSON.stringify(encodedLatest)) > rowsBudget) {
    const [victim] = [...latest.sources.values()].sort((a, b) => Number(a.runId) - Number(b.runId)
      || a.runAttempt - b.runAttempt
      || a.leg.localeCompare(b.leg));

    removeLeg(latest, victim.leg);
    shed.push(victim.leg);
    encodedLatest = encodeLatest(latest);
  }

  if (shed.length > 0) {
    notes.push(`durations.json: the per-test rows passed ${rowsBudget} bytes; dropped the rows of ${shed.join(', ')}`);
  }

  const grouped = new Map();

  for (const { runId, leg } of records.values()) {
    if (!grouped.has(runId)) {
      grouped.set(runId, []);
    }
    grouped.get(runId).push(leg);
  }

  const newest = legs => Math.max(...legs.map(leg => Date.parse(leg.at)));
  const runs = [...grouped.entries()]
    .map(([runId, legs]) => ({
      ...headers.get(runId),
      legs: legs.sort((a, b) => a.leg.localeCompare(b.leg) || a.runAttempt - b.runAttempt),
    }))
    .sort((a, b) => newest(b.legs) - newest(a.legs) || b.runId.localeCompare(a.runId, 'en', { numeric: true }));
  const assemble = (updatedAt, keptRuns) => ({
    version: DURATIONS_VERSION,
    updatedAt,
    retentionDays,
    capBytes,
    slowTestMs: SLOW_TEST_MS,
    budget: budgetOf(keptRuns, retentionDays),
    runs: keptRuns,
    latest: encodedLatest,
  });

  let capped = 0;
  let kept = runs;
  let doc = assemble(null, kept);
  let size = Buffer.byteLength(serializeDurations(doc));
  // What the cap drops first: the oldest runs (`runs` is newest first).
  const eviction = [...runs].reverse();

  // Drop runs until the text fits. The budget block shrinks or grows by a few bytes with the runs it
  // summarizes, so measure again after each round instead of trusting the estimate.
  while (size > capBytes && eviction.length > 0) {
    const dropped = new Set();
    let freed = 0;

    while (eviction.length > 0 && freed < size - capBytes) {
      const victim = eviction.shift();

      dropped.add(victim);
      freed += Buffer.byteLength(JSON.stringify(victim)) + 2;
      capped += 1;
    }

    kept = kept.filter(entry => !dropped.has(entry));
    doc = assemble(null, kept);
    size = Buffer.byteLength(serializeDurations(doc));
  }

  if (capped > 0) {
    notes.push(`durations.json: dropped the ${capped} oldest run(s) to stay under ${capBytes} bytes`);
  }
  if (size > capBytes) {
    notes.push(`durations.json: ${size} bytes even without runs, over the ${capBytes}-byte cap`);
  }

  const changed = prior === null
    || serializeDurations({ ...prior, updatedAt: null }) !== serializeDurations(doc);

  doc.updatedAt = changed ? now.toISOString() : (prior.updatedAt ?? now.toISOString());

  return { doc, changed, added, pruned, capped, recorded, notes };
}

/**
 * What the page inlines: the trend points, the budget input, the heaviest spec files and the slow
 * tests, all derived from the stored document so the page needs no fetch.
 *
 * @param {object|null} doc The stored document.
 * @returns {object|null} The view, or `null` when nothing was collected yet.
 */
export function durationsView(doc) {
  if (!doc || (doc.runs.length === 0 && doc.latest.sources.length === 0)) {
    return null;
  }

  const legs = [...new Set([
    ...doc.runs.flatMap(run => run.legs.map(leg => leg.leg)),
    ...doc.latest.sources.map(source => source.leg),
  ])].sort();
  const projectsPerLeg = new Map(doc.latest.sources.map(source => [source.leg, source.projects.length]));
  const labels = doc.latest.columns.map(column => (projectsPerLeg.get(column.leg) > 1
    ? `${column.leg} (${column.project.replace(/^e2e-/, '')})`
    : column.leg));
  const slowTestMs = doc.slowTestMs ?? SLOW_TEST_MS;
  const heaviestFiles = [];
  const slowTests = [];
  // Each leg's latest record: a run of another shape (shards, workers) is drawn as left out.
  const latest = latestRecords(doc.runs);

  for (const [file, rows] of Object.entries(doc.latest.files)) {
    const perLeg = new Map();
    let ms = 0;
    let executions = 0;

    for (const [title, ...cells] of rows) {
      const over = [];

      for (let index = 0; index < cells.length; index += 1) {
        const cell = cells[index];

        if (cell !== null) {
          const { leg } = doc.latest.columns[index];

          ms += cell;
          executions += 1;
          perLeg.set(leg, (perLeg.get(leg) ?? 0) + cell);

          if (cell > slowTestMs) {
            over.push([labels[index], cell]);
          }
        }
      }

      if (over.length > 0) {
        over.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        slowTests.push({ file, title, ms: over[0][1], legs: over });
      }
    }

    heaviestFiles.push({
      file,
      ms,
      tests: rows.length,
      executions,
      legs: [...perLeg].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    });
  }

  heaviestFiles.sort((a, b) => b.ms - a.ms || a.file.localeCompare(b.file));
  slowTests.sort((a, b) => b.ms - a.ms || a.file.localeCompare(b.file) || a.title.localeCompare(b.title));

  return {
    updatedAt: doc.updatedAt,
    retentionDays: doc.retentionDays,
    slowTestMs,
    legs,
    runs: doc.runs.map(run => [run.runId, run.headSha.slice(0, 10)]),
    // [run index, leg index, start time (ms since epoch), wall-clock ms, tests that ran, attempt, left out of
    // the budget: 0 counted, 1 a test failed every attempt or none ran, 2 a later attempt re-ran the leg,
    // 3 a shard has no part, 4 another shape (shards or workers) than the leg's latest run; then the shards
    // as [[shard, attempt, wall-clock ms, tests], …] for a sharded leg, null for a whole one; then the span
    // from the first shard's start to the last shard's end, null for a whole leg]
    points: doc.runs.flatMap((run, runIndex) => {
      const lastAttempt = new Map();

      run.legs.forEach(leg => lastAttempt.set(leg.leg, Math.max(lastAttempt.get(leg.leg) ?? 0, leg.runAttempt)));

      return run.legs.map((leg) => {
        let leftOut = 0;

        if (Array.isArray(leg.missing)) {
          leftOut = 3;
        } else if (leg.unexpected > 0 || leg.tests === 0) {
          leftOut = 1;
        } else if (leg.runAttempt < lastAttempt.get(leg.leg)) {
          leftOut = 2;
        } else if (!sameShape(shapeOf(leg), shapeOf(latest.get(leg.leg)))) {
          leftOut = 4;
        }

        return [runIndex, legs.indexOf(leg.leg), Date.parse(leg.at), leg.wallMs, leg.tests, leg.runAttempt, leftOut,
          Array.isArray(leg.parts) ? leg.parts : null, isAmount(leg.spanMs) ? leg.spanMs : null];
      });
    }),
    budget: doc.budget,
    heaviestFiles: heaviestFiles.slice(0, HEAVIEST_FILES),
    // Capped like the files: a slow CI day, or a forged source full of 3.1 s tests, must not grow the page.
    slowTests: slowTests.slice(0, SLOW_TESTS_SHOWN),
    slowTestCount: slowTests.length,
    sources: doc.latest.sources,
  };
}

/**
 * Minutes, one decimal.
 *
 * @param {number} ms Milliseconds.
 * @returns {string} The minutes.
 */
function minutes(ms) {
  return (ms / 60000).toFixed(1);
}

/**
 * The step summary's line about time: each leg's wall-clock in the collected run, and the spec file
 * that cost the most across its legs.
 *
 * @param {LegSummary[]} summaries The run's leg summaries.
 * @returns {string} One Markdown line.
 */
export function renderDurationsLine(summaries) {
  if (summaries.length === 0) {
    return 'Playwright wall-clock: no `playwright-durations-*` artifact on this run.';
  }

  const sorted = [...summaries].sort((a, b) => a.leg.localeCompare(b.leg));
  const workers = [...new Set(sorted.map(summary => summary.workers).filter(value => value !== null))];
  const workerText = workers.length > 0
    ? ` (${workers.join('/')} worker${workers.length === 1 && workers[0] === 1 ? '' : 's'})`
    : '';
  const perFile = new Map();

  for (const summary of sorted) {
    for (const file of summary.files) {
      const entry = perFile.get(file.file) ?? { ms: 0, legs: new Set() };

      entry.ms += file.ms;
      entry.legs.add(summary.leg);
      perFile.set(file.file, entry);
    }
  }

  const [heaviest] = [...perFile].sort((a, b) => b[1].ms - a[1].ms || a[0].localeCompare(b[0]));
  // A file path from a pull request's artifact: a backtick or a line break in it would end the code span early.
  const heaviestFile = heaviest ? heaviest[0].replace(/`/g, '\'').replace(/[\r\n]+/g, ' ') : '';
  const heaviestText = heaviest
    ? `; heaviest file: \`${heaviestFile}\` (${minutes(heaviest[1].ms)} min summed over ${heaviest[1].legs.size} `
      + `leg${heaviest[1].legs.size === 1 ? '' : 's'})`
    : '';

  // A sharded leg's wall-clock is its longest shard; a partial one says how many parts it has.
  const shardText = (summary) => {
    const shards = summary.shards;

    if (!shards || shards.total < 2) {
      return '';
    }

    return shards.missing.length > 0
      ? ` (${shards.parts.length} of ${shards.total} shards)`
      : ` (${shards.total} shards)`;
  };

  return `Playwright wall-clock: ${sorted.map(summary => `${summary.leg} ${minutes(summary.wallMs)} min${shardText(summary)}`).join(', ')}`
    + `${workerText}${heaviestText}.`;
}
