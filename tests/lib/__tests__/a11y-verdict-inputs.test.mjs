import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditLedgerInput, verdictInputs } from '../a11y-verdict-inputs.mjs';

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

const LEDGER = {
  latest: { reader: { runId: '100', seenAt: '2026-11-17T13:35:31Z' } },
  nights: [{ source: 'reader', runId: '100', coverage: { checks: {}, axe: null, reader: [], golden: [] } }],
  rows: [{ source: 'reader', key: 'reader|nvda-chromium|token-missing|||grid-core||||arrow-right', status: 'persisting', firstRun: '90', lastRun: '100', gaps: 0,
    seenSinceGap: 2 }],
};
const STEP = { scenario: 'grid-core', step: 'arrow-right', kind: 'token-missing' };

test('an audit reads the findings ledger, from a saved file or the published URL, and a change run never does', async() => {
  const root = mkdtempSync(path.join(tmpdir(), 'a11y-audit-ledger-'));
  const asked = [];
  const fetchJson = async(url) => {
    asked.push(url);

    return LEDGER;
  };

  try {
    writeFileSync(path.join(root, 'a11y.json'), JSON.stringify(LEDGER));

    const fromFile = await auditLedgerInput({ env: { A11Y_LEDGER_FILE: path.join(root, 'a11y.json'), GITHUB_RUN_ID: '200' }, scope: 'audit', source: 'reader', fetchJson });

    assert.equal(fromFile.classify('nvda-chromium', STEP).ledger, 'known');
    assert.equal(fromFile.classify('nvda-chromium', { ...STEP, step: 'open-editor' }).ledger, 'unmeasured', 'the night did not read grid-core whole');
    assert.deepEqual([fromFile.auditAt, fromFile.auditRun], ['2026-11-17T13:35:31Z', '100']);
    assert.deepEqual(asked, [], 'a saved file is read instead of the URL');

    const fromUrl = await auditLedgerInput({ env: {}, scope: 'audit', source: 'reader', fetchJson });

    assert.equal(fromUrl.classify('nvda-chromium', STEP).ledger, 'known');
    assert.deepEqual(asked, ['https://handsontable.github.io/handsontable/test-health/a11y.json']);
    await auditLedgerInput({ env: { A11Y_LEDGER_URL: 'https://example.test/a11y.json' }, scope: 'audit', source: 'reader', fetchJson });
    assert.equal(asked.at(-1), 'https://example.test/a11y.json');
    assert.equal(await auditLedgerInput({ env: {}, scope: 'change', source: 'reader', fetchJson }), undefined);
    assert.equal(asked.length, 2, 'a change run reads no ledger');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a ledger that does not load is a problem the check runs state, never a classifier that reads everything as known', async() => {
  const refused = await auditLedgerInput({ env: {}, scope: 'audit', source: 'reader', fetchJson: async() => { throw new Error('HTTP 503'); } });

  assert.equal(refused.classify, undefined);
  assert.match(refused.problem, /^the findings ledger did not load from https:\/\/handsontable\.github\.io\/handsontable\/test-health\/a11y\.json \(HTTP 503\)$/);

  const shapeless = await auditLedgerInput({ env: {}, scope: 'audit', source: 'reader', fetchJson: async() => ({ rows: 'x' }) });

  assert.match(shapeless.problem, /the ledger has no rows list/);
});
