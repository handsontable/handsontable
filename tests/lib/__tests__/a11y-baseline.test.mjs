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
  entryKey,
  escapeMarkdownText,
  renderAnnotations,
  renderSummary,
  targetFingerprint,
  validateBaseline,
} from '../a11y-baseline.mjs';
import { A11Y_PAGES } from '../../a11y/pages.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PAGE_IDS = ['grid', 'context-menu'];

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
    target: '.htCore > tbody',
    impact: 'critical',
    task: 'DEV-2964',
    note: 'div with roles instead of table semantics',
    ...overrides,
  };
}

/**
 * A well-formed baseline document around the given entries.
 *
 * @param {object[]} entries The entries.
 * @returns {object} The document.
 */
function doc(entries) {
  return { axeCoreVersion: '4.14.0', entries };
}

/**
 * A flattened violation the scan produced; override what the case is about.
 *
 * @param {object} [overrides] Fields to replace.
 * @returns {object} The violation.
 */
function violation(overrides = {}) {
  return {
    page: 'grid',
    theme: 'main',
    rule: 'aria-required-children',
    target: '.htCore > tbody',
    impact: 'critical',
    help: 'Certain ARIA roles must contain particular children',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/aria-required-children',
    html: '<tbody role="rowgroup">',
    nodes: 1,
    ...overrides,
  };
}

const ALL_SCANNED = A11Y_THEMES.flatMap(theme => PAGE_IDS.map(page => ({ page, theme })));

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
  assert.equal(entryKey(entry()), 'grid|main|aria-required-children|.htCore > tbody');
  assert.equal(entryKey(entry({ task: 'DEV-1', note: 'other', impact: 'minor' })), entryKey(entry()));
  assert.notEqual(entryKey(entry({ theme: 'horizon' })), entryKey(entry()));
});

test('targetFingerprint keeps the node\'s own compound selector, with positional indexes and attribute values collapsed', () => {
  assert.equal(targetFingerprint(['.htCore > tbody']), 'tbody', 'the ancestors axe added for uniqueness are not the finding');
  assert.equal(targetFingerprint(['#grid .htCore']), '.htCore', 'a descendant combinator is an ancestor too');
  assert.equal(targetFingerprint([['#host', '.inner > td']]), 'td', 'a target that crosses a shadow root ends on the node');
  assert.equal(
    targetFingerprint(['.htCore > tbody > tr:nth-child(3) > td:nth-child(2)']),
    'td:nth-child(n)',
    'which row or column a cell sits in is not part of the finding'
  );
  assert.equal(targetFingerprint(['.ht-portal > .htMenu:nth-of-type(2)']), '.htMenu:nth-of-type(n)');
  assert.equal(targetFingerprint(['td[data-testid="cell-4-2"]']), 'td[data-testid]',
    'the fixtures stamp every cell with its coordinates, which would make every cell its own finding');
  assert.equal(
    targetFingerprint(['.ht__row_odd:nth-child(2) > .htSeparator[aria-label="---------"][role="menuitem"]']),
    '.htSeparator[aria-label][role="menuitem"]',
    'a label is content, a role says what the node is'
  );
  assert.equal(targetFingerprint(['td[aria-label="Add comment"]']), 'td[aria-label]',
    'axe picks a unique aria-label per menu item, and one structural finding would fan out into one key per item');
  assert.equal(targetFingerprint(['input[type="checkbox"]']), 'input[type="checkbox"]', 'the input type stays');
  assert.equal(targetFingerprint(['select[data-hot-input="true"]']), 'select[data-hot-input]');
});

test('targetFingerprint replaces a generated ht_/wt_ id with what the node is, read from its markup', () => {
  const root = '<div class="ht-wrapper handsonta..." dir="ltr" id="ht_2748fc73094c28f8" role="treegrid" aria-multiselectable="true">';

  assert.equal(targetFingerprint(['#ht_2748fc73094c28f8'], root), 'div[role="treegrid"]',
    'the root element gets a random id per instance, so the id can never be a key; the role says what it is');
  assert.equal(targetFingerprint(['#ht_2748fc73094c28f8']), '#ht_*', 'without the markup the id is still collapsed');
  assert.equal(targetFingerprint(['#ht_2748fc73094c28f8 > .ht_master > .wtHolder'], '<div class="wtHolder" tabindex="-1">'),
    '.wtHolder', 'a generated id on an ancestor is dropped with the ancestor');
  assert.equal(targetFingerprint(['#ht_2748fc73094c28f8-listbox-0-0'], '<div role="listbox" id="ht_2748fc73094c28f8-listbox-0-0">'),
    'div[role="listbox"]', 'an id derived from the instance id is generated too');
  assert.equal(targetFingerprint(['#wt_ab12cd34ef56ab12'], '<div class="wtHolder other">'), 'div.wtHolder',
    'without a role the first class that is not a theme or an instance class names the node');
  assert.equal(targetFingerprint(['#ht_1234567890abcdef'], '<div class="ht-theme-main ht_9f8e">'), 'div',
    'a theme or instance class is no description');
  assert.equal(targetFingerprint(['#ht_1234567890abcdef'], 'not markup'), '#ht_*');
});

test('validateBaseline accepts a well-formed document', () => {
  assert.deepEqual(validateBaseline(doc([entry(), entry({ theme: 'horizon' })]), { pages: PAGE_IDS }), []);
});

test('validateBaseline refuses an entry without a task id or with a malformed one', () => {
  const noTask = entry();

  delete noTask.task;

  assert.match(validateBaseline(doc([noTask]), { pages: PAGE_IDS })[0], /entry 1 .*task/);
  for (const task of ['', 'dev-2964', 'DEV_2964', '2964', 'DEV-', 'the sorting task']) {
    const problems = validateBaseline(doc([entry({ task })]), { pages: PAGE_IDS });

    assert.equal(problems.length, 1, `${JSON.stringify(task)} must be refused`);
    assert.match(problems[0], /task/);
  }
});

test('validateBaseline refuses a missing or empty page, rule, target or note, and an unknown theme or page', () => {
  for (const field of ['page', 'rule', 'target', 'note']) {
    const missing = entry();

    delete missing[field];

    assert.match(validateBaseline(doc([missing]), { pages: PAGE_IDS })[0], new RegExp(field));
    assert.match(validateBaseline(doc([entry({ [field]: '' })]), { pages: PAGE_IDS })[0], new RegExp(field));
    assert.match(validateBaseline(doc([entry({ [field]: 42 })]), { pages: PAGE_IDS })[0], new RegExp(field));
  }
  assert.match(validateBaseline(doc([entry({ theme: 'dark' })]), { pages: PAGE_IDS })[0], /theme "dark"/);
  assert.match(validateBaseline(doc([entry({ page: 'gone' })]), { pages: PAGE_IDS })[0],
    /page "gone" .*a11y\/pages\.mjs/);
});

test('validateBaseline refuses a duplicate key, a non-array entries field, and a missing axe-core version', () => {
  assert.match(validateBaseline(doc([entry(), entry({ task: 'DEV-1' })]), { pages: PAGE_IDS })[0], /duplicate/);
  assert.match(validateBaseline({ axeCoreVersion: '4.14.0', entries: {} }, { pages: PAGE_IDS })[0], /entries/);
  assert.match(validateBaseline({ entries: [] }, { pages: PAGE_IDS })[0], /axeCoreVersion/);
  assert.match(validateBaseline({ axeCoreVersion: 'latest', entries: [] }, { pages: PAGE_IDS })[0], /axeCoreVersion/);
  assert.match(validateBaseline(null, { pages: PAGE_IDS })[0], /object/);
});

test('compareViolations sorts a run into new, matched, stale and unverified', () => {
  const baseline = [
    entry(),
    entry({ theme: 'horizon', rule: 'color-contrast', target: '.htCore td:nth-child(n)', task: 'DEV-2946' }),
    entry({ page: 'context-menu', theme: 'classic', rule: 'aria-required-children', target: '.htMenu' }),
  ];
  const result = compareViolations({
    baseline,
    violations: [
      violation(),
      violation({ page: 'context-menu', rule: 'aria-required-parent', target: '.htMenu .htSeparator' }),
    ],
    scanned: ALL_SCANNED.filter(({ page, theme }) => !(page === 'context-menu' && theme === 'classic')),
    mode: 'warn',
  });

  assert.deepEqual(result.newViolations.map(entryKey), ['context-menu|main|aria-required-parent|.htMenu .htSeparator']);
  assert.deepEqual(result.matched.map(item => [entryKey(item), item.task]), [[entryKey(entry()), 'DEV-2964']]);
  assert.deepEqual(result.stale.map(entryKey), [entryKey(baseline[1])],
    'a baseline entry whose page and theme were scanned and did not reproduce is stale');
  assert.deepEqual(result.unverified.map(entryKey), [entryKey(baseline[2])],
    'a baseline entry whose page or theme was not scanned this run is neither matched nor stale');
  assert.equal(result.mode, 'warn');
});

test('every set carries its one-line remedy', () => {
  const result = compareViolations({
    baseline: [entry(), entry({ theme: 'horizon', rule: 'color-contrast', target: '.htCore td:nth-child(n)' })],
    violations: [violation(), violation({ rule: 'label', target: 'input.htUIInput', task: undefined })],
    scanned: ALL_SCANNED,
    mode: 'warn',
  });

  assert.match(result.newViolations[0].remedy, /fix it, or add .*tests\/a11y\/axe-baseline\.json/i);
  assert.match(result.newViolations[0].remedy, /"task": "DEV-"/, 'the snippet to paste leaves the task to fill in');
  assert.match(result.matched[0].remedy, /DEV-2964/);
  assert.match(result.stale[0].remedy, /delete .* from tests\/a11y\/axe-baseline\.json/i);
});

test('a violation reproduced on several nodes is one finding, and matching ignores the node count', () => {
  const result = compareViolations({
    baseline: [entry()],
    violations: [violation({ nodes: 40 })],
    scanned: ALL_SCANNED,
    mode: 'warn',
  });

  assert.equal(result.newViolations.length, 0);
  assert.equal(result.matched.length, 1);
  assert.equal(result.matched[0].nodes, 40);
});

test('warn mode passes with new and stale findings; block mode fails on either', () => {
  const withNew = { baseline: [], violations: [violation()], scanned: ALL_SCANNED };
  const withStale = { baseline: [entry()], violations: [], scanned: ALL_SCANNED };
  const clean = { baseline: [entry()], violations: [violation()], scanned: ALL_SCANNED };

  assert.equal(compareViolations({ ...withNew, mode: 'warn' }).status, 'passed');
  assert.equal(compareViolations({ ...withStale, mode: 'warn' }).status, 'passed');
  assert.equal(compareViolations({ ...withNew, mode: 'block' }).status, 'failed');
  assert.equal(compareViolations({ ...withStale, mode: 'block' }).status, 'failed');
  assert.equal(compareViolations({ ...clean, mode: 'block' }).status, 'passed');
  assert.throws(() => compareViolations({ ...clean, mode: 'strict' }), /mode/);
});

test('an unverified entry never changes the status, in either mode', () => {
  const result = { baseline: [entry({ page: 'context-menu' })], violations: [], scanned: [] };

  assert.equal(compareViolations({ ...result, mode: 'block' }).status, 'passed');
  assert.equal(compareViolations({ ...result, mode: 'block' }).unverified.length, 1);
});

test('renderSummary writes the job-summary tables with the counts and every remedy', () => {
  const result = compareViolations({
    baseline: [entry(), entry({ theme: 'horizon', rule: 'color-contrast', target: '.htCore td:nth-child(n)', task: 'DEV-2946' })],
    violations: [violation(), violation({ page: 'context-menu', rule: 'label', target: 'input.htUIInput', impact: 'serious' })],
    scanned: ALL_SCANNED,
    mode: 'warn',
  });
  const summary = renderSummary(result);

  assert.match(summary, /^## A11y \/ axe/m);
  assert.match(summary, /warn mode/);
  assert.match(summary, /1 new, 1 matched, 1 stale, 0 unverified/);
  assert.match(summary, /\| context-menu \| main \| label \| serious \| <code>input\.htUIInput<\/code> \|/);
  assert.match(summary, /\| grid \| horizon \| color-contrast \| DEV-2946 \|/, 'a stale entry names the task that owned it');
  assert.match(summary, /dequeuniversity\.com\/rules\/axe/, 'the help link is in the table');
  assert.match(summary, /fix it, or add/i);
  assert.match(summary, /delete .* from/i);
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

test('renderSummary escapes every value it writes into a table and links only a plain https help URL', () => {
  const hostile = HOSTILE.join(' ');
  const summary = renderSummary(compareViolations({
    baseline: [entry({ page: 'context-menu', target: hostile, note: hostile })],
    violations: [
      violation({ target: hostile, help: hostile, helpUrl: 'https://example.test/rule|x' }),
      violation({ rule: 'label', target: 'textarea', help: 'Form elements must have labels', helpUrl: 'javascript:alert(1)' }),
    ],
    scanned: ALL_SCANNED,
    mode: 'warn',
  }));
  const rows = summary.split('\n').filter(line => /^\| (grid|context-menu) \|/.test(line));
  const [newRow, labelRow, staleRow] = [
    rows.find(line => line.startsWith('| grid | main | aria-required-children')),
    rows.find(line => line.startsWith('| grid | main | label')),
    rows.find(line => line.startsWith('| context-menu |')),
  ];
  const newCells = splitRow(newRow);

  assert.equal(newCells.length, 7, 'a new finding row keeps its seven cells');
  assert.equal(displayed(newCells[4].replace(/^<code>|<\/code>$/g, '')), hostile.replace(/\n/g, ' '));
  assert.equal(displayed(newCells[6]), hostile.replace(/\n/g, ' '),
    'a help URL with a pipe in it is not linked, so the help text is the whole cell');
  assert.equal(splitRow(labelRow)[6], 'Form elements must have labels', 'a help URL that is not https is not linked');
  assert.equal(splitRow(staleRow).length, 5, 'a stale entry row keeps its five cells');
  assert.doesNotMatch(summary.replace(/<\/?code>/g, ''), /(?:^|[^\\])(?:\\\\)*</m,
    'no unescaped angle bracket reaches the summary outside its own <code> tags, the remedy bullets included');
  assert.doesNotMatch(summary, /javascript:/, 'a script URL is never linked or written');
});

test('renderSummary of a clean run says so in one line', () => {
  const summary = renderSummary(compareViolations({ baseline: [], violations: [], scanned: ALL_SCANNED, mode: 'warn' }));

  assert.match(summary, /0 new, 0 matched, 0 stale, 0 unverified/);
  assert.doesNotMatch(summary, /\| page \|/i);
});

test('renderAnnotations writes a ::warning per new finding and stale entry in warn mode, ::error in block mode', () => {
  const input = {
    baseline: [entry({ theme: 'horizon', rule: 'color-contrast', target: '.htCore td:nth-child(n)', task: 'DEV-2946' })],
    violations: [violation({ page: 'context-menu', rule: 'label', target: 'input.htUIInput' })],
    scanned: ALL_SCANNED,
  };
  const warn = renderAnnotations(compareViolations({ ...input, mode: 'warn' }));
  const block = renderAnnotations(compareViolations({ ...input, mode: 'block' }));

  assert.equal(warn.length, 2);
  assert.match(warn[0], /^::warning title=A11y axe%3A new violation::context-menu \/ main: label at input\.htUIInput — /,
    'the colon in the title is percent-encoded, as the workflow-command syntax asks for a property');
  assert.match(warn[1], /^::warning title=A11y axe%3A stale baseline entry::grid \/ horizon: color-contrast at /);
  assert.match(warn[1], /DEV-2946/);
  assert.match(block[0], /^::error title=A11y axe%3A new violation::/);
  assert.match(block[1], /^::error title=A11y axe%3A stale baseline entry::/);
  assert.ok(warn.every(line => !line.includes('\n')), 'an annotation is one line');
});

test('renderAnnotations escapes the characters the workflow-command syntax reads', () => {
  const [line] = renderAnnotations(compareViolations({
    baseline: [],
    violations: [violation({ help: 'Elements must meet\nminimum contrast; see %', target: '.a::before' })],
    scanned: ALL_SCANNED,
    mode: 'warn',
  }));

  assert.doesNotMatch(line, /\n/);
  assert.match(line, /%0A/, 'a newline in the message is percent-encoded');
  assert.match(line, /%25/, 'a percent sign in the message is percent-encoded');
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
  }
});
