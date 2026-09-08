import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  JASMINE_ARTIFACT_PREFIX,
  LEDGER_VERSION,
  PLAYWRIGHT_ARTIFACT_PREFIX,
  PLAYWRIGHT_JSON_REPORT,
  RETENTION_DAYS,
  TICKET_THRESHOLD_RUNS,
  aggregate,
  classifyArtifact,
  collectArtifactFiles,
  emptyLedger,
  entryKey,
  mergeLedger,
  parseJasmineRecord,
  parsePlaywrightReport,
  renderPage,
  renderStepSummary,
  runContextFromRun,
  testKey,
} from '../lib/test-health.mjs';
import { repoRoot } from '../lib/repo-root.mjs';

const NOW = new Date('2026-09-08T12:00:00Z');
const TALL_FROZEN_TITLE = 'walkontable exact row heights › in the `exact` mode › '
  + 'keeps a row with a tall frozen cell at the provided height in both tables';
const TIMEOUT_MESSAGE = 'Timed out 10000ms waiting for expect(locator).toBeVisible()';

const RUN = {
  id: 34121444051,
  run_attempt: 1,
  html_url: 'https://github.com/handsontable/handsontable/actions/runs/34121444051',
  name: 'Tests',
  head_branch: 'feature/X-1_Some-branch',
  head_sha: '568d2a263ffc7975c5257a5f67675eb51da13f4d',
  event: 'pull_request',
  updated_at: '2026-09-07T12:40:00Z',
  conclusion: 'failure',
};

// The shape Playwright's JSON reporter writes: a file-level suite whose title is
// the file path, `describe` suites below it, one test per project in each spec.
const PLAYWRIGHT_REPORT = {
  config: {},
  suites: [{
    title: 'e2e/walkontable/exact-row-heights.spec.ts',
    file: 'e2e/walkontable/exact-row-heights.spec.ts',
    line: 0,
    column: 0,
    specs: [],
    suites: [{
      title: 'walkontable exact row heights',
      file: 'e2e/walkontable/exact-row-heights.spec.ts',
      line: 10,
      column: 6,
      specs: [{
        title: 'renders every row at its declared height',
        ok: true,
        file: 'e2e/walkontable/exact-row-heights.spec.ts',
        line: 20,
        column: 3,
        tests: [{ projectName: 'e2e-classic-min', status: 'expected', results: [{ status: 'passed', retry: 0 }] }],
      }],
      suites: [{
        title: 'in the `exact` mode',
        file: 'e2e/walkontable/exact-row-heights.spec.ts',
        line: 40,
        column: 8,
        specs: [{
          title: 'keeps a row with a tall frozen cell at the provided height in both tables',
          ok: false,
          file: 'e2e/walkontable/exact-row-heights.spec.ts',
          line: 57,
          column: 5,
          tests: [{
            projectName: 'e2e-classic-min',
            status: 'flaky',
            results: [
              { status: 'failed', retry: 0, error: { message: '[31mExpected 30 to be 69[39m\n\n  at line 61' } },
              { status: 'passed', retry: 1 },
            ],
          }],
        }, {
          title: 'skips this one',
          ok: true,
          file: 'e2e/walkontable/exact-row-heights.spec.ts',
          line: 70,
          column: 5,
          tests: [{ projectName: 'e2e-classic-min', status: 'skipped', results: [] }],
        }],
      }],
    }],
  }, {
    title: 'e2e/selection.spec.ts',
    file: 'e2e/selection.spec.ts',
    line: 0,
    column: 0,
    specs: [{
      title: 'selects a range',
      ok: false,
      file: 'e2e/selection.spec.ts',
      line: 5,
      column: 1,
      tests: [{
        projectName: 'e2e-classic-min',
        status: 'unexpected',
        results: [
          { status: 'failed', retry: 0, errors: [{ message: TIMEOUT_MESSAGE }] },
          { status: 'failed', retry: 1, errors: [{ message: TIMEOUT_MESSAGE }] },
        ],
      }],
    }],
  }],
  stats: { expected: 1, unexpected: 1, flaky: 1, skipped: 1 },
};

// The shape `handsontable/test/scripts/lib/failed-specs.mjs` writes (`toRecord`).
const JASMINE_RECORD = {
  leg: 'UMD (theme: main)',
  theme: 'main',
  runId: '85c4b4a6',
  failed: [{
    fullName: 'Core_alter remove_row should remove one row',
    description: 'should remove one row',
    filePath: 'handsontable/test/e2e/core/alter.spec.js',
    messages: ['Expected 5 to be 4.\n    at <Jasmine>'],
    isolation: 'passes alone',
  }, {
    fullName: 'MemoryLeakTest leaks',
    description: 'leaks',
    filePath: null,
    messages: [],
    isolation: null,
  }],
};

test('runContextFromRun keeps the run fields the ledger needs and links a re-run attempt', () => {
  assert.deepEqual(runContextFromRun(RUN), {
    runId: '34121444051',
    runAttempt: 1,
    runUrl: 'https://github.com/handsontable/handsontable/actions/runs/34121444051',
    workflow: 'Tests',
    branch: 'feature/X-1_Some-branch',
    headSha: '568d2a263ffc7975c5257a5f67675eb51da13f4d',
    event: 'pull_request',
    seenAt: '2026-09-07T12:40:00Z',
  });
  assert.equal(
    runContextFromRun({ ...RUN, run_attempt: 3 }).runUrl,
    'https://github.com/handsontable/handsontable/actions/runs/34121444051/attempts/3',
    'an attempt after the first links its own page'
  );
});

test('classifyArtifact recognizes the two artifact families and nothing else', () => {
  assert.equal(classifyArtifact('playwright-report-classic-min'), 'playwright');
  assert.equal(classifyArtifact('puppeteer-failed-specs-UMD.min-horizon'), 'jasmine');
  assert.equal(classifyArtifact('handsontable-build-umd'), null);
  assert.equal(PLAYWRIGHT_ARTIFACT_PREFIX, 'playwright-report-');
  assert.equal(JASMINE_ARTIFACT_PREFIX, 'puppeteer-failed-specs-');
});

test('parsePlaywrightReport keeps flaky and failed tests with their title path, leg, line and first error', () => {
  const run = runContextFromRun(RUN);
  const entries = parsePlaywrightReport(PLAYWRIGHT_REPORT, run);

  assert.deepEqual(entries.map(entry => [entry.status, entry.leg, `${entry.file}:${entry.line}`, entry.title]), [
    ['flaky', 'e2e-classic-min', 'e2e/walkontable/exact-row-heights.spec.ts:57', TALL_FROZEN_TITLE],
    ['failed', 'e2e-classic-min', 'e2e/selection.spec.ts:5', 'selects a range'],
  ]);
  assert.equal(entries[0].attempts, 2);
  assert.equal(entries[0].error, 'Expected 30 to be 69', 'colour codes stripped, first line only');
  assert.equal(entries[1].error, TIMEOUT_MESSAGE, 'the `errors` list form is read too');
  assert.equal(entries[0].tier, 'playwright');
  assert.equal(entries[0].source, 'ci');
  assert.equal(entries[0].isolation, null);
  assert.equal(entries[0].runId, '34121444051', 'every entry carries the run');
});

test('parseJasmineRecord keeps every failed spec with its file, message and isolation verdict', () => {
  const entries = parseJasmineRecord(JASMINE_RECORD, runContextFromRun(RUN));

  assert.deepEqual(
    entries.map(entry => [entry.status, entry.leg, entry.file, entry.title, entry.error, entry.isolation]),
    [
      ['failed', 'UMD (theme: main)', 'handsontable/test/e2e/core/alter.spec.js',
        'Core_alter remove_row should remove one row', 'Expected 5 to be 4.', 'passes alone'],
      ['failed', 'UMD (theme: main)', null, 'MemoryLeakTest leaks', null, null],
    ]
  );
  assert.equal(entries[0].tier, 'jasmine');
  assert.equal(entries[0].line, null);
});

test('collectArtifactFiles reads only report and record files, skips broken JSON, notes an HTML-only report', () => {
  const run = runContextFromRun(RUN);
  const file = (artifact, filePath, text) => ({ artifact, path: filePath, text });
  const { entries, notes } = collectArtifactFiles([
    file('playwright-report-classic-min', PLAYWRIGHT_JSON_REPORT, JSON.stringify(PLAYWRIGHT_REPORT)),
    file('playwright-report-classic-min', 'test-results/.last-run.json', '{"status":"failed"}'),
    file('playwright-report-main', 'playwright-report/data/x.json', '{}'),
    file('puppeteer-failed-specs-UMD-main', 'failed-specs-85c4b4a6.json', JSON.stringify(JASMINE_RECORD)),
    file('puppeteer-failed-specs-UMD.min-main', 'failed-specs-0df67fa0.json', '{not json'),
    file('handsontable-build-umd', 'package.json', '{}'),
  ], run);

  assert.deepEqual(entries.map(entry => `${entry.tier}:${entry.status}:${entry.title}`), [
    `playwright:flaky:${TALL_FROZEN_TITLE}`,
    'playwright:failed:selects a range',
    'jasmine:failed:Core_alter remove_row should remove one row',
    'jasmine:failed:MemoryLeakTest leaks',
  ]);
  assert.equal(notes.length, 2, notes.join('\n'));
  assert.match(notes[0], /puppeteer-failed-specs-UMD\.min-main\/failed-specs-0df67fa0\.json: not valid JSON/);
  assert.match(notes[1], /^playwright-report-main: no test-results\/report\.json/);
});

test('entryKey separates attempts, legs and runs; testKey does not', () => {
  const [entry] = parsePlaywrightReport(PLAYWRIGHT_REPORT, runContextFromRun(RUN));
  const again = { ...entry, runAttempt: 2 };
  const otherLeg = { ...entry, leg: 'e2e-main' };

  assert.equal(testKey(entry), testKey(again));
  assert.equal(testKey(entry), testKey(otherLeg));
  assert.notEqual(entryKey(entry), entryKey(again));
  assert.notEqual(entryKey(entry), entryKey(otherLeg));
  assert.equal(
    entryKey(entry),
    entryKey({ ...entry, error: 'different message', seenAt: '2026-01-01T00:00:00Z' }),
    'the message and the time are not part of the identity'
  );
});

test('mergeLedger de-duplicates by entry key, prunes past the retention window, and reports what was new', () => {
  const run = runContextFromRun(RUN);
  const entries = parsePlaywrightReport(PLAYWRIGHT_REPORT, run);
  const daysAgo = days => new Date(NOW.getTime() - (days * 86400000)).toISOString();
  const stale = { ...entries[1], runId: '1', seenAt: daysAgo(RETENTION_DAYS + 1) };
  const fresh = { ...entries[1], runId: '2', seenAt: daysAgo(RETENTION_DAYS - 1) };
  const existing = { ...emptyLedger(), entries: [stale, fresh, entries[0]] };

  const { ledger, added } = mergeLedger(existing, [{ ...entries[0], error: 'newer copy' }, entries[1]], { now: NOW });

  assert.equal(ledger.version, LEDGER_VERSION);
  assert.equal(ledger.updatedAt, NOW.toISOString());
  assert.deepEqual(added.map(entry => entry.title), ['selects a range'],
    'only the entry the ledger did not have counts as added');
  assert.deepEqual(ledger.entries.map(entry => `${entry.runId}:${entry.title}`), [
    '34121444051:selects a range',
    `34121444051:${TALL_FROZEN_TITLE}`,
    '2:selects a range',
  ], 'newest first; the stale copy is gone');
  assert.equal(ledger.entries[1].error, 'newer copy', 'a re-collected attempt replaces the earlier copy');
  assert.deepEqual(mergeLedger(null, [], { now: NOW }).ledger.entries, [], 'no ledger yet is an empty ledger');
});

test('aggregate counts per test over both windows, counts distinct runs, and draws the ticket line', () => {
  const run = runContextFromRun(RUN);
  const [flaky, failed] = parsePlaywrightReport(PLAYWRIGHT_REPORT, run);
  const day = 86400000;
  const at = daysAgo => new Date(NOW.getTime() - (daysAgo * day)).toISOString();
  const entries = [
    { ...flaky, runId: 'a', seenAt: at(1) },
    { ...flaky, runId: 'a', leg: 'e2e-main', seenAt: at(1) }, // same run, second leg: one recurrence, not two
    { ...flaky, runId: 'b', seenAt: at(20) },
    { ...flaky, runId: 'c', seenAt: at(45) }, // outside the long window
    { ...failed, runId: 'a', seenAt: at(2) },
    ...parseJasmineRecord(JASMINE_RECORD, { ...run, runId: 'd', seenAt: at(3) }),
  ];
  const summary = aggregate({ ...emptyLedger(), entries }, { now: NOW });

  assert.equal(summary.ticketThresholdRuns, TICKET_THRESHOLD_RUNS);
  assert.deepEqual(summary.totals, { tests: 4, needsTicket: 1, entries: 7 });

  const [first, ...rest] = summary.rows;

  assert.equal(first.title, flaky.title, 'the test that needs a ticket sorts first');
  assert.equal(first.count7, 2);
  assert.equal(first.count30, 3);
  assert.equal(first.countAll, 4);
  assert.equal(first.runs30, 2, 'two legs of one run are one run');
  assert.deepEqual(first.legs, ['e2e-classic-min', 'e2e-main']);
  assert.equal(first.needsTicket, true);
  assert.equal(first.lastSeen.seenAt, at(1));
  assert.ok(rest.every(row => !row.needsTicket), 'one run each: below the line');

  const jasmine = rest.find(row => row.tier === 'jasmine' && row.file);

  assert.deepEqual(jasmine.isolation, ['passes alone']);
  assert.equal(jasmine.runs30, 1);
});

test('renderStepSummary lists what the run added, the tests over the line, the notes, and the page', () => {
  const run = runContextFromRun(RUN);
  const entries = [...parsePlaywrightReport(PLAYWRIGHT_REPORT, run), ...parseJasmineRecord(JASMINE_RECORD, run)];
  const { ledger, added } = mergeLedger(null, [
    ...entries,
    { ...entries[0], runId: '9', seenAt: '2026-09-01T00:00:00Z' },
  ], { now: NOW });
  const summary = aggregate(ledger, { now: NOW });
  const markdown = renderStepSummary({
    run,
    added,
    notes: ['playwright-report-main: no test-results/report.json in the artifact'],
    summary,
    pageUrl: 'https://handsontable.github.io/handsontable/test-health/',
  });

  assert.match(markdown, /^## Test health — run 34121444051 \(attempt 1, `feature\/X-1_Some-branch`\)\n/);
  assert.match(markdown, /Recorded 5 new observation\(s\):/);
  assert.ok(markdown.includes(`- **flaky** on \`e2e-classic-min\`: ${TALL_FROZEN_TITLE} `
    + '(`e2e/walkontable/exact-row-heights.spec.ts:57`)\n'));
  assert.ok(markdown.includes('- **failed** on `UMD (theme: main)`: Core_alter remove_row should remove one row '
    + '(`handsontable/test/e2e/core/alter.spec.js`), in isolation: passes alone\n'));
  assert.ok(markdown.includes('1 test(s) have flaked in 2+ distinct runs in the last 30 days '
    + 'and need a fix or migration ticket:'));
  assert.match(markdown, /Notes:\n\n- playwright-report-main: no test-results\/report\.json/);
  assert.match(markdown, /Ledger: https:\/\/handsontable\.github\.io\/handsontable\/test-health\/\n$/);

  const quiet = renderStepSummary({
    run, added: [], notes: [], summary: aggregate(emptyLedger(), { now: NOW }), pageUrl: 'x',
  });

  assert.match(quiet, /Nothing new to record/);
  assert.ok(!quiet.includes('need a fix'), 'no ticket block without tests over the line');
});

test('renderPage inlines the summary and survives a `</script>` inside a title', () => {
  const summary = aggregate({
    ...emptyLedger(),
    entries: [{
      ...parsePlaywrightReport(PLAYWRIGHT_REPORT, runContextFromRun(RUN))[0],
      title: 'renders </script><b>bold</b> safely',
    }],
  }, { now: NOW });
  const template = readFileSync(path.join(repoRoot(), '.github/test-health/index.template.html'), 'utf8');
  const html = renderPage(template, summary);

  assert.ok(!html.includes('__SUMMARY_JSON__') && !html.includes('__GENERATED_AT__'), 'placeholders filled');
  assert.ok(html.includes(`Generated ${NOW.toISOString()}`));
  assert.ok(html.includes('renders <\\/script><b>bold<\\/b> safely'), 'every closing tag is escaped inside the JSON');
  assert.equal((html.match(/<\/script>/g) ?? []).length, 2, 'only the template\'s own two script elements close');
});

// The three places that must agree on where the Playwright JSON report is and
// how the artifacts are named: the reporter config writes it, the workflow
// uploads that directory under that artifact name, the collector reads it.
test('the reporter config, the E2E workflow and the collector agree on the report path and the artifact names', () => {
  const root = repoRoot();
  const playwrightConfig = readFileSync(path.join(root, 'tests/playwright.config.ts'), 'utf8');
  const e2e = readFileSync(path.join(root, '.github/workflows/e2e.yml'), 'utf8');

  assert.ok(
    playwrightConfig.includes(`['json', { outputFile: '${PLAYWRIGHT_JSON_REPORT}' }]`),
    `tests/playwright.config.ts must write the JSON report to ${PLAYWRIGHT_JSON_REPORT} in CI`
  );

  const [reportDir] = PLAYWRIGHT_JSON_REPORT.split('/');

  assert.ok(e2e.includes(`name: ${PLAYWRIGHT_ARTIFACT_PREFIX}\${{ matrix.theme }}`),
    'the Playwright artifact keeps the prefix the collector classifies by');
  assert.match(e2e, new RegExp(`^\\s+tests/${reportDir}\\s*$`, 'm'),
    `e2e.yml must upload tests/${reportDir} with the report`);
  assert.ok(e2e.includes(`name: ${JASMINE_ARTIFACT_PREFIX}\${{ matrix.bundle.label }}`),
    'the Puppeteer record artifact keeps the prefix the collector classifies by');
});

test('the test-health workflow chains on the two orchestrators, takes a run id, and stays fork-safe', () => {
  const workflow = readFileSync(path.join(repoRoot(), '.github/workflows/test-health.yml'), 'utf8');

  assert.match(workflow, /workflows: \['Tests', 'Develop'\]/);
  assert.match(workflow, /types: \[completed\]/);
  assert.match(workflow, /workflow_dispatch:\n\s+inputs:\n\s+run-id:/);
  assert.match(workflow, /^permissions:\n\s+contents: write/m, 'the gh-pages push needs contents: write');
  assert.ok(!workflow.includes('pull_request_target'));
  assert.ok(!/^concurrency:/m.test(workflow), 'a concurrency group would cancel queued collections');
  assert.match(workflow, /--seed \.github\/test-health\/seed\.json/);
  assert.match(workflow, /--template \.github\/test-health\/index\.template\.html/);
});
