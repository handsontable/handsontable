import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// The fixture decides whether a scrollbar-clearance band is pinned open by the pointer with the
// engine's own proximity, copied as a literal because a Playwright fixture cannot import the
// TypeScript source. A mirrored number is pinned with a test in this repo (esTarget.unit.js is the
// precedent): an engine change that moved the constant would otherwise silently flip the fixture's
// pinned-vs-stuck verdict.
const root = path.join(import.meta.dirname, '../../..');
const read = rel => readFileSync(path.join(root, rel), 'utf8');

test('the fixture mirrors OVERLAY_SCROLLBAR_PROXIMITY from walkontable', () => {
  const engine = read('handsontable/src/3rdparty/walkontable/src/overlay/constants.ts')
    .match(/export const OVERLAY_SCROLLBAR_PROXIMITY = (\d+);/);
  const fixture = read('visual-tests/src/test-runner.ts').match(/const SCROLLBAR_PROXIMITY = (\d+);/);

  assert.ok(engine, 'OVERLAY_SCROLLBAR_PROXIMITY is no longer a plain integer literal in constants.ts');
  assert.ok(fixture, 'SCROLLBAR_PROXIMITY is no longer a plain integer literal in test-runner.ts');
  assert.equal(fixture[1], engine[1], 'visual-tests/src/test-runner.ts mirrors the engine constant by hand; update it');
});

test('the fixture gives an unpinned band at least the engine fade delay before judging it', () => {
  const fade = read('handsontable/src/3rdparty/walkontable/src/overlay/constants.ts')
    .match(/export const OVERLAY_SCROLLBAR_FADE_DELAY = (\d+);/);
  const allowance = read('visual-tests/src/test-runner.ts').match(/const FADE_ALLOWANCE = (\d+);/);

  assert.ok(fade && allowance);
  assert.ok(Number(allowance[1]) > Number(fade[1]),
    'FADE_ALLOWANCE must exceed OVERLAY_SCROLLBAR_FADE_DELAY, or a healthy band is judged before it can close');
});
