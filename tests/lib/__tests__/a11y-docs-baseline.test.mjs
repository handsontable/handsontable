import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatBaseline, refreshBaseline, sortEntries } from '../a11y-docs-baseline.mjs';
import { DOCS_BASELINE_FILE } from '../a11y-suites.mjs';
import { DEFAULT_DOCS_BASE_URL, DOCS_PAGES, DOCS_THEMES } from '../../a11y/docs/pages.mjs';

// tests/AGENTS.md, "A11y: the docs site scan": the docs baseline goes stale with every docs merge, so one command
// refreshes it from a run's scans (scripts/a11y-docs-baseline.mjs) and the committed file stays in the form it writes.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = path.join(TESTS_ROOT, 'scripts/a11y-docs-baseline.mjs');
const BASE = 'https://docs.example/docs';
const ORDER = { pages: ['intro', 'license'], themes: ['light', 'dark'] };
const ISSUES = [
  { id: 'link-color-only', title: 'Links are told apart by color alone' },
  { id: 'line-number-contrast', title: 'Code line numbers have low contrast' },
  { id: 'missing-landmark', title: 'Content sits outside a landmark' },
];

/**
 * A scan as the docs spec attaches it, with one violation per rule.
 *
 * @param {string} page The page id.
 * @param {string} theme The theme.
 * @param {object} [counts] Nodes per `rule:tag`, e.g. `{'link-in-text-block:a': 2}`.
 * @param {object} [options] `url` and `engine` overrides.
 * @returns {object} The scan.
 */
function scan(page, theme, counts = {}, { url = `${BASE}/${page}/`, engine = '4.14.0', impact = 'serious' } = {}) {
  return {
    page,
    theme,
    url,
    axeCoreVersion: engine,
    violations: Object.entries(counts).map(([signature, nodes]) => {
      const [rule, tag] = signature.split(':');

      return { id: rule, impact, help: rule, helpUrl: '', tags: ['wcag2aa'],
        nodes: Array.from({ length: nodes }, (_, index) => ({ target: [`${tag}:nth-child(${index + 1})`], html: `<${tag}>`, failureSummary: '' })) };
    }),
  };
}

/**
 * A baseline entry.
 *
 * @param {string} page The page id.
 * @param {string} theme The theme.
 * @param {string} rule The axe rule.
 * @param {string} target The fingerprint.
 * @param {number} nodes The node count.
 * @param {string} issue The issue id.
 * @returns {object} The entry.
 */
function entry(page, theme, rule, target, nodes, issue) {
  return { page, theme, rule, target, impact: 'serious', nodes, issue };
}

const BASELINE = {
  axeCoreVersion: '4.14.0',
  issues: ISSUES,
  entries: [
    entry('intro', 'light', 'link-in-text-block', 'a', 2, 'link-color-only'),
    entry('intro', 'light', 'region', 'div', 1, 'missing-landmark'),
    entry('intro', 'dark', 'link-in-text-block', 'a', 2, 'link-color-only'),
    entry('license', 'light', 'color-contrast', 'span', 4, 'line-number-contrast'),
  ],
};

test('a refresh takes the run\'s counts, adds a known finding, deletes a gone one and keeps what the run did not scan', () => {
  const { document, changes, unplaced, problems } = refreshBaseline({
    baseline: BASELINE,
    // `license` is not scanned: its entry is unverified and stays as it is.
    scans: [scan('intro', 'light', { 'link-in-text-block:a': 3 }), scan('intro', 'dark', { 'link-in-text-block:a': 1, 'color-contrast:span': 5 })],
    ...ORDER,
    baseUrl: BASE,
  });

  assert.deepEqual(problems, []);
  assert.deepEqual(unplaced, []);
  assert.deepEqual(document, {
    axeCoreVersion: '4.14.0',
    // The issue whose last entry went leaves the catalog with it.
    issues: ISSUES.slice(0, 2),
    entries: [
      entry('intro', 'light', 'link-in-text-block', 'a', 3, 'link-color-only'),
      // Sorted into place: the page's order, light before dark, then the rule and the target.
      entry('intro', 'dark', 'color-contrast', 'span', 5, 'line-number-contrast'),
      entry('intro', 'dark', 'link-in-text-block', 'a', 1, 'link-color-only'),
      entry('license', 'light', 'color-contrast', 'span', 4, 'line-number-contrast'),
    ],
  });
  assert.deepEqual(changes.added.map(item => `${item.page}|${item.theme}|${item.rule}|${item.issue}`),
    ['intro|dark|color-contrast|line-number-contrast']);
  assert.deepEqual(changes.raised.map(item => [item.from, item.nodes]), [[2, 3]]);
  assert.deepEqual(changes.lowered.map(item => [item.from, item.nodes]), [[2, 1]]);
  assert.deepEqual(changes.removed.map(item => item.rule), ['region']);
  assert.deepEqual(changes.removedIssues, ['missing-landmark']);
  assert.equal(changes.unverified, 1);
  assert.equal(changes.engine, null);
});

test('a refresh of a run that matches the baseline changes nothing', () => {
  const scans = [
    scan('intro', 'light', { 'link-in-text-block:a': 2, 'region:div': 1 }),
    scan('intro', 'dark', { 'link-in-text-block:a': 2 }),
    scan('license', 'light', { 'color-contrast:span': 4 }),
    scan('license', 'dark'),
  ];
  const { document, changes } = refreshBaseline({ baseline: BASELINE, scans, ...ORDER, baseUrl: BASE });

  assert.deepEqual(document, BASELINE);
  assert.equal(formatBaseline(document), formatBaseline(BASELINE));
  assert.deepEqual([changes.added, changes.raised, changes.lowered, changes.impact, changes.removed], [[], [], [], [], []]);
});

test('a refresh drops the entries of a page that left the page list, and an issue left without any', () => {
  // A page removed from the docs visual list is never scanned again: kept as unverified, its entries would fail
  // the baseline's validation and the refresh would write nothing.
  const { document, changes, problems } = refreshBaseline({
    baseline: BASELINE,
    scans: [scan('intro', 'light', { 'link-in-text-block:a': 2, 'region:div': 1 }), scan('intro', 'dark', { 'link-in-text-block:a': 2 })],
    pages: ['intro'],
    themes: ORDER.themes,
    baseUrl: BASE,
  });

  assert.deepEqual(problems, []);
  assert.deepEqual(document.entries, BASELINE.entries.slice(0, 3));
  assert.deepEqual(document.issues, [ISSUES[0], ISSUES[2]]);
  assert.deepEqual(changes.unlisted.map(item => `${item.page}|${item.theme}|${item.rule}`), ['license|light|color-contrast']);
  assert.deepEqual(changes.removed, []);
  assert.deepEqual(changes.removedIssues, ['line-number-contrast']);
  assert.equal(changes.unverified, 0);
});

test('a new finding no issue covers stops the refresh and is listed for a person to name its issue', () => {
  const { document, unplaced, problems } = refreshBaseline({
    baseline: BASELINE,
    scans: [scan('intro', 'light', { 'link-in-text-block:a': 2, 'region:div': 1, 'button-name:button': 2 })],
    ...ORDER,
    baseUrl: BASE,
  });

  assert.equal(document, null);
  assert.deepEqual(unplaced, [{ page: 'intro', theme: 'light', rule: 'button-name', target: 'button', impact: 'serious', nodes: 2, issue: null }]);
  assert.match(problems.join('\n'), /1 new finding whose rule and target no issue covers yet/);
});

test('a scan of another deploy than the staging one writes nothing', () => {
  const { document, problems } = refreshBaseline({
    baseline: BASELINE,
    scans: [scan('intro', 'light', { 'link-in-text-block:a': 2 }, { url: 'https://preview.example/docs/intro/' })],
    ...ORDER,
    baseUrl: BASE,
  });

  assert.equal(document, null);
  assert.match(problems.join('\n'), /another deploy than https:\/\/docs\.example\/docs/);
});

test('a refresh records the engine the run used, and refuses a run on two', () => {
  const scans = ['light', 'dark'].map(theme => scan('intro', theme, { 'link-in-text-block:a': 2, ...(theme === 'light' ? { 'region:div': 1 } : {}) },
    { engine: '4.15.0' }));
  const bumped = refreshBaseline({ baseline: BASELINE, scans, ...ORDER, baseUrl: BASE });

  assert.equal(bumped.document.axeCoreVersion, '4.15.0');
  assert.deepEqual(bumped.changes.engine, { from: '4.14.0', to: '4.15.0' });

  const mixed = refreshBaseline({ baseline: BASELINE, scans: [scans[0], { ...scans[1], axeCoreVersion: '4.14.0' }], ...ORDER, baseUrl: BASE });

  assert.equal(mixed.document, null);
  assert.match(mixed.problems.join('\n'), /2 axe-core versions/);
});

test('a refresh takes the impact axe now gives a known finding', () => {
  const scans = [scan('intro', 'light', { 'link-in-text-block:a': 2, 'region:div': 1 }, { impact: 'moderate' })];
  const { document, changes } = refreshBaseline({ baseline: BASELINE, scans, ...ORDER, baseUrl: BASE });

  assert.deepEqual(document.entries.slice(0, 2).map(item => item.impact), ['moderate', 'moderate']);
  assert.deepEqual(changes.impact.map(item => [item.rule, item.from, item.impact]), [['link-in-text-block', 'serious', 'moderate'],
    ['region', 'serious', 'moderate']]);
});

test('the committed docs baseline is in the order and the form the refresh writes', () => {
  // A hand edit that breaks the form would make the next refresh rewrite lines nobody changed.
  const text = readFileSync(path.join(TESTS_ROOT, DOCS_BASELINE_FILE), 'utf8');
  const document = JSON.parse(text);

  assert.deepEqual(document.entries, sortEntries(document.entries, { pages: DOCS_PAGES.map(page => page.id), themes: DOCS_THEMES }));
  assert.equal(formatBaseline(document), text);
});

test('the script rewrites a baseline from a folder of scans, and writes nothing on --dry-run or on a finding with no issue', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'docs-baseline-test-'));

  try {
    const scans = path.join(dir, 'scans');
    const file = path.join(dir, 'baseline.json');
    const page = DOCS_PAGES[0].id;
    const original = formatBaseline({ axeCoreVersion: '4.14.0', issues: ISSUES.slice(0, 1),
      entries: [entry(page, 'light', 'link-in-text-block', 'a', 2, 'link-color-only')] });
    const run = (...args) => spawnSync(process.execPath, [SCRIPT, '--scans', scans, '--baseline', file, ...args], { encoding: 'utf8' });

    mkdirSync(scans);
    writeFileSync(file, original);
    writeFileSync(path.join(scans, `${page}--light.json`),
      JSON.stringify(scan(page, 'light', { 'link-in-text-block:a': 3 }, { url: `${DEFAULT_DOCS_BASE_URL}/${page}/` })));

    const dry = run('--dry-run');

    assert.equal(dry.status, 0, dry.stderr);
    assert.match(dry.stdout, /raised 1/);
    assert.equal(readFileSync(file, 'utf8'), original);

    const wrote = run();

    assert.equal(wrote.status, 0, wrote.stderr);
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).entries[0].nodes, 3);

    writeFileSync(path.join(scans, `${page}--light.json`),
      JSON.stringify(scan(page, 'light', { 'link-in-text-block:a': 3, 'button-name:button': 1 }, { url: `${DEFAULT_DOCS_BASE_URL}/${page}/` })));

    const before = readFileSync(file, 'utf8');
    const refused = run();

    assert.equal(refused.status, 1);
    assert.match(refused.stdout, /needs an issue: .*"button-name"/);
    assert.match(refused.stderr, /nothing written/);
    assert.equal(readFileSync(file, 'utf8'), before);

    const neither = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });

    assert.equal(neither.status, 1);
    assert.match(neither.stderr, /--run <run-id>/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
