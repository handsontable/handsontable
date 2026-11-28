import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prereleaseTag } from '../rc-prerelease-tag.mjs';

const release = (tagName, isPrerelease = true) => ({ tagName, isPrerelease });

test('finds the pre-release when it sits on the previous RC tag', () => {
  const releases = [release('18.1.3', false), release('19.0.0-rc4'), release('18.1.2', false)];

  assert.equal(prereleaseTag(releases, '19.0.0'), '19.0.0-rc4');
});

test('finds the pre-release two RCs back, after a run that tagged an RC and never moved it', () => {
  const releases = [release('19.0.0-rc4')];

  assert.equal(prereleaseTag(releases, '19.0.0'), '19.0.0-rc4', 'rc5 was tagged, the release stayed on rc4, and rc6 must still find it');
});

test('finds the pre-release that the first RC left on the unnumbered tag', () => {
  assert.equal(prereleaseTag([release('19.0.0-rc')], '19.0.0'), '19.0.0-rc');
});

test('takes the highest RC when a version has more than one pre-release', () => {
  const releases = [release('19.0.0-rc9'), release('19.0.0-rc10'), release('19.0.0-rc2')];

  assert.equal(prereleaseTag(releases, '19.0.0'), '19.0.0-rc10');
});

test('ignores a stable release and the pre-releases of other versions', () => {
  const releases = [release('19.0.0', false), release('19.0.1-rc1'), release('9.0.0-rc3'), release('119.0.0-rc1')];

  assert.equal(prereleaseTag(releases, '19.0.0'), null);
});

test('reads the dots of the version as dots', () => {
  assert.equal(prereleaseTag([release('19x0y0-rc1')], '19.0.0'), null);
});

test('returns null for an empty list', () => {
  assert.equal(prereleaseTag([], '19.0.0'), null);
});
