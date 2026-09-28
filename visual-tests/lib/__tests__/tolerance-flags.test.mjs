import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { toleranceFlags } from '../tolerance-flags.mjs';

// One mapping for every reg-cli call outside `reg-suit run`. The fork comparison and
// the stability matrix both go through it, so they can only ever apply the tolerances
// the same-repo gate applies.

test('maps every tolerance regconfig.json can carry', () => {
  assert.deepEqual(
    toleranceFlags({
      core: { enableAntialias: true, thresholdPixel: 150, thresholdRate: 0.01, matchingThreshold: 0.1 },
    }),
    ['-A', '-S', '150', '-T', '0.01', '-M', '0.1'],
  );
});

test('omits what the config does not set, and tolerates a config without core', () => {
  assert.deepEqual(toleranceFlags({ core: { thresholdPixel: 0 } }), ['-S', '0']);
  assert.deepEqual(toleranceFlags({}), []);
  assert.deepEqual(toleranceFlags(undefined), []);
});

test('the checked-in regconfig.json sets the three knobs the gate relies on', () => {
  // `matchingThreshold` is the one reg-suit defaults to 0 when absent, which is how
  // a 152-pixel antialiasing difference tripped a 150-pixel gate (DEV-2797). The
  // value itself is a measured trade-off documented in visual-tests/AGENTS.md; this
  // pins that it is set at all and stays below the level that hides a focus ring.
  const config = JSON.parse(readFileSync(path.join(import.meta.dirname, '../../regconfig.json'), 'utf8'));

  assert.equal(config.core.enableAntialias, true);
  assert.equal(typeof config.core.thresholdPixel, 'number');
  assert.ok(config.core.matchingThreshold > 0 && config.core.matchingThreshold < 0.2,
    'matchingThreshold must be set, above 0 and below 0.2 (0.2 hid a focus-ring change in measurement)');
  assert.deepEqual(
    toleranceFlags(config),
    ['-A', '-S', String(config.core.thresholdPixel), '-M', String(config.core.matchingThreshold)],
  );
});
