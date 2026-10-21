import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { readBlocks } from '../leg-declarations.mjs';
import {
  QUARANTINE_ANNOTATION,
  QUARANTINE_CAP,
  QUARANTINE_MAX_DAYS,
  QUARANTINE_TAG,
  describeQuarantine,
  evaluateRun,
  isExpired,
  parseQuarantine,
  validateQuarantine,
} from '../quarantine-policy.mjs';

const NOW = new Date('2026-09-08T12:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = days => new Date(NOW.getTime() + (days * DAY_MS)).toISOString().slice(0, 10);

/**
 * A run test with a quarantine annotation.
 *
 * @param {string} title The title.
 * @param {string} outcome The outcome.
 * @param {string} [expires] The expiry; omit for no quarantine.
 * @param {string} [file] The file.
 * @returns {object} The test.
 */
function runTest(title, outcome, expires, file = 'e2e/a.spec.ts') {
  return {
    title,
    file,
    project: 'e2e-main',
    outcome,
    annotations: expires ? [{ type: QUARANTINE_ANNOTATION, description: describeQuarantine('DEV-1234', expires) }] : [],
  };
}

test('describeQuarantine and parseQuarantine round-trip, with and without a reason', () => {
  assert.equal(describeQuarantine('DEV-1234', '2026-10-08'), 'DEV-1234 until 2026-10-08');
  assert.equal(
    describeQuarantine('DEV-1234', '2026-10-08', 'height read early'),
    'DEV-1234 until 2026-10-08 — height read early'
  );
  assert.deepEqual(
    parseQuarantine('DEV-1234 until 2026-10-08'),
    { taskId: 'DEV-1234', expires: '2026-10-08', why: null }
  );
  assert.deepEqual(
    parseQuarantine('PRO-7 until 2026-10-08 — why'),
    { taskId: 'PRO-7', expires: '2026-10-08', why: 'why' }
  );
  assert.equal(parseQuarantine('flaky, see slack'), null);
  assert.equal(parseQuarantine(undefined), null);
  // eslint-disable-next-line no-restricted-syntax -- asserts the literal the tag helpers use
  assert.equal(QUARANTINE_TAG, '@quarantine');
});

test('validateQuarantine refuses a missing task id, a bad date, and an expiry past the horizon', () => {
  assert.equal(validateQuarantine('DEV-1234', daysFromNow(10), NOW), null);
  assert.equal(validateQuarantine('DEV-1234', daysFromNow(QUARANTINE_MAX_DAYS), NOW), null,
    'the horizon itself is allowed');
  assert.match(validateQuarantine('', daysFromNow(10), NOW), /owning task id/);
  assert.match(validateQuarantine('flaky', daysFromNow(10), NOW), /owning task id/);
  assert.match(validateQuarantine('dev-1234', daysFromNow(10), NOW), /owning task id/, 'lower case is not a task id');
  assert.match(validateQuarantine('DEV-1234', 'soon', NOW), /expiry date/);
  assert.match(validateQuarantine('DEV-1234', '2026-13-40', NOW), /expiry date/);
  assert.match(validateQuarantine('DEV-1234', daysFromNow(QUARANTINE_MAX_DAYS + 1), NOW), /within 30 days/);
  assert.match(validateQuarantine('DEV-1234', '2026-02-30', NOW), /expiry date/, 'a rolled-over day is rejected');
  assert.equal(validateQuarantine('DEV-1234', daysFromNow(-3), NOW), null, 'a past date loads; the reporter judges it');
});

test('isExpired counts the expiry day itself as still quarantined', () => {
  assert.equal(isExpired('2026-09-08', new Date('2026-09-08T23:59:59Z')), false);
  assert.equal(isExpired('2026-09-08', new Date('2026-09-09T00:00:00Z')), true);
  assert.equal(isExpired('2026-09-07', NOW), true);
});

test('a flaky test under a live quarantine is reported and the run passes', () => {
  const verdict = evaluateRun({
    tests: [runTest('stays', 'expected'), runTest('flakes', 'flaky', daysFromNow(10))],
    now: NOW,
    runStatus: 'failed',
  });

  assert.equal(verdict.status, 'passed');
  assert.equal(verdict.downgraded, true);
  assert.equal(verdict.quarantinedFlaky, 1);
  assert.equal(verdict.quarantineCount, 1);
  assert.deepEqual(verdict.problems, []);
  assert.match(verdict.notes[0],
    /^quarantined flaky test, reported and not failing the run: e2e\/a\.spec\.ts › flakes \[e2e-main\]/);
  assert.match(verdict.warnings[0], /^::warning title=Quarantined flaky test \(DEV-1234\)::/);
});

test('a flaky test without quarantine, or with an expired one, still fails the run', () => {
  const plain = evaluateRun({ tests: [runTest('flakes', 'flaky')], now: NOW, runStatus: 'failed' });

  assert.equal(plain.status, 'failed');
  assert.equal(plain.downgraded, false);
  assert.deepEqual(plain.problems, [], 'Playwright already explains a plain flaky failure');

  const expired = evaluateRun({ tests: [runTest('flakes', 'flaky', daysFromNow(-1))], now: NOW, runStatus: 'failed' });

  assert.equal(expired.status, 'failed');
  assert.equal(expired.quarantinedFlaky, 0);
  assert.match(expired.problems[0], /flaky, and its quarantine \(DEV-1234\) expired on/);
});

test('a test that fails outright is never covered, even when quarantined', () => {
  const verdict = evaluateRun({
    tests: [runTest('breaks', 'unexpected', daysFromNow(10)), runTest('flakes', 'flaky', daysFromNow(10))],
    now: NOW,
    runStatus: 'failed',
  });

  assert.equal(verdict.status, 'failed');
  assert.equal(verdict.quarantinedFlaky, 1, 'the flaky one is still reported as quarantined');
});

test('an expired quarantine on a passing test warns to remove the tag and does not fail the run', () => {
  const verdict = evaluateRun({
    tests: [runTest('fixed', 'expected', daysFromNow(-2))],
    now: NOW,
    runStatus: 'passed',
  });

  assert.equal(verdict.status, 'passed');
  assert.match(verdict.notes[0], /quarantine expired on .* and the test passes: remove the tag/);
  assert.match(verdict.warnings[0], /^::warning title=Expired quarantine \(DEV-1234\)::/);
});

test('the cap counts distinct tests across projects and blocks the entry after it', () => {
  const sixInTwoProjects = Array
    .from({ length: QUARANTINE_CAP }, (_, index) => runTest(`t${index}`, 'expected', daysFromNow(5)))
    .flatMap(entry => [entry, { ...entry, project: 'e2e-classic-min' }]);
  const atCap = evaluateRun({ tests: sixInTwoProjects, now: NOW, runStatus: 'passed' });

  assert.equal(atCap.quarantineCount, QUARANTINE_CAP, 'the same test in two projects is one entry');
  assert.equal(atCap.status, 'passed');

  const overCap = evaluateRun({
    tests: [...sixInTwoProjects, runTest('one too many', 'expected', daysFromNow(5), 'e2e/b.spec.ts')],
    now: NOW,
    runStatus: 'passed',
  });

  assert.equal(overCap.status, 'failed', 'the seventh entry fails the run even though every test passed');
  assert.ok(overCap.problems[0].startsWith(
    `quarantine cap exceeded: ${QUARANTINE_CAP + 1} tests are quarantined and the cap is ${QUARANTINE_CAP}`
  ));
});

test('an unreadable quarantine annotation fails the run and names the helper', () => {
  const verdict = evaluateRun({
    tests: [{
      ...runTest('odd', 'expected'),
      annotations: [{ type: QUARANTINE_ANNOTATION, description: 'flaky, ask Bob' }],
    }],
    now: NOW,
    runStatus: 'passed',
  });

  assert.equal(verdict.status, 'failed');
  assert.match(verdict.problems[0],
    /unreadable quarantine annotation "flaky, ask Bob"; write it with quarantined\(\)/);
});

test('a run that Playwright ended with an error, a timeout or an interruption is never downgraded', () => {
  const flaky = [runTest('flakes', 'flaky', daysFromNow(10))];

  assert.equal(evaluateRun({ tests: flaky, now: NOW, runStatus: 'failed', hadErrors: true }).status, 'failed');
  assert.equal(evaluateRun({ tests: flaky, now: NOW, runStatus: 'timedout' }).status, 'timedout');
  assert.equal(evaluateRun({ tests: flaky, now: NOW, runStatus: 'interrupted' }).status, 'interrupted');
  // An interrupted run that saw no test stays interrupted: the zero-test rule below fails a run Playwright
  // called passed or failed, never one it ended another way.
  assert.equal(evaluateRun({ tests: [], now: NOW, runStatus: 'interrupted' }).status, 'interrupted');
});

test('a flaky test whose quarantine expiry is beyond the horizon fails the run (no downgrade)', () => {
  // A hand-written annotation past the 30-day horizon must not buy an unbounded downgrade.
  const verdict = evaluateRun({ tests: [runTest('flakes', 'flaky', daysFromNow(60))], now: NOW, runStatus: 'failed' });

  assert.equal(verdict.status, 'failed');
  assert.equal(verdict.quarantinedFlaky, 0, 'a beyond-horizon tag does not downgrade');
  assert.match(verdict.problems[0], /beyond the 30-day horizon/);
});

test('a quarantined test that fails outright is noted, not silently counted', () => {
  const tests = [runTest('breaks', 'unexpected', daysFromNow(10))];
  const verdict = evaluateRun({ tests, now: NOW, runStatus: 'failed' });

  assert.equal(verdict.status, 'failed');
  assert.match(verdict.notes.join('\n'), /FAILED outright \(not flaky\), which quarantine \(DEV-1234\) does not cover/);
});

test('the quarantine reporter is last in both reporter arrays, so its status override wins', () => {
  const config = readFileSync(new URL('../../playwright.config.ts', import.meta.url), 'utf8');

  // In both arrays the quarantine reporter tuple is immediately followed by the array close.
  const closes = [...config.matchAll(/'\.\/reporters\/quarantine\.ts'\]\s*,?\s*\]/g)];

  assert.equal(closes.length, 2, 'the quarantine reporter is the last entry in the CI and local arrays');
});

test('a run that saw no test fails, shard or not: Playwright would pass an empty shard', () => {
  // Playwright 1.62 skips its "No tests found" error whenever `--shard` is set, so a shard whose part of
  // the project is empty ends green on its own; the reporter owns the exit status and says no.
  const empty = evaluateRun({ tests: [], now: NOW, runStatus: 'passed', shard: '2/3' });

  assert.equal(empty.status, 'failed');
  assert.equal(empty.downgraded, true);
  assert.deepEqual(empty.problems.map(problem => problem.slice(0, 60)),
    ['no test ran in shard 2/3: Playwright ends a sharded run with']);

  const whole = evaluateRun({ tests: [], now: NOW, runStatus: 'passed' });

  assert.equal(whole.status, 'failed');
  assert.match(whole.problems[0], /^no test ran: /);

  // A run with a test is judged on its tests alone.
  assert.equal(evaluateRun({ tests: [runTest('a', 'expected')], now: NOW, runStatus: 'passed', shard: '1/3' }).status, 'passed');
});

// The specs that quarantine a test today, by file. A new quarantine adds its file here, so the whole-tree
// count is reviewed with the quarantine itself; the ledger shows the entries.
const QUARANTINED_SPECS = [];

test('the tree quarantines at most QUARANTINE_CAP tests, one test at a time: a sharded leg counts the cap per shard', () => {
  // The reporter counts the quarantined tests of the run it sees, and a leg that runs in shards
  // (e2e.yml, `--shard`) is several runs, each seeing its own tests: three shards could each hold six
  // and none would fail. This static count is the whole-tree half of the cap; the reporter's count is
  // the per-run half. It reads the calls with the leg-declarations block reader, so a `quarantined(`
  // written inside a string (e2e/quarantine-policy.spec.ts builds its synthetic specs that way) is
  // not a site, and a `test.describe(…, quarantined(…), …)` is refused: it parks every test inside the
  // describe while a call-site count sees one.
  const specs = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.spec.ts')) {
        specs.push(full);
      }
    }
  };
  const testsRoot = path.resolve(import.meta.dirname, '../..');

  walk(path.join(testsRoot, 'e2e'));
  assert.ok(specs.length > 200, 'the sweep read the spec tree');

  const sites = [];
  const describes = [];

  for (const full of specs) {
    const file = path.relative(testsRoot, full).split(path.sep).join('/');

    for (const block of readBlocks(readFileSync(full, 'utf8'), file)) {
      if (block.details?.kind === 'quarantined') {
        (block.kind === 'describe' ? describes : sites).push(`${file}:${block.line}`);
      }
    }
  }

  assert.deepEqual(describes, [],
    'quarantine one test at a time, never a describe: a describe-level quarantined() parks every test inside it '
    + 'while this count sees one site, and the reporter cannot see past its own shard (tests/AGENTS.md, Quarantine)');
  assert.ok(sites.length <= QUARANTINE_CAP,
    `${sites.length} quarantined tests in tests/e2e, and the cap is ${QUARANTINE_CAP}; the reporter cannot see past `
    + `its own shard, so fix one before parking another: ${sites.join(', ')}`);
  assert.deepEqual([...new Set(sites.map(site => site.split(':')[0]))].sort(), QUARANTINED_SPECS,
    `the specs with a quarantine are listed in QUARANTINED_SPECS, so the whole-tree count is reviewed with the `
    + `quarantine itself; found ${sites.join(', ') || 'none'}`);
});
