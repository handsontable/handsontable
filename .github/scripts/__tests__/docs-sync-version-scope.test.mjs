import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAboveReleased, versionScopedAbove } from '../lib/docs-sync/version-scope.mjs';

const released = { major: 18, minor: 1, patch: 0 };
const migration = (from, to) => `docs/content/guides/upgrade-and-migration/migrating-from-${from}-to-${to}/migrating-from-${from}-to-${to}.md`;
const changelog = (n) => `docs/content/guides/upgrade-and-migration/changelog-${n}/changelog-${n}.md`;

test('a migration guide into a later minor is above the release', () => {
  assert.equal(isAboveReleased(migration('18.1', '18.2'), released), true);
  assert.equal(isAboveReleased(migration('18.0', '18.1'), released), false);
  assert.equal(isAboveReleased(migration('17.1', '18.0'), released), false);
});

test('a changelog page for a later major is above the release', () => {
  assert.equal(isAboveReleased(changelog(19), released), true);
  assert.equal(isAboveReleased(changelog(18), released), false);
  assert.equal(isAboveReleased(changelog(17), released), false);
});

test('ordinary pages are never version-scoped', () => {
  assert.equal(isAboveReleased('docs/content/guides/rows/row-height/row-height.md', released), false);
  assert.equal(isAboveReleased('docs/content/guides/upgrade-and-migration/changelog/changelog.md', released), false);
});

test('versionScopedAbove keeps only the offending files', () => {
  const files = [migration('18.1', '18.2'), changelog(18), 'docs/content/guides/a.md'];

  assert.deepEqual(versionScopedAbove(files, released), [migration('18.1', '18.2')]);
});
