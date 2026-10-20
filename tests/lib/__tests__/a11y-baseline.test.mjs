import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  A11Y_MODE,
  A11Y_MODES,
  A11Y_THEMES,
  BASELINE_FILE,
  compareViolations,
  engineVersionNote,
  entryKey,
  escapeMarkdownText,
  findingsByRule,
  findingsFromScan,
  headline,
  marksForScan,
  renderAnnotations,
  representativeScans,
  renderSummary,
  targetFingerprint,
  validateBaseline,
  verdictCounts,
  wcagCriteria,
  workflowCommand,
} from '../a11y-baseline.mjs';
import { A11Y_PAGES, stateSteps } from '../../a11y/pages.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PAGE_IDS = ['grid', 'context-menu'];
const ALL_SCANNED = A11Y_THEMES.flatMap(theme => PAGE_IDS.map(page => ({ page, theme })));
const ISSUES = [
  { id: 'grid-roles', title: 'The grid root holds children its role does not allow', tracker: 'DEV-2964' },
  { id: 'menu-roles', title: 'Menu items have no menu parent' },
];

/**
 * A baseline entry with every field valid; override what the case is about.
 *
 * @param {object} [overrides] Fields to replace.
 * @returns {object} The entry.
 */
function entry(overrides = {}) {
  return {
    page: 'grid',
    theme: 'main',
    rule: 'aria-required-children',
    target: 'div.ht-wrapper[role="treegrid"]',
    impact: 'critical',
    nodes: 1,
    issue: 'grid-roles',
    ...overrides,
  };
}

/**
 * A well-formed baseline document around the given entries.
 *
 * @param {object[]} entries The entries.
 * @param {object[]} [issues] The catalog.
 * @returns {object} The document.
 */
function doc(entries, issues = ISSUES) {
  return { axeCoreVersion: '4.14.0', issues, entries };
}

/**
 * A finding as `findingsFromScan()` produces it; override what the case is about.
 *
 * @param {object} [overrides] Fields to replace.
 * @returns {object} The finding.
 */
function violation(overrides = {}) {
  return {
    page: 'grid',
    theme: 'main',
    rule: 'aria-required-children',
    target: 'div.ht-wrapper[role="treegrid"]',
    impact: 'critical',
    help: 'Certain ARIA roles must contain particular children',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/aria-required-children',
    wcag: ['1.3.1'],
    html: '<div class="ht-wrapper handsontable" role="treegrid">',
    selector: ['#ht_1'],
    failureSummary: 'Fix any of the following: Element has children which are not allowed',
    nodes: 1,
    ...overrides,
  };
}

/**
 * `count` findings on the same key, as a scan reports one node each.
 *
 * @param {number} count How many nodes.
 * @param {object} [overrides] Fields to replace.
 * @returns {object[]} The findings.
 */
function nodes(count, overrides = {}) {
  return Array.from({ length: count }, () => violation(overrides));
}

const compare = (baselineEntries, violations, mode = 'warn', scanned = ALL_SCANNED) => compareViolations({
  baseline: baselineEntries, issues: ISSUES, violations, scanned, mode,
});

test('the mode constant is "warn", and flipping it to "block" is a documented, deliberate change', () => {
  assert.deepEqual(A11Y_MODES, ['warn', 'block']);
  assert.equal(A11Y_MODE, 'warn',
    'The axe job runs in warn mode until the replay over recent pull requests says the comparator is precise. '
    + 'Flipping the constant is the whole switch; update tests/AGENTS.md ("A11y") and this test with it.');
});

test('the themes are the three the fixtures accept', () => {
  assert.deepEqual(A11Y_THEMES, ['main', 'horizon', 'classic']);
});

test('entryKey joins page, theme, rule and target, and ignores every other field', () => {
  assert.equal(entryKey(entry()), 'grid|main|aria-required-children|div.ht-wrapper[role="treegrid"]');
  assert.equal(entryKey(entry({ issue: 'menu-roles', nodes: 9, impact: 'minor' })), entryKey(entry()));
  assert.notEqual(entryKey(entry({ theme: 'horizon' })), entryKey(entry()));
});

test('targetFingerprint describes the node from its own start tag, whatever selector axe picked', () => {
  const textarea = '<textarea data-hot-input="" tabindex="-1" class="handsontableInput" style="width: 51px">';

  assert.equal(targetFingerprint(['.handsontableInput'], textarea), 'textarea.handsontableInput');
  assert.equal(targetFingerprint(['textarea'], textarea), 'textarea.handsontableInput',
    'axe reached the same textarea through a different selector on another page; the key stays the same');
  assert.equal(targetFingerprint(['#ht_2748fc73094c28f8'],
    '<div class="ht-wrapper handsonta..." dir="ltr" id="ht_2748fc73094c28f8" role="treegrid">'), 'div.ht-wrapper[role="treegrid"]',
  'a generated id never reaches the key, and a token axe truncated is skipped');
  assert.equal(targetFingerprint(['.ht__row_odd:nth-child(3) > .htSeparator[aria-label="---------"][role="menuitem"]'],
    '<td class="htSeparator" role="menuitem" aria-label="---------" style="height: 1px;">'), 'td.htSeparator[role="menuitem"]');
  assert.equal(targetFingerprint(['td[aria-label="Insert row above"]'],
    '<td class="current" role="menuitem" aria-label="Insert row above" tabindex="-1" aria-selected="true">'), 'td[role="menuitem"]',
  'a state class (current) is not what the node is, and an aria-label is content');
  assert.equal(targetFingerprint(['td[aria-label="Undo"]'], '<td class="htDisabled" role="menuitem" aria-label="Undo">'),
    'td[role="menuitem"]', 'a disabled menu item keys like an enabled one: the selection decides that state');
  assert.equal(targetFingerprint(['.htFiltersMenuValue'],
    '<td class="htCustomMenuRenderer htFiltersMenuValue htSelectionDisabled afterHiddenRow" role="menuitem">'),
  'td.htFiltersMenuValue[role="menuitem"]', 'generic, state and layout classes are skipped to the descriptive one');
  assert.equal(targetFingerprint(['.ht-button--primary'], '<button class="ht-button ht-button--primary">OK</button>'),
    'button.ht-button.ht-button--primary', 'a BEM modifier of the descriptive class stays');
  assert.equal(targetFingerprint(['input'], '<input data-hot-input="" class="handsontableInput" type="date">'),
    'input.handsontableInput[type="date"]');
  assert.equal(targetFingerprint(['a[href="mailto:x"]'], '<a href="mailto:sales@handsontable.com">'), 'a');
});

test('targetFingerprint falls back to the selector\'s last compound when axe gives no start tag', () => {
  assert.equal(targetFingerprint(['.htCore > tbody > tr:nth-child(3) > td:nth-child(2)']), 'td:nth-child(n)');
  assert.equal(targetFingerprint(['td[aria-label="Add comment"]'], ''), 'td[aria-label]');
  assert.equal(targetFingerprint([['#host', '.inner > input[type="text"]']], 'not markup'), 'input[type="text"]');
  assert.equal(targetFingerprint(['#ht_2748fc73094c28f8']), '#ht_*');
});

test('wcagCriteria reads the success criteria from axe\'s tags', () => {
  assert.deepEqual(wcagCriteria(['cat.aria', 'wcag2a', 'wcag412', 'wcag131', 'EN-301-549']), ['4.1.2', '1.3.1']);
  assert.deepEqual(wcagCriteria(['wcag2aa', 'wcag1411']), ['1.4.11']);
  assert.deepEqual(wcagCriteria(), []);
});

test('findingsFromScan gives one finding per node, keyed by its fingerprint, with the node detail', () => {
  const findings = findingsFromScan({
    page: 'grid',
    theme: 'horizon',
    violations: [{
      id: 'label', impact: 'critical', help: 'Form elements must have labels', helpUrl: 'https://x.test/label',
      tags: ['wcag2a', 'wcag412'],
      nodes: [
        { target: ['textarea'], html: '<textarea class="handsontableInput">', failureSummary: 'Fix any of the following' },
        { target: ['.handsontableInput'], html: '<textarea class="handsontableInput">' },
      ],
    }],
  });

  assert.equal(findings.length, 2);
  assert.deepEqual(findings.map(entryKey),
    ['grid|horizon|label|textarea.handsontableInput', 'grid|horizon|label|textarea.handsontableInput']);
  assert.deepEqual(findings[0].wcag, ['4.1.2']);
  assert.equal(findings[0].failureSummary, 'Fix any of the following');
  assert.equal(findings[1].failureSummary, '');
});

test('representativeScans pictures each issue on its first main-theme entry, or its first entry', () => {
  const byScan = representativeScans([
    entry({ page: 'checkbox', theme: 'horizon' }),
    entry({ page: 'grid', theme: 'main' }),
    entry({ page: 'context-menu', theme: 'classic', issue: 'classic-only' }),
    entry({ page: 'context-menu', theme: 'main', issue: 'menu-roles' }),
    entry({ page: 'grid', theme: 'main', rule: 'label', issue: 'menu-roles' }),
  ]);

  assert.deepEqual([...byScan].map(([scan, issues]) => [scan, [...issues]]), [
    ['grid|main', ['grid-roles']],
    ['context-menu|classic', ['classic-only']],
    ['context-menu|main', ['menu-roles']],
  ]);
});

test('marksForScan marks new and grown findings, and the pictured issues, numbered in key order', () => {
  const findings = [
    violation({ selector: ['#a'] }),
    violation({ selector: ['#b'] }),
    violation({ rule: 'label', target: 'textarea', selector: ['textarea'] }),
    violation({ rule: 'aria-required-parent', target: 'td[role="menuitem"]', selector: ['td'] }),
  ];
  const entries = [
    entry({ nodes: 1 }),
    entry({ rule: 'aria-required-parent', target: 'td[role="menuitem"]', issue: 'menu-roles' }),
  ];

  assert.deepEqual(marksForScan({ findings, entries }).map(({ n, status, rule, nodes: count, selectors }) => [n, status, rule, count, selectors]), [
    [1, 'grown', 'aria-required-children', 2, [['#a'], ['#b']]],
    [2, 'new', 'label', 1, [['textarea']]],
  ]);
  assert.deepEqual(marksForScan({ findings, entries, pictured: new Set(['menu-roles']) }).map(({ status, issue }) => [status, issue]), [
    ['grown', 'grid-roles'], ['known', 'menu-roles'], ['new', null],
  ]);
  assert.deepEqual(marksForScan({ findings: findings.slice(3), entries }), [], 'a matched finding of an unpictured issue needs no screenshot');
});

test('findingsFromScan and the comparator keep what locates each node: selector, DOM path and box', () => {
  const [item] = compare([], findingsFromScan({ page: 'grid', theme: 'main', violations: [{
    id: 'label', impact: 'critical', help: 'h', helpUrl: 'https://x.test', tags: [],
    nodes: [{ target: ['textarea'], html: '<textarea class="handsontableInput">', ancestry: ['html > body > div > textarea'], box: { x: 1, y: 2, width: 3, height: 4 } }],
  }] })).newViolations;

  assert.deepEqual(item.details, [{ html: '<textarea class="handsontableInput">', selector: ['textarea'],
    ancestry: ['html > body > div > textarea'], box: { x: 1, y: 2, width: 3, height: 4 }, failureSummary: '' }]);
});

test('validateBaseline accepts a well-formed document', () => {
  assert.deepEqual(validateBaseline(doc([entry(), entry({ theme: 'horizon', issue: 'menu-roles' })]), { pages: PAGE_IDS }), []);
});

test('validateBaseline refuses an entry whose issue is missing or unknown, and an issue with no entry left', () => {
  const noIssue = entry();

  delete noIssue.issue;
  assert.match(validateBaseline(doc([noIssue, entry({ theme: 'horizon', issue: 'menu-roles' })]), { pages: PAGE_IDS })
    .join('\n'), /entry 1 .*"issue" must name an id from "issues"/);
  assert.match(validateBaseline(doc([entry({ issue: 'gone' }), entry({ theme: 'horizon', issue: 'menu-roles' })]), { pages: PAGE_IDS })
    .join('\n'), /"issue" must name an id from "issues", got "gone"/);
  assert.match(validateBaseline(doc([entry()]), { pages: PAGE_IDS }).join('\n'),
    /issue "menu-roles" has no entry left: it is fixed, so delete it from "issues"/);
});

test('validateBaseline refuses a malformed issue: id, title, tracker, unknown field, duplicate', () => {
  const problems = issues => validateBaseline(doc([entry({ issue: issues[0]?.id ?? 'x' })], issues), { pages: PAGE_IDS }).join('\n');

  assert.match(problems([{ id: 'Menu Roles', title: 't' }]), /"id" must be a kebab-case slug/);
  assert.match(problems([{ id: 'menu-roles', title: ' ' }]), /"title" must say what the problem is/);
  assert.match(problems([{ id: 'menu-roles', title: 't', tracker: 'dev-1' }]), /"tracker" is optional, and when present it is a task id/);
  assert.match(problems([{ id: 'menu-roles', title: 't', owner: 'me' }]), /unknown field "owner"/);
  assert.match(problems([{ id: 'menu-roles', title: 'Fixed in DEV-1234', tracker: 'DEV-1234' }]),
    /the title names a task id; it goes in "tracker"/, 'the pull request comment prints titles');
  assert.match(problems([{ id: 'menu-roles', title: 't' }, { id: 'menu-roles', title: 'u' }]), /duplicate issue id "menu-roles"/);
  assert.equal(problems([{ id: 'menu-roles', title: 't' }]), '', 'a tracker is optional');
});

test('validateBaseline refuses the old per-entry owner fields with a pointer to the issue', () => {
  const problems = validateBaseline(doc([entry({ task: 'DEV-2964', note: 'n' }), entry({ theme: 'horizon', issue: 'menu-roles' })]),
    { pages: PAGE_IDS }).join('\n');

  assert.match(problems, /unknown field "task".*the owner and the description live on the issue now/);
  assert.match(problems, /unknown field "note"/);
});

test('validateBaseline refuses a bad page, rule, target, theme, impact, node count, and a duplicate key', () => {
  const problems = item => validateBaseline(doc([item, entry({ theme: 'horizon', issue: 'menu-roles' })]), { pages: PAGE_IDS }).join('\n');

  for (const field of ['page', 'rule', 'target']) {
    assert.match(problems(entry({ [field]: '' })), new RegExp(`"${field}" must be a non-empty string`));
  }
  assert.match(problems(entry({ theme: 'dark' })), /theme "dark"/);
  assert.match(problems(entry({ page: 'gone' })), /page "gone" .*a11y\/pages\.mjs/);
  assert.match(problems(entry({ impact: 'severe' })), /impact "severe"/);
  for (const count of [0, -1, 1.5, '2', undefined]) {
    assert.match(problems(entry({ nodes: count })), /"nodes" must be the number of nodes/, `${JSON.stringify(count)} is refused`);
  }
  assert.match(validateBaseline(doc([entry(), entry({ issue: 'menu-roles' })]), { pages: PAGE_IDS }).join('\n'), /duplicates entry 1/);
  assert.match(validateBaseline({ issues: [], entries: [] }, { pages: PAGE_IDS })[0], /axeCoreVersion/);
  assert.match(validateBaseline({ axeCoreVersion: '4.14.0', entries: [] }, { pages: PAGE_IDS })[0], /"issues" must be an array/);
  assert.match(validateBaseline(null, { pages: PAGE_IDS })[0], /object/);
});

test('compareViolations sorts a run into new, grown, matched, improved, stale and unverified', () => {
  const baseline = [
    entry(),
    entry({ theme: 'horizon', nodes: 2 }),
    entry({ theme: 'classic', nodes: 3 }),
    entry({ page: 'context-menu', rule: 'aria-required-parent', target: 'td[role="menuitem"]', issue: 'menu-roles' }),
    entry({ page: 'context-menu', theme: 'classic', rule: 'aria-required-parent', target: 'td[role="menuitem"]', issue: 'menu-roles' }),
  ];
  const result = compare(baseline, [
    ...nodes(1),
    ...nodes(5, { theme: 'horizon' }),
    ...nodes(1, { theme: 'classic' }),
    ...nodes(2, { page: 'context-menu', theme: 'horizon', rule: 'aria-required-parent', target: 'td[role="menuitem"]' }),
  ], 'warn', ALL_SCANNED.filter(({ page, theme }) => !(page === 'context-menu' && theme === 'classic')));

  assert.deepEqual(result.matched.map(entryKey), [entryKey(entry())]);
  assert.deepEqual(result.grown.map(item => [entryKey(item), item.baselineNodes, item.nodes]), [[entryKey(baseline[1]), 2, 5]]);
  assert.deepEqual(result.improved.map(item => [entryKey(item), item.baselineNodes, item.nodes]), [[entryKey(baseline[2]), 3, 1]]);
  assert.deepEqual(result.newViolations.map(entryKey), ['context-menu|horizon|aria-required-parent|td[role="menuitem"]']);
  assert.equal(result.newViolations[0].suggestedIssue, 'menu-roles',
    'the same rule and target are a known issue on other pages and themes, so the new finding names it');
  assert.deepEqual(result.stale.map(entryKey), [entryKey(baseline[3])]);
  assert.deepEqual(result.unverified.map(entryKey), [entryKey(baseline[4])],
    'a baseline entry whose page or theme was not scanned this run is neither matched nor stale');
});

test('a finding that spreads to more nodes than recorded is grown, never matched (the node count is part of the ratchet)', () => {
  const result = compare([entry({ nodes: 1 })], nodes(26), 'block');

  assert.equal(result.matched.length, 0);
  assert.equal(result.grown.length, 1);
  assert.equal(result.grown[0].nodes, 26);
  assert.match(result.grown[0].remedy, /25 more nodes than the 1 recorded \(26 now\): fix the new ones, or raise "nodes" to 26/);
  assert.equal(result.status, 'failed', 'block mode fails on growth like on a new finding');
});

test('a new finding outside every known issue says how to add one, as valid JSON', () => {
  const [item] = compare([entry()], [violation({ rule: 'label', target: 'textarea.handsontableInput', help: 'Form elements must have labels' })])
    .newViolations;

  assert.equal(item.suggestedIssue, null);
  assert.match(item.remedy, /under an issue \(a new one in "issues" needs a title; its tracker is optional\)/);
  assert.deepEqual(JSON.parse(item.remedy.slice(item.remedy.indexOf('{'))), {
    page: 'grid', theme: 'main', rule: 'label', target: 'textarea.handsontableInput', impact: 'critical', nodes: 1, issue: '',
  });
});

test('a stale entry that was its issue\'s last says to delete the issue too', () => {
  const result = compare([entry(), entry({ page: 'context-menu', issue: 'menu-roles' })], [violation()]);

  assert.match(result.stale[0].remedy, /no longer reproduces; it was the last entry of issue "menu-roles", so delete the issue too/);
});

test('every finding keeps the detail of each node it folds', () => {
  const [item] = compare([], [violation({ html: '<a>' }), violation({ html: '<b>' })]).newViolations;

  assert.equal(item.nodes, 2);
  assert.deepEqual(item.details.map(detail => detail.html), ['<a>', '<b>']);
  assert.equal(item.html, undefined, 'the per-node fields live in details only');
});

test('warn mode always passes; block mode fails on new, grown, improved and stale, never on unverified', () => {
  const cases = {
    new: [[], [violation()]],
    grown: [[entry()], nodes(2)],
    improved: [[entry({ nodes: 2 })], nodes(1)],
    stale: [[entry()], []],
  };

  for (const [name, [baseline, found]] of Object.entries(cases)) {
    assert.equal(compare(baseline, found, 'warn').status, 'passed', `${name} passes in warn mode`);
    assert.equal(compare(baseline, found, 'block').status, 'failed', `${name} fails in block mode`);
  }
  assert.equal(compare([entry()], [violation()], 'block').status, 'passed', 'an exact match passes');
  assert.equal(compare([entry()], [], 'block', []).status, 'passed', 'an unverified entry never changes the status');
  assert.throws(() => compare([], [], 'strict'), /mode/);
});

test('verdictCounts and headline say what needs action', () => {
  const clean = compare([entry()], [violation()]);
  const dirty = compare([entry({ nodes: 2 })], [violation(), violation({ rule: 'label', target: 'textarea' })]);

  assert.deepEqual(verdictCounts(clean), { new: 0, grown: 0, matched: 1, improved: 0, stale: 0, unverified: 0, action: 0 });
  assert.equal(headline(clean), 'No new accessibility findings: 1 known, in 2 known issues');
  assert.deepEqual(verdictCounts(dirty), { new: 1, grown: 0, matched: 0, improved: 1, stale: 0, unverified: 0, action: 2 });
  assert.equal(headline(dirty), '1 new, 1 improved (warn mode)');
});

test('the verdict lists every catalog issue with what this run found of it', () => {
  const result = compare([entry(), entry({ page: 'context-menu', rule: 'aria-required-parent', target: 'td', issue: 'menu-roles' })], [
    violation(),
    violation({ theme: 'horizon', rule: 'aria-required-parent', target: 'td' }),
  ]);
  const byId = Object.fromEntries(result.issues.map(issue => [issue.id, issue.counts]));

  assert.equal(byId['grid-roles'].matched, 1);
  assert.equal(byId['menu-roles'].stale, 1);
  assert.equal(byId['menu-roles'].newPages, 1, 'a new finding that matches the issue\'s signature counts for it');
});

test('engineVersionNote compares the engine the scans ran with the baseline, not the installed package', () => {
  assert.equal(engineVersionNote({ engines: ['4.14.0', '4.14.0'], baselineVersion: '4.14.0' }), null);
  assert.match(engineVersionNote({ engines: ['4.14.1'], baselineVersion: '4.14.0' }),
    /^axe-core 4\.14\.1 ran the scans and the baseline was taken with 4\.14\.0: re-run the scan and refresh the baseline/);
  assert.match(engineVersionNote({ engines: ['4.14.0', '4.15.0'], baselineVersion: '4.14.0' }), /^axe-core 4\.14\.0, 4\.15\.0 ran/,
    'two engines in one run are both named');
  assert.equal(engineVersionNote({ engines: [], baselineVersion: '4.14.0' }), null, 'no scan, nothing to compare');
});

test('renderSummary writes the headline, the action tables with remedies, and the known issues by title', () => {
  const summary = renderSummary(compare([entry(), entry({ theme: 'horizon', nodes: 1 }), entry({ page: 'context-menu', issue: 'menu-roles' })], [
    violation(),
    ...nodes(3, { theme: 'horizon' }),
    violation({ page: 'context-menu', theme: 'main', rule: 'label', target: 'input.htUIInput', impact: 'serious' }),
  ]), { reportUrl: 'https://github.com/handsontable/handsontable/actions/runs/1/artifacts/2' });

  assert.match(summary, /^## A11y \/ axe/m);
  assert.match(summary, /⚠️ \*\*1 new, 1 grown, 1 stale \(warn mode\)\*\*/);
  assert.match(summary, /📊 \[Open the HTML report\]\(https:\/\/github\.com\/handsontable\/handsontable\/actions\/runs\/1\/artifacts\/2\)/);
  assert.match(summary, /\| context-menu \| main \| label \| serious \| <code>input\.htUIInput<\/code> \| 1 \|/);
  assert.match(summary, /### Grown findings/);
  assert.match(summary, /\| grid \| horizon \| aria-required-children \| <code>div\.ht-wrapper\\\[role="treegrid"\\\]<\/code> \| 3 \| 1 \|/);
  assert.match(summary, /\| The grid root holds children its role does not allow \(<code>grid-roles<\/code>\) \| 2 \|$/m);
  assert.doesNotMatch(summary, /DEV-2964/, 'a report names an issue by what it is; its tracker stays in the baseline file');
  assert.match(summary, /fix it, or add it to/);
  assert.match(summary, /delete the entry/);
});

test('renderSummary of a clean run says so', () => {
  const summary = renderSummary(compare([entry()], [violation()]));

  assert.match(summary, /✅ \*\*No new accessibility findings: 1 known, in 2 known issues\*\*/);
  assert.doesNotMatch(summary, /### New findings|### Stale/);
  assert.doesNotMatch(summary, /Open the HTML report/, 'no link without a report URL');
});

test('renderAnnotations writes a ::warning per finding that needs action in warn mode, ::error in block mode', () => {
  const input = [[entry({ nodes: 1 }), entry({ page: 'context-menu', issue: 'menu-roles' })], [
    ...nodes(2),
    violation({ page: 'context-menu', theme: 'horizon', rule: 'label', target: 'textarea' }),
  ]];
  const warn = renderAnnotations(compare(...input, 'warn'));
  const block = renderAnnotations(compare(...input, 'block'));

  assert.equal(warn.length, 3);
  assert.match(warn[0], /^::warning title=A11y axe%3A new finding::context-menu \/ horizon: label at textarea — /);
  assert.match(warn[1], /^::warning title=A11y axe%3A grown finding::grid \/ main: aria-required-children at .* \(issue "grid-roles"\): 1 more node than the 1 recorded/);
  assert.match(warn[2], /^::warning title=A11y axe%3A stale baseline entry::context-menu \/ main: /);
  assert.ok(block.every(line => line.startsWith('::error title=')));
  assert.ok(warn.every(line => !line.includes('\n')), 'an annotation is one line');
});

test('workflowCommand escapes the title and the message, so a problem quoting the baseline stays one line', () => {
  assert.equal(workflowCommand('error', 'A11y axe: tooling', 'entry 3: "note"\n100% wrong, a:b'),
    '::error title=A11y axe%3A tooling::entry 3: "note"%0A100%25 wrong, a:b');
});

test('renderAnnotations escapes the characters the workflow-command syntax reads', () => {
  const [line] = renderAnnotations(compare([], [violation({ help: 'Elements must meet\nminimum contrast; see %' })]));

  assert.doesNotMatch(line, /\n/);
  assert.match(line, /%0A/);
  assert.match(line, /%25/);
});

/**
 * The cells of one GFM table row, read the way GitHub reads them: the row is split before any inline
 * markup, a pipe directly after a backslash belongs to its cell whatever comes before that backslash
 * (cmark-gfm's cell scanner), and `\\|` then turns into `|`.
 *
 * @param {string} row The row, `| a | b |`.
 * @returns {string[]} The raw cell texts.
 */
const splitRow = row => row.trim().slice(1, -1).split(/(?<!\\)\|/).map(text => text.trim().replace(/\\\|/g, '|'));

/**
 * What a cell's inline text displays: a backslash before ASCII punctuation is an escape.
 *
 * @param {string} text The cell text.
 * @returns {string} The displayed text.
 */
const displayed = text => text.replace(/\\([!-/:-@[-`{-~])/g, '$1');

// Values a page, a target or a help text could carry: a pipe after a backslash, markup, an
// HTML tag, a code span, a link, an entity, emphasis, math, a newline.
const HOSTILE = [
  'x\\|y',
  'a|b',
  'trailing\\',
  '<img src=x onerror=alert(1)>',
  '`code` and **bold** and _em_ and ~strike~',
  '[link](https://example.test) &amp; $x$',
  'two\nlines',
];

test('escapeMarkdownText keeps a value in its table cell and displays it as written', () => {
  for (const value of HOSTILE) {
    const escaped = escapeMarkdownText(value);
    const cells = splitRow(`| ${escaped} | next |`);

    assert.equal(cells.length, 2, `${JSON.stringify(value)} must not open or close a cell`);
    assert.equal(displayed(cells[0]), value.replace(/\r?\n/g, ' '), `${JSON.stringify(value)} displays as written`);
    assert.doesNotMatch(escaped, /(?:^|[^\\])(?:\\\\)*[<>`*_[\]&|~$]/,
      `${JSON.stringify(escaped)}: every character markdown or HTML reads is escaped`);
  }
});

test('renderSummary escapes every value it writes into a table and links only a plain https URL', () => {
  const hostile = HOSTILE.join(' ');
  const summary = renderSummary(compareViolations({
    baseline: [entry({ page: 'context-menu', target: hostile })],
    issues: [{ id: 'grid-roles', title: hostile }],
    violations: [
      violation({ target: hostile, help: hostile, helpUrl: 'https://example.test/rule|x' }),
      violation({ rule: 'label', target: 'textarea', help: 'Form elements must have labels', helpUrl: 'javascript:alert(1)' }),
    ],
    scanned: ALL_SCANNED,
    mode: 'warn',
  }), { reportUrl: 'javascript:alert(1)' });
  const rows = summary.split('\n').filter(line => /^\| (grid|context-menu) \|/.test(line));
  const newRow = rows.find(line => line.startsWith('| grid | main | aria-required-children'));
  const labelRow = rows.find(line => line.startsWith('| grid | main | label'));
  const staleRow = rows.find(line => line.startsWith('| context-menu |'));
  const newCells = splitRow(newRow);

  assert.equal(newCells.length, 8, 'a new finding row keeps its eight cells');
  assert.equal(displayed(newCells[4].replace(/^<code>|<\/code>$/g, '')), hostile.replace(/\n/g, ' '));
  assert.equal(displayed(newCells[7]), hostile.replace(/\n/g, ' '),
    'a help URL with a pipe in it is not linked, so the help text is the whole cell');
  assert.equal(splitRow(labelRow)[7], 'Form elements must have labels', 'a help URL that is not https is not linked');
  assert.equal(splitRow(staleRow).length, 5, 'a stale entry row keeps its five cells');
  assert.doesNotMatch(summary.replace(/<\/?code>/g, ''), /(?:^|[^\\])(?:\\\\)*</m,
    'no unescaped angle bracket reaches the summary outside its own <code> tags, the remedy bullets and issue titles included');
  assert.doesNotMatch(summary, /javascript:/, 'a script URL is never linked or written');
});

test('the committed baseline is valid against the page list, and every page names an existing fixture', () => {
  const baselinePath = path.join(TESTS_ROOT, BASELINE_FILE);

  assert.ok(existsSync(baselinePath), `${BASELINE_FILE} must exist`);

  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const pages = A11Y_PAGES.map(page => page.id);

  assert.deepEqual(validateBaseline(baseline, { pages }), []);
  assert.equal(new Set(pages).size, pages.length, 'page ids are unique');
  for (const page of A11Y_PAGES) {
    assert.match(page.id, /^[a-z0-9-]+$/, `${page.id}: a page id is a kebab-case slug`);
    assert.ok(existsSync(path.join(TESTS_ROOT, 'fixtures/demo', page.fixture)),
      `${page.id}: fixture ${page.fixture} must exist under tests/fixtures/demo/`);
    assert.ok(page.surface && typeof page.surface === 'string', `${page.id}: says which accessible surface it covers`);
    assert.ok(stateSteps(page), `${page.id}: its state "${page.state}" has steps in stateSteps() (a11y/pages.mjs)`);
  }
});

test('findingsByRule counts every reproduced finding per rule, most first, with what needs action', () => {
  const verdict = compare([entry(), entry({ theme: 'horizon', nodes: 3 }), entry({ theme: 'classic' })], [
    violation(), // matched
    violation({ theme: 'horizon' }), // improved: 1 of 3
    violation({ theme: 'classic' }), violation({ theme: 'classic' }), // grown: 2 of 1
    violation({ rule: 'label', target: 'textarea', impact: 'serious' }), // new
  ]);

  assert.deepEqual(findingsByRule(verdict), [
    { rule: 'aria-required-children', findings: 3, nodes: 4, impact: 'critical', new: 0, grown: 1, improved: 1 },
    { rule: 'label', findings: 1, nodes: 1, impact: 'serious', new: 1, grown: 0, improved: 0 },
  ]);
  assert.deepEqual(findingsByRule(compare([entry()], [])), [], 'a stale entry is not a reproduced finding');
});
