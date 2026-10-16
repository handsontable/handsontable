import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  DURATIONS_CAP_BYTES,
  DURATIONS_RETENTION_DAYS,
  DURATIONS_VERSION,
  HEAVIEST_FILES,
  DURATIONS_LEGS,
  PLAYWRIGHT_DURATIONS_FILE,
  SLOW_TESTS_SHOWN,
  SLOW_TEST_MS,
  durationsView,
  emptyDurations,
  foldShardParts,
  isDevelopPush,
  mergeDurations,
  parseDurationSummary,
  parseLegArtifact,
  parseShardFlag,
  percentile,
  renderDurationsLine,
  serializeDurations,
  summarizePlaywrightReport,
} from '../lib/playwright-durations.mjs';
import { PLAYWRIGHT_JSON_REPORT, runContextFromRun } from '../lib/test-health.mjs';
import { repoRoot } from '../lib/repo-root.mjs';
import { job } from '../lib/workflow-text.mjs';

// A trimmed real report: five whole spec files of the classic leg of run 38380730524 (artifact
// 11805081390), with the run's real wall-clock, start time and worker count. Result payloads are cut
// to their first error line; nothing that the summarizer reads was changed.
const FIXTURE = path.join(import.meta.dirname, 'fixtures/playwright-report-classic.json');
const readFixture = () => JSON.parse(readFileSync(FIXTURE, 'utf8'));

const NOW = new Date('2026-10-13T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const DEEP_TITLE = 'walkontable inline-start header border refresh › with one declared column width '
  + '(the single-pass layout path) › takes the single-pass calculator path';
const SLOW_TITLE = 'context menu submenu hover delay › keeps the submenu open while the pointer travels '
  + 'diagonally to any of its items';
const RED_TITLE = 'clones, page scroll range and pointer bounds in the reverse split › tracks a drag that moves '
  + 'inside the page offset gap like the hidden twin (ltr)';

// A develop push: the only run the reducer records.
const RUN = {
  id: 38380730524,
  run_attempt: 1,
  html_url: 'https://github.com/handsontable/handsontable/actions/runs/38380730524',
  name: 'Develop',
  head_branch: 'develop',
  head_sha: '146c1ba4cb84d529c6f26f87823b4d4d6c8bea9a',
  event: 'push',
  // When the run ended: after every leg these tests start, the latest at NOW.
  updated_at: '2026-10-13T12:30:00Z',
};

/**
 * A leg summary with the fixture's tests, shifted to another start time and leg.
 *
 * @param {object} [options] What to change.
 * @param {string} [options.leg] The leg.
 * @param {string} [options.startTime] The run's start.
 * @param {string|null} [options.runId] The run id the summary names.
 * @param {number|null} [options.runAttempt] The attempt it names.
 * @param {number|null} [options.wallMs] Another wall-clock.
 * @param {number|null} [options.unexpected] Another failed-test count.
 * @param {number} [options.scale] A factor on every test's time.
 * @returns {object} The summary.
 */
function legSummary({
  leg = 'classic',
  startTime = '2026-10-13T10:20:47.267Z',
  runId = null,
  runAttempt = null,
  wallMs = null,
  unexpected = null,
  scale = 1,
} = {}) {
  const report = readFixture();

  report.stats.startTime = startTime;

  if (wallMs !== null) {
    report.stats.duration = wallMs;
  }
  if (scale !== 1) {
    const walk = (suite) => {
      suite.specs?.forEach(spec => spec.tests.forEach(entry => entry.results.forEach((result) => {
        result.duration *= scale;
      })));
      suite.suites?.forEach(walk);
    };

    report.suites.forEach(walk);
  }

  const summary = summarizePlaywrightReport(report, { leg, runId, runAttempt });

  if (unexpected !== null) {
    summary.counts.unexpected = unexpected;
  }

  return summary;
}

/**
 * A whole leg's summary cut into the parts its shards would upload: the spec files dealt round-robin,
 * heaviest first, each part with its own counts and summed time, and the leg's wall-clock, start, run
 * and attempt on every part (the shards run side by side). What `foldShardParts` must put back together.
 *
 * @param {object} summary A whole leg's summary.
 * @param {number} total The shards.
 * @returns {object[]} The parts, shard 1 first.
 */
function shardsOf(summary, total) {
  const parts = Array.from({ length: total }, (_, offset) => {
    const files = summary.files.filter((file, index) => index % total === offset);
    const counts = { tests: 0, skipped: 0, flaky: 0, unexpected: 0 };

    files.forEach(file => file.cases.forEach((entry) => {
      if (entry.status === 'skipped') {
        counts.skipped += 1;
      } else {
        counts.tests += 1;
      }
      if (entry.status === 'flaky' || entry.status === 'unexpected') {
        counts[entry.status] += 1;
      }
    }));

    return {
      ...summary,
      shard: { index: offset + 1, total },
      summedMs: files.reduce((sum, file) => sum + file.ms, 0),
      counts,
      files,
    };
  });

  // The parts add up to the whole's counts, forced ones included (`legSummary({ unexpected: 0 })` keeps the
  // fixture's two red cases): the part holding most of a count takes the difference.
  Object.keys(parts[0].counts).forEach((key) => {
    const delta = summary.counts[key] - parts.reduce((sum, part) => sum + part.counts[key], 0);
    const [heaviest] = [...parts].sort((a, b) => b.counts[key] - a.counts[key]);

    heaviest.counts[key] += delta;
  });

  return parts;
}

/**
 * `mergeDurations`, with every whole summary of a sharded leg first cut into its parts, the shape the
 * collector hands the reducer (one artifact per shard). A summary that already names its shard is passed
 * as it is, so the tests that build parts by hand keep them.
 *
 * @param {object|null} previous The stored document.
 * @param {object[]} summaries Whole summaries or parts.
 * @param {object} run The run.
 * @param {object} options The options.
 * @returns {object} What `mergeDurations` returns.
 */
function merge(previous, summaries, run, options) {
  const parts = summaries.flatMap(summary => (summary.shard === null && DURATIONS_LEGS[summary.leg] > 1
    ? shardsOf(summary, DURATIONS_LEGS[summary.leg])
    : [summary]));

  return mergeDurations(previous, parts, run, options);
}

const RUNS_URL = 'https://github.com/handsontable/handsontable/actions/runs';
const runOf = overrides => runContextFromRun({
  ...RUN,
  html_url: `${RUNS_URL}/${overrides?.id ?? RUN.id}`,
  ...overrides,
});
const developRun = runOf;

test('summarizePlaywrightReport reproduces the fixture\'s numbers: wall-clock, counts, per-file totals', () => {
  const summary = summarizePlaywrightReport(readFixture(), { leg: 'classic', runId: '38380730524', runAttempt: 1 });

  assert.equal(summary.version, DURATIONS_VERSION);
  assert.equal(summary.leg, 'classic');
  assert.deepEqual(summary.projects, ['e2e-classic']);
  assert.equal(summary.runId, '38380730524');
  assert.equal(summary.runAttempt, 1);
  assert.equal(summary.workers, 2);
  assert.equal(summary.startTime, '2026-10-13T10:20:47.267Z');
  assert.equal(summary.wallMs, 1089639, 'the report\'s wall-clock, rounded to a millisecond');
  // 50 tests in the five files: 43 passed, 2 failed twice (one retry each), 5 skipped.
  assert.deepEqual(summary.counts, { tests: 45, skipped: 5, flaky: 0, unexpected: 2 });
  assert.equal(summary.summedMs, 51226, 'every attempt of every test that ran, retries included');
  assert.deepEqual(summary.files.map(file => [file.file, file.project, file.tests, file.ms]), [
    ['e2e/submenu-hover-delay.spec.ts', 'e2e-classic', 7, 20010],
    ['e2e/page-offset-reverse-split-clones.spec.ts', 'e2e-classic', 11, 16656],
    ['e2e/walkontable/inline-start-border-refresh.spec.ts', 'e2e-classic', 13, 7205],
    ['e2e/notification-placement.spec.ts', 'e2e-classic', 13, 6848],
    ['e2e/amd-loader.spec.ts', 'e2e-classic', 1, 507],
  ], 'heaviest file first; a file counts the tests that ran, not the skipped ones');
  assert.equal(summary.files.reduce((sum, file) => sum + file.tests, 0), summary.counts.tests);
  assert.equal(summary.files.reduce((sum, file) => sum + file.ms, 0), summary.summedMs);
});

test('summarizePlaywrightReport keeps every test with its title path, status and retries', () => {
  const summary = summarizePlaywrightReport(readFixture(), { leg: 'classic' });
  const cases = summary.files.flatMap(file => file.cases.map(entry => ({ file: file.file, ...entry })));

  assert.equal(cases.length, 50, 'skipped tests are kept: the prune phase needs to see them');
  assert.equal(summary.runId, null, 'no run id outside CI');
  assert.equal(summary.runAttempt, null);

  const slow = cases.find(entry => entry.title === SLOW_TITLE);

  assert.deepEqual(slow, { file: 'e2e/submenu-hover-delay.spec.ts', title: SLOW_TITLE, ms: 9857 },
    'a passing test carries no status and no retries');

  const red = cases.find(entry => entry.title === RED_TITLE);

  assert.deepEqual(red, {
    file: 'e2e/page-offset-reverse-split-clones.spec.ts', title: RED_TITLE, ms: 4867, status: 'unexpected', retries: 1,
  }, 'both attempts count toward the time; the retry is named');
  assert.ok(cases.some(entry => entry.title === DEEP_TITLE), 'the title path joins every describe level');

  const skipped = cases.filter(entry => entry.status === 'skipped');

  assert.equal(skipped.length, 5);
  assert.ok(skipped.every(entry => entry.ms === 0 && entry.retries === undefined));
  assert.ok(cases.filter(entry => entry.ms > SLOW_TEST_MS).length === 3, 'two red tests and one slow pass over 3 s');
});

test('summarizePlaywrightReport takes the file from the enclosing suite, never from a spec field', () => {
  const report = readFixture();
  const amd = report.suites.find(suite => suite.file === 'e2e/amd-loader.spec.ts').suites[0];

  // A describe and a spec whose own `file` names a helper (as a test declared through a shared
  // function would) still belong to the spec file whose file-level suite holds them.
  amd.file = 'e2e/helpers/shared-test.ts';
  amd.specs[0].file = 'e2e/helpers/shared-test.ts';
  delete amd.specs[0].tests[0].projectName;
  amd.specs[0].tests[0].projectId = 'e2e-classic';

  const summary = summarizePlaywrightReport(report, { leg: 'classic' });

  assert.ok(summary.files.some(file => file.file === 'e2e/amd-loader.spec.ts' && file.tests === 1));
  assert.ok(!summary.files.some(file => file.file === 'e2e/helpers/shared-test.ts'));
  assert.deepEqual(summary.projects, ['e2e-classic'], 'projectId stands in for a missing projectName');
});

test('summarizePlaywrightReport splits a two-project leg per project and counts a flaky test once', () => {
  const report = readFixture();
  const walk = (suite) => {
    suite.specs?.forEach((spec) => {
      spec.tests = spec.tests.flatMap(entry => [
        { ...entry, projectName: 'e2e-webkit' },
        { ...structuredClone(entry), projectName: 'e2e-firefox' },
      ]);
    });
    suite.suites?.forEach(walk);
  };

  report.suites.forEach(walk);

  const amd = report.suites.find(suite => suite.file === 'e2e/amd-loader.spec.ts').suites[0].specs[0].tests[1];

  amd.status = 'flaky';
  amd.results = [{ ...amd.results[0], status: 'failed', duration: 1200 }, { ...amd.results[0], retry: 1 }];

  const summary = summarizePlaywrightReport(report, { leg: 'engines' });

  assert.deepEqual(summary.projects, ['e2e-firefox', 'e2e-webkit']);
  assert.deepEqual(summary.counts, { tests: 90, skipped: 10, flaky: 1, unexpected: 4 });
  assert.equal(summary.files.length, 10, 'one entry per file and project');

  const firefoxAmd = summary.files
    .find(file => file.file === 'e2e/amd-loader.spec.ts' && file.project === 'e2e-firefox');

  assert.deepEqual(firefoxAmd.cases, [{
    title: 'bundle on a page with an AMD loader › loads and renders while a global define.amd is present',
    ms: 1707,
    status: 'flaky',
    retries: 1,
  }]);
});

test('summarizePlaywrightReport refuses a report it cannot time', () => {
  const noStats = { ...readFixture(), stats: undefined };

  assert.throws(() => summarizePlaywrightReport(noStats, { leg: 'classic' }), /stats\.duration/);
  assert.throws(() => summarizePlaywrightReport(readFixture(), {}), /leg/);
  assert.throws(() => summarizePlaywrightReport(null, { leg: 'classic' }), /not a Playwright JSON report/);
});

test('parseDurationSummary accepts what the summarizer writes and rejects anything else', () => {
  const summary = JSON.parse(JSON.stringify(legSummary()));

  assert.deepEqual(parseDurationSummary(summary), summary);
  assert.throws(() => parseDurationSummary(null), /not an object/);
  assert.throws(() => parseDurationSummary({ ...summary, version: 99 }), /version 99/);
  assert.throws(() => parseDurationSummary({ ...summary, leg: '' }), /leg/);
  assert.throws(() => parseDurationSummary({ ...summary, wallMs: 'slow' }), /wallMs/);
  assert.throws(() => parseDurationSummary({ ...summary, startTime: 'yesterday' }), /startTime/);
  assert.throws(() => parseDurationSummary({ ...summary, files: {} }), /files/);
  assert.throws(() => parseDurationSummary({ ...summary, counts: { tests: 1 } }), /counts\.skipped/);
  assert.throws(() => parseDurationSummary({
    ...summary, files: [{ file: 'a', project: 'p', tests: 1, ms: 1, cases: [{ title: 'x' }] }],
  }), /files\[0\]\.cases\[0\]\.ms/);
});

test('parseDurationSummary takes only a UTC ISO start, a numeric run id, and bounded strings', () => {
  const summary = JSON.parse(JSON.stringify(legSummary()));
  const withCase = entry => ({ ...summary, files: [{ ...summary.files[0], cases: [entry] }] });

  // `Date.parse` reads this, comment and all; a fork could make the comment megabytes long.
  assert.ok(!Number.isNaN(Date.parse(`Tue Oct 13 2026 10:20:47 GMT+0000 (${'x'.repeat(5000)})`)));
  assert.throws(() => parseDurationSummary({
    ...summary, startTime: `Tue Oct 13 2026 10:20:47 GMT+0000 (${'x'.repeat(5000)})`,
  }), /startTime must be an ISO time in UTC/);
  assert.throws(() => parseDurationSummary({ ...summary, startTime: '2026-10-13T12:20:47+02:00' }), /startTime/);
  assert.throws(() => parseDurationSummary({ ...summary, runId: '1 [link](https://example.com)' }), /runId/);
  assert.throws(() => parseDurationSummary({ ...summary, projects: ['p'.repeat(101)] }), /projects/);
  assert.throws(() => parseDurationSummary({ ...summary, files: [{ ...summary.files[0], file: 'a'.repeat(501) }] }),
    /files\[0\]\.file must be a path of 1 to 500 characters/);
  assert.throws(() => parseDurationSummary(withCase({ title: 't'.repeat(2001), ms: 1 })), /title/);
  assert.throws(() => parseDurationSummary(withCase({ title: 't', ms: 1, status: 'passed' })), /status/);
  assert.throws(() => parseDurationSummary(withCase({ title: 't', ms: 1, retries: 0 })), /retries/);
  assert.throws(() => parseDurationSummary({
    ...summary,
    files: [{ ...summary.files[0], cases: Array.from({ length: 50001 }, () => ({ title: 't', ms: 1 })) }],
  }), /more than 50000 tests/);
});

test('summarizePlaywrightReport writes its start time in the one form the summary check accepts', () => {
  const report = readFixture();

  report.stats.startTime = 'Tue, 13 Oct 2026 10:20:47 GMT';
  assert.equal(summarizePlaywrightReport(report, { leg: 'classic' }).startTime, '2026-10-13T10:20:47.000Z');
});

test('percentile is nearest-rank and never interpolates', () => {
  const values = [10, 1, 9, 2, 8, 3, 7, 4, 6, 5];

  assert.equal(percentile(values, 50), 5);
  assert.equal(percentile(values, 90), 9);
  assert.equal(percentile([42], 90), 42);
  assert.equal(percentile([], 50), null);
  assert.deepEqual(values, [10, 1, 9, 2, 8, 3, 7, 4, 6, 5], 'the input is not sorted in place');
});

test('mergeDurations records a run per leg and freezes updatedAt on a true no-op', () => {
  const run = runOf();
  const legs = [legSummary({ leg: 'classic' }), legSummary({ leg: 'main', startTime: '2026-10-13T10:21:00.000Z' })];
  const first = merge(null, legs, run, { now: NOW });

  assert.equal(first.changed, true);
  assert.equal(first.added, 2);
  assert.equal(first.doc.version, DURATIONS_VERSION);
  assert.equal(first.doc.updatedAt, NOW.toISOString());
  assert.equal(first.doc.retentionDays, DURATIONS_RETENTION_DAYS);
  assert.equal(first.doc.runs.length, 1, 'one run, both legs under it');

  const [stored] = first.doc.runs;

  assert.deepEqual(
    { ...stored, legs: undefined },
    {
      runId: '38380730524',
      workflow: 'Develop',
      event: 'push',
      branch: 'develop',
      headSha: '146c1ba4cb84d529c6f26f87823b4d4d6c8bea9a',
      runUrl: 'https://github.com/handsontable/handsontable/actions/runs/38380730524',
      legs: undefined,
    }
  );
  assert.deepEqual(stored.legs[0], {
    leg: 'classic',
    runAttempt: 1,
    at: '2026-10-13T10:20:47.267Z',
    workers: 2,
    wallMs: 1089639,
    summedMs: 51226,
    tests: 45,
    skipped: 5,
    flaky: 0,
    unexpected: 2,
    // classic runs in two shards: the record keeps a row per part, [shard, attempt, wall-clock, tests], and the
    // span from the first part's start to the last part's end (equal to the wall-clock when they start together).
    shards: 2,
    spanMs: 1089639,
    parts: [[1, 1, 1089639, 21], [2, 1, 1089639, 24]],
  });

  const later = new Date(NOW.getTime() + 3600000);
  const again = merge(first.doc, legs, run, { now: later });

  assert.equal(again.changed, false, 're-collecting the same legs changes nothing');
  assert.equal(again.added, 0);
  assert.equal(again.doc.updatedAt, NOW.toISOString(), 'a no-op keeps the change time');
  assert.equal(serializeDurations(again.doc), serializeDurations(first.doc), 'byte-identical');
});

test('mergeDurations keys a leg by the attempt that ran it, so a re-run does not duplicate the others', () => {
  // "Re-run failed jobs" re-runs one leg; the other legs' artifacts from attempt 1 stay on the run, and
  // the collection of attempt 2 downloads them again. The summary names its own attempt.
  const first = merge(null, [
    legSummary({ leg: 'classic', runId: '38380730524', runAttempt: 1 }),
    legSummary({ leg: 'main', runId: '38380730524', runAttempt: 1 }),
  ], runOf(), { now: NOW });
  const secondAttempt = runOf({ run_attempt: 2 });
  const rerun = merge(first.doc, [
    legSummary({ leg: 'classic', runId: '38380730524', runAttempt: 1 }),
    legSummary({ leg: 'main', runId: '38380730524', runAttempt: 2, startTime: '2026-10-13T11:00:00.000Z' }),
  ], secondAttempt, { now: NOW });

  assert.equal(rerun.added, 1, 'only the re-run leg is new');
  assert.deepEqual(rerun.doc.runs[0].legs.map(leg => `${leg.leg}#${leg.runAttempt}`),
    ['classic#1', 'main#1', 'main#2']);
  assert.equal(rerun.doc.runs[0].runUrl, 'https://github.com/handsontable/handsontable/actions/runs/38380730524',
    'the run keeps its base page; a leg names its attempt');
  assert.equal(rerun.doc.latest.sources.find(source => source.leg === 'main').runAttempt, 2);
  assert.equal(rerun.doc.latest.sources.find(source => source.leg === 'main').runUrl,
    'https://github.com/handsontable/handsontable/actions/runs/38380730524/attempts/2');
});

test('mergeDurations prunes past the retention window, oldest first, and the latest rows too', () => {
  const old = merge(null, [legSummary({ leg: 'classic', startTime: '2026-09-10T10:00:00.000Z' })],
    runOf({ id: 1 }), { now: new Date('2026-09-10T12:00:00Z') });

  assert.equal(old.doc.runs.length, 1, 'inside the window when it was collected');

  const both = merge(old.doc, [legSummary({ leg: 'main' })], runOf({ id: 2 }), { now: NOW });

  assert.equal(both.pruned, 1, 'the September run is past 30 days');
  assert.deepEqual(both.doc.runs.map(run => run.runId), ['2']);
  assert.deepEqual(both.doc.latest.sources.map(source => source.leg), ['main'],
    'a leg whose latest rows are past the window drops off');

  const future = merge(both.doc, [], runOf({ id: 2 }), { now: new Date(NOW.getTime() + (40 * DAY)) });

  assert.equal(future.changed, true);
  assert.equal(future.pruned, 1);
  assert.deepEqual(future.doc.runs, []);
  assert.deepEqual(future.doc.latest.sources, []);
  assert.deepEqual(future.doc.latest.files, {});
  assert.equal(future.doc.updatedAt, new Date(NOW.getTime() + (40 * DAY)).toISOString());
});

test('mergeDurations holds the file under its cap by dropping the oldest runs, never the newest', () => {
  let doc = null;

  // Forty runs, so the run history outweighs the rows: the rows' half of the cap is not what binds here.
  for (let index = 0; index < 40; index += 1) {
    const startTime = new Date(NOW.getTime() - ((40 - index) * 3600000)).toISOString();

    doc = merge(doc, [legSummary({ leg: 'classic', startTime })], runOf({ id: 1000 + index }),
      { now: NOW }).doc;
  }

  const unbounded = Buffer.byteLength(serializeDurations(doc));
  const capBytes = unbounded - 600;
  const capped = merge(doc, [legSummary({ leg: 'classic', startTime: NOW.toISOString() })],
    runOf({ id: 2000 }), { now: NOW, capBytes });
  const size = Buffer.byteLength(serializeDurations(capped.doc));

  assert.ok(size <= capBytes, `${size} bytes must fit the ${capBytes}-byte cap`);
  assert.ok(capped.capped >= 2, 'at least the new run\'s size and the overshoot came off');
  assert.equal(capped.doc.runs[0].runId, '2000', 'the run just collected stays');
  assert.ok(!capped.doc.runs.some(run => run.runId === '1000'), 'the oldest run went first');
  assert.deepEqual(capped.doc.runs.map(run => run.runId),
    [...capped.doc.runs.map(run => run.runId)].sort().reverse(), 'still newest first');
  assert.equal(capped.doc.latest.sources.length, 1, 'rows inside their half of the cap stay');

  const again = merge(capped.doc, [legSummary({ leg: 'classic', startTime: NOW.toISOString() })],
    runOf({ id: 2000 }), { now: NOW, capBytes });

  assert.equal(again.changed, false, 'a capped file re-collected is still a no-op');
  assert.equal(DURATIONS_CAP_BYTES, 2 * 1024 * 1024);
});

test('the per-test rows get at most half the cap, the oldest legs\' rows first, so the history keeps the rest', () => {
  const older = legSummary({ leg: 'classic', startTime: '2026-10-13T10:00:00.000Z' });
  const newer = legSummary({ leg: 'main', startTime: '2026-10-13T11:00:00.000Z' });
  const both = merge(merge(null, [older], runOf({ id: 1 }), { now: NOW }).doc, [newer],
    runOf({ id: 2 }), { now: NOW }).doc;
  const oneLegRows = Buffer.byteLength(JSON.stringify(merge(null, [newer], runOf({ id: 2 }),
    { now: NOW }).doc.latest));
  // Room for one leg's rows in half the cap, not for two.
  const capBytes = (oneLegRows * 2) + 200;
  const shed = merge(both, [], runOf({ id: 2 }), { now: NOW, capBytes });

  assert.deepEqual(shed.doc.latest.sources.map(source => source.leg), ['main'], 'the older push\'s rows went');
  assert.match(shed.notes.join('\n'), /dropped the rows of classic/);
  assert.equal(shed.doc.runs.length, 2, 'the run history is untouched');
  assert.ok(Buffer.byteLength(serializeDurations(shed.doc)) <= capBytes);
});

test('the per-test rows follow each leg\'s latest push, and nothing but a develop push is recorded', () => {
  const first = merge(null, [legSummary({ leg: 'classic', startTime: '2026-10-12T10:00:00.000Z', scale: 2 })],
    runOf({ id: 2 }), { now: NOW });
  const later = merge(first.doc, [legSummary({ leg: 'classic', startTime: '2026-10-13T10:00:00.000Z' })],
    runOf({ id: 4 }), { now: NOW });
  const { latest } = later.doc;

  assert.equal(latest.sources[0].runId, '4');
  assert.deepEqual(latest.columns, [{ leg: 'classic', project: 'e2e-classic' }]);
  assert.deepEqual(latest.files['e2e/submenu-hover-delay.spec.ts'].find(row => row[0] === SLOW_TITLE),
    [SLOW_TITLE, 9857]);
  assert.equal(latest.files['e2e/notification-placement.spec.ts'].length, 13, 'a skipped test has no row');
  assert.ok(!latest.files['e2e/notification-placement.spec.ts']
    .some(entry => entry[0] === 'notification placement › a top-end toast sits in that corner of a LTR grid'));
  assert.equal(latest.files['e2e/page-offset-reverse-split-clones.spec.ts'].length, 9,
    'the two tests that failed both attempts have no row: their time is a timeout and a retry');
  assert.ok(!latest.files['e2e/page-offset-reverse-split-clones.spec.ts'].some(entry => entry[0] === RED_TITLE));

  // The collector passes develop pushes only; anything else reaching the reducer is a bug, not data.
  const others = [
    ['a pull request', { name: 'Tests', head_branch: 'feature/x', event: 'pull_request' }],
    ['a manual run on develop', { event: 'workflow_dispatch' }],
    ['the visual nightly on develop', { name: 'Visual nightly', event: 'schedule' }],
    ['a release push', { name: 'Publish', head_branch: 'release/18.2.0' }],
  ];

  for (const [label, overrides] of others) {
    assert.throws(() => merge(later.doc, [legSummary()], runOf({ id: 5, ...overrides }), { now: NOW }),
      /only develop pushes are recorded/, label);
    assert.equal(isDevelopPush(runOf(overrides)), false, label);
  }
  assert.equal(isDevelopPush(runOf()), true);
});

test('a re-run of an older develop push, days later, never replaces a newer commit\'s rows', () => {
  const newer = merge(null, [legSummary({ leg: 'classic', startTime: '2026-10-12T10:00:00.000Z' })],
    developRun({ id: 2000 }), { now: NOW }).doc;
  // "Re-run failed jobs" on develop run 1000, a day later: its legs start after run 2000's did.
  const rerun = legSummary({
    leg: 'classic',
    startTime: '2026-10-13T11:00:00.000Z',
    scale: 2,
    runId: '1000',
    runAttempt: 2,
  });
  const after = merge(newer, [rerun], developRun({ id: 1000, run_attempt: 2 }), { now: NOW }).doc;

  assert.deepEqual(after.latest.sources.map(source => [source.runId, source.runAttempt]), [['2000', 1]],
    'run ids follow commit order; start times do not');
  assert.equal(after.runs.length, 2, 'the re-run is still a record of its own');
});

test('a flaky test has no cell either, and a leg that ran no test keeps the rows it had', () => {
  const flaky = legSummary({ leg: 'classic', unexpected: 0 });
  const amd = flaky.files.find(file => file.file === 'e2e/amd-loader.spec.ts');

  amd.cases[0] = { ...amd.cases[0], status: 'flaky', retries: 1 };

  const { doc } = merge(null, [flaky], developRun({ id: 1 }), { now: NOW });

  assert.equal(doc.latest.files['e2e/amd-loader.spec.ts'], undefined, 'its only test was flaky');

  // The Playwright JSON reporter still writes a report when the web server never starts or a filter
  // matches nothing: no suites, zero tests.
  const dead = summarizePlaywrightReport({
    suites: [],
    stats: { startTime: '2026-10-13T11:00:00.000Z', duration: 63 },
    config: { workers: 2 },
  }, { leg: 'classic' });
  const after = merge(doc, [dead], developRun({ id: 2 }), { now: NOW });

  assert.equal(after.doc.latest.sources[0].runId, '1', 'the newer, empty develop leg did not take over');
  assert.equal(Object.keys(after.doc.latest.files).length, 4);
  assert.deepEqual(after.doc.runs.map(run => [run.runId, run.legs[0].tests]), [['2', 0], ['1', 45]],
    'the empty leg is still a record');
  assert.equal(after.doc.budget.legs.classic.excluded, 1, 'and stays out of the budget');
  assert.equal(durationsView(after.doc).points[0][6], 1, 'and is drawn like a failed leg, not as a clean zero');
});

test('mergeDurations records only the legs e2e.yml runs, and none that starts after its run ended', () => {
  const ended = runOf({ id: 3, updated_at: '2026-10-13T11:00:00Z' });
  const forged = [
    legSummary({ leg: '../../escape' }),
    // A fork's pull request can name its artifact anything; no develop push would ever replace this leg.
    legSummary({ leg: 'zzz' }),
    legSummary({ leg: 'classic', startTime: '2999-01-01T00:00:00.000Z' }),
    legSummary({ leg: 'main' }),
  ];
  const result = merge(null, forged, ended, { now: NOW });
  const notes = result.notes.join('\n');

  assert.match(notes, /leg "\.\.\/\.\.\/escape": not a leg e2e\.yml runs, skipped/);
  assert.match(notes, /leg "zzz": not a leg e2e\.yml runs, skipped/);
  assert.match(notes, /leg classic shard 1: starts at 2999-01-01T00:00:00\.000Z, after run 3 ended, skipped/);
  assert.match(notes, /leg classic shard 2: starts at 2999-01-01T00:00:00\.000Z, after run 3 ended, skipped/);
  assert.deepEqual(result.doc.runs[0].legs.map(leg => leg.leg), ['main']);
  assert.deepEqual(result.doc.latest.sources.map(source => source.leg), ['main']);
  assert.deepEqual(result.recorded.map(summary => summary.leg), ['main'], 'only what was stored is reported');
  assert.ok(result.doc.budget.to <= '2026-10-13T12:00:00.000Z', 'nothing is pinned past the window');
});

test('the leg table is exactly the legs e2e.yml runs, with the shards each one runs in', () => {
  // A change to the matrix (a leg, a shard count) fails here until DURATIONS_LEGS follows the workflow: the
  // reducer records only the legs on the table, and folds a leg's parts against the count there.
  const e2e = readFileSync(path.join(repoRoot(), '.github/workflows/e2e.yml'), 'utf8');
  const rows = [...job(e2e, 'playwright').matchAll(
    /^ {10}- \{ theme: (\w+), bundle: \{ label: '[^']+', suffix: '([^']*)' \}(?:, shard: (\d+), shards: (\d+))? \}$/gm
  )];
  const engines = job(e2e, 'playwright-engines').match(/playwright-durations\.mjs --leg (\S+)$/m)[1];
  const legs = { [engines]: 1 };

  assert.ok(rows.length > 0, 'read the explicit matrix rows of the playwright job');
  rows.forEach(([, theme, suffix, , shards]) => {
    legs[`${theme}${suffix}`] = Number(shards ?? 1);
  });
  assert.deepEqual(DURATIONS_LEGS, legs);
  assert.ok(Object.values(DURATIONS_LEGS).some(count => count > 1), 'at least one leg runs in shards');
});

test('the per-test rows hold one column per leg and project, null where a test did not run', () => {
  const legs = [
    legSummary({ leg: 'classic' }),
    legSummary({ leg: 'main', scale: 2 }),
  ];
  const { doc } = merge(null, legs, developRun(), { now: NOW });

  assert.deepEqual(doc.latest.columns,
    [{ leg: 'classic', project: 'e2e-classic' }, { leg: 'main', project: 'e2e-classic' }]);

  const row = doc.latest.files['e2e/submenu-hover-delay.spec.ts'].find(entry => entry[0] === SLOW_TITLE);

  assert.deepEqual(row, [SLOW_TITLE, 9857, 19714]);

  const withoutSubmenu = { ...legs[0], files: legs[0].files.filter(file => !file.file.includes('submenu')) };
  // A later develop push: its run id is higher than the first one's.
  const onlyMain = merge(doc, [withoutSubmenu], developRun({ id: 38380730600 }), { now: NOW }).doc;

  assert.deepEqual(onlyMain.latest.files['e2e/submenu-hover-delay.spec.ts'].find(entry => entry[0] === SLOW_TITLE),
    [SLOW_TITLE, null, 19714], 'a test the newer classic run no longer has keeps only its main cell');
});

test('the budget input is P50 and P90 per leg, one vote per push, without failed or empty legs', () => {
  let doc = null;
  const walls = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

  walls.forEach((wallMs, index) => {
    const startTime = new Date(NOW.getTime() - ((index + 1) * 3600000)).toISOString();

    doc = merge(doc, [legSummary({ leg: 'classic', startTime, wallMs, unexpected: 0 })],
      runOf({ id: 500 + index }), { now: NOW }).doc;
  });

  // A red leg's time includes retries of failing tests; it is not what the budget should learn from.
  const red = legSummary({ leg: 'classic', startTime: NOW.toISOString(), wallMs: 99999, unexpected: 3 });

  doc = merge(doc, [red], runOf({ id: 600 }), { now: NOW }).doc;

  // A leg with only a flaky test counts: one retry is noise next to the run-to-run spread.
  const flaky = legSummary({ leg: 'main', startTime: NOW.toISOString(), wallMs: 700, unexpected: 0 });

  flaky.counts.flaky = 1;
  doc = merge(doc, [flaky], runOf({ id: 601 }), { now: NOW }).doc;

  // "Re-run failed jobs": run 602's classic leg went red on a flake, and attempt 2 passed. One push, one vote.
  const attemptOf = (runAttempt, startTime, wallMs) => legSummary({
    leg: 'classic',
    startTime,
    wallMs,
    unexpected: 0,
    runId: '602',
    runAttempt,
  });
  const firstTry = attemptOf(1, '2026-10-13T11:40:00.000Z', 5000);
  const secondTry = attemptOf(2, '2026-10-13T11:50:00.000Z', 1100);

  firstTry.counts.flaky = 1;
  doc = merge(doc, [firstTry], runOf({ id: 602 }), { now: NOW }).doc;
  doc = merge(doc, [secondTry], runOf({ id: 602, run_attempt: 2 }), { now: NOW }).doc;

  const { classic, main } = doc.budget.legs;

  // classic: the ten pushes and attempt 2 of run 602, nearest rank over 11 values. `shards` is the count
  // the leg's latest record carries (DURATIONS_LEGS: classic 2, main 3).
  assert.deepEqual(classic, {
    runs: 11, wallMs: { p50: 600, p90: 1000 }, tests: { p50: 45, p90: 45 }, excluded: 1, shards: 2, workers: 2,
  });
  assert.deepEqual(main, {
    runs: 1, wallMs: { p50: 700, p90: 700 }, tests: { p50: 45, p90: 45 }, excluded: 0, shards: 3, workers: 2,
  });
  assert.equal(doc.budget.windowDays, DURATIONS_RETENTION_DAYS);
  assert.ok(doc.budget.from < doc.budget.to);

  // The page marks what the budget left out, and why: 1 failed or empty, 2 replaced by a later attempt.
  const view = durationsView(doc);
  const pointsOf = runId => view.points.filter(point => view.runs[point[0]][0] === runId)
    .map(point => [point[5], point[6]]);

  assert.deepEqual(pointsOf('602'), [[1, 2], [2, 0]]);
  assert.deepEqual(pointsOf('600'), [[1, 1]]);
  assert.deepEqual(pointsOf('501'), [[1, 0]]);
});

test('mergeDurations refuses a stored file of another version instead of rebuilding it from one run', () => {
  // The collector has no try/catch around it, like a durations.json it cannot parse: the job fails and the
  // month of history stays on gh-pages until a migration ships with the version bump.
  assert.throws(() => merge({ version: 0, runs: 'whatever' }, [legSummary()], runOf(), { now: NOW }),
    /durations\.json has version 0, and this collector reads and writes version 1/);
  assert.throws(() => merge({ version: 2 }, [], runOf(), { now: NOW }), /has version 2/);
  assert.deepEqual(merge(emptyDurations(), [], runOf(), { now: NOW }).notes, []);
});

test('a test that fails or flakes in a newer run keeps its last good time; a removed test loses its row', () => {
  const amdTitle = 'bundle on a page with an AMD loader › loads and renders while a global define.amd is present';
  const first = merge(null, [legSummary({ leg: 'classic' })], developRun({ id: 1 }), { now: NOW }).doc;
  const later = legSummary({ leg: 'classic', startTime: '2026-10-13T11:00:00.000Z', scale: 2 });
  const submenu = later.files.find(file => file.file === 'e2e/submenu-hover-delay.spec.ts');
  const amd = later.files.find(file => file.file === 'e2e/amd-loader.spec.ts');
  const notifications = later.files.find(file => file.file === 'e2e/notification-placement.spec.ts');
  const removed = notifications.cases.find(entry => !entry.status).title;

  submenu.cases = submenu.cases.map(entry => (entry.title === SLOW_TITLE
    ? { ...entry, ms: 40000, status: 'unexpected', retries: 1 } : entry));
  amd.cases = amd.cases.map(entry => ({ ...entry, ms: 5000, status: 'flaky', retries: 1 }));
  notifications.cases = notifications.cases.filter(entry => entry.title !== removed);

  const { latest } = merge(first, [later], developRun({ id: 2 }), { now: NOW }).doc;
  const cell = (file, title) => latest.files[file]?.find(row => row[0] === title)?.[1];

  assert.equal(latest.sources[0].runId, '2', 'the red develop push is the newer source');
  assert.equal(cell('e2e/submenu-hover-delay.spec.ts', SLOW_TITLE), 9857, 'the failed test keeps its time from run 1');
  assert.equal(cell('e2e/amd-loader.spec.ts', amdTitle), 507, 'the flaky test keeps its time from run 1');
  assert.equal(cell('e2e/notification-placement.spec.ts', removed), undefined, 'a test gone from the leg is gone');
  // Every test that passed first time takes the new run's time, which the scale doubled.
  const inline = 'e2e/walkontable/inline-start-border-refresh.spec.ts';

  assert.deepEqual(latest.files[inline], first.latest.files[inline].map(([title, ms]) => [title, ms * 2]));
});

test('serializeDurations writes one run and one spec file per line, and round-trips', () => {
  const { doc } = merge(null, [legSummary({ leg: 'classic' })], developRun(), { now: NOW });
  const text = serializeDurations(doc);

  assert.deepEqual(JSON.parse(text), doc);
  assert.ok(text.endsWith('}\n'));
  assert.equal(text.split('\n').filter(line => line.startsWith('{"runId":')).length, 1);
  assert.equal(text.split('\n').filter(line => line.startsWith('"e2e/')).length, 5);
  assert.deepEqual(JSON.parse(serializeDurations(emptyDurations())), emptyDurations());
});

test('a spec file named __proto__ is a row like any other', () => {
  const odd = legSummary({ leg: 'classic', unexpected: 0 });

  odd.files[0] = { ...odd.files[0], file: '__proto__' };

  const { doc } = merge(null, [odd], developRun(), { now: NOW });

  const own = files => Object.getOwnPropertyDescriptor(files, '__proto__')?.value;

  assert.ok(Object.hasOwn(doc.latest.files, '__proto__'));
  assert.deepEqual(own(JSON.parse(serializeDurations(doc)).latest.files), own(doc.latest.files));
  assert.ok(durationsView(doc).heaviestFiles.some(file => file.file === '__proto__'));
});

test('a two-project leg labels its slow tests by engine in parentheses', () => {
  const engines = legSummary({ leg: 'engines' });

  engines.projects = ['e2e-firefox', 'e2e-webkit'];
  engines.files = engines.files
    .flatMap(file => [{ ...file, project: 'e2e-firefox' }, { ...file, project: 'e2e-webkit' }]);

  const view = durationsView(merge(null, [engines], developRun(), { now: NOW }).doc);

  assert.deepEqual(view.slowTests[0].legs.map(([label]) => label), ['engines (firefox)', 'engines (webkit)']);
});

test('durationsView ranks the heaviest spec files, lists the slow tests, and names each push by run and commit', () => {
  let doc = merge(null, [legSummary({ leg: 'classic' }), legSummary({ leg: 'main', scale: 2 })],
    developRun({ id: 7 }), { now: NOW }).doc;

  doc = merge(doc, [legSummary({ leg: 'classic', startTime: '2026-10-13T11:00:00.000Z' })],
    runOf({ id: 8 }), { now: NOW }).doc;
  doc = merge(doc, [legSummary({ leg: 'classic', startTime: '2026-10-13T11:30:00.000Z' })],
    runOf({ id: 9 }), { now: NOW }).doc;

  const view = durationsView(doc);

  assert.deepEqual(view.legs, ['classic', 'main']);
  assert.deepEqual(view.runs, [['9', '146c1ba4cb'], ['8', '146c1ba4cb'], ['7', '146c1ba4cb']], 'newest first');
  assert.equal(view.points.length, 4, 'one point per leg and attempt');
  assert.equal(view.heaviestFiles.length, 5, `at most ${HEAVIEST_FILES}, here every file`);
  assert.deepEqual(view.heaviestFiles[0], {
    file: 'e2e/submenu-hover-delay.spec.ts',
    ms: 60030,
    tests: 7,
    executions: 14,
    legs: [['main', 40020], ['classic', 20010]],
  });
  // The two tests that failed both attempts are not listed: their time is a timeout and a retry.
  assert.equal(view.slowTests[0].title, SLOW_TITLE);
  assert.ok(!view.slowTests.some(entry => entry.title === RED_TITLE));
  assert.deepEqual(view.slowTests[0].legs, [['main', 19714], ['classic', 9857]]);
  assert.ok(view.slowTests.length > 1);
  assert.ok(view.slowTests.every(entry => entry.ms > SLOW_TEST_MS));
  assert.ok(view.slowTests.slice(1).every(entry => entry.legs.length === 1 && entry.legs[0][0] === 'main'),
    'under 3 s on classic, over on main (scaled twice): listed for main only');
  assert.equal(view.sources.length, 2);
  assert.equal(view.slowTestCount, view.slowTests.length, 'under the cap, every slow test is listed');
  assert.equal(durationsView(emptyDurations()), null, 'nothing collected yet: the page says so');
});

test('the page lists at most SLOW_TESTS_SHOWN slow tests, slowest first, and counts them all', () => {
  const many = legSummary({ leg: 'classic' });

  many.files.push({
    file: 'e2e/many-slow.spec.ts',
    project: 'e2e-classic',
    tests: 250,
    ms: 0,
    cases: Array.from({ length: 250 },
      (_, index) => ({ title: `slow ${String(index).padStart(3, '0')}`, ms: 3100 + index })),
  });

  const view = durationsView(merge(null, [many], developRun(), { now: NOW }).doc);

  assert.equal(view.slowTests.length, SLOW_TESTS_SHOWN);
  assert.equal(view.slowTestCount, 251, 'the 250 above and the fixture\'s own slow test');
  assert.equal(view.slowTests[0].title, SLOW_TITLE);
  assert.equal(view.slowTests[1].title, 'slow 249');
});

test('renderDurationsLine names each leg\'s wall-clock and the heaviest file of the run', () => {
  const line = renderDurationsLine([legSummary({ leg: 'main', scale: 2 }), legSummary({ leg: 'classic' })]);

  assert.equal(line, 'Playwright wall-clock: classic 18.2 min, main 18.2 min (2 workers); heaviest file: '
    + '`e2e/submenu-hover-delay.spec.ts` (1.0 min summed over 2 legs).');
  assert.equal(renderDurationsLine([]), 'Playwright wall-clock: no `playwright-durations-*` artifact on this run.');

  // The path comes from a pull request's artifact: a line break must not end the code span and let the
  // rest render as Markdown in the base repository's step summary.
  const forged = legSummary({ leg: 'main' });

  forged.files[0].file = 'e2e/x`y\n\n# heading\n[link](https://example.com).spec.ts';

  const escaped = renderDurationsLine([forged]);

  assert.ok(!escaped.includes('\n'), 'one line');
  assert.ok(escaped.includes('`e2e/x\'y # heading [link](https://example.com).spec.ts`'));
});

test('the summary file sits beside the JSON report it is made from', () => {
  // The same directory: the summarizer writes next to the reporter's file, Playwright clears it at the start
  // of a run (so a stale summary never survives a crashed leg), and the failure upload ships all of it.
  assert.equal(path.posix.dirname(PLAYWRIGHT_DURATIONS_FILE), path.posix.dirname(PLAYWRIGHT_JSON_REPORT));
  assert.notEqual(PLAYWRIGHT_DURATIONS_FILE, PLAYWRIGHT_JSON_REPORT);
});

// Shards: a leg over the wall-clock target runs as several jobs (`--shard=<i>/<n>`), each uploading its own
// part; the collector folds the parts back into the leg (`foldShardParts`, DURATIONS_LEGS for the count).

test('parseShardFlag reads <index>/<total> as Playwright\'s --shard takes it, and nothing else', () => {
  assert.deepEqual(parseShardFlag('2/3'), { index: 2, total: 3 });
  assert.deepEqual(parseShardFlag('1/1'), { index: 1, total: 1 });

  for (const bad of ['3/2', '0/3', '1/0', '1', '1/3/5', ' 1/3', '1/3\n', 'a/b', '', undefined, '01/3']) {
    assert.throws(() => parseShardFlag(bad), /<index>\/<total> with 1 <= index <= total/, JSON.stringify(bad));
  }
});

test('parseLegArtifact names the leg and the shard from an artifact\'s suffix', () => {
  assert.deepEqual(parseLegArtifact('main-s2'), { leg: 'main', shard: 2 });
  assert.deepEqual(parseLegArtifact('main-min-s10'), { leg: 'main-min', shard: 10 });
  assert.deepEqual(parseLegArtifact('classic-min'), { leg: 'classic-min', shard: null });
  assert.deepEqual(parseLegArtifact('engines'), { leg: 'engines', shard: null });
  assert.deepEqual(parseLegArtifact('main-s0'), { leg: 'main-s0', shard: null }, 'shards count from 1');
  assert.deepEqual(parseLegArtifact('-s1'), { leg: '-s1', shard: null }, 'a shard needs a leg before it');
});

test('summarizePlaywrightReport records the shard it was told, and the summary check reads old and new parts', () => {
  const summary = summarizePlaywrightReport(readFixture(), { leg: 'classic', shard: { index: 2, total: 2 } });

  assert.deepEqual(summary.shard, { index: 2, total: 2 });
  assert.equal(summarizePlaywrightReport(readFixture(), { leg: 'classic' }).shard, null, 'a whole leg');
  assert.throws(() => summarizePlaywrightReport(readFixture(), { leg: 'classic', shard: { index: 3, total: 2 } }), /shard/);
  assert.throws(() => summarizePlaywrightReport(readFixture(), { leg: 'classic', shard: '1/2' }), /shard/);

  const written = JSON.parse(JSON.stringify(summary));

  assert.deepEqual(parseDurationSummary(written), written);
  assert.throws(() => parseDurationSummary({ ...written, shard: { index: 0, total: 2 } }), /shard/);
  assert.throws(() => parseDurationSummary({ ...written, shard: [1, 2] }), /shard/);
  assert.throws(() => parseDurationSummary({ ...written, shard: { index: 1 } }), /shard/);

  const { shard, ...older } = written;

  assert.deepEqual(parseDurationSummary(older), older, 'a part written before shards existed still reads (as a whole leg)');
});

test('foldShardParts puts a leg back together: the longest part is the wall-clock, everything else adds up', () => {
  const whole = legSummary({ leg: 'classic', runId: '7', runAttempt: 1 });
  const [first, second] = shardsOf(whole, 2);

  // The second shard ran 30 s longer and started 3 s later.
  second.wallMs = whole.wallMs + 30000;
  second.startTime = '2026-10-13T10:20:50.000Z';

  const { summary, missing, notes } = foldShardParts('classic', [second, first], 2);

  assert.deepEqual(missing, []);
  assert.deepEqual(notes, []);
  assert.equal(summary.leg, 'classic');
  assert.equal(summary.wallMs, whole.wallMs + 30000, 'the shards run side by side: the leg takes as long as its longest');
  assert.equal(summary.startTime, whole.startTime, 'the earliest part');
  assert.equal(summary.summedMs, whole.summedMs);
  assert.deepEqual(summary.counts, whole.counts);
  assert.deepEqual(summary.projects, whole.projects);
  assert.equal(summary.runId, '7');
  assert.equal(summary.runAttempt, 1);
  assert.equal(summary.workers, 2);
  assert.equal(summary.shard, null, 'the fold is the whole leg');
  assert.equal(summary.version, DURATIONS_VERSION);

  const byFile = files => Object.fromEntries(files.map(file => [file.file, [file.project, file.tests, file.ms, file.cases.length]]));

  assert.deepEqual(byFile(summary.files), byFile(whole.files), 'every file with the totals the whole leg had');
  assert.deepEqual(summary.files.map(file => file.file), whole.files.map(file => file.file), 'heaviest first, as a whole leg');
  assert.deepEqual(summary.shards, {
    total: 2,
    // First start to last end: the second part started 2,733 ms later and ran 30 s longer.
    spanMs: whole.wallMs + 30000 + 2733,
    parts: [first, second].map(part => ({
      index: part.shard.index,
      runAttempt: 1,
      startTime: part.startTime,
      workers: 2,
      wallMs: part.wallMs,
      summedMs: part.summedMs,
      ...part.counts,
    })),
    missing: [],
  });
});

test('foldShardParts merges a spec file Playwright dealt across two shards', () => {
  // `fullyParallel` deals at test granularity, so one file's tests can land in two shards.
  const whole = legSummary({ leg: 'horizon' });
  const [submenu, ...rest] = whole.files;
  const countsOf = files => files.flatMap(file => file.cases).reduce((counts, entry) => {
    counts[entry.status === 'skipped' ? 'skipped' : 'tests'] += 1;

    if (entry.status === 'flaky' || entry.status === 'unexpected') {
      counts[entry.status] += 1;
    }

    return counts;
  }, { tests: 0, skipped: 0, flaky: 0, unexpected: 0 });
  const slice = cases => ({
    ...submenu,
    tests: cases.filter(entry => entry.status !== 'skipped').length,
    ms: cases.reduce((sum, entry) => sum + entry.ms, 0),
    cases,
  });
  const part = (index, files) => ({
    ...whole,
    shard: { index, total: 2 },
    files,
    counts: countsOf(files),
    summedMs: files.reduce((sum, file) => sum + file.ms, 0),
  });
  const first = part(1, [slice(submenu.cases.slice(0, 4)), ...rest.slice(0, 2)]);
  const second = part(2, [slice(submenu.cases.slice(4)), ...rest.slice(2)]);
  const { summary } = foldShardParts('horizon', [first, second], 2);
  const merged = summary.files.find(file => file.file === submenu.file);

  assert.equal(summary.files.length, whole.files.length, 'one entry per file and project, not per part');
  assert.deepEqual([merged.tests, merged.ms], [submenu.tests, submenu.ms]);
  assert.deepEqual(merged.cases, submenu.cases, 'the cases in shard order');
  assert.deepEqual(summary.counts, whole.counts);
  assert.equal(summary.summedMs, whole.summedMs);
});

test('foldShardParts names the shards without a part, skips a part for a shard the leg does not have, and notes a total that disagrees', () => {
  const whole = legSummary({ leg: 'main' });
  const [s1, s2, s3] = shardsOf(whole, 3);
  const partial = foldShardParts('main', [s3, s1], 3);

  assert.deepEqual(partial.missing, [2]);
  assert.deepEqual(partial.notes, []);
  assert.equal(partial.summary.counts.tests, s1.counts.tests + s3.counts.tests);
  assert.deepEqual(partial.summary.shards.parts.map(part => part.index), [1, 3]);
  assert.deepEqual(partial.summary.shards.missing, [2]);

  const stray = foldShardParts('main', [s1, { ...s2, shard: { index: 4, total: 4 } }], 3);

  assert.match(stray.notes.join('\n'), /^leg main: a part for shard 4, and e2e\.yml runs the leg in 3; skipped$/m);
  assert.deepEqual(stray.missing, [2, 3]);

  const disagree = foldShardParts('main', [{ ...s1, shard: { index: 1, total: 2 } }, s2, s3], 3);

  assert.match(disagree.notes.join('\n'), /^leg main: the part for shard 1 says 2 shards; e2e\.yml runs 3$/m);
  assert.deepEqual(disagree.missing, [], 'the table decides the count, so the leg is whole');
  assert.deepEqual(foldShardParts('main', [], 3), { summary: null, missing: [1, 2, 3], notes: [] });

  // An unsharded leg is one part without a shard, read as shard 1 of 1.
  const one = foldShardParts('main-min', [legSummary({ leg: 'main-min' })], 1);

  assert.deepEqual(one.missing, []);
  assert.equal(one.summary.shards.total, 1);
  assert.deepEqual(one.summary.shards.parts.map(part => part.index), [1]);
  assert.equal(one.summary.wallMs, whole.wallMs);
});

test('mergeDurations records a sharded leg as one record with a row per part, and a partial leg as left out', () => {
  // `unexpected: 0`: the fixture's two red tests would leave every push out of the budget.
  const parts = shardsOf(legSummary({ leg: 'main', runId: '38380730524', runAttempt: 1, unexpected: 0 }), 3);
  const full = mergeDurations(null, parts, runOf(), { now: NOW });
  const [record] = full.doc.runs[0].legs;

  assert.equal(full.added, 1, 'one record for the leg, not three');
  assert.deepEqual(full.notes, []);
  assert.equal(record.leg, 'main');
  assert.equal(record.shards, 3);
  assert.deepEqual(record.parts, parts.map((part, index) => [index + 1, 1, part.wallMs, part.counts.tests]),
    'a row per part: [shard, attempt, wall-clock ms, tests]');
  assert.equal(record.missing, undefined, 'whole');
  assert.equal(record.tests, 45);
  assert.equal(record.wallMs, parts[0].wallMs);
  assert.equal(full.doc.latest.sources[0].shards, 3);
  assert.deepEqual(full.doc.latest.sources[0].parts, record.parts);
  assert.equal(Object.keys(full.doc.latest.files).length, 5, 'the rows come from every part');
  assert.match(renderDurationsLine(full.recorded), /^Playwright wall-clock: main 18\.2 min \(3 shards\) \(2 workers\)/);

  // The same parts an hour later, in another order: nothing changes.
  const again = mergeDurations(full.doc, [parts[2], parts[0], parts[1]], runOf(), { now: new Date(NOW.getTime() + 3600000) });

  assert.equal(again.changed, false);
  assert.equal(again.added, 0);

  // A later push with a shard missing: a partial record, left out of the budget, the rows still the whole push's.
  const later = shardsOf(legSummary({
    leg: 'main', startTime: '2026-10-13T11:00:00.000Z', scale: 2, runId: '38380730600', runAttempt: 1, unexpected: 0,
  }), 3);
  const partial = mergeDurations(full.doc, [later[0], later[2]], runOf({ id: 38380730600 }), { now: NOW });
  const [newer] = partial.doc.runs[0].legs;

  assert.equal(partial.doc.runs[0].runId, '38380730600');
  assert.deepEqual(newer.missing, [2]);
  assert.equal(newer.shards, 3);
  assert.deepEqual(newer.parts.map(part => part[0]), [1, 3]);
  assert.match(partial.notes.join('\n'),
    /^leg main: no part for shard 2 of 3; recorded as partial, left out of the budget, and its per-test rows are the run before's$/m);
  assert.equal(partial.doc.latest.sources[0].runId, '38380730524', 'the rows stay the whole push\'s');
  assert.deepEqual(partial.doc.budget.legs.main, {
    runs: 1, wallMs: { p50: 1089639, p90: 1089639 }, tests: { p50: 45, p90: 45 }, excluded: 1, shards: 3, workers: 2,
  });
  assert.equal(record.spanMs, record.wallMs, 'parts that start together span their longest part');
  assert.equal(full.doc.latest.sources[0].spanMs, record.wallMs);
  assert.match(renderDurationsLine(partial.recorded), /^Playwright wall-clock: main 18\.2 min \(2 of 3 shards\) \(2 workers\)/);

  const view = durationsView(partial.doc);
  const pointOf = runId => view.points.find(point => view.runs[point[0]][0] === runId);

  assert.equal(pointOf('38380730600')[6], 3, 'drawn as left out: a shard has no part');
  assert.deepEqual(pointOf('38380730600')[7], newer.parts, 'the page lists the parts under the point');
  assert.equal(pointOf('38380730524')[6], 0);
  assert.equal(pointOf('38380730524')[7].length, 3);
  assert.equal(durationsView(mergeDurations(null, [legSummary({ leg: 'main-min' })], runOf(), { now: NOW }).doc).points[0][7],
    null, 'a whole leg has no parts to list');
});

test('"Re-run failed jobs" re-runs one shard: the record takes the latest attempt, and the parts keep their own', () => {
  const [s1, s2, s3] = shardsOf(legSummary({ leg: 'main', runId: '602', runAttempt: 1, unexpected: 0 }), 3);
  const first = mergeDurations(null, [s1, s2, s3], runOf({ id: 602 }), { now: NOW });
  // Shard 2 went red on a flake; its re-run passed, and the collection of attempt 2 downloads the other two
  // shards' attempt-1 parts again.
  const rerun = { ...s2, runAttempt: 2, startTime: '2026-10-13T11:00:00.000Z', wallMs: 5000 };
  const second = mergeDurations(first.doc, [s1, rerun, s3], runOf({ id: 602, run_attempt: 2 }), { now: NOW });

  assert.equal(second.added, 1);
  assert.deepEqual(second.doc.runs[0].legs.map(leg => [leg.runAttempt, leg.parts.map(part => part[1]), leg.wallMs]),
    [[1, [1, 1, 1], s1.wallMs], [2, [1, 2, 1], s1.wallMs]], 'attempt 2 is the leg\'s final state: two old parts and the new one');
  assert.equal(second.doc.latest.sources[0].runAttempt, 2);
  assert.equal(second.doc.budget.legs.main.runs, 1, 'one vote per push: attempt 2');

  const view = durationsView(second.doc);

  assert.deepEqual(view.points.map(point => [point[5], point[6]]).sort(), [[1, 2], [2, 0]], 'attempt 1 superseded');
});

test('the span is first start to last end: shards that queue fold to a short wall-clock and a long span', () => {
  const [s1, s2, s3] = shardsOf(legSummary({ leg: 'main', unexpected: 0, wallMs: 300000 }), 3);
  const at = minutes => new Date(Date.parse('2026-10-13T10:00:00.000Z') + (minutes * 60000)).toISOString();
  const staggered = [
    { ...s1, startTime: at(0) },
    { ...s2, startTime: at(10) },
    { ...s3, startTime: at(20) },
  ];
  const { summary } = foldShardParts('main', staggered, 3);

  assert.equal(summary.wallMs, 300000, 'what the leg costs when its shards start together');
  assert.equal(summary.shards.spanMs, 1500000, 'what the pull request waited: 20 min of queueing plus the last 5-min shard');
  assert.equal(summary.startTime, at(0));

  const { doc } = mergeDurations(null, staggered, developRun(), { now: NOW });
  const [record] = doc.runs[0].legs;

  assert.deepEqual([record.wallMs, record.spanMs], [300000, 1500000]);
  assert.deepEqual(doc.latest.sources[0].spanMs, 1500000);

  const [point] = durationsView(doc).points;

  assert.equal(point[8], 1500000, 'the page shows the span under the point');
  assert.equal(durationsView(mergeDurations(null, [legSummary({ leg: 'main-min' })], developRun(), { now: NOW }).doc).points[0][8],
    null, 'a whole leg has no span of its own');
});

test('a part without a shard for a sharded leg is an older whole leg: recorded as one alone, skipped beside shard parts', () => {
  // A "Re-run failed jobs" of a push from before the shards uploads `playwright-durations-main`, no `-s<i>`.
  const whole = legSummary({ leg: 'main', unexpected: 0 });
  const alone = foldShardParts('main', [whole], 3);

  assert.deepEqual(alone.missing, [], 'not partial: it is the whole leg');
  assert.equal(alone.summary.shards.total, 1);
  assert.equal(alone.summary.counts.tests, 45);
  assert.deepEqual(alone.notes, [
    'leg main: an unsharded part for a leg e2e.yml runs in 3 shards (a run from before the shards); recorded as a whole leg',
  ]);

  const recorded = mergeDurations(null, [whole], developRun(), { now: NOW });
  const [record] = recorded.doc.runs[0].legs;

  assert.equal(record.shards, undefined, 'recorded in the shape from before shards existed');
  assert.equal(record.parts, undefined);
  assert.equal(record.missing, undefined);
  assert.match(recorded.notes.join('\n'), /recorded as a whole leg/);
  assert.equal(recorded.doc.budget.legs.main.shards, 1, 'the budget sees a whole leg');

  const [s1, , s3] = shardsOf(whole, 3);
  const mixed = foldShardParts('main', [s1, whole, s3], 3);

  assert.deepEqual(mixed.missing, [2]);
  assert.deepEqual(mixed.summary.shards.parts.map(part => part.index), [1, 3]);
  assert.equal(mixed.summary.counts.tests, s1.counts.tests + s3.counts.tests, 'the whole part was not read as shard 1');
  assert.deepEqual(mixed.notes, ['leg main: an unsharded part beside 2 shard part(s); the unsharded one is skipped']);
});

test('the budget counts only the records of a leg\'s latest shape: a change of shards or workers starts it over', () => {
  let doc = null;
  const at = index => new Date(NOW.getTime() - ((10 - index) * 3600000)).toISOString();

  // Five unsharded pushes on 2 workers at about 17 minutes (the shape before this change).
  for (let index = 0; index < 5; index += 1) {
    const old = legSummary({ leg: 'main', startTime: at(index), wallMs: 1000000, unexpected: 0 });

    doc = mergeDurations(doc, [old], runOf({ id: 100 + index }), { now: NOW }).doc;
  }
  // Two sharded pushes on 4 workers at five minutes.
  for (let index = 5; index < 7; index += 1) {
    const parts = shardsOf(legSummary({ leg: 'main', startTime: at(index), wallMs: 300000, unexpected: 0 }), 3)
      .map(part => ({ ...part, workers: 4 }));

    doc = mergeDurations(doc, parts, runOf({ id: 100 + index }), { now: NOW }).doc;
  }

  assert.deepEqual(doc.budget.legs.main, {
    runs: 2, wallMs: { p50: 300000, p90: 300000 }, tests: { p50: 45, p90: 45 }, excluded: 5, shards: 3, workers: 4,
  }, 'the five 17-minute records are left out, not mixed into a "3 shards" P50');

  const view = durationsView(doc);
  const flags = Object.fromEntries(view.points.map(point => [view.runs[point[0]][0], point[6]]));

  assert.deepEqual(flags, { 100: 4, 101: 4, 102: 4, 103: 4, 104: 4, 105: 0, 106: 0 },
    'the page marks the other shape as left out (4), the current shape as counted');

  // A push on the same 3 shards but back on 2 workers is another shape too.
  const twoWorkers = shardsOf(legSummary({ leg: 'main', startTime: at(7), wallMs: 500000, unexpected: 0 }), 3);
  const back = mergeDurations(doc, twoWorkers, runOf({ id: 107 }), { now: NOW }).doc;

  assert.deepEqual([back.budget.legs.main.runs, back.budget.legs.main.excluded, back.budget.legs.main.workers], [1, 7, 2],
    'the latest push sets the shape, so the two 4-worker pushes are now the ones left out');
});
