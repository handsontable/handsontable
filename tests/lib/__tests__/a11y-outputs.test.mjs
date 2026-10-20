import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareViolations } from '../a11y-baseline.mjs';
import { FINDINGS_SCHEMA, agentFindings } from '../a11y-findings.mjs';
import { COMMENT_MARKER, neutralizeTaskIds, renderComment, shouldComment, textBar } from '../a11y-pr-comment.mjs';

const PAGES = [
  { id: 'grid', fixture: 'grid.html', state: 'none' },
  { id: 'context-menu', fixture: 'context-menu-checked-items.html', state: 'context-menu', cell: [2, 1] },
];
const ISSUES = [{ id: 'grid-roles', title: 'The grid root holds children its role does not allow', tracker: 'DEV-2964' }];
const entry = overrides => ({ page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]',
  impact: 'critical', nodes: 1, issue: 'grid-roles', ...overrides });
const finding = overrides => ({ page: 'grid', theme: 'main', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]',
  impact: 'critical', help: 'h', helpUrl: 'https://dequeuniversity.com/x', wcag: ['1.3.1'], html: '<div role="treegrid">',
  selector: ['#ht_1'], ancestry: ['html > body > div'], box: { x: 1, y: 2, width: 3, height: 4 }, failureSummary: 'Fix it', nodes: 1, ...overrides });
const scanned = [{ page: 'grid', theme: 'main' }, { page: 'grid', theme: 'horizon' }, { page: 'context-menu', theme: 'main' }];
const verdictOf = (baseline, violations, mode = 'warn') => compareViolations({ baseline, issues: ISSUES, violations, scanned, mode });

test('agentFindings lists what needs action with where to open it and the elements, and every known issue with its locations', () => {
  const document = agentFindings({
    verdict: verdictOf([entry(), entry({ theme: 'horizon' })], [
      finding(),
      finding({ theme: 'horizon' }), finding({ theme: 'horizon', selector: ['#ht_2'] }),
      finding({ page: 'context-menu', rule: 'label', target: 'textarea', selector: ['textarea'], box: null }),
    ]),
    pages: PAGES,
  });

  assert.equal(document.schema, FINDINGS_SCHEMA);
  assert.deepEqual(document.counts, { new: 1, grown: 1, matched: 1, improved: 0, stale: 0, unverified: 0, action: 2 });
  assert.match(document.reproduce.scan, /npm --prefix tests run test:a11y/);
  assert.deepEqual(document.needsAction.map(item => [item.status, item.page, item.theme, item.rule, item.nodes, item.recordedNodes]), [
    ['new', 'context-menu', 'main', 'label', 1, null],
    ['grown', 'grid', 'horizon', 'aria-required-children', 2, 1],
  ]);
  assert.deepEqual(document.needsAction[0].url, '/tests/fixtures/demo/context-menu-checked-items.html?theme=main');
  assert.equal(document.needsAction[0].steps, 'select cell (2, 1) (hot.selectCell(2, 1)), then press Shift+F10');
  assert.deepEqual(document.needsAction[0].elements, [{ selector: 'textarea', domPath: 'html > body > div', box: null, html: '<div role="treegrid">', why: 'Fix it' }]);
  assert.deepEqual(document.needsAction[1].elements.map(item => item.selector), ['#ht_1', '#ht_2']);
  assert.deepEqual(document.issues.map(issue => [issue.id, issue.tracker, issue.findings, issue.nodes, issue.wcag]), [['grid-roles', 'DEV-2964', 2, 3, ['1.3.1']]]);
  assert.deepEqual(document.issues[0].locations[0], { page: 'grid', theme: 'main', rule: 'aria-required-children',
    target: 'div.ht-wrapper[role="treegrid"]', nodes: 1, selector: '#ht_1', domPath: 'html > body > div' });
  assert.deepEqual(document.pages['context-menu'], { fixture: '/tests/fixtures/demo/context-menu-checked-items.html', query: null,
    steps: 'select cell (2, 1) (hot.selectCell(2, 1)), then press Shift+F10', surface: null });
});

test('agentFindings stays concise: at most ten elements per finding, one locator per known location', () => {
  const many = Array.from({ length: 14 }, (_, index) => finding({ rule: 'label', target: 'td', selector: [`td${index}`] }));
  const document = agentFindings({ verdict: verdictOf([entry()], [finding(), ...many]), pages: PAGES });

  assert.equal(document.needsAction[0].nodes, 14);
  assert.equal(document.needsAction[0].elements.length, 10);
  assert.equal(document.issues[0].locations.length, 1);
});

test('the comment is posted only when something needs action or the tooling failed', () => {
  assert.equal(shouldComment({ ...verdictOf([entry()], [finding()]), problems: [] }), false);
  assert.equal(shouldComment({ ...verdictOf([entry()], [finding()]), problems: ['broken'] }), true);
  assert.equal(shouldComment({ ...verdictOf([], [finding()]), problems: [] }), true);
});

test('the comment leads with the headline and the report link, lists what needs action, and starts with its marker', () => {
  const body = renderComment({ ...verdictOf([entry(), entry({ theme: 'horizon', nodes: 1 })], [
    finding(), finding({ theme: 'horizon' }), finding({ theme: 'horizon' }),
    finding({ page: 'context-menu', rule: 'label', target: 'textarea.handsontableInput' }),
  ]), problems: [] }, {
    reportUrl: 'https://github.com/o/r/actions/runs/1/artifacts/2',
    runUrl: 'https://github.com/o/r/actions/runs/1',
    checkUrl: 'https://github.com/o/r/runs/3',
  });

  assert.ok(body.startsWith(`${COMMENT_MARKER}\n### ♿ A11y / axe: ⚠️ 1 new, 1 grown (warn mode)`), body.slice(0, 120));
  assert.match(body, /Warn mode: these findings never block the merge\./);
  assert.match(body, /📊 \*\*\[Open the HTML report\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\/artifacts\/2\)\*\* to locate each element/);
  assert.match(body, /\| ✖ New \| context-menu \| main \| label \| <code>textarea\.handsontableInput<\/code> \| 1 \| – \|/);
  assert.match(body, /\| ▲ Grown \| grid \| horizon \| aria-required-children \| <code>div\.ht-wrapper\\\[role="treegrid"\\\]<\/code> \| 2 \(was 1\) \| The grid root holds children its role does not allow \|/);
  assert.match(body, /<sub>\[Workflow run\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\) · \[Check run\]\(https:\/\/github\.com\/o\/r\/runs\/3\) · baseline: `tests\/a11y\/axe-baseline\.json`/);
  assert.doesNotMatch(body, /DEV-2964/, 'a tracker never reaches the comment');
});

test('a clean run\'s comment says so, and a block-mode or tooling failure is marked as one', () => {
  assert.match(renderComment({ ...verdictOf([entry()], [finding()]), problems: [] }), /### ♿ A11y \/ axe: ✅ No new accessibility findings: 1 known, in 1 known issues\n\nNothing needs action/);
  assert.match(renderComment({ ...verdictOf([], [finding()], 'block'), problems: [] }), /### ♿ A11y \/ axe: ❌ 1 new \(block mode\)\n\nBlock mode: these findings fail the job/);
  assert.match(renderComment({ ...verdictOf([entry()], [finding()]), problems: ['the <baseline> broke'] }), /### ♿ A11y \/ axe: ❌[\s\S]*> \*\*Tooling problem:\*\* the \\<baseline\\> broke/);
});

test('the comment lists fifteen rows and points to the report for the rest', () => {
  const many = Array.from({ length: 18 }, (_, index) => finding({ rule: `rule-${String(index).padStart(2, '0')}`, target: 'td' }));
  const body = renderComment({ ...verdictOf([], many), problems: [] });

  assert.equal((body.match(/^\| ✖ New /gm) ?? []).length, 15);
  assert.match(body, /…and 3 more in the report\./);
});

test('no task id can reach the comment, wherever it comes from', () => {
  assert.equal(neutralizeTaskIds('see DEV-1234 and PRO-7, not dev-1 or WCAG 2.2'), 'see DEV‑1234 and PRO‑7, not dev-1 or WCAG 2.2');

  const body = renderComment({ ...verdictOf([], [finding({ help: 'Fixed in DEV-1234', target: 'td.SU-99' })]), problems: ['IT-555 broke'] });

  assert.doesNotMatch(body, /\b[A-Z][A-Z0-9]*-\d+\b/, 'the ClickUp integration attaches every task id in a pull request comment');
});

test('a text bar is its share of the longest one, to an eighth of a character, and never empty above zero', () => {
  assert.equal(textBar(10, 10), '█'.repeat(20));
  assert.equal(textBar(5, 10), '█'.repeat(10));
  assert.equal(textBar(3, 8, 4), '█▌');
  assert.equal(textBar(1, 1000), '▏', 'a value above zero always shows');
  assert.equal(textBar(0, 10), '');
  assert.equal(textBar(20, 10), '█'.repeat(20), 'a bar never outgrows the chart');
});

test('the comment charts the findings by rule, with what needs action, in a clean run too', () => {
  const comparison = { ...verdictOf([entry(), entry({ theme: 'horizon' })], [
    finding(), finding({ theme: 'horizon' }), finding({ theme: 'horizon', selector: ['#ht_2'] }),
    finding({ page: 'context-menu', rule: 'label', target: 'textarea.handsontableInput' }),
  ]), problems: [] };
  const body = renderComment(comparison);
  const chart = body.slice(body.indexOf('#### Findings by rule'));

  assert.ok(body.indexOf('| ✖ New |') < body.indexOf('#### Findings by rule'), 'what needs action comes first');
  assert.match(chart, /\| Rule \| Findings \| Chart \| Elements \| Needs action \|\n\|---\|--:\|---\|--:\|---\|/);
  assert.match(chart, new RegExp(`\\| <code>aria-required-children</code> \\| 2 \\| ${'█'.repeat(20)} \\| 3 \\| ▲ 1 grown \\|`));
  assert.match(chart, new RegExp(`\\| <code>label</code> \\| 1 \\| ${'█'.repeat(10)} \\| 1 \\| ✖ 1 new \\|`));

  const clean = renderComment({ ...verdictOf([entry()], [finding()]), problems: [] });

  assert.match(clean, /<code>aria-required-children<\/code> \| 1 \| █+ \| 1 \| – \|/);
  assert.doesNotMatch(renderComment({ ...verdictOf([], []), problems: ['broken'] }), /Findings by rule/, 'no chart without a finding');
});

test('the chart shows twelve rules and points to the report for the rest', () => {
  const many = Array.from({ length: 14 }, (_, index) => finding({ rule: `rule-${String(index).padStart(2, '0')}`, target: 'td' }));
  const body = renderComment({ ...verdictOf([], many), problems: [] });
  const chart = body.slice(body.indexOf('#### Findings by rule'));

  assert.equal((chart.match(/^\| <code>rule-/gm) ?? []).length, 12);
  assert.match(chart, /…and 2 more rules in the report\./);
});
