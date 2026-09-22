import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseExampleBlockRanges, parseUnifiedDiffHunks, isExampleRelevant,
} from '../lib/docs-examples-gate.mjs';

test('parseExampleBlockRanges finds a single block, fence lines inclusive', () => {
  const text = [
    '# Title', // 1
    '', // 2
    '::: example #example1 --js 1', // 3
    '@[code](@/content/guides/x/y/javascript/example1.js)', // 4
    ':::', // 5
    '', // 6
    'Some prose after.', // 7
  ].join('\n');

  assert.deepEqual(parseExampleBlockRanges(text), [{ start: 3, end: 5 }]);
});

test('parseExampleBlockRanges recognizes example-without-tabs', () => {
  const text = ['::: example-without-tabs #ex', '@[code](@/content/x.js)', ':::'].join('\n');

  assert.deepEqual(parseExampleBlockRanges(text), [{ start: 1, end: 3 }]);
});

test('parseExampleBlockRanges replicates the loader\'s nesting quirk: a nested ":::name" without a space closes the outer block early, one WITH a space nests', () => {
  // Mirrors framework-loader.mjs's processExampleBlocks(): depth only
  // increments on /^:::\s+\S/ (whitespace required before the name).
  const noSpace = [
    '::: example #ex', // 1 (open, depth 1)
    ':::tip', // 2 -- no space: does NOT nest, matches close-ish? no: does not match CLOSE_RE either (has trailing text)
    'tip body', // 3
    ':::', // 4 -- closes the outer block (depth 0)
    'orphaned prose', // 5
  ].join('\n');

  // depth only ever decrements on an exact ":::" line, so the block ends at
  // line 4 regardless of the un-nested ":::tip" on line 2.
  assert.deepEqual(parseExampleBlockRanges(noSpace), [{ start: 1, end: 4 }]);

  const withSpace = [
    '::: example #ex', // 1 (open, depth 1)
    ':::  tip', // 2 -- space + name: nests (depth 2)
    'tip body', // 3
    ':::', // 4 -- closes the nested tip (depth 1)
    ':::', // 5 -- closes the outer example block (depth 0)
  ].join('\n');

  assert.deepEqual(parseExampleBlockRanges(withSpace), [{ start: 1, end: 5 }]);
});

test('parseExampleBlockRanges does not throw on an unterminated block, and extends it to EOF', () => {
  const text = ['::: example #ex', '@[code](@/content/x.js)'].join('\n');

  assert.deepEqual(parseExampleBlockRanges(text), [{ start: 1, end: 2 }]);
});

test('parseExampleBlockRanges returns no ranges for prose with no block', () => {
  assert.deepEqual(parseExampleBlockRanges('# Title\n\nJust prose.\n'), []);
});

test('parseUnifiedDiffHunks tracks both old- and new-side line numbers across hunks, and ignores the file headers', () => {
  const diff = [
    '--- a/docs/content/guides/x/y.md',
    '+++ b/docs/content/guides/x/y.md',
    '@@ -3,2 +3,1 @@',
    '-old line 3',
    '-old line 4',
    '+new line 3',
    '@@ -10,0 +9,2 @@',
    '+added line 9',
    '+added line 10',
  ].join('\n');

  const { addedLines, removedLines } = parseUnifiedDiffHunks(diff);

  assert.deepEqual([...addedLines].sort((a, b) => a - b), [3, 9, 10]);
  assert.deepEqual([...removedLines].sort((a, b) => a - b), [3, 4]);
});

test('isExampleRelevant: out-of-scope path is never relevant', () => {
  assert.equal(isExampleRelevant({ path: 'handsontable/src/core.ts', status: 'modified' }), false);
});

test('isExampleRelevant: a non-.md sibling file in scope is always relevant, for every status', () => {
  for (const status of ['added', 'modified', 'removed', 'renamed', 'copied']) {
    assert.equal(
      isExampleRelevant({ path: 'docs/content/guides/x/y/javascript/example1.ts', status }),
      true,
      `status=${status}`,
    );
  }
});

test('isExampleRelevant: a rename or copy of a .md file is always relevant, even with identical content', () => {
  assert.equal(isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'renamed' }), true);
  assert.equal(isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'copied' }), true);
});

test('isExampleRelevant: a new .md file is relevant only if it contains an example block', () => {
  const withBlock = '::: example #ex\n@[code](@/content/x.js)\n:::\n';
  const withoutBlock = '# Title\n\nJust prose.\n';

  assert.equal(isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'added', afterText: withBlock }), true);
  assert.equal(isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'added', afterText: withoutBlock }), false);
});

test('isExampleRelevant: added .md with unreadable after-text fails open', () => {
  assert.equal(isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'added', afterText: null }), true);
});

test('isExampleRelevant: a deleted .md file is relevant only if it HAD an example block', () => {
  const withBlock = '::: example #ex\n@[code](@/content/x.js)\n:::\n';
  const withoutBlock = '# Title\n\nJust prose.\n';

  assert.equal(isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'removed', beforeText: withBlock }), true);
  assert.equal(isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'removed', beforeText: withoutBlock }), false);
});

test('isExampleRelevant: modified .md with an edit strictly outside any block is not relevant', () => {
  const before = ['# Title', '', 'Old prose.', '', '::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n');
  const after = ['# Title', '', 'New prose, fixed a typo.', '', '::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n');
  const diffText = [
    '--- a/docs/content/guides/x/y.md',
    '+++ b/docs/content/guides/x/y.md',
    '@@ -3 +3 @@',
    '-Old prose.',
    '+New prose, fixed a typo.',
  ].join('\n');

  assert.equal(
    isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'modified', diffText, beforeText: before, afterText: after }),
    false,
  );
});

test('isExampleRelevant: an edit to an @[code] reference line is relevant', () => {
  const before = ['::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n');
  const after = ['::: example #ex', '@[code](@/content/x.ts)', ':::'].join('\n');
  const diffText = [
    '--- a/docs/content/guides/x/y.md',
    '+++ b/docs/content/guides/x/y.md',
    '@@ -2 +2 @@',
    '-@[code](@/content/x.js)',
    '+@[code](@/content/x.ts)',
  ].join('\n');

  assert.equal(
    isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'modified', diffText, beforeText: before, afterText: after }),
    true,
  );
});

test('isExampleRelevant: an edit to the block\'s fence/header line is relevant', () => {
  const before = ['::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n');
  const after = ['::: example #ex --code-only', '@[code](@/content/x.js)', ':::'].join('\n');
  const diffText = [
    '--- a/docs/content/guides/x/y.md',
    '+++ b/docs/content/guides/x/y.md',
    '@@ -1 +1 @@',
    '-::: example #ex',
    '+::: example #ex --code-only',
  ].join('\n');

  assert.equal(
    isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'modified', diffText, beforeText: before, afterText: after }),
    true,
  );
});

test('isExampleRelevant: deleting an entire example block is relevant, even though the after side has no lines to intersect', () => {
  const before = ['# Title', '', '::: example #ex', '@[code](@/content/x.js)', ':::', '', 'Trailing prose.'].join('\n');
  const after = ['# Title', '', 'Trailing prose.'].join('\n');
  const diffText = [
    '--- a/docs/content/guides/x/y.md',
    '+++ b/docs/content/guides/x/y.md',
    '@@ -3,4 +3,0 @@',
    '-::: example #ex',
    '-@[code](@/content/x.js)',
    '-:::',
    '-',
  ].join('\n');

  assert.equal(
    isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'modified', diffText, beforeText: before, afterText: after }),
    true,
  );
});

test('isExampleRelevant: removing a plain line from inside an otherwise-unchanged block is relevant via the before-side range check, not the cheap marker pre-filter', () => {
  // The removed line carries neither "::: example" nor "@[code]", so
  // EXAMPLE_MARKER_RE does not fire here -- this is the one case that
  // actually forces the code through intersects(removedLines, beforeRanges).
  const before = ['::: example #ex', 'a caption line', '@[code](@/content/x.js)', ':::'].join('\n');
  const after = ['::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n');
  const diffText = [
    '--- a/docs/content/guides/x/y.md',
    '+++ b/docs/content/guides/x/y.md',
    '@@ -2 +1,0 @@',
    '-a caption line',
  ].join('\n');

  assert.doesNotMatch(diffText, /:::\s*example|@\[code\]/m, 'the removed line itself must not carry a marker, or this test proves nothing');
  assert.equal(
    isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'modified', diffText, beforeText: before, afterText: after }),
    true,
  );
});

test('isExampleRelevant: adding a plain line inside an otherwise-unchanged block is relevant via the after-side range check, not the cheap marker pre-filter', () => {
  const before = ['::: example #ex', '@[code](@/content/x.js)', ':::'].join('\n');
  const after = ['::: example #ex', 'a caption line', '@[code](@/content/x.js)', ':::'].join('\n');
  const diffText = [
    '--- a/docs/content/guides/x/y.md',
    '+++ b/docs/content/guides/x/y.md',
    '@@ -1,0 +2 @@',
    '+a caption line',
  ].join('\n');

  assert.doesNotMatch(diffText, /:::\s*example|@\[code\]/m, 'the added line itself must not carry a marker, or this test proves nothing');
  assert.equal(
    isExampleRelevant({ path: 'docs/content/guides/x/y.md', status: 'modified', diffText, beforeText: before, afterText: after }),
    true,
  );
});

test('isExampleRelevant: a renamed .md file is relevant even when the new path has moved outside the scoped directories', () => {
  // git's pathspec match on a rename/copy can fire on the OLD path; the new
  // path (what `path` holds) may no longer match docs/content/guides|recipes.
  // That move is itself a reason to sync, not a reason to fall through to the
  // scope filter and read "not relevant".
  assert.equal(isExampleRelevant({ path: 'docs/other/y.md', status: 'renamed' }), true);
});

test('isExampleRelevant: modified .md with a missing before/after blob fails open', () => {
  assert.equal(
    isExampleRelevant({
      path: 'docs/content/guides/x/y.md', status: 'modified', diffText: '', beforeText: null, afterText: 'anything',
    }),
    true,
  );
});
