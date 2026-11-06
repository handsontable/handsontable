import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verdictInputs } from '../a11y-verdict-inputs.mjs';

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('the scope follows the event, and the run id is the external id the run verdict reads', () => {
  assert.equal(verdictInputs({ env: { GITHUB_EVENT_NAME: 'schedule', GITHUB_RUN_ID: '42' }, testsRoot: TESTS_ROOT }).scope, 'audit');
  assert.equal(verdictInputs({ env: { GITHUB_EVENT_NAME: 'workflow_dispatch' }, testsRoot: TESTS_ROOT }).scope, 'audit');
  assert.equal(verdictInputs({ env: { GITHUB_EVENT_NAME: 'pull_request' }, testsRoot: TESTS_ROOT }).scope, 'change');
  assert.equal(verdictInputs({ env: {}, testsRoot: TESTS_ROOT }).scope, 'change');
  assert.equal(verdictInputs({ env: { GITHUB_RUN_ID: '42' }, testsRoot: TESTS_ROOT }).externalId, '42');
  assert.equal(verdictInputs({ env: {}, testsRoot: TESTS_ROOT }).externalId, undefined);
});

test('the committed catalog loads, so a pull request can read tracked debt as a warning', () => {
  const inputs = verdictInputs({ env: {}, testsRoot: TESTS_ROOT });

  assert.deepEqual(inputs.notes, []);
  assert.equal(inputs.tracked('checks', 'tree-snapshots', { kind: 'headers-after-data', criteria: ['1.3.2'], page: 'grid', theme: 'main', step: 'the grid in reading order' }), true,
    'the overlay clones\' split tree has a tracker in the committed catalog');
  assert.equal(inputs.tracked('checks', 'tree-snapshots', { kind: 'no-such-kind', criteria: ['1.3.2'], page: 'grid', theme: 'main', step: 'x' }), false,
    'a finding no cluster matches lands in needs-triage, which has no tracker');
});

test('a catalog that does not load tracks nothing and says so: a broken catalog can turn a check red, never green', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'a11y-verdict-inputs-'));

  try {
    mkdirSync(path.join(root, 'a11y'));
    writeFileSync(path.join(root, 'a11y/issues.json'), '{ not json');

    const inputs = verdictInputs({ env: {}, testsRoot: root });

    assert.equal(inputs.tracked('checks', 'keyboard-walker', { kind: 'focus-lost', criteria: [], page: 'grid', theme: 'main', step: 'Tab 1' }), false);
    assert.match(inputs.notes[0], /^tests\/a11y\/issues\.json did not load, so no finding is read as tracked: /);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
