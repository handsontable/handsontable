import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {
  DURATIONS_ARTIFACT_PREFIX,
  JASMINE_ARTIFACT_PREFIX,
  LEDGER_VERSION,
  PLAYWRIGHT_ARTIFACT_PREFIX,
  PLAYWRIGHT_JSON_REPORT,
  RETENTION_DAYS,
  TICKET_THRESHOLD_RUNS,
  VISUAL_ARTIFACT_PREFIX,
  VISUAL_NIGHTLY_WORKFLOW,
  aggregate,
  classifyArtifact,
  collectArtifactFiles,
  emptyLedger,
  entryKey,
  mergeLedger,
  parseJasmineRecord,
  parsePlaywrightReport,
  parseVisualRecord,
  renderPage,
  renderStepSummary,
  runContextFromRun,
  stableGeneratedAt,
  testKey,
} from '../lib/test-health.mjs';
import {
  PLAYWRIGHT_DURATIONS_FILE,
  durationsView,
  mergeDurations,
  summarizePlaywrightReport,
} from '../lib/playwright-durations.mjs';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, steps } from '../lib/workflow-text.mjs';

const NOW = new Date('2026-09-08T12:00:00Z');
const TALL_FROZEN_TITLE = 'walkontable exact row heights › in the `exact` mode › '
  + 'keeps a row with a tall frozen cell at the provided height in both tables';
const TIMEOUT_MESSAGE = 'Timed out 10000ms waiting for expect(locator).toBeVisible()';
const QUARANTINE_NOTE = 'DEV-1234 until 2026-10-08 — height read one draw early';

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
            annotations: [{ type: 'quarantine', description: QUARANTINE_NOTE }],
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

test('classifyArtifact recognizes the artifact families and nothing else', () => {
  assert.equal(classifyArtifact('playwright-report-classic-min'), 'playwright');
  assert.equal(classifyArtifact('puppeteer-failed-specs-UMD.min-horizon'), 'jasmine');
  assert.equal(classifyArtifact('visual-compare-full'), 'visual');
  assert.equal(classifyArtifact('handsontable-build-umd'), null);
  assert.equal(classifyArtifact('visual-diff-report'), null, 'the diff report is images, not a record');
  assert.equal(PLAYWRIGHT_ARTIFACT_PREFIX, 'playwright-report-');
  assert.equal(JASMINE_ARTIFACT_PREFIX, 'puppeteer-failed-specs-');
  assert.equal(VISUAL_ARTIFACT_PREFIX, 'visual-compare-');
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
  assert.equal(entries[0].quarantine, QUARANTINE_NOTE, 'the quarantine travels');
  assert.equal(entries[1].quarantine, null);
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
  assert.equal(entries[0].quarantine, null, 'the frozen suite has no quarantine');
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
  assert.match(notes[0], /puppeteer-failed-specs-UMD\.min-main\/failed-specs-0df67fa0\.json: could not be read/);
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

  const later = new Date(NOW.getTime() + 3600000);
  const again = mergeLedger(ledger, [{ ...entries[0], error: 'newer copy' }], { now: later });

  assert.equal(again.changed, false, 're-collecting the stored payload changes nothing');
  assert.equal(again.pruned, 0);
  assert.equal(again.ledger.updatedAt, NOW.toISOString(), 'an unchanged ledger keeps its change time');
  assert.equal(aggregate(again.ledger, { now: later }).generatedAt, later.toISOString(),
    'aggregate always stamps now; stableGeneratedAt keeps an unchanged page identical in the collector');
});

test('aggregate counts per test over both windows, counts distinct runs, and draws the ticket line', () => {
  const run = runContextFromRun(RUN);
  const [flaky, failed] = parsePlaywrightReport(PLAYWRIGHT_REPORT, run);
  const day = 86400000;
  const at = daysAgo => new Date(NOW.getTime() - (daysAgo * day)).toISOString();
  const plainFlaky = { ...flaky, quarantine: null };
  const entries = [
    { ...plainFlaky, runId: 'a', seenAt: at(1) },
    { ...plainFlaky, runId: 'a', leg: 'e2e-main', seenAt: at(1) }, // same run, second leg: one recurrence, not two
    { ...plainFlaky, runId: 'b', seenAt: at(20) },
    { ...plainFlaky, runId: 'c', seenAt: at(45) }, // outside the long window
    { ...failed, runId: 'a', seenAt: at(2) },
    ...parseJasmineRecord(JASMINE_RECORD, { ...run, runId: 'd', seenAt: at(3) }),
  ];
  const summary = aggregate({ ...emptyLedger(), entries }, { now: NOW });

  assert.equal(summary.ticketThresholdRuns, TICKET_THRESHOLD_RUNS);
  assert.deepEqual(summary.totals, { tests: 4, needsTicket: 1, quarantined: 0, entries: 7 });

  const [first, ...rest] = summary.rows;

  assert.equal(first.title, flaky.title, 'the test that needs a ticket sorts first');
  assert.equal(first.count7, 2);
  assert.equal(first.count30, 3);
  assert.equal(first.countAll, 4);
  assert.equal(first.runs30, 2, 'two legs of one run are one run');
  assert.deepEqual(first.legs, ['e2e-classic-min', 'e2e-main']);
  assert.equal(first.needsTicket, true);
  assert.equal(first.quarantine, null, 'these entries are not quarantined');
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
    { ...entries[0], runId: '9', seenAt: '2026-09-01T00:00:00Z' }, // quarantined recurrence: badge, not a ticket
    // a non-quarantined recurrence across two branches supplies the needs-ticket row:
    { ...entries[1], runId: '9b', branch: 'feature/other', seenAt: '2026-09-02T00:00:00Z' },
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
  assert.match(markdown, /Recorded 6 new observation\(s\):/);
  assert.ok(markdown.includes(`- **flaky** on \`e2e-classic-min\`: ${TALL_FROZEN_TITLE} `
    + '(`e2e/walkontable/exact-row-heights.spec.ts:57`), '
    + `quarantined (${QUARANTINE_NOTE})\n`));
  assert.ok(markdown.includes('- **failed** on `UMD (theme: main)`: Core_alter remove_row should remove one row '
    + '(`handsontable/test/e2e/core/alter.spec.js`), in isolation: passes alone\n'));
  assert.ok(markdown.includes('1 test(s) recurred across 2+ distinct branches or flaky reruns (for a visual '
    + 'capture, 2+ nightly runs or distinct branches) in the last 30 days and need a fix or migration ticket:'));
  assert.match(markdown, /— 2 branch\(es\), 0 flaky rerun\(s\), legs: /, 'a functional row states its branches');
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
  assert.ok(html.includes('renders \\u003c/script>\\u003cb>bold\\u003c/b> safely'),
    'every `<` is escaped inside the JSON');
  assert.equal((html.match(/<\/script>/g) ?? []).length, 3,
    'only the template\'s own three script elements close (the summary, the durations, the code)');
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
  assert.match(e2e, /^\s+tests\/playwright-report\s*$/m,
    'e2e.yml must also upload tests/playwright-report, so tests/ stays the artifact root '
    + `and the report keeps its ${reportDir}/ prefix`);
  assert.ok(e2e.includes(`name: ${JASMINE_ARTIFACT_PREFIX}\${{ matrix.bundle.label }}`),
    'the Puppeteer record artifact keeps the prefix the collector classifies by');
});

test('the ledger chains on the orchestrators and the visual nightly, takes a run id, and stays fork-safe', () => {
  const workflow = readFileSync(path.join(repoRoot(), '.github/workflows/test-health.yml'), 'utf8');

  // `Visual nightly` is the only run the weekday full render's compare record arrives on; a pull request's
  // arrives on its `Tests` run. `Visual seed` must stay out – its differences are the merge's own.
  assert.match(workflow, /workflows: \['Tests', 'Develop', 'Publish', 'Visual nightly'\]/);
  // The visual ticket line counts runs of this workflow by name, so the name must be the real one.
  assert.ok(workflow.includes(`'${VISUAL_NIGHTLY_WORKFLOW}'`));
  assert.match(readFileSync(path.join(repoRoot(), '.github/workflows/visual-nightly.yml'), 'utf8'),
    new RegExp(`^name: ${VISUAL_NIGHTLY_WORKFLOW}$`, 'm'));
  assert.doesNotMatch(workflow, /workflows: \[[^\]]*'Visual seed'/, 'a seed\'s differences are not flakes');
  assert.match(workflow, /conclusion != 'cancelled'/, 'collects every completed run, not only failures');
  assert.match(workflow, /types: \[completed\]/);
  assert.match(workflow, /workflow_dispatch:\n\s+inputs:\n\s+run-id:/);
  assert.match(workflow, /^permissions:\n\s+contents: write/m, 'the gh-pages push needs contents: write');
  assert.ok(!workflow.includes('pull_request_target'));
  assert.ok(!/^concurrency:/m.test(workflow), 'a concurrency group would cancel queued collections');
  assert.match(workflow, /--seed \.github\/test-health\/seed\.json/);
  assert.match(workflow, /--template \.github\/test-health\/index\.template\.html/);
});

test('mergeLedger reports changed/pruned and freezes updatedAt on a true no-op', () => {
  const run = runContextFromRun(RUN);
  const [flaky] = parsePlaywrightReport(PLAYWRIGHT_REPORT, run);
  const seed = { ...emptyLedger(), updatedAt: '2026-09-01T00:00:00Z', entries: [flaky] };

  const noop = mergeLedger(seed, [flaky], { now: NOW });

  assert.equal(noop.changed, false, 're-collecting the same entry changes nothing');
  assert.equal(noop.pruned, 0);
  assert.equal(noop.ledger.updatedAt, '2026-09-01T00:00:00Z', 'a no-op keeps the old timestamp');

  const overwrite = mergeLedger(seed, [{ ...flaky, error: 'new error' }], { now: NOW });

  assert.equal(overwrite.changed, true, 'the same key with a different payload is a change');
  assert.equal(overwrite.added.length, 0);
  assert.equal(overwrite.ledger.updatedAt, NOW.toISOString());

  const day = 86400000;
  const staleAt = new Date(NOW.getTime() - ((RETENTION_DAYS + 1) * day)).toISOString();
  const stale = { ...flaky, runId: 'old', seenAt: staleAt };
  const pruning = mergeLedger(
    { ...emptyLedger(), updatedAt: '2026-09-01T00:00:00Z', entries: [stale] }, [], { now: NOW }
  );

  assert.equal(pruning.pruned, 1);
  assert.equal(pruning.changed, true, 'pruning a stale entry is a change');
});

test('stableGeneratedAt keeps the timestamp when only it would differ, else advances to now', () => {
  const base = { generatedAt: '2026-09-01T00:00:00Z', rows: [{ key: 'a', count7: 1 }], totals: { tests: 1 } };
  const same = { ...base, generatedAt: NOW.toISOString() };

  assert.equal(stableGeneratedAt(base, same, NOW), '2026-09-01T00:00:00Z', 'identical but for the stamp keeps it');

  const rolled = { ...base, generatedAt: NOW.toISOString(), rows: [{ key: 'a', count7: 0 }] };

  assert.equal(stableGeneratedAt(base, rolled, NOW), NOW.toISOString(), 'a count that rolled advances the stamp');
  assert.equal(stableGeneratedAt(null, same, NOW), NOW.toISOString(), 'the first publish uses now');
});

test('needsTicket flags a flake across runs or branches, not one branch failing twice', () => {
  const run = runContextFromRun(RUN);
  const [flaky, failed] = parsePlaywrightReport(PLAYWRIGHT_REPORT, run);
  const day = 86400000;
  const at = daysAgo => new Date(NOW.getTime() - (daysAgo * day)).toISOString();

  const oneBranch = aggregate({ ...emptyLedger(), entries: [
    { ...failed, runId: 'r1', branch: 'feature/x', seenAt: at(1) },
    { ...failed, runId: 'r2', branch: 'feature/x', seenAt: at(2) },
  ] }, { now: NOW });

  assert.equal(oneBranch.rows[0].needsTicket, false, "two failures on one branch is that branch's bug");

  const twoBranches = aggregate({ ...emptyLedger(), entries: [
    { ...failed, runId: 'r1', branch: 'feature/x', seenAt: at(1) },
    { ...failed, runId: 'r2', branch: 'feature/y', seenAt: at(2) },
  ] }, { now: NOW });

  assert.equal(twoBranches.rows[0].needsTicket, true, 'across two branches it needs a ticket');

  const plainFlaky = { ...flaky, quarantine: null };
  const flakyTwice = aggregate({ ...emptyLedger(), entries: [
    { ...plainFlaky, runId: 'r1', branch: 'feature/x', seenAt: at(1) },
    { ...plainFlaky, runId: 'r2', branch: 'feature/x', seenAt: at(2) },
  ] }, { now: NOW });

  assert.equal(flakyTwice.rows[0].needsTicket, true, 'flaky in two runs needs a ticket');
});

test('a quarantined test does not also count as needing a ticket', () => {
  const run = runContextFromRun(RUN);
  const [flaky] = parsePlaywrightReport(PLAYWRIGHT_REPORT, run);
  const day = 86400000;
  const at = daysAgo => new Date(NOW.getTime() - (daysAgo * day)).toISOString();

  assert.ok(flaky.quarantine, 'the fixture flaky test carries a quarantine annotation');

  const summary = aggregate({ ...emptyLedger(), entries: [
    { ...flaky, runId: 'r1', branch: 'feature/x', seenAt: at(1) },
    { ...flaky, runId: 'r2', branch: 'feature/y', seenAt: at(2) },
  ] }, { now: NOW });

  assert.ok(summary.rows[0].quarantine, 'the row is quarantined');
  assert.equal(summary.rows[0].needsTicket, false, 'a quarantined test already has an owner');
  assert.equal(summary.totals.needsTicket, 0);
});

test('the collector and the quarantine policy agree on the annotation type', () => {
  const policy = readFileSync(path.join(repoRoot(), 'tests/lib/quarantine-policy.mjs'), 'utf8');
  const match = policy.match(/QUARANTINE_ANNOTATION\s*=\s*'([^']+)'/);

  assert.ok(match, 'quarantine-policy.mjs defines QUARANTINE_ANNOTATION');

  const collector = readFileSync(path.join(repoRoot(), '.github/scripts/lib/test-health.mjs'), 'utf8');

  assert.ok(collector.includes(`candidate.type === '${match[1]}'`),
    'test-health.mjs quarantineOf must read the same annotation type the policy writes');
});

// The shape `visual-tests/lib/visual-compare-record.mjs` writes (`buildRecord`).
const VISUAL_RECORD = {
  version: 1,
  tier: 'full',
  expectedKey: 'base/develop',
  actualKey: 'nightly/develop',
  items: [
    {
      path: 'js/chromium-theme-main/multi-frameworks/filters/escaping-the-menu-12.png',
      status: 'changed',
      leg: 'js/chromium-theme-main',
      spec: 'visual-tests/tests/multi-frameworks/filters/escaping-the-menu.spec.ts',
      capture: 'multi-frameworks/filters/escaping-the-menu-12',
      actualSha256: '3b1f00aa11bb22cc33dd44ee55ff6677889900aabbccddeeff00112233445566',
      quarantine: null,
    },
    {
      path: 'js/chromium-theme-main-dark/multi-frameworks/filters/escaping-the-menu-12.png',
      status: 'changed',
      leg: 'js/chromium-theme-main-dark',
      spec: 'visual-tests/tests/multi-frameworks/filters/escaping-the-menu.spec.ts',
      capture: 'multi-frameworks/filters/escaping-the-menu-12',
      actualSha256: 'ffee',
      quarantine: 'DEV-1234 until 2026-10-08 — focus timer',
    },
    {
      path: 'js/chromium/js-only/sheetsBar/tabs-7.png',
      status: 'new',
      leg: 'js/chromium',
      capture: 'js-only/sheetsBar/tabs-7',
    },
    {
      path: 'cross-browser/webkit/borders-1.png',
      status: 'deleted',
      leg: 'cross-browser/webkit',
      capture: 'borders-1',
    },
  ],
};

test('parseVisualRecord keeps changed captures with their leg, spec and render hash', () => {
  const entries = parseVisualRecord(VISUAL_RECORD, runContextFromRun(RUN));

  // New and deleted items are structure – a renamed spec, a missing seed – not flakes.
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map(e => [e.tier, e.leg, e.status]), [
    ['visual', 'js/chromium-theme-main', 'failed'],
    ['visual', 'js/chromium-theme-main-dark', 'failed'],
  ]);
  assert.equal(entries[0].file, 'visual-tests/tests/multi-frameworks/filters/escaping-the-menu.spec.ts');
  assert.equal(entries[0].title, 'multi-frameworks/filters/escaping-the-menu-12', 'the capture, without the leg');
  assert.match(entries[0].error, /differs from base\/develop \(full tier\); render sha256 3b1f00aa11bb$/);
  assert.equal(entries[1].quarantine, 'DEV-1234 until 2026-10-08 — focus timer');
  // One capture on two themes in one run is one test, the way the two `-min` legs are.
  assert.equal(testKey(entries[0]), testKey(entries[1]));
});

test('a seed record adds nothing to the ledger', () => {
  // A seed's differences are what its merged commit changed. Ingesting them would file every intended
  // change as a flake – and a seed-tier record also arrives through `Tests`, on the master push.
  assert.deepEqual(parseVisualRecord({ ...VISUAL_RECORD, tier: 'seed' }, runContextFromRun(RUN)), []);
});

test('collectArtifactFiles reads a visual record and nothing else in that artifact', () => {
  const file = (artifact, filePath, text) => ({ artifact, path: filePath, text });
  const { entries, notes } = collectArtifactFiles([
    file('visual-compare-full', 'visual-compare-full-0123456789ab.json', JSON.stringify(VISUAL_RECORD)),
    file('visual-compare-full', 'notes.txt', 'ignored'),
    file('visual-compare-pr', 'visual-compare-pr-abc.json', '{broken'),
  ], runContextFromRun(RUN));

  assert.equal(entries.length, 2);
  assert.equal(notes.length, 1);
  assert.match(notes[0], /^visual-compare-pr\/visual-compare-pr-abc\.json: could not be read/);

  // A changed item the record could not map to a spec is noted, not dropped silently.
  const unmapped = { ...VISUAL_RECORD, items: [...VISUAL_RECORD.items, { path: 'odd/x-1.png', status: 'changed' }] };
  const noted = collectArtifactFiles([
    file('visual-compare-full', 'visual-compare-full-0123456789ab.json', JSON.stringify(unmapped)),
  ], runContextFromRun(RUN));

  assert.equal(noted.entries.length, 2);
  assert.deepEqual(noted.notes, ['visual-compare-full/visual-compare-full-0123456789ab.json: 1 changed item(s) had '
    + 'no capture (a path the record could not map to a spec), not recorded']);
});

test('a visual capture needs a ticket after two nights or on two branches, never for one pull request', () => {
  // Nothing in the visual tier is ever `flaky` (a retry overwrites the screenshot) and the nightly is one
  // branch, so the functional rule could never flag the same capture red on two nights. A raw run count
  // would, but it would also flag a pull request's own intended change on its second push.
  const run = runContextFromRun(RUN);
  const nightly = { workflow: VISUAL_NIGHTLY_WORKFLOW, branch: 'develop' };
  const [capture, otherLeg] = parseVisualRecord(VISUAL_RECORD, run);
  const plain = { ...otherLeg, quarantine: null };
  const day = 86400000;
  const at = daysAgo => new Date(NOW.getTime() - (daysAgo * day)).toISOString();
  const ledgerOf = entries => ({ ...emptyLedger(), entries });

  const oneRun = aggregate(ledgerOf([
    { ...capture, ...nightly, runId: 'n1', seenAt: at(1) },
    { ...plain, ...nightly, runId: 'n1', seenAt: at(1) },
  ]), { now: NOW });

  assert.equal(oneRun.rows.length, 1, 'both legs are one row');
  assert.deepEqual(oneRun.rows[0].legs, ['js/chromium-theme-main', 'js/chromium-theme-main-dark']);
  assert.equal(oneRun.rows[0].needsTicket, false, 'two legs in one run is one recurrence');

  const twoNights = aggregate(ledgerOf([
    { ...capture, ...nightly, runId: 'n1', seenAt: at(1) },
    { ...capture, ...nightly, runId: 'n2', seenAt: at(2) },
  ]), { now: NOW });

  assert.equal(twoNights.rows[0].needsTicket, true, 'the same capture red on two nights needs a ticket');
  assert.equal(twoNights.rows[0].nightlyRuns30, 2);

  // The record is written before approval, so an intended change is recorded on every push of its pull
  // request. Two pushes are one branch and no nights: not a flake.
  const onePullRequest = aggregate(ledgerOf([
    { ...capture, runId: 'p1', seenAt: at(1) },
    { ...capture, runId: 'p2', seenAt: at(2) },
  ]), { now: NOW });

  assert.equal(onePullRequest.rows[0].runs30, 2);
  assert.equal(onePullRequest.rows[0].needsTicket, false, 'a pull request\'s intended change pushed twice');

  const twoPullRequests = aggregate(ledgerOf([
    { ...capture, runId: 'p1', seenAt: at(1) },
    { ...capture, runId: 'q1', branch: 'feature/other', seenAt: at(2) },
  ]), { now: NOW });

  assert.equal(twoPullRequests.rows[0].needsTicket, true, 'the same capture red on unrelated pull requests');

  const pullRequestAndNight = aggregate(ledgerOf([
    { ...capture, runId: 'p1', seenAt: at(1) },
    { ...capture, ...nightly, runId: 'n1', seenAt: at(2) },
  ]), { now: NOW });

  assert.equal(pullRequestAndNight.rows[0].needsTicket, true, 'a pull request and a night are two branches');

  const markdown = renderStepSummary({ run, added: [], notes: [], summary: twoNights, pageUrl: 'x' });

  assert.ok(markdown.includes('- multi-frameworks/filters/escaping-the-menu-12 '
    + '(`visual-tests/tests/multi-frameworks/filters/escaping-the-menu.spec.ts`) — 2 nightly run(s), 1 branch(es), '
    + 'legs: js/chromium-theme-main\n'), 'a visual row states its nights and branches, not reruns it never has');

  const quarantined = aggregate(ledgerOf([
    { ...otherLeg, ...nightly, runId: 'n1', seenAt: at(1) },
    { ...otherLeg, ...nightly, runId: 'n2', seenAt: at(2) },
  ]), { now: NOW });

  assert.equal(quarantined.rows[0].needsTicket, false, 'a quarantined capture already names its owner');
});

test('a capture parked on one leg still needs a ticket for the leg that is not, whichever sorts last', () => {
  // The visual quarantine is per leg. `otherLeg` (main-dark) carries a stamp and `capture` (main) does not;
  // both differ on the same two nights, at the same instant, so only the entry order decides which one is
  // "last". Neither the badge nor the ticket line may depend on that.
  const run = runContextFromRun(RUN);
  const nightly = { workflow: VISUAL_NIGHTLY_WORKFLOW, branch: 'develop' };
  const [capture, otherLeg] = parseVisualRecord(VISUAL_RECORD, run);
  const seenAt = night => new Date(NOW.getTime() - (night * 86400000)).toISOString();
  const sightings = [1, 2].flatMap(night => [
    { ...capture, ...nightly, runId: `n${night}`, seenAt: seenAt(night) },
    { ...otherLeg, ...nightly, runId: `n${night}`, seenAt: seenAt(night) },
  ]);
  const rowOf = entries => aggregate({ ...emptyLedger(), entries }, { now: NOW }).rows[0];

  [sightings, [...sightings].reverse()].forEach((order, i) => {
    const row = rowOf(order);

    assert.equal(row.needsTicket, true, `order ${i}: the unparked leg is red on two nights`);
    assert.equal(row.quarantine, otherLeg.quarantine, `order ${i}: the row shows the parked leg's entry`);
    assert.equal(row.nightlyRuns30, 2);
  });

  // Only the parked leg differs: nothing to file, and the badge says why.
  const parkedOnly = rowOf(sightings.filter(entry => entry.quarantine));

  assert.equal(parkedOnly.needsTicket, false);
  assert.equal(parkedOnly.quarantine, otherLeg.quarantine);

  // The parked leg on two nights and the unparked one on a single pull request is one open branch: no ticket.
  const mixed = rowOf([...sightings.filter(entry => entry.quarantine), { ...capture, runId: 'p1', seenAt: seenAt(3) }]);

  assert.equal(mixed.needsTicket, false);
  assert.equal(mixed.openBranches30, 1);
});

test('the Compare job uploads its record under the prefix the collector classifies by', () => {
  // The same three-place agreement the Playwright report has: the workflow uploads it under this name, the
  // download step's filter admits it, and the collector classifies it.
  const root = repoRoot();
  const visual = readFileSync(path.join(root, '.github/workflows/visual.yml'), 'utf8');
  const health = readFileSync(path.join(root, '.github/workflows/test-health.yml'), 'utf8');

  // Read inside the two steps, never from the whole file: a commented-out or moved line must not pass.
  const stepOf = (workflow, name) => {
    const start = workflow.indexOf(`      - name: ${name}\n`);

    assert.notEqual(start, -1, `lost the step: ${name}`);
    const next = workflow.indexOf('\n      - ', start + 1);

    return workflow.slice(start, next === -1 ? undefined : next);
  };
  const upload = stepOf(visual, 'Upload the visual compare record');
  const download = stepOf(health, 'Download the run\'s test artifacts');

  assert.ok(upload.includes(`\n          name: ${VISUAL_ARTIFACT_PREFIX}\${{ inputs.tier }}\n`),
    'visual.yml must upload the record under the prefix the collector classifies by');
  const families = new RegExp('test\\("\\^\\(playwright-report-\\|playwright-durations-\\|'
    + 'puppeteer-failed-specs-\\|visual-compare-\\)"\\)');

  assert.match(download, new RegExp(`\\n\\s+--jq '[^'\\n]*${families.source}`),
    'test-health.yml must download the visual records');
  assert.ok(download.includes(`|${VISUAL_ARTIFACT_PREFIX})`));
});

// The fourth family: every Playwright leg's durations, green or red (`lib/playwright-durations.mjs`).
const DURATIONS_FIXTURE = path.join(import.meta.dirname, 'fixtures/playwright-report-classic.json');
const durationsOf = (leg, extra = {}) => summarizePlaywrightReport(
  JSON.parse(readFileSync(DURATIONS_FIXTURE, 'utf8')), { leg, runId: String(RUN.id), runAttempt: 1, ...extra }
);

test('classifyArtifact recognizes the durations family beside the three flake families', () => {
  assert.equal(DURATIONS_ARTIFACT_PREFIX, 'playwright-durations-');
  assert.equal(classifyArtifact('playwright-durations-classic-min'), 'durations');
  assert.equal(classifyArtifact('playwright-durations-engines'), 'durations');
  assert.equal(classifyArtifact('playwright-report-classic-min'), 'playwright', 'the report family is unchanged');
  assert.equal(classifyArtifact('playwright-trace'), null);
});

test('collectArtifactFiles routes a durations file to the durations, never to the flake entries', () => {
  const run = runContextFromRun(RUN);
  const file = (artifact, filePath, text) => ({ artifact, path: filePath, text });
  const classic = durationsOf('classic');
  const { entries, notes, durations } = collectArtifactFiles([
    file('playwright-durations-classic', 'playwright-durations.json', JSON.stringify(classic)),
    file('playwright-durations-main', 'playwright-durations.json', JSON.stringify(durationsOf('main-min'))),
    file('playwright-durations-horizon', 'playwright-durations.json', '{"version":1,'),
    file('playwright-durations-horizon-min', 'notes.txt', 'nothing here'),
    // The failure upload ships all of tests/test-results. The summarizer runs after it, so a report
    // artifact holds no durations file today; if the steps were reordered, reading it would count the leg twice.
    file('playwright-report-classic', PLAYWRIGHT_DURATIONS_FILE, JSON.stringify(classic)),
    file('playwright-report-classic', PLAYWRIGHT_JSON_REPORT, JSON.stringify(PLAYWRIGHT_REPORT)),
  ], run);

  assert.deepEqual(entries.map(entry => entry.title), [TALL_FROZEN_TITLE, 'selects a range'],
    'the flake entries come from the report alone');
  assert.deepEqual(durations.map(summary => summary.leg), ['classic', 'main'],
    'a leg is named by its artifact, which GitHub keeps unique within a run');
  assert.deepEqual(durations[0], classic);
  assert.equal(notes.length, 3, notes.join('\n'));
  assert.match(notes[0], /^playwright-durations-main: the file names leg main-min; recorded as main$/);
  assert.match(notes[1], /^playwright-durations-horizon\/playwright-durations\.json: could not be read/);
  assert.match(notes[2], /^playwright-durations-horizon-min: no playwright-durations\.json in the artifact/);
});

test('the E2E workflow summarizes and uploads every leg\'s durations, red or green', () => {
  // The post-steps run on `!cancelled()`: a bare `if:` would get `success()` ANDed on and skip every red
  // leg, and `failure()` alone would skip every green one. Both must reach the page.
  const e2e = readFileSync(path.join(repoRoot(), '.github/workflows/e2e.yml'), 'utf8');
  // The GitHub expression the matrix job names its leg with, as text.
  // eslint-disable-next-line no-template-curly-in-string
  const legs = [['playwright', '${{ matrix.theme }}${{ matrix.bundle.suffix }}'], ['playwright-engines', 'engines']];

  for (const [jobId, leg] of legs) {
    const jobSteps = steps(job(e2e, jobId));
    const at = name => jobSteps.findIndex(step => step.startsWith(`- name: ${name}\n`));
    const run = jobSteps.findIndex(step => /^ {8}id: playwright$/m.test(step));
    const report = jobSteps.findIndex(step => /^ {10}name: playwright-report-/m.test(step));
    const summarize = at('Summarize the Playwright durations');
    const upload = at('Upload the Playwright durations');

    assert.ok(run !== -1 && report !== -1, `${jobId}: lost the run step or the report upload`);
    assert.ok(summarize > report && upload === summarize + 1,
      `${jobId}: summarize, then upload, after the report upload (whose failure() must not see these steps)`);

    const summarizeStep = jobSteps[summarize];
    const uploadStep = jobSteps[upload];
    const reportPin = jobSteps[report].match(/uses: (actions\/upload-artifact@[0-9a-f]{40})/)[1];

    assert.match(summarizeStep, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${jobId}: summarize on !cancelled()`);
    assert.ok(summarizeStep.includes(`\n        run: node .github/scripts/playwright-durations.mjs --leg ${leg}\n`),
      `${jobId}: the summarizer names the leg the artifact is named after`);
    assert.match(uploadStep, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m, `${jobId}: upload on !cancelled()`);
    assert.ok(uploadStep.includes(`uses: ${reportPin} `), `${jobId}: the same pinned upload action as the report`);
    assert.ok(uploadStep.includes(`\n          name: ${DURATIONS_ARTIFACT_PREFIX}${leg}\n`),
      `${jobId}: the artifact keeps the prefix the collector classifies by`);
    assert.ok(uploadStep.includes(`\n          path: tests/${PLAYWRIGHT_DURATIONS_FILE}\n`),
      `${jobId}: one JSON file, not the HTML report`);
    assert.match(uploadStep, /^ {10}if-no-files-found: ignore$/m,
      `${jobId}: a leg that crashed before its report is a notice from the summarizer, not a second warning`);
    assert.match(uploadStep, /^ {10}retention-days: 3$/m);
    assert.match(uploadStep, /^ {10}overwrite: true$/m, `${jobId}: a re-run attempt replaces the file`);
  }

  const health = readFileSync(path.join(repoRoot(), '.github/workflows/test-health.yml'), 'utf8');

  assert.ok(health.includes(`|${DURATIONS_ARTIFACT_PREFIX}|`), 'test-health.yml must download the durations');
});

/**
 * Runs a script in a child process.
 *
 * @param {string} script The script, relative to the repository root.
 * @param {string[]} args Its arguments.
 * @param {object} [options] Options.
 * @param {string} [options.cwd] The working directory (the repository root by default).
 * @param {object} [options.env] Extra environment; the GitHub run variables are cleared otherwise.
 * @returns {{status: number, stdout: string, stderr: string}} The outcome.
 */
function runScript(script, args, { cwd = repoRoot(), env = {} } = {}) {
  const result = spawnSync(process.execPath, [path.join(repoRoot(), script), ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_RUN_ID: '', GITHUB_RUN_ATTEMPT: '', ...env },
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('the summarizer CLI writes the leg\'s durations next to the report, and never fails a leg over it', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'durations-cli-'));

  try {
    const results = path.join(dir, 'tests/test-results');

    mkdirSync(results, { recursive: true });

    const missing = runScript('.github/scripts/playwright-durations.mjs', ['--leg', 'classic'], { cwd: dir });

    assert.equal(missing.status, 0, 'a leg whose run step died before the report must not go red here');
    assert.match(missing.stdout, /^::notice title=Playwright durations::No tests\/test-results\/report\.json/m);
    assert.ok(!existsSync(path.join(dir, 'tests', PLAYWRIGHT_DURATIONS_FILE)));

    writeFileSync(path.join(results, 'report.json'), '{"suites": [');

    const broken = runScript('.github/scripts/playwright-durations.mjs', ['--leg', 'classic'], { cwd: dir });

    assert.equal(broken.status, 0);
    assert.match(broken.stdout, /^::warning title=Playwright durations::Could not summarize/m);
    assert.ok(!existsSync(path.join(dir, 'tests', PLAYWRIGHT_DURATIONS_FILE)));

    writeFileSync(path.join(results, 'report.json'), readFileSync(DURATIONS_FIXTURE));

    const written = runScript('.github/scripts/playwright-durations.mjs', ['--leg', 'classic'],
      { cwd: dir, env: { GITHUB_RUN_ID: String(RUN.id), GITHUB_RUN_ATTEMPT: '1' } });

    assert.equal(written.status, 0, written.stderr);
    assert.deepEqual(JSON.parse(readFileSync(path.join(dir, 'tests', PLAYWRIGHT_DURATIONS_FILE), 'utf8')),
      durationsOf('classic'));
    assert.match(written.stdout, /45 tests in 5 spec files: 18\.2 min wall-clock, 0\.9 min summed over 2 workers/);

    const noLeg = runScript('.github/scripts/playwright-durations.mjs', [], { cwd: dir });

    assert.equal(noLeg.status, 2, 'a missing --leg is the workflow\'s own bug and stays loud');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the collector writes durations.json beside the ledger, and a second collection is a no-op', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'durations-collect-'));

  try {
    const artifacts = path.join(dir, 'artifacts');
    const ledgerDir = path.join(dir, 'gh-pages/test-health');
    const put = (relative, text) => {
      mkdirSync(path.dirname(path.join(artifacts, relative)), { recursive: true });
      writeFileSync(path.join(artifacts, relative), text);
    };

    put('playwright-durations-classic/playwright-durations.json', JSON.stringify(durationsOf('classic')));
    put('playwright-durations-main/playwright-durations.json', JSON.stringify(durationsOf('main')));
    put(`playwright-report-classic/${PLAYWRIGHT_JSON_REPORT}`, JSON.stringify(PLAYWRIGHT_REPORT));
    writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ ...RUN, updated_at: '2026-10-13T10:45:00Z' }));

    const collect = now => runScript('.github/scripts/test-health-collect.mjs', [
      '--run', path.join(dir, 'run.json'),
      '--artifacts', artifacts,
      '--ledger-dir', ledgerDir,
      '--template', path.join(repoRoot(), '.github/test-health/index.template.html'),
      '--now', now,
    ]);
    const files = ['ledger.json', 'summary.json', 'durations.json', 'index.html'];
    const snapshot = () => Object.fromEntries(files
      .map(name => [name, readFileSync(path.join(ledgerDir, name), 'utf8')]));

    const first = collect('2026-10-13T12:00:00Z');

    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout,
      /^Playwright wall-clock: classic 18\.2 min, main 18\.2 min \(2 workers\); heaviest file: /m);

    const before = snapshot();
    const durations = JSON.parse(before['durations.json']);

    assert.deepEqual(durations.runs.map(run => [run.runId, run.legs.map(leg => leg.leg)]),
      [[String(RUN.id), ['classic', 'main']]]);
    assert.equal(JSON.parse(before['ledger.json']).entries.length, 2, 'the flake ledger is untouched by the durations');
    assert.ok(before['index.html'].includes('Where the time goes'));

    const second = collect('2026-10-13T13:00:00Z');

    assert.equal(second.status, 0, second.stderr);
    assert.deepEqual(snapshot(), before, 'the same artifacts an hour later change no published byte');

    const future = collect('2026-12-31T00:00:00Z');

    assert.equal(future.status, 0, future.stderr);
    assert.deepEqual(JSON.parse(readFileSync(path.join(ledgerDir, 'durations.json'), 'utf8')).runs, [],
      'past 30 days the run is pruned');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('renderStepSummary adds the leg wall-clocks and the heaviest file when the run left durations', () => {
  const run = runContextFromRun(RUN);
  const summary = aggregate(emptyLedger(), { now: NOW });
  const markdown = renderStepSummary({
    run, added: [], notes: [], summary, pageUrl: 'x', durations: [durationsOf('classic')],
  });

  assert.ok(markdown.includes('\nPlaywright wall-clock: classic 18.2 min (2 workers); heaviest file: '
    + '`e2e/submenu-hover-delay.spec.ts` (0.3 min summed over 1 leg).\n'));
  assert.ok(markdown.indexOf('Playwright wall-clock') < markdown.indexOf('Ledger: x'));
});

test('renderPage draws the "Where the time goes" section from the inlined durations, escaped and runnable', () => {
  const template = readFileSync(path.join(repoRoot(), '.github/test-health/index.template.html'), 'utf8');
  const legs = [durationsOf('classic'), durationsOf('main')];

  legs[1].files[0].cases[0].title = 'stalls </script><b>bold</b> forever';

  // A branch name is pull-request input. `<!--` then `<script` would leave the data element open past
  // the template's own `</script>`, so the code never runs and the page, ledger included, stays blank.
  const run = runContextFromRun({ ...RUN, head_branch: 'fix/x<!--<script>y', updated_at: '2026-10-13T10:45:00Z' });
  const { doc } = mergeDurations(null, legs, run, { now: new Date('2026-10-13T12:00:00Z') });
  const view = durationsView(doc);
  const html = renderPage(template, aggregate(emptyLedger(), { now: NOW }), view);

  assert.ok(!html.includes('__DURATIONS_JSON__'), 'placeholder filled');
  assert.match(html, /<h2 id="time">Where the time goes<\/h2>/);
  assert.ok(html.includes('stalls \\u003c/script>\\u003cb>bold\\u003c/b> forever'),
    'a title cannot close the data element');
  assert.ok(html.includes('fix/x\\u003c!--\\u003cscript>y'), 'nor can a branch open a comment in it');
  assert.equal((html.match(/<\/script>/g) ?? []).length, 3);

  const dataOpen = '<script id="durations" type="application/json">';
  const dataStart = html.indexOf(dataOpen) + dataOpen.length;
  const data = html.slice(dataStart, html.indexOf('</script>', dataStart));

  assert.ok(!data.includes('<'), 'no `<` reaches the data element');
  assert.deepEqual(JSON.parse(data), JSON.parse(JSON.stringify(view)));

  const empty = renderPage(template, aggregate(emptyLedger(), { now: NOW }));

  assert.ok(empty.includes('<script id="durations" type="application/json">null</script>'),
    'a page rendered before any durations exist still parses');

  // The page's own code must at least compile: a syntax error would blank the whole page, ledger included.
  const code = html.split('<script>').slice(1).map(part => part.slice(0, part.indexOf('</script>')));

  assert.equal(code.length, 1);
  assert.doesNotThrow(() => new vm.Script(code[0]));
});
