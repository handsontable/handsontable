// Unit tests for setting up the confirm re-run of the failing scenarios.
//
// The re-run's teardown reads every `output/<name>/iteration-*.json`, so the setup has to move each
// re-run scenario's first traces out of that path (or the teardown would average them in), keep them
// for the artifact, and keep the first verdict, which the teardown merges with the re-run's.

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareConfirmPass, scenarioSpecPath } from '../confirm-pass.mjs';
import { GATE_FIRST_PASS_DIR, GATE_FIRST_PASS_FILE, GATE_VERDICT_FILE } from '../gate.mjs';

const PERF_ROOT = join(import.meta.dirname, '..', '..');

let output;

/**
 * @param {string[]} failing -- scenario names
 * @returns {Promise<void>} a verdict and a traced directory per scenario, in a fresh output/
 */
async function seed(failing, scenarios = ['sorting', 'filtering', 'scroll-down']) {
  for (const name of scenarios) {
    await mkdir(join(output, name), { recursive: true });
    await writeFile(join(output, name, 'iteration-1.json'), `{"first":"${name}"}`);
  }

  await writeFile(join(output, GATE_VERDICT_FILE), JSON.stringify({
    status: failing.length > 0 ? 'fail' : 'pass',
    failing: failing.map(name => ({ name })),
  }));
}

beforeEach(async() => {
  output = await mkdtemp(join(tmpdir(), 'perf-confirm-'));
});

afterEach(async() => {
  await rm(output, { recursive: true, force: true });
});

describe('scenarioSpecPath', () => {
  test('is the scenario\'s own spec file, which exists for every scenario', async() => {
    assert.equal(scenarioSpecPath('sorting'), 'scenarios/sorting/sorting.spec.ts');

    const { readdir } = await import('node:fs/promises');

    for (const name of await readdir(join(PERF_ROOT, 'scenarios'))) {
      assert.ok(existsSync(join(PERF_ROOT, scenarioSpecPath(name))), `${name} has no ${scenarioSpecPath(name)}`);
    }
  });

  test('refuses anything but a kebab-case name, since the path reaches a shell', () => {
    for (const bad of ['', 'Sorting', '../sorting', 'sorting; rm -rf /', 'a b', 'sorting-']) {
      assert.throws(() => scenarioSpecPath(bad), /Not a scenario name/, bad);
    }
  });
});

describe('prepareConfirmPass', () => {
  test('moves each failing scenario\'s first traces aside and returns its spec file', async() => {
    await seed(['sorting', 'scroll-down']);

    const files = await prepareConfirmPass(output);

    assert.deepEqual(files, ['scenarios/sorting/sorting.spec.ts', 'scenarios/scroll-down/scroll-down.spec.ts']);

    for (const name of ['sorting', 'scroll-down']) {
      assert.equal(existsSync(join(output, name)), false, `${name}'s first traces must leave output/${name}/`);
      assert.equal(
        await readFile(join(output, GATE_FIRST_PASS_DIR, name, 'iteration-1.json'), 'utf8'), `{"first":"${name}"}`
      );
    }

    assert.ok(existsSync(join(output, 'filtering', 'iteration-1.json')), 'a passing scenario stays where it is');
  });

  test('keeps the first verdict, and leaves it in place for a re-run that dies early', async() => {
    await seed(['sorting']);

    const before = await readFile(join(output, GATE_VERDICT_FILE), 'utf8');

    await prepareConfirmPass(output);

    assert.equal(await readFile(join(output, GATE_FIRST_PASS_FILE), 'utf8'), before);
    assert.equal(await readFile(join(output, GATE_VERDICT_FILE), 'utf8'), before);
  });

  test('does nothing when nothing failed, when too much failed, or without a verdict', async() => {
    await seed([]);
    assert.deepEqual(await prepareConfirmPass(output), []);

    await seed(['sorting', 'filtering', 'scroll-down', 'scroll-up', 'undo-sort'],
      ['sorting', 'filtering', 'scroll-down', 'scroll-up', 'undo-sort']);
    assert.deepEqual(await prepareConfirmPass(output), []);

    await rm(join(output, GATE_VERDICT_FILE));
    assert.deepEqual(await prepareConfirmPass(output), []);

    assert.equal(existsSync(join(output, GATE_FIRST_PASS_DIR)), false);
    assert.equal(existsSync(join(output, GATE_FIRST_PASS_FILE)), false);
  });

  test('replaces a first pass a previous local run left behind', async() => {
    await mkdir(join(output, GATE_FIRST_PASS_DIR, 'sorting'), { recursive: true });
    await writeFile(join(output, GATE_FIRST_PASS_DIR, 'sorting', 'iteration-9.json'), '{}');
    await seed(['sorting']);

    await prepareConfirmPass(output);

    assert.equal(existsSync(join(output, GATE_FIRST_PASS_DIR, 'sorting', 'iteration-9.json')), false);
    assert.ok(existsSync(join(output, GATE_FIRST_PASS_DIR, 'sorting', 'iteration-1.json')));
  });
});
