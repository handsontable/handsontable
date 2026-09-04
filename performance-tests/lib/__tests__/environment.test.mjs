// Unit tests for run provenance and the baseline compatibility key.
//
// The defect this guards: a Playwright bump changed the Chromium every scenario ran in, three
// scenarios shifted by 18-49% on develop in one push, and the median-of-5 baseline carried the old
// browser's numbers into five days of pull-request comments. Nothing recorded which browser had
// produced a golden, so nothing could refuse the comparison. These cases pin that the key is built
// from the two fields that redefine a measurement (Chromium build, harness version), that a golden
// without them is excluded by their absence, and that the mismatch is explained in words a reader
// can act on.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  baselineKey,
  collectEnvironment,
  currentKey,
  describeKey,
  describeKeyMismatch,
  formatEnvironment,
  isCompatibleBaseline,
  isCompleteKey,
  readEnvironment,
  writeEnvironment,
} from '../environment.mjs';
import { HARNESS_VERSION } from '../trace-runner.mjs';

describe('collectEnvironment', () => {
  test('records the Chromium build it is given and the machine it runs on', () => {
    const env = collectEnvironment({ chromium: '140.0.7339.16', env: {} });

    assert.equal(env.chromium, '140.0.7339.16');
    assert.equal(typeof env.cpuCount, 'number');
    assert.ok(env.cpuCount > 0);
    assert.ok(env.memoryGiB > 0);
    assert.match(env.platform, /^\w+ \w+$/);
    assert.equal(env.runnerImage, null, 'no runner image outside GitHub-hosted runners');
  });

  test('joins the GitHub runner image variables when both are present', () => {
    const env = collectEnvironment({
      chromium: 'x', env: { ImageOS: 'ubuntu24', ImageVersion: '20260901.1.0' },
    });

    assert.equal(env.runnerImage, 'ubuntu24 20260901.1.0');
  });

  test('keeps whichever runner image variable is present when only one is', () => {
    assert.equal(collectEnvironment({ chromium: 'x', env: { ImageOS: 'ubuntu24' } }).runnerImage, 'ubuntu24');
    assert.equal(
      collectEnvironment({ chromium: 'x', env: { ImageVersion: '20260901.1.0' } }).runnerImage,
      '20260901.1.0'
    );
  });

  test('an unknown Chromium is null, never an empty string that would equal another empty string', () => {
    assert.equal(collectEnvironment({ chromium: '', env: {} }).chromium, null);
    assert.equal(collectEnvironment({ chromium: undefined, env: {} }).chromium, null);
  });
});

describe('writeEnvironment / readEnvironment', () => {
  test('round-trips through output/environment.json and reads null when absent', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'perf-env-'));

    try {
      assert.equal(await readEnvironment(dir), null);

      await writeEnvironment(dir, { chromium: '1.2.3', cpuModel: 'Test CPU' });

      assert.deepEqual(await readEnvironment(dir), { chromium: '1.2.3', cpuModel: 'Test CPU' });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('baselineKey / isCompleteKey / currentKey', () => {
  test('extracts the two fields that redefine a measurement, and nothing else', () => {
    const key = baselineKey({
      harnessVersion: 2,
      environment: { chromium: '140.0.1', cpuModel: 'AMD EPYC 7763', runnerImage: 'ubuntu24 1' },
    });

    assert.deepEqual(key, { chromium: '140.0.1', harnessVersion: 2 });
  });

  test('a golden recorded before provenance existed has an incomplete key', () => {
    const key = baselineKey({ timestamp: '2026-08-27T06:32:14.000Z', scenarios: {} });

    assert.deepEqual(key, { chromium: null, harnessVersion: null });
    assert.equal(isCompleteKey(key), false);
  });

  test('a harness version that is not a number is treated as absent', () => {
    assert.equal(baselineKey({ harnessVersion: '1', environment: { chromium: 'x' } }).harnessVersion, null);
  });

  test('the current key carries the runner constant and the recorded Chromium', () => {
    assert.deepEqual(currentKey({ chromium: '140.0.1' }), { chromium: '140.0.1', harnessVersion: HARNESS_VERSION });
    assert.deepEqual(currentKey(null), { chromium: null, harnessVersion: HARNESS_VERSION });
  });
});

describe('isCompatibleBaseline', () => {
  const key = { chromium: '140.0.7339.16', harnessVersion: 1 };
  const golden = (environment, harnessVersion) => ({ environment, harnessVersion });

  test('accepts a golden with the same Chromium and harness version', () => {
    assert.equal(isCompatibleBaseline(golden({ chromium: '140.0.7339.16' }, 1), key), true);
  });

  test('a different CPU or runner image does not disqualify a golden -- speed is noise, not redefinition', () => {
    const differentMachine = golden(
      { chromium: '140.0.7339.16', cpuModel: 'Intel Xeon 8370C', runnerImage: 'ubuntu24 20260801.1.0' }, 1
    );

    assert.equal(isCompatibleBaseline(differentMachine, key), true);
  });

  test('rejects a golden from another Chromium build', () => {
    assert.equal(isCompatibleBaseline(golden({ chromium: '138.0.7204.23' }, 1), key), false);
  });

  test('rejects a golden from another harness version', () => {
    assert.equal(isCompatibleBaseline(golden({ chromium: '140.0.7339.16' }, 2), key), false);
  });

  test('rejects a golden with no provenance at all, by the absence of the fields', () => {
    assert.equal(isCompatibleBaseline({ timestamp: 'x', scenarios: {} }, key), false);
  });

  test('rejects everything when the current run has no Chromium recorded, rather than matching null to null', () => {
    const unknownCurrent = { chromium: null, harnessVersion: 1 };

    assert.equal(isCompatibleBaseline(golden({ chromium: null }, 1), unknownCurrent), false);
  });
});

describe('describeKey / describeKeyMismatch / formatEnvironment', () => {
  test('names the browser and harness', () => {
    assert.equal(describeKey({ chromium: '140.0.1', harnessVersion: 1 }), 'Chromium 140.0.1, harness 1');
    assert.equal(
      describeKey({ chromium: null, harnessVersion: null }), 'Chromium unknown Chromium, harness unversioned'
    );
  });

  test('the mismatch names only what differs, old -> new, and says when deltas resume', () => {
    const text = describeKeyMismatch(
      { chromium: '140.0.1', harnessVersion: 1 }, { chromium: '138.0.1', harnessVersion: 1 }
    );

    assert.ok(text.includes('Chromium 138.0.1 -> 140.0.1'));
    assert.ok(!text.includes('harness'), 'the harness did not change, so it is not named');
    assert.ok(text.includes('two develop pushes'));
  });

  test('a golden without provenance reads as unknown -> current on both fields', () => {
    const text = describeKeyMismatch(
      { chromium: '140.0.1', harnessVersion: 1 }, { chromium: null, harnessVersion: null }
    );

    assert.ok(text.includes('Chromium unknown -> 140.0.1'));
    assert.ok(text.includes('harness unversioned -> 1'));
  });

  test('formats the environment for a footer and omits what is unknown', () => {
    assert.equal(
      formatEnvironment({ chromium: '140.0.1', cpuModel: 'AMD EPYC 7763', cpuCount: 4, runnerImage: 'ubuntu24 1' }),
      'Chromium 140.0.1 · AMD EPYC 7763 ×4 · ubuntu24 1'
    );
    assert.equal(formatEnvironment({ chromium: '140.0.1' }), 'Chromium 140.0.1');
    assert.equal(formatEnvironment(null), '');
  });
});
