import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareViolations } from '../a11y-baseline.mjs';
import { CHECK_RUN_NAME, annotationBatches, baselineLines, buildCheckRun, pageLines } from '../a11y-check-run.mjs';
import { A11Y_PAGES } from '../../a11y/pages.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ISSUES = [{ id: 'grid-roles', title: 'The grid root holds children its role does not allow' }, { id: 'menu-roles', title: 'Menu items' }];
const ENTRIES = [
  { page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]', impact: 'critical', nodes: 1, issue: 'grid-roles' },
  { page: 'context-menu', theme: 'main', rule: 'aria-required-parent', target: 'td[role="menuitem"]', impact: 'critical', nodes: 3, issue: 'menu-roles' },
];
const BASELINE_SOURCE = `{\n  "axeCoreVersion": "4.14.0",\n  "issues": [],\n  "entries": [\n${ENTRIES.map(item => `    ${JSON.stringify(item)}`).join(',\n')}\n  ]\n}\n`;
const PAGES_SOURCE = "export const A11Y_PAGES = [\n  // comment\n  { id: 'grid', fixture: 'grid.html' },\n  { id: 'context-menu', fixture: 'grid.html',\n    state: 'context-menu' },\n];\n";

/**
 * A comparison as the reporter writes it.
 *
 * @param {object[]} violations The findings.
 * @param {object} [extra] Mode, problems, notes.
 * @returns {object} The comparison.
 */
function comparison(violations, { mode = 'warn', problems = [], notes = [] } = {}) {
  const scanned = [{ page: 'grid', theme: 'main' }, { page: 'context-menu', theme: 'main' }];

  return { ...compareViolations({ baseline: ENTRIES, issues: ISSUES, violations, scanned, mode }), problems, notes };
}

const finding = overrides => ({ page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]',
  impact: 'critical', help: 'h', helpUrl: 'https://dequeuniversity.com/x', nodes: 1, ...overrides });
const matchedAll = [finding(), ...Array.from({ length: 3 }, () => finding({ page: 'context-menu', rule: 'aria-required-parent', target: 'td[role="menuitem"]' }))];
const build = (value, extra = {}) => buildCheckRun({ comparison: value, pages: pageLines(PAGES_SOURCE), baseline: baselineLines(BASELINE_SOURCE),
  reportUrl: 'https://github.com/o/r/actions/runs/1/artifacts/2', runUrl: 'https://github.com/o/r/actions/runs/1', ...extra });

test('pageLines and baselineLines find the line to annotate', () => {
  assert.deepEqual([...pageLines(PAGES_SOURCE)], [['grid', 3], ['context-menu', 4]]);
  assert.deepEqual([...baselineLines(BASELINE_SOURCE).values()], [5, 6]);
  assert.equal(baselineLines(BASELINE_SOURCE).get('context-menu|main|aria-required-parent|td[role="menuitem"]'), 6);
});

test('the line indexes read the committed files: every page and every baseline entry has a line', () => {
  const pages = pageLines(readFileSync(path.join(TESTS_ROOT, 'a11y/pages.mjs'), 'utf8'));
  const baseline = JSON.parse(readFileSync(path.join(TESTS_ROOT, 'a11y/axe-baseline.json'), 'utf8'));
  const lines = baselineLines(readFileSync(path.join(TESTS_ROOT, 'a11y/axe-baseline.json'), 'utf8'));
  assert.deepEqual(A11Y_PAGES.filter(page => !pages.has(page.id)).map(page => page.id), [],
    'every page entry opens with `{ id: \'…\'` on its own line, which is where a new finding is annotated');
  assert.equal(lines.size, baseline.entries.length, 'one entry per line, every one found');
});

const RULE = '(critical/serious = red, moderate/minor = warning)';

test('a change run with nothing new is a success, titled with the known count: the baseline is known debt', () => {
  const payload = build(comparison(matchedAll));

  assert.equal(payload.name, CHECK_RUN_NAME);
  assert.equal(payload.conclusion, 'success');
  assert.equal(payload.title, `✔ Green: 0 critical, 0 serious, 0 moderate, 0 minor ${RULE} · No new accessibility findings: 2 known, in 2 known issues`);
  assert.deepEqual(payload.annotations, []);
  assert.match(payload.summary, /^\*\*Verdict: green\.\*\*/);
  assert.match(payload.summary, /\*\*Change run\*\* \(a pull request or a push\): only a finding that is new or grown against the baseline counts;/);
  assert.match(payload.summary, /\*\*Warn mode:\*\* the job never fails on a finding; this check run's verdict says what the scan found, and it never blocks a merge\./);
  assert.match(payload.summary, /📊 \[Open the HTML report\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\/artifacts\/2\)/);
  assert.match(payload.summary, /\[The workflow run\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\)/);
});

test('a new critical finding on a change run is red, annotated on the line to change; an improved count is advisory', () => {
  const payload = build(comparison([finding(), finding({ rule: 'label', target: 'textarea' }), finding({ page: 'context-menu', rule: 'aria-required-parent', target: 'td[role="menuitem"]' })]));

  assert.equal(payload.conclusion, 'failure');
  assert.equal(payload.title, `✖ Red: 1 critical, 0 serious, 0 moderate, 0 minor ${RULE} · 1 advisory · 1 new, 1 improved (warn mode)`);
  assert.deepEqual(payload.annotations.map(item => [item.path, item.start_line, item.annotation_level, item.title]), [
    ['tests/a11y/pages.mjs', 3, 'failure', 'New accessibility finding (critical): label'],
    ['tests/a11y/axe-baseline.json', 6, 'notice', 'Improved: lower the recorded node count'],
  ]);
  assert.match(payload.annotations[0].message, /^grid on main: label on textarea\. fix it, or add it to/);
});

test('a new minor or moderate finding on a change run is neutral, with a warning annotation', () => {
  const minor = build(comparison([...matchedAll, finding({ rule: 'label', target: 'textarea', impact: 'minor' })]));

  assert.equal(minor.conclusion, 'neutral');
  assert.equal(minor.title, `⚠ Warning: 0 critical, 0 serious, 0 moderate, 1 minor ${RULE} · 1 new (warn mode)`);
  assert.deepEqual(minor.annotations.map(item => [item.annotation_level, item.title]), [['warning', 'New accessibility finding (minor): label']]);

  // axe gives one impact per rule, so every node of a grown key carries the same one.
  const grown = build(comparison([finding({ impact: 'moderate' }), finding({ impact: 'moderate' }), ...matchedAll.slice(1)]));

  assert.equal(grown.conclusion, 'neutral', 'a grown finding counts at its impact too');
  assert.deepEqual(grown.annotations.map(item => [item.annotation_level, item.title]), [['warning', 'Grown accessibility finding (moderate): aria-required-children']]);
});

test('on a change run a new finding whose cluster has a tracker is a warning, never red', () => {
  const seen = [];
  const tracked = (source, check, item) => {
    seen.push([source, check, item.rule]);

    return item.rule === 'label';
  };
  const payload = build(comparison([...matchedAll, finding({ rule: 'label', target: 'textarea' })]), { tracked });

  assert.deepEqual(seen, [['axe', 'axe', 'label']], 'only what counts is looked up, as the ledger reads the scan: source axe, check axe');
  assert.equal(payload.conclusion, 'neutral');
  assert.equal(payload.annotations[0].annotation_level, 'warning');
  assert.match(payload.title, /· 1 warning only ·/);
});

test('an audit run counts every open finding: the known ones too, annotated on their baseline entry', () => {
  const tracked = () => true;
  const payload = build(comparison(matchedAll), { scope: 'audit', tracked });

  assert.equal(payload.conclusion, 'failure', 'an audit says the truth: known debt, tracked or not, is red when it is critical or serious');
  assert.equal(payload.title, `✖ Red: 2 critical, 0 serious, 0 moderate, 0 minor ${RULE} · No new accessibility findings: 2 known, in 2 known issues`);
  assert.deepEqual(payload.annotations.map(item => [item.path, item.start_line, item.annotation_level, item.title]), [
    ['tests/a11y/axe-baseline.json', 5, 'failure', 'Known accessibility finding (critical): aria-required-children'],
    ['tests/a11y/axe-baseline.json', 6, 'failure', 'Known accessibility finding (critical): aria-required-parent'],
  ]);
  assert.match(payload.summary, /\*\*Audit run\*\* \(a schedule or a dispatch\): every open finding counts, tracked or not\./);
});

test('a violation axe gave no impact counts as serious', () => {
  const payload = build(comparison([...matchedAll, finding({ rule: 'label', target: 'textarea', impact: null })]));

  assert.equal(payload.conclusion, 'failure');
  assert.match(payload.title, /^✖ Red: 0 critical, 1 serious,/);
});

test('block mode fails the check when a finding needs action', () => {
  const payload = build(comparison([], { mode: 'block' }));

  assert.equal(payload.conclusion, 'failure');
  assert.match(payload.title, /^✖ 2 stale \(block mode\)$/);
  assert.ok(payload.annotations.every(item => item.annotation_level === 'failure'));
  assert.match(payload.summary, /\*\*Block mode:\*\*/);
});

test('a tooling problem fails the check whatever the mode, and a missing comparison does too', () => {
  const broken = build(comparison(matchedAll, { problems: ['tests/a11y/axe-baseline.json: entry 3 is not an object'] }));

  assert.equal(broken.conclusion, 'failure');
  assert.equal(broken.title, '✖ Tooling failure: tests/a11y/axe-baseline.json: entry 3 is not an object');
  assert.match(broken.summary, /> Tooling problem: tests\/a11y\/axe-baseline\.json: entry 3 is not an object/);

  const missing = build(null);

  assert.equal(missing.conclusion, 'failure');
  assert.match(missing.title, /wrote no comparison/);
});

test('an unsafe run or report URL is never linked', () => {
  const payload = build(comparison(matchedAll), { reportUrl: 'javascript:alert(1)', runUrl: 'javascript:alert(2)' });

  assert.doesNotMatch(payload.summary, /javascript:/);
});

test('annotationBatches splits by the Checks API limit and always yields one batch', () => {
  assert.deepEqual(annotationBatches([]), [[]]);
  assert.deepEqual(annotationBatches([1, 2, 3], 2), [[1, 2], [3]]);
  assert.equal(annotationBatches(Array.from({ length: 120 }, (_, index) => index)).map(batch => batch.length).join(','), '50,50,20');
});
