import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compareMinor, parseVersion, pickTarget, syncBranchFor,
} from '../lib/docs-sync/target.mjs';

test('the highest prod-docs/X.Y wins, by number not by string', () => {
  const names = ['prod-docs/9.0', 'prod-docs/18.0', 'prod-docs/18.1', 'prod-docs/latest', 'develop', 'prod-docs/17.1'];

  assert.equal(pickTarget(names), 'prod-docs/18.1');
});

test('no prod-docs branch gives null', () => {
  assert.equal(pickTarget(['develop', 'prod-docs/latest']), null);
});

test('parseVersion reads a semver string and rejects garbage', () => {
  assert.deepEqual(parseVersion('18.1.0'), { major: 18, minor: 1, patch: 0 });
  assert.deepEqual(parseVersion('18.1.0-rc3'), { major: 18, minor: 1, patch: 0 });
  assert.throws(() => parseVersion('next'), /Unparseable version/);
});

test('compareMinor ignores the patch', () => {
  assert.equal(compareMinor({ major: 18, minor: 2 }, { major: 18, minor: 1, patch: 4 }), 1);
  assert.equal(compareMinor({ major: 18, minor: 1 }, { major: 18, minor: 1, patch: 4 }), 0);
  assert.equal(compareMinor({ major: 17, minor: 9 }, { major: 18, minor: 0 }), -1);
});

test('the sync branch name flattens the slash', () => {
  assert.equal(syncBranchFor('prod-docs/18.1'), 'docs-sync/prod-docs-18.1');
});
