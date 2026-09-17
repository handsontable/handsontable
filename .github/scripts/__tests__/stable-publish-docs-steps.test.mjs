import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The two DEV-2925 scripts run inside `stable-publish` AFTER the job checks out
// the prod-docs branch. That branch was cut before these scripts existed, so the
// checkout DELETES them from the working tree -- running them from
// `.github/scripts/` there ENOENTs and blocks the docs push on exactly the patch
// releases the feature targets. The fix: the `Create or update docs production
// branch` step copies them into $RUNNER_TEMP (which survives the branch switch)
// BEFORE the checkout, and both consumers run from that copy. Pin that shape, since
// no fixture test can see the branch switch.

const publishYml = readFileSync(path.join(repoRoot(), '.github/workflows/publish.yml'), 'utf8');

/**
 * The body of a named job's step, from its `- name:` line to the next step.
 *
 * @param {string} name The step name.
 * @returns {string} The step body.
 */
function step(name) {
  const lines = publishYml.split('\n');
  const start = lines.findIndex(line => new RegExp(`^\\s+- name:\\s*${name}\\s*$`).test(line));

  assert.notEqual(start, -1, `publish.yml: no step named "${name}"`);

  let end = lines.length;

  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s+- name:\s/.test(lines[i])) { end = i; break; }
  }

  return lines.slice(start, end).join('\n');
}

const DELTA_SCRIPT = 'sync-release-docs-delta.mjs';
const VERSION_SCRIPT = 'set-package-version.mjs';

test('the docs branch step preserves both scripts in $RUNNER_TEMP before the checkout', () => {
  const body = step('Create or update docs production branch');
  // Anchor to the start of a command line, so a comment that merely mentions
  // `git checkout` does not count as the checkout.
  const copyIndex = body.search(/^\s*cp /m);
  const checkoutIndex = body.search(/^\s*git checkout/m);

  assert.ok(copyIndex !== -1, 'publish.yml: the docs branch step must copy the DEV-2925 scripts before checkout');
  assert.ok(
    checkoutIndex !== -1 && copyIndex < checkoutIndex,
    'publish.yml: the script copy must run BEFORE the branch checkout deletes them'
  );

  const copyLine = body.split('\n').find(line => line.trimStart().startsWith('cp '));

  assert.match(copyLine, new RegExp(`\\.github/scripts/${DELTA_SCRIPT}`));
  assert.match(copyLine, new RegExp(`\\.github/scripts/${VERSION_SCRIPT}`));
  assert.match(copyLine, /"\$RUNNER_TEMP\/"/);
});

test('both scripts are run from $RUNNER_TEMP, never from the prod-docs working tree', () => {
  const delta = step('Sync release docs delta to the docs branch');
  const version = step('Update core version in docs branch');

  assert.match(delta, new RegExp(`node "\\$RUNNER_TEMP/${DELTA_SCRIPT}"`));
  assert.match(version, new RegExp(`node "\\$RUNNER_TEMP/${VERSION_SCRIPT}"`));

  // The failure mode this guards: invoking them from `.github/scripts/`, which the
  // prod-docs checkout has removed.
  assert.doesNotMatch(delta, new RegExp(`node \\.github/scripts/${DELTA_SCRIPT}`));
  assert.doesNotMatch(version, new RegExp(`node \\.github/scripts/${VERSION_SCRIPT}`));
});
