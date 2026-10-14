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
  mergeDurations,
  parseDurationSummary,
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

const RUN = {
  id: 38380730524,
  run_attempt: 1,
  html_url: 'https://github.com/handsontable/handsontable/actions/runs/38380730524',
  name: 'Tests',
  head_branch: 'feature/X-1_Some-branch',
  head_sha: '146c1ba4cb84d529c6f26f87823b4d4d6c8bea9a',
  event: 'pull_request',
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

const RUNS_URL = 'https://github.com/handsontable/handsontable/actions/runs';
const runOf = overrides => runContextFromRun({
  ...RUN,
  html_url: `${RUNS_URL}/${overrides?.id ?? RUN.id}`,
  ...overrides,
});
const developRun = overrides => runOf({ name: 'Develop', head_branch: 'develop', event: 'push', ...overrides });

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
  const first = mergeDurations(null, legs, run, { now: NOW });

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
      workflow: 'Tests',
      event: 'pull_request',
      branch: 'feature/X-1_Some-branch',
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
  });

  const later = new Date(NOW.getTime() + 3600000);
  const again = mergeDurations(first.doc, legs, run, { now: later });

  assert.equal(again.changed, false, 're-collecting the same legs changes nothing');
  assert.equal(again.added, 0);
  assert.equal(again.doc.updatedAt, NOW.toISOString(), 'a no-op keeps the change time');
  assert.equal(serializeDurations(again.doc), serializeDurations(first.doc), 'byte-identical');
});

test('mergeDurations keys a leg by the attempt that ran it, so a re-run does not duplicate the others', () => {
  // "Re-run failed jobs" re-runs one leg; the other legs' artifacts from attempt 1 stay on the run, and
  // the collection of attempt 2 downloads them again. The summary names its own attempt.
  const first = mergeDurations(null, [
    legSummary({ leg: 'classic', runId: '38380730524', runAttempt: 1 }),
    legSummary({ leg: 'main', runId: '38380730524', runAttempt: 1 }),
  ], runOf(), { now: NOW });
  const secondAttempt = runOf({ run_attempt: 2 });
  const rerun = mergeDurations(first.doc, [
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
  const old = mergeDurations(null, [legSummary({ leg: 'classic', startTime: '2026-09-10T10:00:00.000Z' })],
    runOf({ id: 1 }), { now: new Date('2026-09-10T12:00:00Z') });

  assert.equal(old.doc.runs.length, 1, 'inside the window when it was collected');

  const both = mergeDurations(old.doc, [legSummary({ leg: 'main' })], runOf({ id: 2 }), { now: NOW });

  assert.equal(both.pruned, 1, 'the September run is past 30 days');
  assert.deepEqual(both.doc.runs.map(run => run.runId), ['2']);
  assert.deepEqual(both.doc.latest.sources.map(source => source.leg), ['main'],
    'a leg whose latest rows are past the window drops off');

  const future = mergeDurations(both.doc, [], runOf({ id: 2 }), { now: new Date(NOW.getTime() + (40 * DAY)) });

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

    doc = mergeDurations(doc, [legSummary({ leg: 'classic', startTime })], runOf({ id: 1000 + index }),
      { now: NOW }).doc;
  }

  const unbounded = Buffer.byteLength(serializeDurations(doc));
  const capBytes = unbounded - 600;
  const capped = mergeDurations(doc, [legSummary({ leg: 'classic', startTime: NOW.toISOString() })],
    runOf({ id: 2000 }), { now: NOW, capBytes });
  const size = Buffer.byteLength(serializeDurations(capped.doc));

  assert.ok(size <= capBytes, `${size} bytes must fit the ${capBytes}-byte cap`);
  assert.ok(capped.capped >= 2, 'at least the new run\'s size and the overshoot came off');
  assert.equal(capped.doc.runs[0].runId, '2000', 'the run just collected stays');
  assert.ok(!capped.doc.runs.some(run => run.runId === '1000'), 'the oldest run went first');
  assert.deepEqual(capped.doc.runs.map(run => run.runId),
    [...capped.doc.runs.map(run => run.runId)].sort().reverse(), 'still newest first');
  assert.equal(capped.doc.latest.sources.length, 1, 'rows inside their half of the cap stay');

  const again = mergeDurations(capped.doc, [legSummary({ leg: 'classic', startTime: NOW.toISOString() })],
    runOf({ id: 2000 }), { now: NOW, capBytes });

  assert.equal(again.changed, false, 'a capped file re-collected is still a no-op');
  assert.equal(DURATIONS_CAP_BYTES, 2 * 1024 * 1024);
});

test('the per-test rows get at most half the cap, pull-request rows shed first, so the history keeps the rest', () => {
  const pr = legSummary({ leg: 'classic', startTime: '2026-10-13T11:00:00.000Z' });
  const develop = legSummary({ leg: 'main', startTime: '2026-10-13T10:00:00.000Z' });
  const both = mergeDurations(mergeDurations(null, [pr], runOf({ id: 1 }), { now: NOW }).doc, [develop],
    developRun({ id: 2 }), { now: NOW }).doc;
  const oneLegRows = Buffer.byteLength(JSON.stringify(mergeDurations(null, [develop], developRun({ id: 2 }),
    { now: NOW }).doc.latest));
  // Room for one leg's rows in half the cap, not for two.
  const capBytes = (oneLegRows * 2) + 200;
  const shed = mergeDurations(both, [], runOf({ id: 2 }), { now: NOW, capBytes });

  assert.deepEqual(shed.doc.latest.sources.map(source => source.leg), ['main'],
    'the pull request\'s rows went, the develop push\'s stayed, though the pull request is newer');
  assert.match(shed.notes.join('\n'), /dropped the rows of classic/);
  assert.equal(shed.doc.runs.length, 2, 'the run history is untouched');
  assert.ok(Buffer.byteLength(serializeDurations(shed.doc)) <= capBytes);
});

test('past the cap, runs that are not develop pushes go before any develop push', () => {
  let doc = null;

  // Thirty develop pushes, then thirty pull request runs, all newer than the develop pushes. Enough runs
  // that the history outweighs the rows, so the run cap binds, not the rows' half of it.
  for (let index = 0; index < 60; index += 1) {
    const startTime = new Date(NOW.getTime() - ((60 - index) * 600000)).toISOString();
    const run = index < 30 ? developRun({ id: 3000 + index }) : runOf({ id: 3000 + index });

    doc = mergeDurations(doc, [legSummary({ leg: 'classic', startTime, unexpected: 0 })], run, { now: NOW }).doc;
  }

  const capBytes = Buffer.byteLength(serializeDurations(doc)) - 1500;
  const capped = mergeDurations(doc, [], runOf({ id: 3059 }), { now: NOW, capBytes });
  const kept = capped.doc.runs.map(run => Number(run.runId));

  assert.ok(capped.capped > 0 && capped.doc.latest.sources.length === 1, 'the run cap bound, not the rows budget');
  assert.equal(kept.filter(id => id < 3030).length, 30, 'every develop push stayed');
  assert.ok(!kept.includes(3030), 'the oldest pull request run went first');
  assert.equal(capped.doc.budget.legs.classic.develop.runs, 30, 'the budget input is whole');
});

test('the per-test rows follow the latest develop run of each leg, and a pull request only fills a gap', () => {
  const prSummary = legSummary({ leg: 'classic', startTime: '2026-10-12T10:00:00.000Z' });
  const bootstrap = mergeDurations(null, [prSummary], runOf({ id: 1 }), { now: NOW });

  assert.equal(bootstrap.doc.latest.sources[0].branch, 'feature/X-1_Some-branch',
    'before any develop run, the newest run of any branch supplies the rows');

  const olderDevelop = legSummary({ leg: 'classic', startTime: '2026-10-12T09:00:00.000Z', scale: 2 });
  const develop = mergeDurations(bootstrap.doc, [olderDevelop], developRun({ id: 2 }), { now: NOW });

  assert.equal(develop.doc.latest.sources[0].runId, '2', 'a develop run replaces it, even an older one');

  const newerPr = mergeDurations(develop.doc, [legSummary({ leg: 'classic', startTime: '2026-10-13T09:00:00.000Z' })],
    runOf({ id: 3 }), { now: NOW });

  assert.equal(newerPr.doc.latest.sources[0].runId, '2', 'a newer pull request never displaces develop');

  const newerDevelop = mergeDurations(newerPr.doc,
    [legSummary({ leg: 'classic', startTime: '2026-10-13T10:00:00.000Z' })], developRun({ id: 4 }), { now: NOW });
  const { latest } = newerDevelop.doc;

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
});

test('a re-run of an older develop push, days later, never replaces a newer commit\'s rows', () => {
  const newer = mergeDurations(null, [legSummary({ leg: 'classic', startTime: '2026-10-12T10:00:00.000Z' })],
    developRun({ id: 2000 }), { now: NOW }).doc;
  // "Re-run failed jobs" on develop run 1000, a day later: its legs start after run 2000's did.
  const rerun = legSummary({
    leg: 'classic',
    startTime: '2026-10-13T11:00:00.000Z',
    scale: 2,
    runId: '1000',
    runAttempt: 2,
  });
  const after = mergeDurations(newer, [rerun], developRun({ id: 1000, run_attempt: 2 }), { now: NOW }).doc;

  assert.deepEqual(after.latest.sources.map(source => [source.runId, source.runAttempt]), [['2000', 1]],
    'run ids follow commit order; start times do not');
  assert.equal(after.runs.length, 2, 'the re-run is still a record of its own');
});

test('a flaky test has no cell either, and a leg that ran no test keeps the rows it had', () => {
  const flaky = legSummary({ leg: 'classic', unexpected: 0 });
  const amd = flaky.files.find(file => file.file === 'e2e/amd-loader.spec.ts');

  amd.cases[0] = { ...amd.cases[0], status: 'flaky', retries: 1 };

  const { doc } = mergeDurations(null, [flaky], developRun({ id: 1 }), { now: NOW });

  assert.equal(doc.latest.files['e2e/amd-loader.spec.ts'], undefined, 'its only test was flaky');

  // The Playwright JSON reporter still writes a report when the web server never starts or a filter
  // matches nothing: no suites, zero tests.
  const dead = summarizePlaywrightReport({
    suites: [],
    stats: { startTime: '2026-10-13T11:00:00.000Z', duration: 63 },
    config: { workers: 2 },
  }, { leg: 'classic' });
  const after = mergeDurations(doc, [dead], developRun({ id: 2 }), { now: NOW });

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
  const result = mergeDurations(null, forged, ended, { now: NOW });
  const notes = result.notes.join('\n');

  assert.match(notes, /leg "\.\.\/\.\.\/escape": not a leg e2e\.yml runs, skipped/);
  assert.match(notes, /leg "zzz": not a leg e2e\.yml runs, skipped/);
  assert.match(notes, /leg classic: starts at 2999-01-01T00:00:00\.000Z, after run 3 ended, skipped/);
  assert.deepEqual(result.doc.runs[0].legs.map(leg => leg.leg), ['main']);
  assert.deepEqual(result.doc.latest.sources.map(source => source.leg), ['main']);
  assert.deepEqual(result.recorded.map(summary => summary.leg), ['main'], 'only what was stored is reported');
  assert.ok(result.doc.budget.to <= '2026-10-13T12:00:00.000Z', 'nothing is pinned past the window');
});

test('the leg allowlist is exactly the legs e2e.yml runs', () => {
  // The matrix-collapse work will change the legs; this fails until DURATIONS_LEGS follows the workflow.
  const e2e = readFileSync(path.join(repoRoot(), '.github/workflows/e2e.yml'), 'utf8');
  const matrix = job(e2e, 'playwright');
  const themes = matrix.match(/^ {8}theme: \[([^\]]+)\]$/m)[1].split(',').map(theme => theme.trim());
  const suffixes = [...matrix.matchAll(/suffix: '([^']*)'/g)].map(([, suffix]) => suffix);
  const engines = job(e2e, 'playwright-engines').match(/playwright-durations\.mjs --leg (\S+)$/m)[1];

  assert.ok(themes.length > 0 && suffixes.length > 0, 'read the theme and bundle axes of the matrix');
  assert.deepEqual([...DURATIONS_LEGS].sort(),
    [...themes.flatMap(theme => suffixes.map(suffix => `${theme}${suffix}`)), engines].sort());
});

test('an expired develop source never outranks the run that arrives after it', () => {
  const old = mergeDurations(null, [legSummary({ leg: 'classic', startTime: '2026-09-12T11:00:00.000Z' })],
    developRun({ id: 1 }), { now: new Date('2026-09-12T12:00:00Z') });
  const pr = mergeDurations(old.doc, [legSummary({ leg: 'classic', startTime: '2026-10-12T11:00:00.000Z' })],
    runOf({ id: 2 }), { now: new Date('2026-10-12T12:00:00Z') });

  assert.deepEqual(pr.doc.latest.sources.map(source => source.runId), ['2'],
    'the September develop source is past 30 days: the pull request fills the gap at once');
});

test('the per-test rows hold one column per leg and project, null where a test did not run', () => {
  const legs = [
    legSummary({ leg: 'classic' }),
    legSummary({ leg: 'main', scale: 2 }),
  ];
  const { doc } = mergeDurations(null, legs, developRun(), { now: NOW });

  assert.deepEqual(doc.latest.columns,
    [{ leg: 'classic', project: 'e2e-classic' }, { leg: 'main', project: 'e2e-classic' }]);

  const row = doc.latest.files['e2e/submenu-hover-delay.spec.ts'].find(entry => entry[0] === SLOW_TITLE);

  assert.deepEqual(row, [SLOW_TITLE, 9857, 19714]);

  const withoutSubmenu = { ...legs[0], files: legs[0].files.filter(file => !file.file.includes('submenu')) };
  // A later develop push: its run id is higher than the first one's.
  const onlyMain = mergeDurations(doc, [withoutSubmenu], developRun({ id: 38380730600 }), { now: NOW }).doc;

  assert.deepEqual(onlyMain.latest.files['e2e/submenu-hover-delay.spec.ts'].find(entry => entry[0] === SLOW_TITLE),
    [SLOW_TITLE, null, 19714], 'a test the newer classic run no longer has keeps only its main cell');
});

test('the budget input is P50 and P90 per leg over clean runs, develop separately', () => {
  let doc = null;
  const walls = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

  walls.forEach((wallMs, index) => {
    const startTime = new Date(NOW.getTime() - ((index + 1) * 3600000)).toISOString();
    const run = index < 4 ? developRun({ id: 500 + index }) : runOf({ id: 500 + index });

    doc = mergeDurations(doc, [legSummary({ leg: 'classic', startTime, wallMs, unexpected: 0 })], run,
      { now: NOW }).doc;
  });

  // A red leg's time includes retries of failing tests; it is not what the budget should learn from.
  const red = legSummary({ leg: 'classic', startTime: NOW.toISOString(), wallMs: 99999, unexpected: 3 });

  doc = mergeDurations(doc, [red], runOf({ id: 600 }), { now: NOW }).doc;

  // A leg with only a flaky test counts: one retry is noise next to the run-to-run spread.
  const flaky = legSummary({ leg: 'main', startTime: NOW.toISOString(), wallMs: 700, unexpected: 0 });

  flaky.counts.flaky = 1;
  doc = mergeDurations(doc, [flaky], runOf({ id: 601 }), { now: NOW }).doc;

  const { classic, main } = doc.budget.legs;

  assert.deepEqual(classic.all, { runs: 10, wallMs: { p50: 500, p90: 900 }, tests: { p50: 45, p90: 45 } });
  assert.deepEqual(classic.develop, { runs: 4, wallMs: { p50: 200, p90: 400 }, tests: { p50: 45, p90: 45 } });
  assert.equal(classic.excluded, 1, 'the red leg is counted as excluded, not hidden');
  assert.deepEqual(main.all, { runs: 1, wallMs: { p50: 700, p90: 700 }, tests: { p50: 45, p90: 45 } });
  assert.equal(main.excluded, 0);
  assert.equal(doc.budget.windowDays, DURATIONS_RETENTION_DAYS);
  assert.ok(doc.budget.from < doc.budget.to);
});

test('mergeDurations refuses a stored file of another version instead of rebuilding it from one run', () => {
  // The collector has no try/catch around it, like a durations.json it cannot parse: the job fails and the
  // month of history stays on gh-pages until a migration ships with the version bump.
  assert.throws(() => mergeDurations({ version: 0, runs: 'whatever' }, [legSummary()], runOf(), { now: NOW }),
    /durations\.json has version 0, and this collector reads and writes version 1/);
  assert.throws(() => mergeDurations({ version: 2 }, [], runOf(), { now: NOW }), /has version 2/);
  assert.deepEqual(mergeDurations(emptyDurations(), [], runOf(), { now: NOW }).notes, []);
});

test('a test that fails or flakes in a newer run keeps its last good time; a removed test loses its row', () => {
  const amdTitle = 'bundle on a page with an AMD loader › loads and renders while a global define.amd is present';
  const first = mergeDurations(null, [legSummary({ leg: 'classic' })], developRun({ id: 1 }), { now: NOW }).doc;
  const later = legSummary({ leg: 'classic', startTime: '2026-10-13T11:00:00.000Z', scale: 2 });
  const submenu = later.files.find(file => file.file === 'e2e/submenu-hover-delay.spec.ts');
  const amd = later.files.find(file => file.file === 'e2e/amd-loader.spec.ts');
  const notifications = later.files.find(file => file.file === 'e2e/notification-placement.spec.ts');
  const removed = notifications.cases.find(entry => !entry.status).title;

  submenu.cases = submenu.cases.map(entry => (entry.title === SLOW_TITLE
    ? { ...entry, ms: 40000, status: 'unexpected', retries: 1 } : entry));
  amd.cases = amd.cases.map(entry => ({ ...entry, ms: 5000, status: 'flaky', retries: 1 }));
  notifications.cases = notifications.cases.filter(entry => entry.title !== removed);

  const { latest } = mergeDurations(first, [later], developRun({ id: 2 }), { now: NOW }).doc;
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
  const { doc } = mergeDurations(null, [legSummary({ leg: 'classic' })], developRun(), { now: NOW });
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

  const { doc } = mergeDurations(null, [odd], developRun(), { now: NOW });

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

  const view = durationsView(mergeDurations(null, [engines], developRun(), { now: NOW }).doc);

  assert.deepEqual(view.slowTests[0].legs.map(([label]) => label), ['engines (firefox)', 'engines (webkit)']);
});

test('durationsView ranks the heaviest spec files, lists the slow tests, and tells develop from pull requests', () => {
  let doc = mergeDurations(null, [legSummary({ leg: 'classic' }), legSummary({ leg: 'main', scale: 2 })],
    developRun({ id: 7 }), { now: NOW }).doc;

  doc = mergeDurations(doc, [legSummary({ leg: 'classic', startTime: '2026-10-13T11:00:00.000Z' })],
    runOf({ id: 8 }), { now: NOW }).doc;
  doc = mergeDurations(doc, [legSummary({ leg: 'classic', startTime: '2026-10-13T11:30:00.000Z' })],
    runOf({ id: 9, name: 'Publish', head_branch: 'release/18.2.0', event: 'workflow_dispatch' }), { now: NOW }).doc;

  const view = durationsView(doc);

  assert.deepEqual(view.legs, ['classic', 'main']);
  assert.deepEqual(view.runs.map(([runId, kind]) => `${runId}:${kind}`), ['9:other', '8:pr', '7:develop']);
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

  const view = durationsView(mergeDurations(null, [many], developRun(), { now: NOW }).doc);

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
