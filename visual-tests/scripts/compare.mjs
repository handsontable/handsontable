/**
 * Runs the comparison as `sync-expected → prune → compare → publish`, refusing to overwrite golden
 * records from a local run.
 *
 * The three reg-suit subcommands are what its `run` command does, with one step of our own between
 * the fetch and the diff: the fetched `.reg/expected` tree is pruned to the tier's prefixes
 * (`lib/visual-tiers.mjs`). reg-suit reports every expected file with no actual counterpart as a
 * deleted item, so the pr tier's subset render compared against the whole `base/<branch>` would
 * report about 1178 phantom deletions on every pull request; pruned first, the comparison is an
 * exact subset comparison and `visual-gate.mjs` reads it unchanged. `compare` copies `screenshots/`
 * into `.reg/actual` (reg-suit-core `processor.js`), so the workflow's
 * `aws s3 sync ./visual-tests/.reg/actual` still finds the render, and `publish` uploads the `.reg`
 * tree as before. The prune runs in every tier: in `seed` and `full` the prefixes cover every known
 * variant, so it removes nothing unless a stale variant lingers in R2 — and then it logs what went.
 *
 * The deleted `upload.mjs` threw when a reference-branch upload was attempted
 * outside CI. reg-suit has no equivalent: a developer holding R2
 * credentials for debugging, with `REG_ACTUAL_KEY` pointing at a `base/` key,
 * would silently replace the baseline every pull request is compared against.
 *
 * Usage: node visual-tests/scripts/compare.mjs
 */

import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { pruneExpected } from '../lib/visual-tiers.mjs';
import { getTier } from './utils/utils.mjs';

const ROOT = join(import.meta.dirname, '..');

// Nothing else loads it: dotenv is not a dependency and both Playwright configs
// have their `require('dotenv').config()` commented out. The README tells people
// to put their R2 credentials here, so honour that rather than silently running
// with the keys unset.
const envFile = join(ROOT, '.env');

try {
  // Node's own `--env-file` semantics: existing environment wins, quoting and
  // `export` prefixes handled. Nothing else loads this file -- dotenv is not a
  // dependency and both Playwright configs have their loader commented out.
  process.loadEnvFile(envFile);
} catch {
  // Absent or unreadable .env is the normal case in CI.
}

/**
 * Runs one reg-suit subcommand and resolves with its exit code.
 *
 * @param {string} subcommand `sync-expected`, `compare` or `publish`.
 * @returns {Promise<number>} The exit code; 1 when the child was killed by a signal.
 */
function regSuit(subcommand) {
  return new Promise((resolve) => {
    spawn('npx', ['--no', 'reg-suit', subcommand], {
      // reg-suit resolves regconfig.json by walking up from cwd to the nearest
      // package.json. Unpinned, running this file from the repo root finds the
      // monorepo manifest, loads no config, and compares nothing while exiting 0.
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }).on('close', (exitCode) => {
      // `close` passes null when the child was killed by a signal (OOM,
      // cancellation). Treating that as success would report a green comparison
      // that never finished.
      resolve(exitCode ?? 1);
    });
  });
}

const actualKey = process.env.REG_ACTUAL_KEY ?? '';
const expectedKey = process.env.REG_EXPECTED_KEY ?? '';

if (!actualKey || !expectedKey) {
  // reg-suit expands an unset `${REG_ACTUAL_KEY}` to the literal string
  // "undefined", which slips past the `base/` guard below and publishes the
  // whole tree to `s3://<bucket>/undefined/`. Fail before spawning instead.
  console.error('REG_EXPECTED_KEY and REG_ACTUAL_KEY must both be set.');
  console.error('reg-suit expands an unset key to the literal string "undefined" and publishes there.');
  process.exitCode = 1;
} else if (process.env.CI !== 'true' && actualKey.startsWith('base/')) {
  console.error(`Refusing to publish to "${actualKey}" outside CI.`);
  console.error('Keys under `base/` are the golden records every pull request is compared against;');
  console.error('only a CI build of that branch may write them. Use a `local/...` key to experiment.');
  process.exitCode = 1;
} else {
  // Resolved before the first spawn: an unknown VISUAL_TIER or wrapper is a
  // configuration error, and it should not cost a fetch of 1646 golden records first.
  const tier = getTier();
  let exitCode = await regSuit('sync-expected');

  if (exitCode === 0) {
    const { kept, pruned, prunedDirs } = pruneExpected(join(ROOT, '.reg', 'expected'), tier.prefixes);

    console.log(`Tier "${tier.name}": kept ${kept} golden records, pruned ${pruned} outside the tier`
      + `${pruned > 0 ? ` (${prunedDirs.join(', ')})` : ''}.`);

    if (kept === 0 && pruned > 0) {
      // The goldens exist, so this is not the bootstrap path (an absent baseline
      // fetches nothing and prunes nothing) — but none of them is a variant this
      // tier renders. Every tier renders `main` and `main-dark`, so no tier can
      // seed such a baseline: it is an older golden layout, or one left
      // half-written by a killed seed. Comparing would report every rendered
      // record as new, a `changed` verdict that reads like a real change.
      // compare-fork.mjs refuses the same shape.
      console.error(`Tier "${tier.name}": the golden records under "${expectedKey}" hold none of this tier's `
        + `variants (${tier.prefixes.join(', ')}).`);
      console.error('That is an older golden layout or a half-written baseline, not a subset; a seed-tier build '
        + 'of the base branch has to replace it before this tier can be compared.');
      exitCode = 1;
    } else {
      exitCode = await regSuit('compare');
    }
  }

  if (exitCode === 0) {
    exitCode = await regSuit('publish');
  }

  process.exitCode = exitCode;
}
