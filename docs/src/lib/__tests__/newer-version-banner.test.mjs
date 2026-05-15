import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldShowNewerVersionBanner } from '../newer-version-banner.mjs';

test('no banner when current minor is ahead of production latest (RC preview)', () => {
  assert.equal(shouldShowNewerVersionBanner('17.2', '17.1'), false);
});

test('banner when current minor is behind production latest', () => {
  assert.equal(shouldShowNewerVersionBanner('17.0', '17.1'), true);
});

test('no banner when minors match', () => {
  assert.equal(shouldShowNewerVersionBanner('17.1', '17.1'), false);
});

test('no banner when current is empty', () => {
  assert.equal(shouldShowNewerVersionBanner('', '17.1'), false);
});

test('no banner when latest is empty', () => {
  assert.equal(shouldShowNewerVersionBanner('17.1', ''), false);
});

test('no banner for next', () => {
  assert.equal(shouldShowNewerVersionBanner('next', '17.1'), false);
  assert.equal(shouldShowNewerVersionBanner('17.1', 'next'), false);
});

test('banner for several-minor gap', () => {
  assert.equal(shouldShowNewerVersionBanner('16.0', '18.0'), true);
});
