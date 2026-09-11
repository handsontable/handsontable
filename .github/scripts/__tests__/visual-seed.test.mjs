import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The golden seed for develop moved out of develop.yml because that run's
// `cancel-in-progress` kept cancelling it and left every open pull request
// comparing against a stale baseline (DEV-2797). Two ways that regresses without
// anything going red: someone adds a `visual:` job back to develop.yml (the seed
// then renders twice and inherits the cancellation again), or someone "tidies"
// the seed's concurrency to cancel in progress like every other orchestrator.
//
// Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the
// repo root.

const root = repoRoot();
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const seed = read('.github/workflows/visual-seed.yml');
const develop = read('.github/workflows/develop.yml');

/**
 * The jobs a workflow declares, by the two-space indent that starts each one.
 *
 * @param {string} source The workflow file's contents.
 * @returns {string[]} Job ids in order.
 */
function jobIds(source) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);

  return [...jobsBlock.matchAll(/^ {2}([A-Za-z0-9_-]+):$/gm)].map(([, id]) => id);
}

test('develop.yml no longer renders the visual seed itself', () => {
  assert.ok(!jobIds(develop).includes('visual'), 'develop.yml has a `visual:` job again — the seed would render '
    + 'twice per push and the cancelled-run lag would be back');
  assert.doesNotMatch(develop, /uses: \.\/\.github\/workflows\/visual\.yml/,
    'develop.yml calls visual.yml; the seed belongs to visual-seed.yml');
});

test('the seed runs on every develop push and by hand, never on an ordinary pull request', () => {
  assert.match(seed, /^on:\n  push:\n    branches: \[ develop \]/m, 'the seed must trigger on a develop push');
  assert.match(seed, /^\s+workflow_dispatch:/m, 'the seed must be re-runnable by hand for a poisoned baseline');
  // The self-validation trigger that develop.yml also carries, and the skip that
  // keeps it from seeding from a pull request.
  assert.match(seed, /pull_request:\n\s+paths: \[ '\.github\/workflows\/visual-seed\.yml' \]/);
  assert.match(seed, /if: github\.event_name != 'pull_request'/);
});

test('the seed never cancels an in-flight run', () => {
  assert.match(seed, /concurrency:\n(?:\s+#.*\n)*\s+group: visual-seed-\$\{\{ github\.ref \}\}\n\s+cancel-in-progress: false/,
    'the seed group must keep a static prefix and cancel-in-progress: false — that is the whole reason it exists');
  assert.doesNotMatch(seed, /\$\{\{ github\.workflow \}\}/);
});

test('the seed calls the shared visual module with the secrets it needs', () => {
  assert.match(seed, /uses: \.\/\.github\/workflows\/visual\.yml\n\s+secrets: inherit/);
  // Parity with develop.yml: no caller-level permissions block, or the nested
  // grant in visual.yml would be validated against a second ceiling.
  assert.doesNotMatch(seed, /^permissions:/m, 'visual-seed.yml must not declare a permissions block');
  assert.deepEqual(jobIds(seed), ['visual']);
});
