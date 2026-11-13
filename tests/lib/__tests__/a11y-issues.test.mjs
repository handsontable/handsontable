import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AXE_SCAN_CHECK,
  AXE_SCAN_KIND,
  DOCS_SCAN_CHECK,
  FINDING_SOURCES,
  ISSUES_FILE,
  ISSUES_SCHEMA,
  MATCH_FIELDS,
  READER_KINDS,
  TRIAGE_ID,
  catalogFinding,
  findingShape,
  clusterOf,
  compileIssuesCatalog,
  maskSelector,
  matchClusters,
  trackedBy,
  validateIssuesCatalog,
} from '../a11y-issues.mjs';
import { VOLATILE_CLASSES } from '../a11y-baseline.mjs';
import { EVIDENCE_CHECKS } from '../a11y-evidence.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG_PATH = path.join(TESTS_ROOT, ISSUES_FILE);
const SAMPLE_PATH = path.join(TESTS_ROOT, 'lib/__tests__/fixtures/a11y-findings-sample.json');

const readCatalog = () => JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
const readSample = () => JSON.parse(readFileSync(SAMPLE_PATH, 'utf8'));
// The live sources of the ids a rule may name, which the frozen sample cannot speak for.
const AXE_ISSUES = JSON.parse(readFileSync(path.join(TESTS_ROOT, 'a11y/axe-baseline.json'), 'utf8')).issues.map(issue => issue.id);
const DOCS_ISSUES = JSON.parse(readFileSync(path.join(TESTS_ROOT, 'a11y/docs/docs-baseline.json'), 'utf8')).issues.map(issue => issue.id);
const READER_PROJECTS = [...readFileSync(path.join(TESTS_ROOT, 'playwright.screenreader.config.ts'), 'utf8')
  .matchAll(/\{ name: '([a-z0-9-]+)', use:/g)].map(([, name]) => name);

/**
 * Every kebab-case string literal in the checks' code: the kinds a check can emit are among them.
 *
 * @param {string} dir A directory under `tests/`.
 * @returns {string[]} The literals.
 */
function literalsUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : literalsUnder(full);
    }
    if (!/\.(mjs|ts)$/.test(entry.name)) {
      return [];
    }

    return [...readFileSync(full, 'utf8').matchAll(/'([a-z0-9]+(?:-[a-z0-9]+)+)'/g)].map(([, literal]) => literal);
  });
}

/**
 * A catalog with one cluster per entry, for the matcher tests.
 *
 * @param {Array<[string, object[]]>} clusters `[id, match rules]` pairs.
 * @returns {object} The catalog document.
 */
function catalogOf(...clusters) {
  return {
    schema: ISSUES_SCHEMA,
    triageLimit: 0,
    clusters: clusters.map(([id, match, extra = {}]) => ({ id, title: `Cluster ${id}`, match, ...extra })),
  };
}

const finding = (fields) => ({
  source: 'checks', check: 'keyboard-walker', kind: 'focus-not-returned', rule: null, cause: null, criteria: ['2.4.3'],
  page: 'grid', theme: 'main', where: 'Escape on the editor state', issue: null, ...fields,
});

test('maskSelector strips the instance hash, the volatile classes and positional indexes, and is idempotent', () => {
  // The formula builder marks each reference's cells with a class that carries the instance's random id, so
  // the same cell keys differently every night without the mask (the only hash seen in a real night).
  assert.equal(maskSelector('td.ht-formula-ref-fill-ht_3f7319f5810a6f01-2[role="gridcell"]'),
    'td.ht-formula-ref-fill-ht_*-2[role="gridcell"]');
  assert.equal(maskSelector('#ht_2748fc73094c28f8 > div.wt_a1b2c3d4e5f6'), '#ht_* > div.wt_*');
  // The selection border's `area` class says which selection layer drew it, not what the element is.
  assert.equal(maskSelector('.wtBorder.area'), '.wtBorder');
  assert.equal(maskSelector('td.current.htDimmed[role="gridcell"]'), 'td[role="gridcell"]');
  assert.equal(maskSelector('tr:nth-child(3) > td.htDisabled.htSeparator'), 'tr:nth-child(n) > td.htSeparator');
  // What the mask must not touch: a class that merely starts like a volatile one, and an ordinary name.
  assert.equal(maskSelector('div.ht-wrapper.currentSheet'), 'div.ht-wrapper.currentSheet');
  assert.equal(maskSelector('td.htSubmenu[role="menuitem"]'), 'td.htSubmenu[role="menuitem"]');
  assert.equal(maskSelector('button.ht-button "Action" (2)'), 'button.ht-button "Action" (2)');
  // The chain can be a pair (`a × b`) or carry a step after it: every compound in it is masked.
  assert.equal(maskSelector('div.htMenu.current × div.htMenu (2)'), 'div.htMenu × div.htMenu (2)');
  assert.equal(maskSelector(maskSelector('td.ht-formula-ref-line-ht_f3c9a3a92ef9e4b3-1.current')),
    maskSelector('td.ht-formula-ref-line-ht_f3c9a3a92ef9e4b3-1.current'), 'masking twice changes nothing');
  assert.equal(maskSelector(''), '');
  assert.equal(maskSelector(null), '');

  for (const name of VOLATILE_CLASSES) {
    assert.equal(maskSelector(`td.${name}.htSeparator`), 'td.htSeparator', `${name} is volatile`);
  }
});

test('validateIssuesCatalog accepts the documented shape and names every problem', () => {
  assert.deepEqual(validateIssuesCatalog(catalogOf(
    ['menu-semantics', [{ source: 'axe', axeIssues: ['menu-roles'] }], { tracker: 'DEV-3491' }],
    ['unnamed-controls', [{ source: 'checks', checks: ['keyboard-walker'], kinds: ['focus-stop-unnamed'] }],
      { tracker: ['DEV-3492', 'DEV-2970'] }],
    ['reader-positions', [{ source: 'reader', checks: ['vo-webkit'], where: ['^arrow-'] }]],
  )), []);

  const problems = validateIssuesCatalog({
    schema: 2,
    triageLimit: -1,
    clusters: [
      { id: 'Bad Id', title: '', match: [] },
      { id: 'dup', title: 'One', match: [{ source: 'checks', kinds: ['x'] }] },
      { id: 'dup', title: 'Two', match: [{ source: 'checks', kinds: ['x'] }] },
      { id: 'task-in-title', title: 'Fixed in DEV-1234', match: [{ source: 'checks', kinds: ['x'] }] },
      { id: 'bad-tracker', title: 'T', tracker: 'dev-1', match: [{ source: 'checks', kinds: ['x'] }] },
      { id: 'bad-tracker-list', title: 'T', tracker: ['DEV-1', 7], match: [{ source: 'checks', kinds: ['x'] }] },
      { id: 'no-source', title: 'T', match: [{ kinds: ['x'] }] },
      { id: 'only-source', title: 'T', match: [{ source: 'checks' }] },
      { id: 'bad-source', title: 'T', match: [{ source: 'website', kinds: ['x'] }] },
      { id: 'bad-regex', title: 'T', match: [{ source: 'checks', where: ['('] }] },
      { id: 'unknown-field', title: 'T', match: [{ source: 'checks', selectors: ['x'] }] },
      { id: 'not-a-list', title: 'T', match: [{ source: 'checks', kinds: 'x' }] },
      { id: 'unknown-check', title: 'T', match: [{ source: 'checks', checks: ['no-such-check'] }] },
      { id: 'empty-list', title: 'T', match: [{ source: 'checks', kinds: [] }] },
      { id: 'extra', title: 'T', note: 'x', match: [{ source: 'checks', kinds: ['x'] }] },
      { id: 'needs-triage', title: 'T', match: [{ source: 'checks', kinds: ['x'] }] },
    ],
  });
  const expect = (pattern) => assert.ok(problems.some(problem => pattern.test(problem)),
    `expected a problem matching ${pattern}; got:\n${problems.join('\n')}`);

  expect(/schema/);
  expect(/triageLimit/);
  expect(/"Bad Id"/);
  expect(/title/);
  expect(/no match rule/);
  expect(/duplicate cluster id "dup"/);
  expect(/names a task id/);
  expect(/"bad-tracker".*tracker/);
  expect(/"bad-tracker-list".*tracker/);
  expect(/"no-source".*source/);
  expect(/"only-source".*at least one/);
  expect(/"bad-source".*source/);
  expect(/"bad-regex".*regular expression/);
  expect(/"unknown-field".*unknown field "selectors"/);
  expect(/"not-a-list".*kinds/);
  expect(/"unknown-check".*no-such-check/);
  expect(/"empty-list".*kinds/);
  expect(/"extra".*unknown field "note"/);
  expect(/"needs-triage".*reserved/);

  assert.deepEqual(validateIssuesCatalog(null), ['the catalog must be a JSON object with "schema", "triage" (or "triageLimit") and "clusters"']);
  assert.throws(() => compileIssuesCatalog({ schema: ISSUES_SCHEMA, triageLimit: 0, clusters: [{ id: 'x', title: 'T', match: [] }] }),
    /no match rule/);
});

test('validateIssuesCatalog reads the triage list: one entry per queued shape, each with a reason, and the limit is its length', () => {
  const shape = 'reader|nvda-firefox|token-missing|||sheets-bar|shift-tab-grid';
  const base = catalogOf(['x', [{ source: 'checks', kinds: ['x'] }]]);

  delete base.triageLimit;

  const listed = { ...base, triage: [{ shape, reason: 'Not told apart yet.' }] };

  assert.deepEqual(validateIssuesCatalog(listed), []);
  assert.equal(compileIssuesCatalog(listed).triageLimit, 1, 'the limit is the length of the list');
  assert.deepEqual(compileIssuesCatalog(listed).triage, [{ shape, reason: 'Not told apart yet.' }]);
  assert.equal(compileIssuesCatalog({ ...base, triageLimit: 3 }).triageLimit, 3, 'a catalog that gives the number alone keeps it');
  assert.deepEqual(compileIssuesCatalog({ ...base, triageLimit: 3 }).triage, []);
  assert.deepEqual(validateIssuesCatalog({ ...base, triage: [] }), [], 'an empty queue is a list of none');

  const problems = validateIssuesCatalog({
    ...base,
    triageLimit: 1,
    triage: [
      { shape, reason: '' },
      { shape, reason: 'Twice.' },
      { shape: 'reader|nvda-firefox|token-missing', reason: 'Too short.' },
      { shape: 'website|x|y|||p|w', reason: 'Unknown source.' },
      { shape: 'axe|axe|axe-violation|r||p|w', reason: 'R.', note: 'x' },
      'reader|x',
    ],
  });
  const expect = (pattern) => assert.ok(problems.some(problem => pattern.test(problem)),
    `expected a problem matching ${pattern}; got:\n${problems.join('\n')}`);

  expect(/give one of them, not both/);
  expect(/triage entry 1 needs a "reason"/);
  expect(/triage entry 2 repeats the shape/);
  expect(/triage entry 3 needs a "shape"/);
  expect(/triage entry 4 needs a "shape"/);
  expect(/triage entry 5 has an unknown field "note"/);
  expect(/triage entry 6 must be an object/);
  assert.deepEqual(validateIssuesCatalog({ ...base, triage: {} }), ['"triage" must be an array of { "shape", "reason" } entries']);
});

test('validateIssuesCatalog refuses a field no finding of the rule\'s source carries, and an id its live source does not have', () => {
  const problems = validateIssuesCatalog(catalogOf(
    ['bad-criterion', [{ source: 'checks', criteria: ['9.9.9'] }]],
    ['bad-theme', [{ source: 'checks', themes: ['dark'] }]],
    ['axe-check', [{ source: 'axe', checks: ['keyboard-walker'] }]],
    ['axe-kind', [{ source: 'axe', kinds: ['axe-known'] }]],
    ['axe-cause', [{ source: 'axe', causes: ['color-contrast:bgOverlap'] }]],
    ['reader-kind', [{ source: 'reader', kinds: ['focus-lost'] }]],
    ['reader-rule', [{ source: 'reader', rules: ['region'] }]],
    ['reader-theme', [{ source: 'reader', kinds: ['token-missing'], themes: ['main'] }]],
    ['check-issue', [{ source: 'checks', axeIssues: ['menu-roles'] }]],
    ['unknown-issue', [{ source: 'axe', axeIssues: ['no-such-issue'] }]],
    ['unknown-project', [{ source: 'reader', checks: ['no-such-project'] }]],
  ), { axeIssues: ['menu-roles'], readerProjects: ['nvda-chromium'] });
  const expect = (pattern) => assert.ok(problems.some(problem => pattern.test(problem)),
    `expected a problem matching ${pattern}; got:\n${problems.join('\n')}`);

  expect(/"bad-criterion".*"criteria" names "9\.9\.9", not a WCAG 2\.2 criterion/);
  expect(/"bad-theme".*"themes" names "dark", not a theme/);
  expect(/"axe-check".*"checks" names "keyboard-walker", not the axe scan's check \("axe"\)/);
  expect(/"axe-kind".*"kinds" names "axe-known", not the axe scan's kind \("axe-violation"\)/);
  expect(/"axe-cause".*"causes" on a axe rule: a axe finding never carries it/);
  expect(/"reader-kind".*"kinds" names "focus-lost", not a reader kind/);
  expect(/"reader-rule".*"rules" on a reader rule/);
  expect(/"reader-theme".*"themes" on a reader rule/);
  expect(/"check-issue".*"axeIssues" on a checks rule/);
  expect(/"unknown-issue".*"axeIssues" names "no-such-issue", not an issue of the axe baseline/);
  expect(/"unknown-project".*"checks" names "no-such-project", not a screen reader project/);
  assert.equal(problems.length, 11, problems.join('\n'));
  // The collector compiles the catalog without the live lists, so those two ids are the test's to check.
  assert.deepEqual(validateIssuesCatalog(catalogOf(
    ['unknown-issue', [{ source: 'axe', axeIssues: ['no-such-issue'] }]],
    ['unknown-project', [{ source: 'reader', checks: ['no-such-project'] }]],
  )), []);
  assert.equal(AXE_SCAN_CHECK, 'axe');
  assert.equal(AXE_SCAN_KIND, 'axe-violation');
  assert.deepEqual(READER_KINDS, ['token-missing', 'golden-differs', 'traversal-off']);
});

test('a docs rule names the docs scan\'s check, its color schemes and the docs baseline\'s issues', () => {
  const problems = validateIssuesCatalog(catalogOf(
    ['docs-check', [{ source: 'docs', checks: ['axe'] }]],
    ['docs-kind', [{ source: 'docs', kinds: ['focus-lost'] }]],
    ['docs-theme', [{ source: 'docs', rules: ['link-in-text-block'], themes: ['main'] }]],
    ['docs-cause', [{ source: 'docs', causes: ['color-contrast:bgOverlap'] }]],
    ['docs-issue', [{ source: 'docs', axeIssues: ['menu-roles'] }]],
    ['product-theme', [{ source: 'axe', rules: ['color-contrast'], themes: ['dark'] }]],
  ), { axeIssues: ['menu-roles'], docsIssues: ['docs-link-underline'] });
  const expect = (pattern) => assert.ok(problems.some(problem => pattern.test(problem)),
    `expected a problem matching ${pattern}; got:\n${problems.join('\n')}`);

  expect(/"docs-check".*"checks" names "axe", not the docs scan's check \("docs-axe"\)/);
  expect(/"docs-kind".*"kinds" names "focus-lost", not the axe scan's kind/);
  expect(/"docs-theme".*"themes" names "main", not a docs color scheme \(light, dark\)/);
  expect(/"docs-cause".*"causes" on a docs rule/);
  expect(/"docs-issue".*"axeIssues" names "menu-roles", not an issue of the docs baseline/);
  expect(/"product-theme".*"themes" names "dark", not a theme/);
  assert.equal(problems.length, 6, problems.join('\n'));
  assert.deepEqual(validateIssuesCatalog(catalogOf(
    ['docs-ok', [{ source: 'docs', checks: ['docs-axe'], kinds: ['axe-violation'], themes: ['dark'], axeIssues: ['docs-link-underline'] }]],
  ), { docsIssues: ['docs-link-underline'] }), []);
  assert.equal(DOCS_SCAN_CHECK, 'docs-axe');

  // A docs finding never matches a product rule, and the other way round, though both are axe violations.
  const catalog = compileIssuesCatalog(catalogOf(
    ['product', [{ source: 'axe', rules: ['link-in-text-block'] }]],
    ['docs', [{ source: 'docs', rules: ['link-in-text-block'] }]],
  ));
  const violation = { check: DOCS_SCAN_CHECK, kind: AXE_SCAN_KIND, rule: 'link-in-text-block', page: 'js-introduction', theme: 'dark', where: 'a' };

  assert.deepEqual(matchClusters(finding({ ...violation, source: 'docs' }), catalog), ['docs']);
  assert.deepEqual(matchClusters(finding({ ...violation, source: 'axe', check: AXE_SCAN_CHECK, theme: 'main' }), catalog), ['product']);
});

test('matchClusters ANDs the fields of a rule, ORs the values in a field and the rules of a cluster', () => {
  const catalog = compileIssuesCatalog(catalogOf(
    ['by-kind', [{ source: 'checks', checks: ['keyboard-walker'], kinds: ['focus-not-returned', 'focus-lost'] }]],
    ['by-where', [{ source: 'checks', kinds: ['shortcut-moves-focus-out'], where: ['comment'] }]],
    ['by-page', [{ source: 'checks', kinds: ['unnamed-header'], pages: ['grid', 'dark-grid'] }]],
    ['by-rule', [
      { source: 'checks', checks: ['axe-discovery'], rules: ['aria-required-parent'] },
      { source: 'axe', axeIssues: ['menu-roles'] },
    ]],
    ['by-cause', [{ source: 'checks', rules: ['color-contrast'], causes: ['color-contrast:bgOverlap'] }]],
    ['by-criteria', [{ source: 'checks', checks: ['reflow'], criteria: ['1.4.10'] }]],
    ['by-theme', [{ source: 'axe', rules: ['color-contrast'], themes: ['classic'] }]],
    ['reader-step', [{ source: 'reader', kinds: ['token-missing'], where: ['^(close-editor|close-context-menu)$'] }]],
  ));

  assert.deepEqual(matchClusters(finding({}), catalog), ['by-kind']);
  assert.deepEqual(matchClusters(finding({ kind: 'focus-lost', check: 'keyboard-walker' }), catalog), ['by-kind']);
  assert.deepEqual(matchClusters(finding({ kind: 'focus-lost', check: 'tree-snapshots' }), catalog), [], 'the check is ANDed');
  assert.deepEqual(matchClusters(finding({ kind: 'shortcut-moves-focus-out', where: 'Ctrl+Enter on comment at (5, 5)' }), catalog), ['by-where']);
  assert.deepEqual(matchClusters(finding({ kind: 'shortcut-moves-focus-out', where: 'Enter on context-menu at (5, 5)' }), catalog), []);
  assert.deepEqual(matchClusters(finding({ kind: 'unnamed-header', page: 'grid' }), catalog), ['by-page']);
  assert.deepEqual(matchClusters(finding({ kind: 'unnamed-header', page: 'rtl-grid' }), catalog), [], 'a page pattern is anchored');
  assert.deepEqual(matchClusters(finding({ check: 'axe-discovery', kind: 'axe-violation', rule: 'aria-required-parent' }), catalog), ['by-rule']);
  assert.deepEqual(matchClusters(finding({ source: 'axe', check: 'axe', kind: 'axe-violation', rule: 'aria-required-parent', issue: 'menu-roles' }), catalog), ['by-rule']);
  assert.deepEqual(matchClusters(finding({ source: 'axe', check: 'axe', kind: 'axe-violation', rule: 'aria-required-parent', issue: 'grid-roles' }), catalog), [],
    'an axe row is matched by its baseline issue, not by its rule alone');
  assert.deepEqual(matchClusters(finding({ check: 'axe-discovery', kind: 'axe-needs-review', rule: 'color-contrast', cause: 'color-contrast:bgOverlap' }), catalog), ['by-cause']);
  assert.deepEqual(matchClusters(finding({ check: 'axe-discovery', kind: 'axe-needs-review', rule: 'color-contrast', cause: 'color-contrast:nonBmp' }), catalog), []);
  assert.deepEqual(matchClusters(finding({ check: 'reflow', kind: 'needs-horizontal-scroll', criteria: ['1.4.10'] }), catalog), ['by-criteria']);
  assert.deepEqual(matchClusters(finding({ check: 'reflow', kind: 'text-clipped', criteria: ['1.4.4', '1.4.12'] }), catalog), []);
  assert.deepEqual(matchClusters(finding({ source: 'axe', check: 'axe', kind: 'axe-violation', rule: 'color-contrast', theme: 'classic' }), catalog), ['by-theme']);
  assert.deepEqual(matchClusters(finding({ source: 'axe', check: 'axe', kind: 'axe-violation', rule: 'color-contrast', theme: 'horizon' }), catalog), []);
  assert.deepEqual(matchClusters(finding({ source: 'reader', check: 'nvda-chromium', kind: 'token-missing', page: 'grid-core', theme: null, where: 'close-editor', criteria: [] }), catalog), ['reader-step']);
  assert.deepEqual(matchClusters(finding({ source: 'reader', check: 'nvda-chromium', kind: 'token-missing', page: 'grid-core', theme: null, where: 'close-editor-again', criteria: [] }), catalog), []);
});

test('catalogFinding reads a check run\'s finding the way the ledger does, so a cluster rule matches it at PR time too', () => {
  assert.deepEqual(catalogFinding('checks', 'keyboard-walker', {
    kind: 'focus-lost', criteria: ['2.4.3'], page: 'grid', theme: 'main', selector: 'td.ht_1a2b3c4d.current', step: 'Tab 3',
    severity: 'serious', reason: 'r',
  }), {
    source: 'checks', check: 'keyboard-walker', kind: 'focus-lost', rule: null, cause: null, criteria: ['2.4.3'],
    page: 'grid', theme: 'main', where: 'td.ht_* @ Tab 3', issue: null,
  });
  assert.equal(catalogFinding('checks', 'reflow', { kind: 'k', criteria: [], page: 'p', theme: 'main', step: 'only a step' }).where, 'only a step');
  assert.deepEqual(catalogFinding('axe', 'axe', {
    page: 'context-menu', theme: 'main', rule: 'aria-required-parent', target: 'td.htSeparator.current[role="menuitem"]',
    wcag: ['1.3.1'], suggestedIssue: 'menu-separators',
  }), {
    source: 'axe', check: AXE_SCAN_CHECK, kind: AXE_SCAN_KIND, rule: 'aria-required-parent', cause: null, criteria: ['1.3.1'],
    page: 'context-menu', theme: 'main', where: 'td.htSeparator[role="menuitem"]', issue: 'menu-separators',
  });
  assert.equal(catalogFinding('axe', 'axe', { page: 'p', theme: 'main', rule: 'r', target: 't', issue: 'known', suggestedIssue: 'other' }).issue, 'known',
    'a matched finding\'s own issue wins over a suggestion');
  assert.deepEqual(catalogFinding('reader', 'nvda-chromium', { scenario: 'grid-core', step: 'close-editor', kind: 'token-missing' }), {
    source: 'reader', check: 'nvda-chromium', kind: 'token-missing', rule: null, cause: null, criteria: [],
    page: 'grid-core', theme: null, where: 'close-editor', issue: null,
  });
});

test('catalogFinding reads a docs scan finding as the ledger does: the axe shape under the docs source and check', () => {
  const item = { page: 'js-introduction', theme: 'dark', rule: 'aria-required-children', target: 'div.ht-wrapper[role="treegrid"]',
    wcag: ['1.3.1'], suggestedIssue: 'example-grid-roles' };

  assert.deepEqual(catalogFinding('docs', DOCS_SCAN_CHECK, item), {
    source: 'docs', check: DOCS_SCAN_CHECK, kind: AXE_SCAN_KIND, rule: 'aria-required-children', cause: null, criteria: ['1.3.1'],
    page: 'js-introduction', theme: 'dark', where: 'div.ht-wrapper[role="treegrid"]', issue: 'example-grid-roles',
  });

  const catalog = compileIssuesCatalog(catalogOf(
    ['product-grid', [{ source: 'axe', rules: ['aria-required-children'] }], { tracker: 'TASK-1' }],
    ['docs-grid', [{ source: 'docs', axeIssues: ['example-grid-roles'] }]],
  ));

  assert.equal(clusterOf(catalogFinding('docs', DOCS_SCAN_CHECK, item), catalog).id, 'docs-grid');
  assert.equal(trackedBy(catalog)('docs', DOCS_SCAN_CHECK, item), false, 'a docs finding never borrows a product cluster\'s tracker');
  assert.equal(trackedBy(catalog)('axe', AXE_SCAN_CHECK, item), true, 'the same item read as the product scan\'s would');
});

test('trackedBy says whether a finding\'s cluster has a tracker, and tracks nothing without a catalog', () => {
  const catalog = compileIssuesCatalog(catalogOf(
    ['one', [{ source: 'checks', kinds: ['focus-not-returned'] }], { tracker: 'TASK-1' }],
    ['two', [{ source: 'checks', kinds: ['keyboard-trap'] }], { tracker: ['TASK-2', 'TASK-3'] }],
    ['three', [{ source: 'checks', kinds: ['tab-keeps-focus'] }]],
  ));
  const tracked = trackedBy(catalog);
  const item = kind => ({ kind, criteria: ['2.4.3'], page: 'grid', theme: 'main', step: 'Escape' });

  assert.equal(tracked('checks', 'keyboard-walker', item('focus-not-returned')), true);
  assert.equal(tracked('checks', 'keyboard-walker', item('keyboard-trap')), true, 'a list of trackers is tracked');
  assert.equal(tracked('checks', 'keyboard-walker', item('tab-keeps-focus')), false, 'a cluster without a tracker is not');
  assert.equal(tracked('checks', 'keyboard-walker', item('focus-lost')), false, 'needs-triage is not');
  assert.equal(trackedBy(null)('checks', 'keyboard-walker', item('focus-not-returned')), false);
});

test('clusterOf names the cluster and its tracker, sends an unmatched finding to needs-triage, and reports an ambiguous one', () => {
  const catalog = compileIssuesCatalog(catalogOf(
    ['one', [{ source: 'checks', kinds: ['focus-not-returned'] }], { tracker: 'DEV-3603' }],
    ['two', [{ source: 'checks', checks: ['keyboard-walker'] }], { tracker: ['DEV-1', 'DEV-2'] }],
    ['three', [{ source: 'checks', kinds: ['tab-keeps-focus'] }]],
  ));

  assert.deepEqual(clusterOf(finding({ check: 'tree-snapshots' }), catalog), { id: 'one', tracker: 'DEV-3603', ambiguous: [] });
  assert.deepEqual(clusterOf(finding({ kind: 'tab-keeps-focus', check: 'tree-snapshots' }), catalog), { id: 'three', tracker: null, ambiguous: [] });
  assert.deepEqual(clusterOf(finding({ kind: 'keyboard-trap' }), catalog), { id: 'two', tracker: ['DEV-1', 'DEV-2'], ambiguous: [] });
  assert.deepEqual(clusterOf(finding({ kind: 'escape-does-not-close', check: 'tree-snapshots' }), catalog),
    { id: TRIAGE_ID, tracker: null, ambiguous: [] });
  // The first cluster in catalog order wins, and the caller is told, so a tooling test can refuse the catalog.
  assert.deepEqual(clusterOf(finding({}), catalog), { id: 'one', tracker: 'DEV-3603', ambiguous: ['one', 'two'] });
});

test('the committed catalog validates against the live baseline issues and screen reader projects, and keeps its cluster ids', () => {
  const doc = readCatalog();

  assert.ok(AXE_ISSUES.includes('menu-roles') && READER_PROJECTS.includes('nvda-chromium') && READER_PROJECTS.includes('vo-webkit'),
    'read the baseline issues and the screen reader projects');
  assert.deepEqual(validateIssuesCatalog(doc, { axeIssues: AXE_ISSUES, docsIssues: DOCS_ISSUES, readerProjects: READER_PROJECTS }), []);
  assert.equal(doc.schema, ISSUES_SCHEMA);
  assert.deepEqual(FINDING_SOURCES, ['checks', 'axe', 'reader', 'docs', 'docs-checks']);
  assert.deepEqual(MATCH_FIELDS, ['source', 'checks', 'kinds', 'rules', 'causes', 'criteria', 'pages', 'themes', 'where', 'axeIssues']);
  assert.equal(TRIAGE_ID, 'needs-triage');

  const catalog = compileIssuesCatalog(doc);
  const ids = catalog.clusters.map(cluster => cluster.id);

  assert.deepEqual([...ids].sort(), [...new Set(ids)].sort(), 'cluster ids are unique');
  // Every check a rule names exists, so a renamed check cannot leave a rule matching nothing for months.
  for (const cluster of catalog.clusters) {
    for (const rule of cluster.match.filter(entry => entry.source === 'checks' && entry.checks)) {
      for (const check of rule.checks) {
        assert.ok(Object.hasOwn(EVIDENCE_CHECKS, check), `cluster "${cluster.id}" names a check that is not in EVIDENCE_CHECKS: ${check}`);
      }
    }
  }
  // The clusters the task started with, by id: a rename here is a rename for the skill lessons and the debt triage.
  for (const id of ['overlay-clones-split-tree', 'focus-not-returned-after-escape', 'unnamed-controls', 'menu-semantics',
    'contrast-and-focus-visibility', 'drag-and-press-activation', 'reflow-and-motion', 'status-messages', 'dialogs-leak-tab',
    'target-size']) {
    assert.ok(ids.includes(id), `the catalog keeps the starting cluster "${id}"`);
  }
});

test('every kind a check rule names is one the checks\' code can emit', () => {
  // A kind is a string literal in the check's code (tests/lib, tests/a11y/checks); one that no literal spells is a
  // typo or a renamed kind, and its rule would send every live finding of the real kind to needs-triage.
  const literals = new Set([...literalsUnder(path.join(TESTS_ROOT, 'lib')), ...literalsUnder(path.join(TESTS_ROOT, 'a11y/checks'))]);
  const unknown = readCatalog().clusters.flatMap(cluster => cluster.match
    .filter(rule => rule.source === 'checks' && Array.isArray(rule.kinds))
    .flatMap(rule => rule.kinds.filter(kind => !literals.has(kind)).map(kind => `${cluster.id}: ${kind}`)));

  assert.ok(literals.has('focus-not-returned') && literals.has('axe-needs-review') && literals.has('moves-over-five-seconds'),
    'read the checks\' kinds');
  assert.deepEqual(unknown, []);
});

test('every rule of every cluster matches a sampled finding', () => {
  // A rule that matches nothing is misspelled (an axe rule, a cause, a where pattern) or dead: fix it or delete it.
  const catalog = compileIssuesCatalog(readCatalog());
  const { findings } = readSample();
  const dead = catalog.clusters.flatMap(cluster => cluster.match.map((rule, index) => ({ cluster, rule, index })))
    .filter(({ cluster, rule }) => !findings.some(item => matchClusters(item, { clusters: [{ ...cluster, match: [rule] }] }).length > 0))
    .map(({ cluster, index }) => `${cluster.id}, rule ${index + 1}`);

  assert.deepEqual(dead, []);
});

test('every sampled finding maps to one cluster or to needs-triage, and the triage count is exact', () => {
  // The sample is one row per distinct finding shape (source, check, kind, rule, cause, page, where) of a
  // real audit (fixtures/a11y-findings-sample.json says which runs). A rule that matches two clusters is refused
  // here, not sorted at collection time, and the needs-triage queue is pinned exactly: a change to the catalog
  // or to a check that moves it changes the `triage` list of tests/a11y/issues.json in the same change, whose
  // entries name each queued shape with its reason. A shape leaves the list when it is sorted into a cluster,
  // and joins it only visibly, in the change that adds it; the limit the collector warns at is its length.
  const doc = readCatalog();
  const catalog = compileIssuesCatalog(doc);
  const sample = readSample();
  const A11Y_TRIAGE_LIMIT = catalog.triageLimit;

  assert.ok(Array.isArray(doc.triage), 'the committed catalog lists its queued shapes in "triage", not as a bare "triageLimit"');
  const ambiguous = [];
  const triage = [];
  const matched = new Map(catalog.clusters.map(cluster => [cluster.id, 0]));

  assert.ok(sample.findings.length > 100, 'the sample holds a night');
  assert.equal(new Set(sample.findings.map(findingShape)).size, sample.findings.length, 'one row per finding shape');

  for (const item of sample.findings) {
    const verdict = clusterOf(item, catalog);

    if (verdict.ambiguous.length > 0) {
      ambiguous.push(`${item.check} ${item.kind} ${item.rule ?? ''} ${item.page} ${item.where}: ${verdict.ambiguous.join(', ')}`);
    } else if (verdict.id === TRIAGE_ID) {
      triage.push(item);
    } else {
      matched.set(verdict.id, matched.get(verdict.id) + 1);
    }
  }

  assert.deepEqual(ambiguous, [], 'a finding matches at most one cluster');
  for (const [id, count] of matched) {
    assert.ok(count > 0, `cluster "${id}" matches no sampled finding: a cluster leaves the catalog with its last finding, `
      + 'or its rule is wrong');
  }
  assert.ok(triage.length <= A11Y_TRIAGE_LIMIT,
    `${triage.length} findings need triage against a limit of ${A11Y_TRIAGE_LIMIT}: map the new ones to a cluster `
    + `(tests/a11y/issues.json) instead of growing the triage list:\n${triage.slice(0, 20).map(item => `  ${findingShape(item)}`).join('\n')}`);
  assert.equal(triage.length, A11Y_TRIAGE_LIMIT,
    `${triage.length} findings need triage against a list of ${A11Y_TRIAGE_LIMIT}: remove the sorted shapes from "triage" in tests/a11y/issues.json`);
  assert.deepEqual(triage.map(findingShape).sort(), doc.triage.map(entry => entry.shape).sort(),
    'every shape left in needs-triage has its entry in the catalog\'s "triage" list, and every entry names a shape still there');
});
