import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveExamplesBranch, CURRENT_EXAMPLES_BRANCH } from '../docs-version.mjs';

test('a production build derives the prod-examples branch for its major', () => {
  assert.equal(deriveExamplesBranch('18.0.2', true), 'prod-examples/18');
  assert.equal(deriveExamplesBranch('15.3.0', true), 'prod-examples/15');
  assert.equal(deriveExamplesBranch('19.0.0-beta.1', true), 'prod-examples/19');
});

test('a non-production build always resolves to the examples repo master branch', () => {
  // master, not develop: handsontable/examples has no develop branch.
  assert.equal(deriveExamplesBranch('0.0.0-next-abc1234-20260812', false), 'master');
  assert.equal(deriveExamplesBranch('18.0.2', false), 'master');
});

test('a version with no released major never derives a prod-examples/0 branch', () => {
  // The staging/dev placeholder reaching a production build must not produce a
  // link to prod-examples/0, which does not exist.
  assert.equal(deriveExamplesBranch('0.0.0-next-abc1234-20260812', true), 'master');
  assert.equal(deriveExamplesBranch('next', true), 'master');
  assert.equal(deriveExamplesBranch('', true), 'master');
  assert.equal(deriveExamplesBranch(undefined, true), 'master');
});

test('CURRENT_EXAMPLES_BRANCH resolves to a branch that exists in handsontable/examples', () => {
  assert.match(CURRENT_EXAMPLES_BRANCH, /^(master|prod-examples\/\d+)$/);
  assert.doesNotMatch(CURRENT_EXAMPLES_BRANCH, /prod-examples\/0$/);
});
