import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const modulePath = fileURLToPath(
  new URL('../VersionComparison/featuredEntries.ts', import.meta.url),
);
const transpiled = ts.transpileModule(readFileSync(modulePath, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const { isFeatured, matchesFilter, partitionEntries } = await import(
  `data:text/javascript;charset=utf-8,${encodeURIComponent(transpiled)}`
);

function entry(overrides = {}) {
  return {
    version: '18.1.0',
    releaseDate: '2026-09-01',
    category: 'added',
    breaking: false,
    framework: 'core',
    prNumber: 1,
    prKind: 'pull',
    title: 'A change',
    highlighted: false,
    ...overrides,
  };
}

// The page hands each release group the entries its filter admits. Mirroring
// that here keeps the fixtures honest about partitionEntries' precondition.
function visible(entries, filter) {
  return entries.filter((e) => isFeatured(e, filter) || matchesFilter(e, filter));
}

function partitionVisible(entries, filter) {
  return partitionEntries(visible(entries, filter), filter);
}

test('a highlight filed under Fixed is featured on the New tab', () => {
  const shadowDom = entry({ category: 'fixed', prNumber: 13194, highlighted: true });
  const { featured, compact } = partitionVisible([shadowDom], 'new');

  assert.deepEqual(featured.map((e) => e.prNumber), [13194]);
  assert.deepEqual(compact, []);
});

test('a highlight still shows on the tab matching its own category', () => {
  const shadowDom = entry({ category: 'fixed', prNumber: 13194, highlighted: true });
  const { featured } = partitionVisible([shadowDom], 'fixed');

  assert.deepEqual(featured.map((e) => e.prNumber), [13194]);
});

test('a highlight does not leak onto an unrelated tab', () => {
  const shadowDom = entry({ category: 'fixed', prNumber: 13194, highlighted: true });

  for (const filter of ['deprecated', 'breaking']) {
    assert.equal(isFeatured(shadowDom, filter), false, `leaked onto ${filter}`);
    const { featured, compact } = partitionVisible([shadowDom], filter);
    assert.deepEqual(featured, [], `leaked onto ${filter}`);
    assert.deepEqual(compact, [], `leaked onto ${filter}`);
  }
});

test('one PR cited by two bullets renders a single card, and the first bullet wins', () => {
  // #12951 is cited under `#### Added` (the hook) and `#### Changed` (the
  // render path). The changelog order decides which pill the card carries.
  const addedBullet = entry({ category: 'added', prNumber: 12951, highlighted: true, title: 'hook' });
  const changedBullet = entry({ category: 'changed', prNumber: 12951, highlighted: true, title: 'render path' });

  const onAll = partitionVisible([addedBullet, changedBullet], 'all');
  assert.deepEqual(onAll.featured.map((e) => e.category), ['added']);
  assert.deepEqual(onAll.compact.map((e) => e.category), ['changed']);

  const onNew = partitionVisible([addedBullet, changedBullet], 'new');
  assert.deepEqual(onNew.featured.map((e) => e.category), ['added']);
  // The `changed` bullet belongs to no New-tab category, so a promoted
  // highlight must not drag it into the compact list there.
  assert.deepEqual(onNew.compact, []);
});

test('the losing bullet keeps its place when its own category matches the tab', () => {
  // 16.1's #11790 is cited under both `#### Added` and `#### Deprecated`.
  const addedBullet = entry({ version: '16.1.0', category: 'added', prNumber: 11790, highlighted: true });
  const deprecatedBullet = entry({ version: '16.1.0', category: 'deprecated', prNumber: 11790, highlighted: true });

  const onDeprecated = partitionVisible([addedBullet, deprecatedBullet], 'deprecated');
  assert.deepEqual(onDeprecated.featured.map((e) => e.category), ['deprecated']);
  assert.deepEqual(onDeprecated.compact, []);
});

test('entries with no PR citation are never deduplicated against each other', () => {
  const first = entry({ prNumber: null, prKind: null, title: 'first' });
  const second = entry({ prNumber: null, prKind: null, title: 'second' });
  const { featured, compact } = partitionVisible([first, second], 'new');

  assert.deepEqual(featured, []);
  assert.deepEqual(compact.map((e) => e.title), ['first', 'second']);
});

test('a plain entry lands in the compact list on its own tab only', () => {
  const fix = entry({ category: 'fixed', prNumber: 13220 });

  assert.deepEqual(partitionVisible([fix], 'fixed').compact.map((e) => e.prNumber), [13220]);
  assert.deepEqual(partitionVisible([fix], 'new').compact, []);
  assert.deepEqual(partitionVisible([fix], 'all').compact.map((e) => e.prNumber), [13220]);
});

test('a breaking highlight is featured on Breaking and on New', () => {
  const breakingChange = entry({ category: 'changed', breaking: true, prNumber: 12011, highlighted: true });

  assert.deepEqual(partitionVisible([breakingChange], 'breaking').featured.map((e) => e.prNumber), [12011]);
  assert.deepEqual(partitionVisible([breakingChange], 'new').featured.map((e) => e.prNumber), [12011]);
});
