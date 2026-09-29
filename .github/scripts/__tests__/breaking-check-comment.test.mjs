import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MARKER, renderCleared, renderComment, shouldComment,
} from '../lib/breaking-check/comment.mjs';

const result = (overrides = {}) => ({
  removedNames: [{ name: 'forRoot', kind: 'method', file: 'wrappers/angular-wrapper/x.ts', line: '', publicScore: 0.21 }],
  defaultsTouched: false,
  defaultsEvidence: null,
  declared: { breakingEntry: false, removedRegistryTouched: false, deprecationWarnAdded: false },
  flagged: true,
  jevUsed: true,
  candidateCount: 1,
  sentToJev: 1,
  ...overrides,
});

test('the marker is the HTML comment the sticky comment is found by', () => {
  assert.equal(MARKER, '<!-- breaking-check -->');
});

test('shouldComment needs a flag and no declared breaking entry', () => {
  assert.equal(shouldComment(result()), true);
  assert.equal(shouldComment(result({ flagged: false })), false);
  assert.equal(shouldComment(result({ declared: { breakingEntry: true } })), false);
});

test('the comment is advisory, lists the name with kind and file but no raw score, and states its scope', () => {
  const text = renderComment(result());

  assert.match(text, /^### Possible breaking change/);
  assert.match(text, /does not block/);
  assert.match(text, /can be wrong/);
  assert.match(text, /`forRoot` \(method\) in `wrappers\/angular-wrapper\/x\.ts`$/m);
  assert.doesNotMatch(text, /0\.21|Jev score/);
  assert.match(text, /"breaking": true/);
  assert.match(text, /\.ai\/BREAKING-CHANGES\.md/);
  assert.match(text, /does not check behavior, DOM structure, or CSS property or value changes/);
  assert.match(text, /no comment is not an all-clear/);
  assert.match(text, /1 in 7/);
  assert.doesNotMatch(text, /\u2014/);
});

test('a code-only result marks the name as not checked by Jev, and a default change shows its evidence', () => {
  const text = renderComment(result({
    removedNames: [{ name: 'x', kind: 'option', file: 'f.ts', line: '', publicScore: null }],
    defaultsTouched: true,
    defaultsEvidence: '-  undo: true,',
  }));

  assert.match(text, /`x` \(option\) in `f\.ts`, not checked by Jev$/m);
  assert.match(text, /metaSchema.*`- undo: true,`/);
});

test('a defaults-only result has no removed-names section', () => {
  const text = renderComment(result({ removedNames: [], defaultsTouched: true, defaultsEvidence: '-  a: 1,' }));

  assert.doesNotMatch(text, /remove or rename/);
});

test('lists at most 15 names and counts the rest', () => {
  const removedNames = Array.from({ length: 18 }, (_, i) => ({ name: `n${i}`, kind: 'method', file: 'f', line: '', publicScore: null }));
  const text = renderComment(result({ removedNames }));

  assert.match(text, /`n14`/);
  assert.doesNotMatch(text, /`n15`/);
  assert.match(text, /and 3 more/);
});

test('the cleared text names why: a later push, or a declared break', () => {
  assert.match(renderCleared(result()), /A later push no longer triggers the check\./);
  assert.match(
    renderCleared(result({ declared: { breakingEntry: true } })),
    /The changelog entry now declares this breaking change\./,
  );
});

test('text from a diff cannot break out of a code span', () => {
  const text = renderComment(result({
    removedNames: [{ name: 'a`b', kind: 'method', file: 'x``y.ts', line: '', publicScore: null }],
    defaultsTouched: true,
    defaultsEvidence: '-  `tick`: 1,\n  next line',
  }));

  assert.match(text, /- ``a`b`` \(method\) in ```x``y\.ts```/);
  assert.match(text, /appears to change: ``- `tick`: 1, next line``/);
});

test('says how many removed names were not scored', () => {
  assert.match(
    renderComment(result({ unscoredNames: [{ name: 'a' }, { name: 'b' }] })),
    /2 more removed names were not scored\./,
  );
  assert.doesNotMatch(renderComment(result({ unscoredNames: [] })), /not scored/);
});
