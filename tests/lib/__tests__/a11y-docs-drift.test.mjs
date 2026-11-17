import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareViolations } from '../a11y-baseline.mjs';
import { DOCS_SCAN, baselineLines, buildCheckRun, pageLines } from '../a11y-check-run.mjs';
import { DOCS_AUDIT_COMMAND, LEDGER_URL, auditIsStale, auditStaleness, docsAudit, driftKey, driftNotes, driftOf, isDrift, siteAudit } from '../a11y-docs-drift.mjs';

// tests/AGENTS.md ("A11y: the docs site scan", baseline drift): a pull request's docs scan reads develop's staging deploy,
// so a new finding develop's latest docs audit also saw is drift, a warning at most; a grown one, and one the audit did
// not see, stay at their severity.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const row = (fields = {}) => ({ source: 'docs', check: 'docs-axe', kind: 'axe-violation', rule: 'color-contrast', page: 'angular-instance-access',
  theme: 'dark', where: 'div.ln', lastRun: '200', ...fields });
const LEDGER = {
  latest: { a11y: { runId: '100', seenAt: '2026-11-10T05:00:00Z' }, docs: { runId: '200', seenAt: '2026-11-10T10:29:01Z' } },
  nights: [
    { source: 'docs', runId: '200', headSha: 'abc', seenAt: '2026-11-10T10:29:01Z', axe: { complete: true } },
    { source: 'docs', runId: '150', headSha: 'old', seenAt: '2026-11-09T10:00:00Z', axe: { complete: true } },
  ],
  rows: [
    row(),
    row({ rule: 'link-in-text-block', page: 'js-api-core', theme: 'light', where: 'a', nodes: 6 }),
    row({ rule: 'label', page: 'js-demo', where: 'input', lastRun: '150' }),
    row({ source: 'axe', check: 'axe', page: 'dialog', theme: 'main', where: 'button' }),
  ],
};

test('the audit is the ledger\'s latest docs night: its run, time, commit and the docs findings it sighted', () => {
  const audit = docsAudit(LEDGER);

  assert.deepEqual({ ...audit, keys: [...audit.keys].sort(), nodes: Object.fromEntries(audit.nodes) }, {
    runId: '200', seenAt: '2026-11-10T10:29:01Z', headSha: 'abc',
    keys: ['color-contrast|angular-instance-access|dark|div.ln', 'link-in-text-block|js-api-core|light|a'],
    nodes: { 'color-contrast|angular-instance-access|dark|div.ln': null, 'link-in-text-block|js-api-core|light|a': 6 },
  }, 'a row the latest night did not sight, and a product row, are not the audit\'s; a row recorded before node counts has none');
  assert.equal(docsAudit({ latest: { a11y: { runId: '1' } }, nights: [], rows: [] }), null, 'no docs night, no audit');
  assert.equal(docsAudit(null), null);

  // A develop dispatch whose scan wrote no findings document records a night of the checks alone: it sighted no docs
  // finding, so the audit stays the latest night that read the scan.
  const checksOnly = {
    ...LEDGER,
    latest: { ...LEDGER.latest, docs: { runId: '300', seenAt: '2026-11-12T10:00:00Z' } },
    nights: [...LEDGER.nights, { source: 'docs', runId: '300', headSha: 'def', seenAt: '2026-11-12T10:00:00Z', axe: null }],
  };

  assert.equal(docsAudit(checksOnly).runId, '200');
  assert.equal(docsAudit(checksOnly).keys.size, 2);
  assert.equal(docsAudit({ ...checksOnly, nights: checksOnly.nights.slice(2) }), null, 'only a night of the checks: no audit, and the note says so');
  assert.equal(driftKey({ rule: 'r', page: 'p', theme: 't', where: 'w' }), 'r|p|t|w');
  assert.equal(LEDGER_URL, 'https://handsontable.github.io/handsontable/test-health/a11y.json');
});

test('the website audit is the ledger\'s latest website night, and its notes name the website\'s baseline and audit', () => {
  const ledger = {
    ...LEDGER,
    latest: { ...LEDGER.latest, website: { runId: '300', seenAt: '2026-11-12T09:00:00Z' } },
    nights: [...LEDGER.nights, { source: 'website', runId: '300', headSha: 'def', seenAt: '2026-11-12T09:00:00Z', axe: { complete: true } }],
    rows: [...LEDGER.rows, row({ source: 'website', check: 'website-axe', page: 'pricing', theme: 'phone', where: 'button.tab', lastRun: '300' })],
  };
  const audit = siteAudit(ledger, 'website');

  assert.deepEqual([...audit.keys], ['color-contrast|pricing|phone|button.tab'], 'a docs row is not the website audit\'s');
  assert.equal(siteAudit(LEDGER, 'website'), null, 'no website night, no audit');

  const [note] = driftNotes({ audit, drift: 1, counted: 2, site: 'website' });

  assert.match(note, /1 of the 2 new or grown findings are on the live website already: the website audit of 2026-11-12 \(run 300\)/);
  assert.match(note, /refresh tests\/a11y\/website\/website-baseline\.json from that audit \(tests\/AGENTS\.md/,
    'the docs refresh command is not the website\'s');
  assert.match(driftNotes({ audit: null, drift: 0, counted: 1, site: 'website' })[0], /gh workflow run website-a11y\.yml --ref develop/);
  assert.match(driftNotes({ audit, drift: 0, counted: 1, grown: 1, site: 'website' })[0],
    /^A grown finding counts at its severity: this run counts more nodes than the website audit recorded/);
});

test('a finding is drift when the audit saw its rule on its page, scheme and masked element', () => {
  const audit = docsAudit(LEDGER);
  const item = { rule: 'color-contrast', page: 'angular-instance-access', theme: 'dark', target: 'div.ln' };

  assert.equal(isDrift(audit, item), true);
  assert.equal(isDrift(audit, { ...item, theme: 'light' }), false, 'another scheme is another finding');
  assert.equal(isDrift(audit, { ...item, page: 'js-demo', rule: 'label', target: 'input' }), false, 'a row the audit did not sight');
  assert.equal(isDrift(null, item), false, 'with no audit nothing is drift');

  const masked = docsAudit({ ...LEDGER, rows: [row({ where: 'td.ht_*' })] });

  assert.equal(isDrift(masked, { ...item, target: 'td.ht_4f2a9c1b' }), true, 'the element is masked the way the ledger masks it');
});

test('the notes say how much is drift and the remedy, when nothing could be read, and when the audit is stale', () => {
  const audit = docsAudit(LEDGER);

  assert.deepEqual(driftNotes({ audit, drift: 0, counted: 2 }), []);
  assert.match(driftNotes({ audit, drift: 0, counted: 2, grown: 2 })[0],
    /^2 grown findings count at their severity: this run counts more nodes than the develop docs audit recorded, or its row there has no count/);
  assert.match(driftNotes({ audit, drift: 3, counted: 5 })[0],
    /^3 of the 5 new or grown findings are on develop's docs already: the develop docs audit of 2026-11-10 \(run 200\) saw them, each grown one with at least as many nodes\..*refresh tests\/a11y\/docs\/docs-baseline\.json from that audit, `node tests\/scripts\/a11y-docs-baseline\.mjs --run 200`/);
  assert.match(driftNotes({ audit: null, problem: 'HTTP 404', drift: 0, counted: 5 })[0], /could not be read \(HTTP 404\), so every new or grown finding counts/);
  assert.ok(driftNotes({ audit: null, drift: 0, counted: 5 })[0].includes(DOCS_AUDIT_COMMAND), 'no audit: dispatch one');

  const stale = driftNotes({ audit, drift: 1, counted: 1, deployedAt: '2026-11-12T07:25:30Z' });

  assert.equal(stale.length, 2);
  assert.match(stale[1], /older than the staging deploy this run read \(2026-11-12 07:25 UTC\).*gh workflow run docs-a11y\.yml --ref develop/);
  assert.equal(driftNotes({ audit, drift: 1, counted: 1, deployedAt: '2026-11-09T00:00:00Z' }).length, 1, 'an audit newer than the deploy is not stale');
});

test('the audit is stale when a deploy landed after it STARTED, not after it finished', () => {
  // The shape of the incident: an audit that ran 14 minutes (10:15 to 10:29) and a docs change deployed at 10:25, inside the
  // run. The scan may have read the pages before the deploy, so the finish time says the audit is newer than the deploy and
  // the start time says it may not be.
  const audit = { ...docsAudit(LEDGER), startedAt: '2026-11-10T10:15:00Z', seenAt: '2026-11-10T10:29:01Z' };
  const during = '2026-11-10T10:25:00Z';

  assert.equal(auditIsStale(audit, during), true, 'a deploy during the audit');
  assert.equal(auditIsStale(audit, '2026-11-10T10:10:00Z'), false, 'a deploy before the audit started');
  assert.equal(auditIsStale(audit, null), false, 'no deploy read says nothing');
  assert.equal(auditIsStale({ ...audit, startedAt: undefined }, during), false, 'with no start time the finish time decides, as before');
  assert.equal(auditIsStale({ ...audit, startedAt: undefined }, '2026-11-10T10:30:00Z'), true);
  assert.equal(auditIsStale({ ...audit, startedAt: 'not a time' }, during), false, 'a start time that does not parse falls back to the finish time');
  assert.equal(auditIsStale({ ...audit, startedAt: 'not a time' }, '2026-11-10T10:30:00Z'), true);

  const [note] = driftNotes({ audit, drift: 0, counted: 0, deployedAt: during });

  assert.match(note, /^The develop docs audit of 2026-11-10 is older than the staging deploy this run read \(2026-11-10 10:25 UTC\)/);
  assert.match(note, /which landed after the audit started, so a new finding the site gained since reads as this change's/,
    'the note says the deploy landed after the audit started');
  assert.match(driftNotes({ audit: { ...audit, startedAt: undefined }, drift: 0, counted: 0, deployedAt: '2026-11-10T10:30:00Z' })[0],
    /which landed after the audit finished/, 'with no start time the note says finished');
  assert.deepEqual(driftNotes({ audit, drift: 0, counted: 0, deployedAt: '2026-11-10T10:10:00Z' }), []);
});

test('the poster reads the audit\'s start only when a deploy time is known, and the start it reads decides the staleness', async() => {
  const audit = docsAudit(LEDGER);
  const calls = [];
  const readStart = startedAt => async runId => {
    calls.push(runId);

    return startedAt;
  };
  const during = '2026-11-10T10:25:00Z';

  // Finished 10:29:01; started 10:15: a deploy at 10:25 is inside the run, which only the start time shows.
  const started = await auditStaleness({ audit, deployedAt: during, readStart: readStart('2026-11-10T10:15:00Z') });

  assert.equal(started.stale, true);
  assert.equal(started.audit.startedAt, '2026-11-10T10:15:00Z');
  assert.deepEqual(calls, ['200'], 'the start is read from the audit\'s run');

  assert.equal((await auditStaleness({ audit, deployedAt: during, readStart: readStart(null) })).stale, false,
    'an API that does not answer leaves the finish time to decide: 10:25 is before 10:29');
  assert.equal((await auditStaleness({ audit, deployedAt: '2026-11-10T10:10:00Z', readStart: readStart('2026-11-10T10:15:00Z') })).stale, false,
    'a deploy before the audit started');

  calls.length = 0;
  assert.deepEqual(await auditStaleness({ audit, deployedAt: null, readStart: readStart('x') }), { audit, stale: false });
  assert.deepEqual(await auditStaleness({ audit: null, deployedAt: during, readStart: readStart('x') }), { audit: null, stale: false });
  assert.deepEqual(calls, [], 'with no deploy time, or no audit, nothing is read');
});

test('on a stale audit a grown finding the audit saw is drift whatever its node count, and a finding it did not see still counts', () => {
  const entry = { page: 'js-api-core', theme: 'light', rule: 'link-in-text-block', target: 'a', impact: 'serious', nodes: 3, issue: 'prose-link-color-only' };
  const finding = overrides => ({ page: 'js-api-core', theme: 'light', rule: 'link-in-text-block', target: 'a', impact: 'serious', help: 'h',
    helpUrl: 'https://dequeuniversity.com/x', wcag: ['1.4.1'], nodes: 1, ...overrides });
  const comparison = violations => compareViolations({ baseline: [entry], issues: [{ id: 'prose-link-color-only', title: 'Prose links' }], violations,
    scanned: [{ page: 'js-api-core', theme: 'light' }, { page: 'js-demo', theme: 'light' }], mode: 'warn', baselineFile: 'a11y/docs/docs-baseline.json' });
  const audit = docsAudit(LEDGER);
  // 10 nodes against the 6 the audit recorded (LEDGER's link-in-text-block row of js-api-core), and a label finding on a page
  // the audit never sighted.
  const grew = comparison([...Array.from({ length: 10 }, () => finding()), finding({ page: 'js-demo', rule: 'label', target: 'input', wcag: ['4.1.2'] })]);
  const [grownItem] = grew.grown;
  const [freshItem] = grew.newViolations;

  assert.equal(driftOf(audit, grew)(grownItem), false, 'on a fresh audit growth past its count is this change\'s');
  assert.equal(driftOf(audit, grew, { stale: true })(grownItem), true, 'on a stale audit the docs may have grown it since');
  assert.equal(driftOf(audit, grew, { stale: true })(freshItem), false, 'a finding the audit never saw still counts: a stale audit cannot clear a rule the scan code added');
  assert.equal(driftOf(null, grew, { stale: true })(grownItem), false, 'with no audit nothing is drift');
});

test('the note names the grown findings that count, not only how many', () => {
  const audit = docsAudit(LEDGER);
  const grown = [
    { rule: 'js-row-height', page: 'js-row-height', theme: 'light' },
    { rule: 'link-in-text-block', page: 'js-row-height', theme: 'dark' },
    { rule: 'label', page: 'js-demo', theme: 'light' },
    { rule: 'color-contrast', page: 'js-demo', theme: 'dark' },
  ];
  const [note] = driftNotes({ audit, drift: 0, counted: 4, grown: grown.length, grownItems: grown });

  assert.match(note, /^4 grown findings count at their severity: js-row-height on js-row-height \(light\), link-in-text-block on js-row-height \(dark\), label on js-demo \(light\) and 1 more: /);
  assert.match(driftNotes({ audit, drift: 0, counted: 1, grown: 1, grownItems: grown.slice(0, 1) })[0],
    /^A grown finding counts at its severity: js-row-height on js-row-height \(light\): this run counts more nodes/);
});

test('the docs check run counts drift as a warning on a change run, a finding the audit did not see at its severity, and everything on an audit', () => {
  const entry = { page: 'js-api-core', theme: 'light', rule: 'link-in-text-block', target: 'a', impact: 'serious', nodes: 3, issue: 'prose-link-color-only' };
  const finding = overrides => ({ page: 'js-api-core', theme: 'light', rule: 'link-in-text-block', target: 'a', impact: 'serious', help: 'h',
    helpUrl: 'https://dequeuniversity.com/x', wcag: ['1.4.1'], nodes: 1, ...overrides });
  const scanned = [{ page: 'js-api-core', theme: 'light' }, { page: 'angular-instance-access', theme: 'dark' }];
  const comparison = violations => ({ ...compareViolations({ baseline: [entry], issues: [{ id: 'prose-link-color-only', title: 'Prose links' }], violations,
    scanned, mode: 'warn', baselineFile: 'a11y/docs/docs-baseline.json' }), problems: [], notes: [] });
  const build = (value, extra = {}) => buildCheckRun({
    comparison: value, pages: pageLines(readFileSync(path.join(TESTS_ROOT, 'a11y/docs/pages.mjs'), 'utf8')), baseline: baselineLines(''),
    scan: DOCS_SCAN, ...extra,
  });
  const audit = docsAudit(LEDGER);
  // New on a page the audit saw it on: drift.
  const drifted = comparison([...Array.from({ length: 3 }, () => finding()), finding({ page: 'angular-instance-access', theme: 'dark', rule: 'color-contrast',
    target: 'div.ln', wcag: ['1.4.3'] })]);
  const drift = driftOf(audit, drifted);

  assert.equal(build(drifted).conclusion, 'failure', 'without the audit, drift is red');

  const warned = build(drifted, { drift });

  assert.equal(warned.conclusion, 'neutral');
  assert.match(warned.title, /· 1 warning only · 1 new/);
  assert.ok(warned.annotations.every(item => item.annotation_level === 'warning'));

  // Grown on a baselined entry the audit saw: develop's growth is drift up to the node count the audit recorded (6),
  // and growth past it is this change's, as is any growth on a row recorded before the ledger kept node counts.
  const developGrew = comparison(Array.from({ length: 6 }, () => finding()));
  const changeGrew = comparison(Array.from({ length: 40 }, () => finding()));
  const uncounted = docsAudit({ ...LEDGER, rows: LEDGER.rows.map(item => ({ ...item, nodes: undefined })) });

  assert.equal(developGrew.grown.length, 1);
  assert.equal(build(developGrew, { drift: driftOf(audit, developGrew) }).conclusion, 'neutral', 'growth the audit had is drift');
  assert.equal(build(changeGrew, { drift: driftOf(audit, changeGrew) }).conclusion, 'failure', 'growth past the audit is this change\'s');
  assert.equal(build(developGrew, { drift: driftOf(uncounted, developGrew) }).conclusion, 'failure', 'a row with no count says nothing');

  const causedComparison = comparison([...Array.from({ length: 3 }, () => finding()), finding({ page: 'angular-instance-access', theme: 'dark',
    rule: 'aria-allowed-attr', target: 'button.version-select', impact: 'critical', wcag: ['4.1.2'] })]);
  const caused = build(causedComparison, { drift: driftOf(audit, causedComparison) });

  assert.equal(caused.conclusion, 'failure', 'a finding the audit did not see is this change\'s');
  assert.equal(build(drifted, { drift, scope: 'audit' }).conclusion, 'failure', 'an audit counts every open finding, drift or not');
});

test('a grown finding is compared by the ledger row\'s sum: a sibling location that masks alike does not hide its growth', () => {
  const entry = (target, nodes) => ({ page: 'js-api-core', theme: 'light', rule: 'link-in-text-block', target, impact: 'serious', nodes,
    issue: 'prose-link-color-only' });
  const finding = target => ({ page: 'js-api-core', theme: 'light', rule: 'link-in-text-block', target, impact: 'serious', help: 'h',
    helpUrl: 'https://dequeuniversity.com/x', wcag: ['1.4.1'], nodes: 1 });
  // Two list items' links mask to one ledger row (`li:nth-child(n) > a`), which keeps the sum of their nodes.
  const comparison = (first, second) => compareViolations({
    baseline: [entry('li:nth-child(1) > a', 3), entry('li:nth-child(2) > a', 2)], issues: [{ id: 'prose-link-color-only', title: 'Prose links' }],
    violations: [...Array.from({ length: first }, () => finding('li:nth-child(1) > a')), ...Array.from({ length: second }, () => finding('li:nth-child(2) > a'))],
    scanned: [{ page: 'js-api-core', theme: 'light' }], mode: 'warn', baselineFile: 'a11y/docs/docs-baseline.json',
  });
  const audit = recorded => siteAudit({
    nights: [{ source: 'docs', runId: '200', seenAt: '2026-11-10T10:29:01Z', axe: { complete: true } }],
    rows: [row({ rule: 'link-in-text-block', page: 'js-api-core', theme: 'light', where: 'li:nth-child(n) > a', nodes: recorded })],
  }, 'docs');
  const grewByOne = comparison(4, 2);

  assert.deepEqual(grewByOne.grown.map(item => [item.target, item.nodes]), [['li:nth-child(1) > a', 4]]);
  assert.equal(driftOf(audit(5), grewByOne)(grewByOne.grown[0]), false,
    'the row went from 5 to 6 nodes: the growth is this change\'s, though the one location (4) is under the row\'s 5');
  assert.equal(driftOf(audit(6), grewByOne)(grewByOne.grown[0]), true, 'the audit recorded the row at 6: develop grew it that far');
  assert.equal(driftOf(audit(null), grewByOne)(grewByOne.grown[0]), false, 'a row with no count says nothing');
});
