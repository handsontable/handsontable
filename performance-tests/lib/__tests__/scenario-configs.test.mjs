// Pins the scenario configs against what the docs and the teardown assume about them.
//
// The config `name` must match its directory (the teardown resolves `output/<name>/` back to
// `scenarios/<name>/scenario.config.mjs` to read `measurementVersion`), every scenario declares a
// numeric `measurementVersion`, and the iteration counts the skill and the README quote are the ones
// in force -- a fifth scenario at five iterations, or a count changed in one place, fails here rather
// than drifting the prose.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = join(import.meta.dirname, '..', '..');
const SCENARIOS_DIR = join(ROOT, 'scenarios');
const SKILL_DOC = join(ROOT, '..', '.claude', 'skills', 'performance-testing', 'SKILL.md');
const README = join(ROOT, 'README.md');

// The short-window scenarios that run five iterations; everything else runs three.
const FIVE_ITERATIONS = ['filtering', 'initial-load', 'sorting', 'source-data-validator-load'];

/**
 * @returns {Promise<Array<{ dir: string, config: object }>>}
 */
async function loadConfigs() {
  const dirs = (await readdir(SCENARIOS_DIR, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  return Promise.all(dirs.map(async(dir) => {
    const { default: config } = await import(
      pathToFileURL(join(SCENARIOS_DIR, dir, 'scenario.config.mjs')).href
    );

    return { dir, config };
  }));
}

describe('scenario configs', () => {
  test('every config names its own directory and declares a numeric measurementVersion', async() => {
    const configs = await loadConfigs();

    assert.ok(configs.length >= 9);

    for (const { dir, config } of configs) {
      assert.equal(config.name, dir, `${dir}/scenario.config.mjs names "${config.name}"`);
      assert.equal(typeof config.measurementVersion, 'number', `${dir} declares measurementVersion`);
      assert.ok(Number.isInteger(config.measurementVersion) && config.measurementVersion >= 1, dir);
    }
  });

  test('the four short-window scenarios run five iterations and the rest run three', async() => {
    const configs = await loadConfigs();

    for (const { dir, config } of configs) {
      const expected = FIVE_ITERATIONS.includes(dir) ? 5 : 3;

      assert.equal(config.iterations, expected, `${dir} runs ${expected} iterations`);
      assert.equal(config.warmupRuns, 1, `${dir} runs one warmup`);
    }
  });

  test('the docs name exactly the five-iteration scenarios', async() => {
    for (const path of [SKILL_DOC, README]) {
      const text = await readFile(path, 'utf8');
      const sentence = text.split('\n').find(line => /run \*\*5\*\*|Iterations: 3 for/.test(line));

      assert.ok(sentence, `${path} states the iteration counts`);

      // Only the clause that lists the five-iteration scenarios: the skill sentence also names the
      // three-iteration ones ("3 for the scroll and cell-editing scenarios, 5 for ..."), and the
      // README lists the four in the parentheses right before "run **5**".
      const fiveMarker = sentence.includes('Iterations: 3 for') ? '5 for ' : 'run **5**';
      const markerAt = sentence.indexOf(fiveMarker);
      const fiveClause = fiveMarker === '5 for '
        ? sentence.slice(markerAt, sentence.indexOf('.', markerAt))
        : sentence.slice(sentence.lastIndexOf('(', markerAt), markerAt);

      for (const name of FIVE_ITERATIONS) {
        assert.ok(fiveClause.includes(name), `${path} lists ${name} among the five-iteration scenarios`);
      }

      // No other scenario is claimed to run five.
      const configs = await loadConfigs();

      for (const { dir } of configs) {
        if (!FIVE_ITERATIONS.includes(dir)) {
          assert.ok(!fiveClause.includes(dir), `${path} does not list ${dir} among the five-iteration scenarios`);
        }
      }
    }
  });
});
