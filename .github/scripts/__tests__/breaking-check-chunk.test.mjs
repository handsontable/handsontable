import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterScope, splitDiffByFile } from '../lib/breaking-check/chunk.mjs';

const diffFor = (path, hunkCount = 1) => {
  const hunks = Array.from({ length: hunkCount }, (unused, i) => [
    `@@ -${i * 10 + 1},3 +${i * 10 + 1},3 @@`,
    ` context ${i}`,
    `-old line ${i}`,
    `+new line ${i}`,
  ].join('\n'));

  return [
    `diff --git a/${path} b/${path}`,
    'index 1111111..2222222 100644',
    `--- a/${path}`,
    `+++ b/${path}`,
    ...hunks,
  ].join('\n');
};

test('splitDiffByFile splits a multi-file diff into per-file sections keyed by the post-change path', () => {
  const diff = [diffFor('handsontable/src/a.ts'), diffFor('handsontable/src/b.ts')].join('\n');

  const files = splitDiffByFile(diff);

  assert.equal(files.length, 2);
  assert.equal(files[0].path, 'handsontable/src/a.ts');
  assert.equal(files[1].path, 'handsontable/src/b.ts');
  assert.match(files[0].text, /diff --git a\/handsontable\/src\/a\.ts b\/handsontable\/src\/a\.ts/);
  assert.match(files[0].text, /\+new line 0/);
  assert.doesNotMatch(files[0].text, /new line 0\n.*diff --git.*b\.ts/s);
});

test('splitDiffByFile resolves a rename to its new ("b") path', () => {
  const diff = [
    'diff --git a/handsontable/src/old.ts b/handsontable/src/new.ts',
    'similarity index 100%',
    'rename from handsontable/src/old.ts',
    'rename to handsontable/src/new.ts',
  ].join('\n');

  const files = splitDiffByFile(diff);

  assert.equal(files.length, 1);
  assert.equal(files[0].path, 'handsontable/src/new.ts');
});

test('splitDiffByFile returns nothing for empty input', () => {
  assert.deepEqual(splitDiffByFile(''), []);
  assert.deepEqual(splitDiffByFile(undefined), []);
});

test('filterScope drops test and markdown files, keeps in-scope source', () => {
  const files = [
    { path: 'handsontable/src/core.ts', text: 't' },
    { path: 'handsontable/src/__tests__/core.unit.js', text: 't' },
    { path: 'handsontable/src/core.md', text: 't' },
    { path: 'tests/e2e/core.spec.ts', text: 't' },
    { path: 'wrappers/react-wrapper/src/index.ts', text: 't' },
    { path: '.changelogs/12345.json', text: 't' },
  ];

  const kept = filterScope(files).map((f) => f.path);

  assert.deepEqual(kept, ['handsontable/src/core.ts', 'wrappers/react-wrapper/src/index.ts']);
});
