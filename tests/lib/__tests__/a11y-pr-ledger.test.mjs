import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVIDENCE_CHECKS, EVIDENCE_SCHEMA, buildEvidenceCheckRun, ledgerSectionOf } from '../a11y-evidence.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ledgerClass, ledgerIndex, ledgerKey, pagesTouched, prLedgerOf, sharedSourceFolders } from '../a11y-pr-ledger.mjs';

// tests/AGENTS.md, "A11y: the checks beyond axe": a pull request runs the short suite, and the findings ledger tells its
// new findings from the known ones. Known findings do not count, so the pages' standing debt never turns a pull
// request red; a regression and a new finding count, a new one on a page the pull request did not change as a warning
// at most. The ledger's own key is held to this one in .github/scripts/__tests__/a11y-pr-ledger.test.mjs.

const WALK = { kind: 'focus-lost', criteria: ['2.4.3'], severity: 'serious', selector: 'td.current', step: 'Tab 1', page: 'grid', theme: 'main',
  state: 'none', variant: null, reason: 'Tab from inside the grid left no element focused' };
const finding = overrides => ({ ...WALK, ...overrides });
const rowOf = (item, status) => ({ source: 'checks', key: ledgerKey('checks', 'keyboard-walker', item), status });
const LEDGER = {
  latest: { a11y: { runId: '44077688383', seenAt: '2026-11-17T12:09:26Z' } },
  rows: [
    rowOf(finding({ page: 'grid' }), 'persisting'),
    rowOf(finding({ page: 'shared-demo' }), 'new'),
    rowOf(finding({ page: 'complex-demo' }), 'flapping'),
    rowOf(finding({ page: 'dialog' }), 'resolved'),
    { ...rowOf(finding({ page: 'context-menu' }), 'persisting'), source: 'docs-checks' },
    { source: 'checks', status: 'persisting' },
  ],
};

test('ledgerKey masks the selector and joins it with the step, as the ledger keys a row', () => {
  assert.equal(ledgerKey('checks', 'keyboard-walker', WALK), 'checks|keyboard-walker|focus-lost|||grid|main|none||td @ Tab 1',
    'the state class `current` is masked, as the baseline masks it');
  assert.equal(ledgerKey('checks', 'axe-discovery', { kind: 'axe-violation', rule: 'region', cause: 'c', page: 'grid', theme: 'main', variant: 'dark',
    selector: '#ht_0123456789abcdef div.wtHolder:nth-child(2)' }), 'checks|axe-discovery|axe-violation|region|c|grid|main||dark|#ht_* div.wtHolder:nth-child(n)');
  assert.equal(ledgerKey('checks', 'pointer', { kind: 'k', page: 'grid', theme: 'main', step: '  a\n  b  ' }), 'checks|pointer|k|||grid|main|||a b');
  assert.equal(ledgerKey('checks', 'pointer', { kind: 'k', page: 'grid', theme: 'main', step: 'x'.repeat(400) }).split('|').at(-1), `${'x'.repeat(299)}…`);
});

test('a finding whose ledger row is open is known, a resolved one is a regression, and one with no row is new', () => {
  const index = ledgerIndex(LEDGER);
  const classOf = page => ledgerClass(index, 'checks', 'keyboard-walker', finding({ page }));

  assert.deepEqual(['grid', 'shared-demo', 'complex-demo', 'dialog', 'context-menu', 'pagination'].map(classOf),
    ['known', 'known', 'known', 'regression', 'new', 'new'], 'only the checks source counts: the docs site\'s row of a page is not the product\'s');
  assert.equal(ledgerClass(index, 'checks', 'reflow', finding()), 'new', 'the check is part of the key');
  assert.equal(index.auditAt, '2026-11-17T12:09:26Z');
  assert.throws(() => ledgerIndex({ rows: 'x' }), /the ledger has no rows list/);
});

const COVERAGE = {
  pages: [{ id: 'grid', fixture: 'grid.html' }, { id: 'dialog', fixture: 'dialog-states.html' }, { id: 'comments', fixture: 'grid.html' },
    { id: 'pagination', fixture: 'pagination.html' }],
  plugins: { dialog: { pages: ['dialog'] }, comments: { pages: ['comments'] }, autoRowSize: { none: 'measures' } },
  editors: { textEditor: { pages: ['grid'] } },
};

test('pagesTouched maps a pull request\'s files to the catalog pages they reach', () => {
  assert.deepEqual([...pagesTouched(['handsontable/src/plugins/dialog/dialog.ts', 'docs/content/x.md'], COVERAGE)], ['dialog']);
  assert.deepEqual([...pagesTouched(['handsontable/src/editors/textEditor/textEditor.ts'], COVERAGE)], ['grid'], 'an editor no other editor extends');
  assert.deepEqual([...pagesTouched(['tests/fixtures/demo/grid.html'], COVERAGE)].sort(), ['comments', 'grid'], 'every page of the fixture');
  assert.deepEqual([...pagesTouched(['tests/fixtures/demo/unlisted.html'], COVERAGE)], [], 'a fixture no catalog page loads');
  assert.deepEqual([...pagesTouched(['.github/workflows/a11y.yml', 'wrappers/react-wrapper/src/x.tsx'], COVERAGE)], []);
});

test('pagesTouched fails toward counting: shared code, the checks\' own code and shared fixture files touch every page', () => {
  const shared = { plugins: new Set(['dialog']), editors: new Set(['textEditor']) };
  const all = [
    'handsontable/src/core.ts',
    'handsontable/src/themes/static/main.scss',
    'handsontable/src/plugins/autoRowSize/autoRowSize.ts', // `none`: no pages, but it sizes every grid
    'handsontable/src/plugins/base/base.ts', // no entry: every plugin extends it
    'handsontable/src/editors/baseEditor/baseEditor.ts',
    'handsontable/src/editors/utils/index.ts',
    'tests/a11y/checks/reflow.spec.ts',
    'tests/lib/contrast.mjs',
    'tests/reporters/a11y-checks.ts',
    'tests/support/static-server.mjs',
    'tests/playwright.a11y-checks.config.ts',
    'tests/package.json',
    'tests/fixtures/demo/test-license-key.js',
    'tests/fixtures/licenseTiers.ts',
  ];

  for (const file of all) {
    assert.equal(pagesTouched([file], COVERAGE), 'all', file);
  }
  assert.equal(pagesTouched(['handsontable/src/plugins/dialog/dialog.ts'], { ...COVERAGE, shared }), 'all', 'a plugin another plugin imports');
  assert.equal(pagesTouched(['handsontable/src/editors/textEditor/textEditor.ts'], { ...COVERAGE, shared }), 'all', 'an editor other editors extend');
  assert.deepEqual([...pagesTouched(['handsontable/src/plugins/comments/comments.ts'], { ...COVERAGE, shared })], ['comments']);
});

test('sharedSourceFolders reads from the source tree which plugin and editor folders others of their kind import', () => {
  const shared = sharedSourceFolders(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../handsontable/src'));

  for (const editor of ['baseEditor', 'textEditor', 'handsontableEditor', 'autocompleteEditor', 'utils']) {
    assert.ok(shared.editors.has(editor), `${editor} is extended by another editor`);
  }
  for (const plugin of ['base', 'dropdownMenu', 'filters']) {
    assert.ok(shared.plugins.has(plugin), `${plugin} is imported by another plugin`);
  }
  assert.ok(!shared.editors.has('passwordEditor') && !shared.plugins.has('dialog'), 'a leaf folder is not shared');
});

/**
 * An evidence document of the keyboard walker holding the findings.
 *
 * @param {object[]} findings The findings.
 * @returns {object} The document.
 */
function walkerDoc(findings) {
  const targets = [...new Set(findings.map(item => item.page))].map(page => ({ page, theme: 'main', state: 'none', variant: null, status: 'measured',
    criteria: ['2.4.3'], problems: 0, detail: null }));

  return {
    schema: EVIDENCE_SCHEMA, check: 'keyboard-walker', title: EVIDENCE_CHECKS['keyboard-walker'].title, mode: 'report', triage: false,
    criteria: EVIDENCE_CHECKS['keyboard-walker'].criteria, run: { commit: null, ref: 'refs/pull/1/merge', runUrl: null }, targets,
    findings: findings.map((item, index) => ({ id: `f${index}`, ...item })), problems: [],
    summary: { targets: targets.length, measured: targets.length, errors: 0, flaky: 0, findings: findings.length,
      bySeverity: { serious: findings.length }, byKind: {}, byCriterion: {}, withoutCriterion: 0 },
  };
}

const runOf = (findings, touched = 'all', extra = {}) => buildEvidenceCheckRun({
  doc: walkerDoc(findings), pages: new Map([['grid', 3], ['dialog', 9], ['pagination', 12]]), scope: 'change',
  prLedger: prLedgerOf({ index: ledgerIndex(LEDGER), touched, catalog: new Set(['grid', 'dialog', 'pagination', 'shared-demo']) }), ...extra,
});

test('on a pull request a known finding does not count: the pages\' standing debt leaves the check run green', () => {
  const payload = runOf([finding({ page: 'grid' }), finding({ page: 'shared-demo' })]);

  assert.equal(payload.conclusion, 'success');
  assert.match(payload.title, /^✔ Green: 0 critical, 0 serious, 0 moderate, 0 minor .* · ledger: 0 new, 0 regressions, 2 known · 2 findings/);
  assert.deepEqual(payload.annotations, []);
  assert.match(payload.summary, /only a finding the findings ledger does not hold as open counts \(a new one, or a regression\)/);
  assert.match(payload.summary, /#### New and known, by the findings ledger/);
  assert.match(payload.summary, /as of the audit of 2026-11-17/);
  assert.match(payload.summary, /a class renamed since then makes a known finding read as new/);
});

test('a regression and a new finding count at their severity, listed regressions first, each annotated with its class', () => {
  const payload = runOf([finding({ page: 'pagination' }), finding({ page: 'dialog' }), finding({ page: 'grid' })]);

  assert.equal(payload.conclusion, 'failure');
  assert.match(payload.title, /^✖ Red: 0 critical, 2 serious, .* · ledger: 1 new, 1 regression, 1 known · /);
  assert.deepEqual(payload.annotations.map(item => [item.start_line, item.annotation_level, item.title]),
    [[12, 'failure', 'New: 2.4.3 focus-lost'], [9, 'failure', 'Regression: 2.4.3 focus-lost']]);
  assert.match(payload.summary, /\| 1 \| 1 \| 1 \|/);
  assert.match(payload.summary, /\| Regression \| serious \| dialog \|[^\n]*\n\| New \| serious \| pagination \|/);
});

test('a new finding on a page the pull request did not change is a warning at most, and says so', () => {
  const payload = runOf([finding({ page: 'pagination' })], new Set(['dialog']));

  assert.equal(payload.conclusion, 'neutral');
  assert.equal(payload.annotations[0].annotation_level, 'warning');
  assert.match(payload.annotations[0].message, /\(on a page you did not change\)$/);
  assert.match(payload.summary, /\| New \| serious \| pagination \|[^\n]*\| on a page you did not change \|/);

  const changed = runOf([finding({ page: 'pagination' })], new Set(['pagination']));

  assert.equal(changed.conclusion, 'failure', 'on a page the pull request changed, a new finding counts at its severity');

  const regression = runOf([finding({ page: 'dialog' })], new Set(['pagination']));

  assert.equal(regression.conclusion, 'failure', 'a regression on a page the pull request did not change still counts at its severity');
  assert.doesNotMatch(regression.annotations[0].message, /did not change/);

  const outside = runOf([finding({ page: 'column-resize' })], new Set(['pagination']));

  assert.equal(outside.conclusion, 'failure', 'a page outside the catalog has no known sources, so it is never marked');

  const unread = runOf([finding({ page: 'pagination' })], null);

  assert.equal(unread.conclusion, 'failure', 'without the changed files no page is marked');
  assert.match(unread.summary, /The pull request's changed files were not read/);
});

test('a ledger that did not load leaves every finding counted, with a note, never a green run', () => {
  const payload = buildEvidenceCheckRun({ doc: walkerDoc([finding({ page: 'grid' })]), scope: 'change',
    prLedger: { problem: 'the findings ledger did not load (https://example.test answered 503)' } });

  assert.equal(payload.conclusion, 'failure');
  assert.match(payload.summary, /> Known and new findings were not told apart, so every finding counts: the findings ledger did not load/);
  assert.doesNotMatch(payload.title, /ledger:/);
});

test('without a pull request\'s ledger the check run is what it was, and the job summary\'s section is empty', () => {
  const doc = walkerDoc([finding({ page: 'grid' })]);

  assert.equal(buildEvidenceCheckRun({ doc, scope: 'change' }).conclusion, 'failure');
  assert.equal(ledgerSectionOf(doc, undefined), '');
  assert.match(ledgerSectionOf(doc, prLedgerOf({ index: ledgerIndex(LEDGER), touched: 'all' })), /^#### New and known, by the findings ledger/);
});
