import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareViolations } from '../a11y-baseline.mjs';
import { DOCS_SCAN, baselineLines, buildCheckRun, pageLines } from '../a11y-check-run.mjs';
import { DOCS_AUDIT_COMMAND, LEDGER_URL, docsAudit, driftKey, driftNotes, driftOf, isDrift } from '../a11y-docs-drift.mjs';

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
    row({ rule: 'link-in-text-block', page: 'js-api-core', theme: 'light', where: 'a' }),
    row({ rule: 'label', page: 'js-demo', where: 'input', lastRun: '150' }),
    row({ source: 'axe', check: 'axe', page: 'dialog', theme: 'main', where: 'button' }),
  ],
};

test('the audit is the ledger\'s latest docs night: its run, time, commit and the docs findings it sighted', () => {
  const audit = docsAudit(LEDGER);

  assert.deepEqual({ ...audit, keys: [...audit.keys].sort() }, {
    runId: '200', seenAt: '2026-11-10T10:29:01Z', headSha: 'abc',
    keys: ['color-contrast|angular-instance-access|dark|div.ln', 'link-in-text-block|js-api-core|light|a'],
  }, 'a row the latest night did not sight, and a product row, are not the audit\'s');
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
  assert.match(driftNotes({ audit, drift: 0, counted: 0, grown: 2 })[0], /^The 2 grown findings count at their severity: the ledger keeps no node count/);
  assert.match(driftNotes({ audit, drift: 3, counted: 5 })[0],
    /^3 of the 5 new findings are on develop's docs already: the develop docs audit of 2026-11-10 \(run 200\) saw them\..*refresh tests\/a11y\/docs\/docs-baseline\.json from that audit, `node tests\/scripts\/a11y-docs-baseline\.mjs --run 200`/);
  assert.match(driftNotes({ audit: null, problem: 'HTTP 404', drift: 0, counted: 5 })[0], /could not be read \(HTTP 404\), so every new or grown finding counts/);
  assert.ok(driftNotes({ audit: null, drift: 0, counted: 5 })[0].includes(DOCS_AUDIT_COMMAND), 'no audit: dispatch one');

  const stale = driftNotes({ audit, drift: 1, counted: 1, deployedAt: '2026-11-12T07:25:30Z' });

  assert.equal(stale.length, 2);
  assert.match(stale[1], /older than the staging deploy this run read \(2026-11-12 07:25 UTC\).*gh workflow run docs-a11y\.yml --ref develop/);
  assert.equal(driftNotes({ audit, drift: 1, counted: 1, deployedAt: '2026-11-09T00:00:00Z' }).length, 1, 'an audit newer than the deploy is not stale');
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

  // Grown on a baselined entry the audit saw, from 3 nodes to 40: the ledger keeps no node count, so the growth is
  // this change's until the baseline says otherwise.
  const grown = comparison(Array.from({ length: 40 }, () => finding()));

  assert.equal(grown.grown.length, 1);
  assert.equal(build(grown, { drift: driftOf(audit, grown) }).conclusion, 'failure', 'a grown finding is never drift');

  const causedComparison = comparison([...Array.from({ length: 3 }, () => finding()), finding({ page: 'angular-instance-access', theme: 'dark',
    rule: 'aria-allowed-attr', target: 'button.version-select', impact: 'critical', wcag: ['4.1.2'] })]);
  const caused = build(causedComparison, { drift: driftOf(audit, causedComparison) });

  assert.equal(caused.conclusion, 'failure', 'a finding the audit did not see is this change\'s');
  assert.equal(build(drifted, { drift, scope: 'audit' }).conclusion, 'failure', 'an audit counts every open finding, drift or not');
});
