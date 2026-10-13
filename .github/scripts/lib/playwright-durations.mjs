/**
 * Where the Playwright E2E time goes: the pure half.
 *
 * Every Playwright leg of `.github/workflows/e2e.yml`, green or red, summarizes its JSON report into
 * one small file (`playwright-durations.json`, uploaded as `playwright-durations-<leg>`): the leg's
 * wall-clock, worker count and test counts, and the milliseconds of every spec file and every test.
 * `test-health.yml` collects those files from every completed run into `test-health/durations.json`
 * on `gh-pages`, beside the flake ledger, and the test-health page draws its "Where the time goes"
 * section from it.
 *
 * Two shapes live here:
 *
 * - The leg summary (`summarizePlaywrightReport`), which the leg writes. It holds every test, so a
 *   later reader can rank spec files and tests without the multi-megabyte report.
 * - The stored document (`mergeDurations`), which keeps, for 30 days, one record per run and leg
 *   (wall-clock, workers, counts) and, for the latest run of each leg, the per-test milliseconds of
 *   every test that passed on its first attempt.
 *   Per-file totals for every run would not fit: at roughly 30 completed runs a day and seven legs a
 *   run, 270 files each, a month is tens of megabytes. The per-test rows of the latest run give every
 *   per-file total that the page and the later phases read. A develop push supplies those rows
 *   whenever one is in the window, because develop is what every pull request is measured against;
 *   until one arrives, the newest run of any branch does, so the section is never empty.
 *
 * The stored document also carries the budget input a later e2e budget is derived from: per leg, the
 * P50 and P90 of the wall-clock and of the test count over the window, from every run and from develop
 * pushes alone. A leg with a test that failed every attempt (`unexpected`), or with no test at all, is
 * left out of those numbers: its time includes the failing tests' retries and timeouts. A leg with only
 * flaky tests counts; one retry is noise next to the run-to-run spread.
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
 * What a leg name may look like: the artifact suffix `e2e.yml` writes (`main`, `classic-min`, `engines`).
 * The collector runs on every pull request's artifacts, a fork's included, so a name outside this shape is
 * noted and skipped rather than stored.
 */
export const DURATIONS_LEG_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

/**
 * The most legs one run may record. The matrix has seven; the rest of a run's artifacts are skipped.
 */
export const MAX_LEGS_PER_RUN = 16;

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
 * Whether a value is an ISO time `Date.parse` reads.
 *
 * @param {unknown} value The value.
 * @returns {boolean} The verdict.
 */
function isTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
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
 * @returns {LegSummary} The summary.
 */
export function summarizePlaywrightReport(report, { leg, runId = null, runAttempt = null } = {}) {
  if (!report || typeof report !== 'object' || !Array.isArray(report.suites)) {
    throw new Error('not a Playwright JSON report (no `suites` array)');
  }
  if (typeof leg !== 'string' || leg === '') {
    throw new Error('the leg name is required');
  }

  const { duration, startTime } = report.stats ?? {};

  if (!isAmount(duration)) {
    throw new Error('the report has no stats.duration, so the leg has no wall-clock');
  }
  if (!isTime(startTime)) {
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
    workers: isAmount(workers) ? workers : null,
    startTime,
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
  if (!Array.isArray(value.projects) || value.projects.some(project => typeof project !== 'string')) {
    fail('projects must be a list of names');
  }
  if (value.runId !== null && typeof value.runId !== 'string') {
    fail('runId must be a string or null');
  }
  if (value.runAttempt !== null && !(Number.isInteger(value.runAttempt) && value.runAttempt > 0)) {
    fail('runAttempt must be a positive integer or null');
  }
  if (value.workers !== null && !isAmount(value.workers)) {
    fail('workers must be a number or null');
  }
  if (!isTime(value.startTime)) {
    fail('startTime must be an ISO time');
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
  if (!Array.isArray(value.files)) {
    fail('files must be a list');
  }

  value.files.forEach((file, index) => {
    const at = `files[${index}]`;

    if (typeof file?.file !== 'string' || file.file === '') {
      fail(`${at}.file must be a non-empty string`);
    }
    if (typeof file.project !== 'string') {
      fail(`${at}.project must be a string`);
    }
    if (!isAmount(file.tests) || !isAmount(file.ms)) {
      fail(`${at}.tests and ${at}.ms must be non-negative numbers`);
    }
    if (!Array.isArray(file.cases)) {
      fail(`${at}.cases must be a list`);
    }

    file.cases.forEach((entry, caseIndex) => {
      if (typeof entry?.title !== 'string') {
        fail(`${at}.cases[${caseIndex}].title must be a string`);
      }
      if (!isAmount(entry.ms)) {
        fail(`${at}.cases[${caseIndex}].ms must be a non-negative number`);
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
 * Whether a run is a push to develop, the line every pull request is measured against.
 *
 * @param {{branch: string, event: string}} run The run or source.
 * @returns {boolean} The verdict.
 */
function isDevelop(run) {
  return run.branch === 'develop' && run.event !== 'pull_request';
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
 * @returns {object|null} The statistics, or `null` without samples.
 */
function legStatistics(samples) {
  if (samples.length === 0) {
    return null;
  }

  const walls = samples.map(sample => sample.wallMs);
  const tests = samples.map(sample => sample.tests);

  return {
    runs: samples.length,
    wallMs: { p50: percentile(walls, 50), p90: percentile(walls, 90) },
    tests: { p50: percentile(tests, 50), p90: percentile(tests, 90) },
  };
}

/**
 * The budget input: per leg, P50 and P90 of the wall-clock and the test count over the stored runs.
 *
 * @param {object[]} runs The stored runs.
 * @param {number} windowDays The retention window.
 * @returns {object} The budget block.
 */
function budgetOf(runs, windowDays) {
  const legs = new Map();
  let from = null;
  let to = null;

  for (const run of runs) {
    for (const leg of run.legs) {
      if (!legs.has(leg.leg)) {
        legs.set(leg.leg, { all: [], develop: [], excluded: 0 });
      }

      const bucket = legs.get(leg.leg);

      from = from === null || Date.parse(leg.at) < Date.parse(from) ? leg.at : from;
      to = to === null || Date.parse(leg.at) > Date.parse(to) ? leg.at : to;

      if (leg.unexpected > 0 || leg.tests === 0) {
        bucket.excluded += 1;
        continue;
      }

      bucket.all.push(leg);

      if (isDevelop(run)) {
        bucket.develop.push(leg);
      }
    }
  }

  return {
    windowDays,
    from,
    to,
    legs: Object.fromEntries([...legs.keys()].sort().map(name => [name, {
      all: legStatistics(legs.get(name).all),
      develop: legStatistics(legs.get(name).develop),
      excluded: legs.get(name).excluded,
    }])),
  };
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
  const files = {};

  for (const file of [...latest.cells.keys()].sort()) {
    const rows = [...latest.cells.get(file).entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, byColumn]) => [title, ...keys.map(key => byColumn.get(key) ?? null)])
      .filter(row => row.slice(1).some(value => value !== null));

    if (rows.length > 0) {
      files[file] = rows;
    }
  }

  return { sources: legs.map(leg => latest.sources.get(leg)), columns, files };
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
 * - The per-test rows of a leg come from its latest develop push; a newer develop push replaces them,
 *   a pull request run never does. With no develop push in the window, the newest run of any branch
 *   supplies them until one arrives. A leg that ran no test supplies none. Only a test that passed on
 *   its first attempt gets a cell: a failed or flaky test's time is its retries and timeouts (the flake
 *   ledger tracks those), and a skipped one never ran.
 * - The summaries are untrusted: a fork's pull request runs its own `e2e.yml`. A leg outside
 *   `DURATIONS_LEG_PATTERN`, the legs past `MAX_LEGS_PER_RUN`, and a leg that claims to start after the
 *   run ended are noted and skipped, so nothing can pin a record past the retention window.
 * - Records older than the retention window go, and so do a leg's rows. The rows get at most half the
 *   cap: past it, the rows of pull-request sources go first, then the oldest legs'. Past the cap, the
 *   oldest runs go first, whole.
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
 * @returns {{doc: object, changed: boolean, added: number, pruned: number, capped: number, notes: string[]}}
 * The new document; whether its text changed; how many leg records were new, and how many fell out of
 * the window; how many runs the cap dropped; notes for the step summary (skipped legs, dropped rows and runs).
 */
export function mergeDurations(previous, summaries, run, {
  now,
  retentionDays = DURATIONS_RETENTION_DAYS,
  capBytes = DURATIONS_CAP_BYTES,
}) {
  const notes = [];
  let prior = previous ?? null;

  if (prior !== null && prior?.version !== DURATIONS_VERSION) {
    notes.push(`durations.json had version ${prior?.version}, not ${DURATIONS_VERSION}; rebuilt it from this run`);
    prior = null;
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
  let added = 0;
  let accepted = 0;

  headers.set(run.runId, header);
  // An expired source never ranks: drop it before an incoming run is compared with it.
  pruneSources();

  for (const summary of summaries) {
    if (!DURATIONS_LEG_PATTERN.test(summary.leg)) {
      notes.push(`leg ${JSON.stringify(summary.leg.slice(0, 60))}: not a leg name, skipped`);
      continue;
    }
    if (accepted >= MAX_LEGS_PER_RUN) {
      notes.push(`leg ${summary.leg}: past the ${MAX_LEGS_PER_RUN} legs one run may record, skipped`);
      continue;
    }
    if (!(Date.parse(summary.startTime) <= latestStart)) {
      notes.push(`leg ${summary.leg}: starts at ${summary.startTime}, after run ${run.runId} ended, skipped`);
      continue;
    }

    accepted += 1;

    const ownRun = summary.runId === null || summary.runId === run.runId;

    if (!ownRun) {
      notes.push(`${summary.leg}: the durations were written by run ${summary.runId}, collected as run ${run.runId}`);
    }

    const runAttempt = ownRun && summary.runAttempt ? summary.runAttempt : run.runAttempt;
    const key = recordKey(run.runId, summary.leg, runAttempt);

    if (!records.has(key)) {
      added += 1;
    }

    records.set(key, {
      runId: run.runId,
      leg: {
        leg: summary.leg,
        runAttempt,
        at: summary.startTime,
        workers: summary.workers,
        wallMs: summary.wallMs,
        summedMs: summary.summedMs,
        tests: summary.counts.tests,
        skipped: summary.counts.skipped,
        flaky: summary.counts.flaky,
        unexpected: summary.counts.unexpected,
      },
    });

    // A leg that ran no test (its web server never started, a filter matched nothing) has no rows to give,
    // and must not wipe the rows of the leg's last run that had some.
    if (summary.counts.tests === 0) {
      continue;
    }

    const source = {
      leg: summary.leg,
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
    };
    const current = latest.sources.get(summary.leg);
    // Develop first, then the newer run. An equal rank is the same execution collected again, or a
    // tie no order could settle better: the incoming copy wins, which keeps a re-collection a no-op.
    const outranked = current !== undefined && (Number(isDevelop(current)) - Number(isDevelop(source))
      || Date.parse(current.at) - Date.parse(source.at)) > 0;

    if (!outranked) {
      removeLeg(latest, summary.leg);
      latest.sources.set(summary.leg, source);

      for (const file of summary.files) {
        const column = `${summary.leg}\u0000${file.project}`;

        if (!latest.cells.has(file.file)) {
          latest.cells.set(file.file, new Map());
        }

        const titles = latest.cells.get(file.file);

        for (const entry of file.cases) {
          // Passed on the first attempt: no status. A failed or flaky test's time is retries and timeouts.
          if (entry.status !== undefined) {
            continue;
          }
          if (!titles.has(entry.title)) {
            titles.set(entry.title, new Map());
          }
          titles.get(entry.title).set(column, entry.ms);
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
  // the other half. Past it, pull-request sources go first, then the oldest legs.
  const rowsBudget = Math.floor(capBytes / 2);
  const shed = [];
  let encodedLatest = encodeLatest(latest);

  while (latest.sources.size > 0 && Buffer.byteLength(JSON.stringify(encodedLatest)) > rowsBudget) {
    const [victim] = [...latest.sources.values()].sort((a, b) => Number(isDevelop(a)) - Number(isDevelop(b))
      || Date.parse(a.at) - Date.parse(b.at)
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
  let doc = assemble(null, runs);
  let size = Buffer.byteLength(serializeDurations(doc));

  // Drop the oldest runs until the text fits. The budget block shrinks or grows by a few bytes with
  // the runs it summarizes, so measure again after each round instead of trusting the estimate.
  while (size > capBytes && runs.length > 0) {
    let freed = 0;

    while (runs.length > 0 && freed < size - capBytes) {
      freed += Buffer.byteLength(JSON.stringify(runs.pop())) + 2;
      capped += 1;
    }

    doc = assemble(null, runs);
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

  return { doc, changed, added, pruned, capped, notes };
}

/**
 * What kind of run a record came from, for the page's colors.
 *
 * @param {{branch: string, event: string}} run The run.
 * @returns {'develop'|'pr'|'other'} A develop push, a pull request, or anything else (master, a release).
 */
function runKind(run) {
  if (isDevelop(run)) {
    return 'develop';
  }

  return run.event === 'pull_request' ? 'pr' : 'other';
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
    ? `${column.leg} · ${column.project.replace(/^e2e-/, '')}`
    : column.leg));
  const slowTestMs = doc.slowTestMs ?? SLOW_TEST_MS;
  const heaviestFiles = [];
  const slowTests = [];

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
    runs: doc.runs.map(run => [run.runId, runKind(run), run.branch, run.runUrl, run.headSha.slice(0, 10)]),
    // [run index, leg index, start time (ms since epoch), wall-clock ms, tests that ran, attempt, left out of the
    // budget (1: a test failed every attempt, or none ran) or not (0)]
    points: doc.runs.flatMap((run, runIndex) => run.legs.map(leg => [
      runIndex,
      legs.indexOf(leg.leg),
      Date.parse(leg.at),
      leg.wallMs,
      leg.tests,
      leg.runAttempt,
      leg.unexpected > 0 || leg.tests === 0 ? 1 : 0,
    ])),
    budget: doc.budget,
    heaviestFiles: heaviestFiles.slice(0, HEAVIEST_FILES),
    slowTests,
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
  // A file path from a pull request's artifact: a backtick in it would end the code span early.
  const heaviestFile = heaviest ? heaviest[0].replace(/`/g, '\'') : '';
  const heaviestText = heaviest
    ? `; heaviest file: \`${heaviestFile}\` (${minutes(heaviest[1].ms)} min summed over ${heaviest[1].legs.size} `
      + `leg${heaviest[1].legs.size === 1 ? '' : 's'})`
    : '';

  return `Playwright wall-clock: ${sorted.map(summary => `${summary.leg} ${minutes(summary.wallMs)} min`).join(', ')}`
    + `${workerText}${heaviestText}.`;
}
