import assert from 'node:assert/strict';
import test from 'node:test';
import { computeVersionsDisplay } from '../versions-menu.mjs';

const docsData = {
  latestVersion: '18.0',
  versionsWithPatches: [
    ['18.0', ['18.0.1', '18.0.0']],
    ['17.1', ['17.1.2', '17.1.1', '17.1.0']],
    ['8.5', ['8.5.0']],
  ],
};

test('current minor behind latest: button shows the minor, not "latest"', () => {
  const { buttonLabel, isLatest, latestVersion } = computeVersionsDisplay(docsData, '17.1');

  assert.equal(buttonLabel, '17.1');
  assert.equal(isLatest, false);
  assert.equal(latestVersion, '18.0');
});

test('current minor matches latest: button shows the latest patch + "latest"', () => {
  const { buttonLabel, isLatest } = computeVersionsDisplay(docsData, '18.0', '18.0.1');

  assert.equal(buttonLabel, '18.0.1 latest');
  assert.equal(isLatest, true);
});

test('"next" (dev) build is always displayed as "dev", never marked latest', () => {
  const { buttonLabel, isLatest } = computeVersionsDisplay(docsData, 'next');

  assert.equal(buttonLabel, 'dev');
  assert.equal(isLatest, false);
});

test('versions with major < 9 are excluded from the dropdown items', () => {
  const { versionItems } = computeVersionsDisplay(docsData, '18.0');

  assert.deepEqual(versionItems.map((item) => item.minor), ['18.0', '17.1']);
});

test('dropdown items carry the current-version marker and handsontable.com href', () => {
  const { versionItems } = computeVersionsDisplay(docsData, '17.1');

  const current = versionItems.find((item) => item.minor === '17.1');
  const other = versionItems.find((item) => item.minor === '18.0');

  assert.equal(current.isCurrent, true);
  assert.equal(current.href, 'https://handsontable.com/docs/17.1');
  assert.equal(other.isCurrent, false);
});

test('null docsData (e.g. fetch failed) falls back to the current minor as latest, no items', () => {
  const { buttonLabel, isLatest, latestVersion, versionItems } = computeVersionsDisplay(null, '17.1');

  assert.equal(latestVersion, '17.1');
  assert.equal(isLatest, true);
  assert.equal(buttonLabel, '17.1 latest');
  assert.deepEqual(versionItems, []);
});

test('falls back to rawVersion when the latest minor has no patch entry', () => {
  const dataWithoutPatches = { latestVersion: '18.0', versionsWithPatches: [['18.0', []]] };
  const { buttonLabel } = computeVersionsDisplay(dataWithoutPatches, '18.0', '18.0.0');

  assert.equal(buttonLabel, '18.0.0 latest');
});
