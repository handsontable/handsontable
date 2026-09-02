import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// `postbuild:partial` regenerates the `exports` map from the tree that was just
// built and fails when a rule matches no file. The map names the type
// declarations, so any job that composes a tree from individual build tasks and
// then runs the check has to build the types too -- otherwise it fails on eight
// missing `.d.ts`/`.d.mts` files, none of which it mentions building.
//
// This is the "partial build inherits a red gate with no test to warn it" case
// the root AGENTS.md already warns about in prose. The warning was not enough:
// `visual.yml`'s artifact-fallback path shipped without the types tasks on
// 2026-08-20 (#13210) and stayed latent until the first pull request that
// changed `visual-tests/**` without touching `handsontable/**`, because only
// then is the `Build` job skipped and the fallback actually taken.
//
// Asserted per job, not per step: `visual.yml` legitimately splits the work,
// building types with the ES+CJS group and running the check after the UMD one.

const root = repoRoot();
const WORKFLOWS = path.join(root, '.github/workflows');

/**
 * Split a workflow into its jobs, by the two-space indent that starts each one.
 *
 * Text-based rather than YAML-parsed, matching `fork-guards.test.mjs`: no YAML
 * parser is a dependency of the repo root.
 *
 * @param {string} source The workflow file's contents.
 * @returns {Array<{name: string, body: string}>} One entry per job.
 */
function jobsOf(source) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);

  return jobsBlock
    .split(/^ {2}(?=[A-Za-z0-9_-]+:$)/m)
    .filter(block => block.trim())
    .map(block => ({ name: block.split(':')[0].trim(), body: block }));
}

test('every job that runs postbuild:partial also builds the type declarations', () => {
  const checked = [];

  for (const file of readdirSync(WORKFLOWS).filter(name => name.endsWith('.yml'))) {
    const source = readFileSync(path.join(WORKFLOWS, file), 'utf8');

    for (const job of jobsOf(source)) {
      if (!job.body.includes('postbuild:partial')) {
        continue;
      }

      checked.push(`${file}:${job.name}`);

      assert.ok(
        job.body.includes('build:types'),
        `${file} job \`${job.name}\` runs postbuild:partial without build:types, so the exports `
          + 'map will point at .d.ts files nothing emitted'
      );
      assert.ok(
        job.body.includes('downlevel:types'),
        `${file} job \`${job.name}\` runs postbuild:partial without downlevel:types, so the `
          + '.d.mts half of every exports rule is missing'
      );
    }
  }

  // A rename that made the scan match nothing would otherwise pass silently.
  assert.ok(checked.length >= 2, `expected at least two partial-packaging jobs, found ${checked}`);
});
