import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECORD_VERSION, buildRecord, itemToSpec, recordFileName } from '../visual-compare-record.mjs';

// The record is how a visual flake gets a memory: the ledger keys on the capture and the spec it reads
// here, so a path that maps to the wrong spec files the sighting under the wrong row, and one that maps to
// nothing drops it. The inverse of `helpers.screenshotPath()` is pinned on every shape the suite writes and
// against the spec tree itself.

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO_ROOT = join(PACKAGE_ROOT, '..');
const CROSS_BROWSER = readdirSync(join(PACKAGE_ROOT, 'tests', 'cross-browser'))
  .filter(name => name.endsWith('.spec.ts'))
  .map(name => name.slice(0, -'.spec.ts'.length));

test('itemToSpec reads the leg, the spec and the capture off each shape the suite writes', () => {
  const filters = 'js/chromium-theme-main-dark/multi-frameworks/filters/escaping-the-menu-12.png';

  assert.deepEqual(itemToSpec(filters, CROSS_BROWSER), {
    leg: 'js/chromium-theme-main-dark',
    spec: 'visual-tests/tests/multi-frameworks/filters/escaping-the-menu.spec.ts',
    capture: 'multi-frameworks/filters/escaping-the-menu-12',
    index: 12,
  });
  // A wrapper leg, and a nested js-only directory.
  assert.equal(itemToSpec('react-wrapper/chromium/multi-frameworks/tab-navigation-1.png', CROSS_BROWSER).leg,
    'react-wrapper/chromium');
  assert.equal(itemToSpec('js/chromium/js-only/complex-demo/rtl/select-cells-1.png', CROSS_BROWSER).spec,
    'visual-tests/tests/js-only/complex-demo/rtl/select-cells.spec.ts');
  // A cross-browser spec on the root page has no URL segment; one that navigates carries the demo's path.
  assert.deepEqual(itemToSpec('cross-browser/webkit/columns-filter-2.png', CROSS_BROWSER), {
    leg: 'cross-browser/webkit',
    spec: 'visual-tests/tests/cross-browser/columns-filter.spec.ts',
    capture: 'columns-filter-2',
    index: 2,
  });
  assert.equal(itemToSpec('cross-browser/firefox/alignment-custom-style-demo-1.png', CROSS_BROWSER).spec,
    'visual-tests/tests/cross-browser/alignment.spec.ts');
});

test('itemToSpec refuses a path the suite does not write', () => {
  ['notes.txt', 'js/chromium/x.png', 'js/x-1.png', 'cross-browser/webkit/no-such-spec-1.png'].forEach((item) => {
    assert.equal(itemToSpec(item, CROSS_BROWSER), null, item);
  });
});

test('the longest cross-browser basename wins, so a spec named after another one is not swallowed by it', () => {
  // `columns-filter` and a hypothetical `columns-filter-advanced`: the shorter one is a dash-boundary prefix
  // of the longer, and only the longest-first rule keeps `…-advanced-2` on its own spec.
  const specs = ['columns-filter', 'columns-filter-advanced'];

  assert.equal(itemToSpec('cross-browser/chromium/columns-filter-advanced-2.png', specs).spec,
    'visual-tests/tests/cross-browser/columns-filter-advanced.spec.ts');
  assert.equal(itemToSpec('cross-browser/chromium/columns-filter-2.png', specs).spec,
    'visual-tests/tests/cross-browser/columns-filter.spec.ts');
});

test('the spec tree keeps the two properties the inverse relies on', () => {
  // Measured on 2026-09-23: over the live manifest's 1676 items, all map to a spec on disk. Two properties
  // of the tree make that hold, and either can break with one new file: a cross-browser basename that is a
  // dash-boundary prefix of another (the longest-first rule then has to guess for the shorter spec's URL
  // segments), and a spec basename that itself ends in `-<digits>` (indistinguishable from a capture index).
  const clashes = CROSS_BROWSER.filter(a => CROSS_BROWSER.some(b => a !== b && b.startsWith(`${a}-`)));
  const digitEnded = readdirSync(join(PACKAGE_ROOT, 'tests'), { recursive: true })
    .filter(path => /-\d+\.spec\.ts$/.test(String(path)));

  assert.deepEqual(clashes, [], 'a cross-browser spec basename prefixes another; check itemToSpec still maps both');
  assert.deepEqual(digitEnded, [], 'a spec basename ends in -<digits>, which reads as a capture index');
});

test('a sample of real golden paths maps to specs that exist', () => {
  // A trimmed copy of the live `base/develop/out.json`: one path per leg, and every cross-browser shape.
  const sample = [
    'angular-wrapper/chromium/multi-frameworks/change-rows-order-1.png',
    'vue3/chromium/multi-frameworks/filters/accepting-by-enter-5.png',
    'js/chromium/js-only/sheetsBar/tabs-6.png',
    'js/chromium-theme-horizon/js-only/dialog/dialog-focus-5.png',
    'js/chromium-theme-horizon-dark/multi-frameworks/mouse-wheel-2.png',
    'js/chromium-theme-main/js-only/pagination/navigation-4.png',
    'cross-browser/chromium/copy-paste-large-dataset-demo-1.png',
    'cross-browser/firefox/selection-arabic-rtl-demo-3.png',
    'cross-browser/webkit/undo-redo-nested-rows-demo-2.png',
    'cross-browser/webkit/borders-1.png',
  ];

  sample.forEach((item) => {
    const origin = itemToSpec(item, CROSS_BROWSER);

    assert.ok(origin, `${item} maps to nothing`);
    assert.ok(existsSync(join(REPO_ROOT, origin.spec)), `${item} maps to ${origin.spec}, which does not exist`);
  });
});

test('buildRecord lists what differed, with the render hash, and counts the passes without listing them', () => {
  const record = buildRecord({
    report: {
      failedItems: ['js/chromium-theme-main/multi-frameworks/filters/escaping-the-menu-12.png'],
      newItems: ['js/chromium-theme-main/js-only/sheetsBar/tabs-7.png'],
      deletedItems: ['cross-browser/webkit/borders-1.png'],
      passedItems: ['a.png', 'b.png'],
    },
    tier: 'pr',
    keys: { expected: 'base/develop', actual: 'pr-1/abc' },
    run: { branch: 'feature/x', sha: 'abc', event: 'pull_request', runId: '42', runAttempt: 1 },
    crossBrowserSpecs: CROSS_BROWSER,
    hashOf: item => `sha-of-${item}`,
    quarantineOf: item => (item.includes('escaping') ? 'DEV-1234 until 2026-10-01 — timer' : null),
  });

  assert.equal(record.version, RECORD_VERSION);
  assert.equal(record.tier, 'pr');
  assert.equal(record.expectedKey, 'base/develop');
  assert.equal(record.compared, true);
  assert.deepEqual(record.counts, { changed: 1, new: 1, deleted: 1, passed: 2 });
  assert.deepEqual(record.items.map(item => item.status), ['changed', 'new', 'deleted']);

  const [changed, added, deleted] = record.items;

  assert.equal(changed.capture, 'multi-frameworks/filters/escaping-the-menu-12');
  assert.equal(changed.actualSha256, 'sha-of-js/chromium-theme-main/multi-frameworks/filters/escaping-the-menu-12.png');
  assert.equal(changed.quarantine, 'DEV-1234 until 2026-10-01 — timer');
  assert.equal(added.quarantine, null);
  // A deleted item has no render, so there is nothing to hash.
  assert.equal(deleted.actualSha256, null);
  // The record is written before the verdict and never carries it.
  assert.equal('verdict' in record, false);
  assert.ok(record.items.every(item => item.status !== 'passed'), 'passes are counted, never listed');
});

test('a comparison that wrote no report still leaves a record, empty', () => {
  const record = buildRecord({
    report: null,
    tier: 'seed',
    keys: { expected: 'base/develop', actual: 'base/develop' },
    run: { branch: 'develop', sha: 'def', event: 'push', runId: '43', runAttempt: 2 },
    crossBrowserSpecs: CROSS_BROWSER,
  });

  assert.equal(record.compared, false);
  assert.equal(record.tier, 'seed', 'the ledger skips a seed record by this field');
  assert.deepEqual(record.items, []);
  assert.deepEqual(record.counts, { changed: 0, new: 0, deleted: 0, passed: 0 });
});

test('the record file name carries the tier and the commit', () => {
  assert.equal(recordFileName('full', '0123456789abcdef'), 'visual-compare-full-0123456789ab.json');
  assert.equal(recordFileName('pr', ''), 'visual-compare-pr-unknown.json');
});
