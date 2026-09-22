import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The gate's safety properties -- that a skip costs nothing and that a bug in
// the gate step fails OPEN (dispatches), not closed (silently drops a real
// example sync) -- are shapes in the YAML that no unit test of the script
// itself can see. Pinned here the way docs-sync-workflow.test.mjs pins
// docs-sync.yml's own safety properties.
const source = readFileSync(path.join(repoRoot(), '.github/workflows/docs-examples-sync.yml'), 'utf8');

test('grants read-only repo access for the checkout and diff, nothing more', () => {
  assert.match(source, /^permissions:\n\s+contents: read$/m);
});

test('checks out full history, sparse and blobless, without persisting credentials', () => {
  assert.match(source, /uses: actions\/checkout@[0-9a-f]{40}/);
  assert.match(source, /fetch-depth: 0/);
  assert.match(source, /filter: blob:none/);
  assert.match(source, /sparse-checkout: \|\s*\n\s*docs\/content\/guides\s*\n\s*docs\/content\/recipes/);
  assert.match(source, /persist-credentials: false/);
});

test('the sparse checkout includes .github, or the gate step has no script to run', () => {
  // Cone-mode sparse-checkout only materializes the directories listed (plus
  // top-level files); omitting .github here would make `node
  // .github/scripts/docs-examples-gate.mjs` fail before its own try/catch
  // runs, which -- through the later steps' implicit success() -- would
  // silently skip the dispatch instead of running it.
  const sparseCheckoutBlock = source.match(/sparse-checkout: \|\n([\s\S]*?)\n\s*persist-credentials:/)?.[1] ?? '';

  assert.match(sparseCheckoutBlock, /^\s*\.github\s*$/m);
});

test('the gate step runs before the token mint, reading before/after SHAs', () => {
  const gateIndex = source.indexOf('id: gate');
  const mintIndex = source.indexOf('name: Mint GitHub App token');

  assert.ok(gateIndex > 0 && mintIndex > 0 && gateIndex < mintIndex, 'gate step must precede the token mint');
  assert.match(source, /run: node \.github\/scripts\/docs-examples-gate\.mjs/);
  assert.match(source, /BEFORE_SHA: \$\{\{ github\.event\.before \}\}/);
  assert.match(source, /AFTER_SHA: \$\{\{ github\.event\.after \}\}/);
});

test('the mint and dispatch steps are gated on needs_sync with fail-open polarity', () => {
  // `!= 'false'` (not `== 'true'`): an unset/missing output from a future bug
  // in the gate step is not the string "false", so both steps still proceed.
  const guardCount = (source.match(/if: steps\.gate\.outputs\.needs_sync != 'false'/g) ?? []).length;

  assert.equal(guardCount, 2, 'both the mint and dispatch steps must carry the fail-open guard');
  assert.doesNotMatch(source, /needs_sync == 'true'/);
});

test('step order is validate branch, checkout, gate, mint, dispatch', () => {
  // Validate first so an invalid manual-dispatch ref fails fast without
  // paying for the checkout that follows.
  const order = ['Validate docs branch', 'Checkout docs content', 'id: gate', 'Mint GitHub App token', 'Send repository_dispatch to handsontable/examples'];
  const positions = order.map((marker) => source.indexOf(marker));

  assert.ok(positions.every((p) => p > -1), 'every expected step marker must be present');
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), 'steps must appear in this order');
});
