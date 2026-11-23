import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  A11Y_AXE_ARTIFACT, A11Y_AXE_FILE, A11Y_AXE_SCHEMA, A11Y_EVIDENCE_ARTIFACT, DOCS_AXE_ARTIFACT, DOCS_CHECKS_ARTIFACT, READER_ARTIFACT_PREFIX,
  READER_TRANSCRIPTS_DIR, READER_TRANSCRIPT_SCHEMA, WEBSITE_AXE_ARTIFACT, WEBSITE_CHECKS_ARTIFACT, findingKey, nightMeasured, readA11yArtifacts,
} from '../lib/a11y-ledger.mjs';
import { EVIDENCE_CHECKS, EVIDENCE_SCHEMA } from '../../../tests/lib/a11y-evidence.mjs';
import { READER_GOLDEN_DIFFERS, READER_TOKEN_MISSING, READER_TRAVERSAL_OFF, READER_TRAVERSAL_WHERE } from '../../../tests/lib/a11y-issues.mjs';
import { NIGHT_OF_SOURCE, ledgerIndex, ledgerKey, ledgerMeasured } from '../../../tests/lib/a11y-pr-ledger.mjs';
import { siteChecks } from '../../../tests/lib/a11y-site-checks.mjs';
import { DEFAULT_DOCS_BASE_URL } from '../../../tests/a11y/docs/constants.mjs';
import { DEFAULT_WEBSITE_BASE_URL } from '../../../tests/a11y/website/constants.mjs';

// tests/AGENTS.md, "A11y: the checks beyond axe" and "A11y: the verdict of a check run": a pull request's short suite
// and every check run of an audit read the findings ledger, and a finding is known when its ledger row is open. They read
// the row by `ledgerKey()` in tests/lib, which cannot import the ledger module (it reaches tests/a11y, and the verdict
// jobs check out tests/lib alone). So the two keys are held together here, for every row source the ledger writes: every
// finding below, read by the collector the way a night is read, has the key `ledgerKey()` gives it as its check run holds
// it. A finding the two key apart would read as new on every pull request and every audit, and turn the audit red.

const FINDINGS = [
  { kind: 'focus-not-returned', criteria: ['2.4.3'], severity: 'serious', step: 'Escape on the editor state', page: 'autocomplete-editor',
    theme: 'main', state: 'editor', reason: 'r' },
  { kind: 'focus-lost', criteria: ['2.4.3'], severity: 'serious', selector: 'input.ht-multi-select-editor-search-input', step: 'Tab 1',
    page: 'multiselect-editor', theme: 'main', state: 'editor', reason: 'r' },
  { kind: 'focus-indicator-contrast', criteria: ['1.4.11'], severity: 'serious', selector: 'td.ht-formula-ref-fill-ht_3f7319f5810a6f01-2  >  span',
    page: 'formula-builder', theme: 'horizon', state: 'formula-builder', variant: 'dark', reason: 'r' },
  { kind: 'axe-violation', rule: 'aria-required-parent', cause: 'aria-required-parent:fail', criteria: ['1.3.1'], severity: 'critical',
    selector: '#ht_0123456789abcdef td.htSeparator[role="menuitem"]:nth-child(3)', page: 'context-menu', theme: 'main', state: 'context-menu', reason: 'r' },
  { kind: 'shortcut-does-nothing', criteria: ['2.1.1'], severity: 'serious', step: `Ctrl+Shift+\\   with   ${'a long setup step, '.repeat(20)}`,
    page: 'grid', theme: 'main', reason: 'r' },
  { kind: 'controls-overlap', criteria: ['1.4.10'], severity: 'serious', selector: `button.${'x'.repeat(320)}`, page: 'pagination', theme: 'classic',
    variant: 'reflow-320', reason: 'r' },
];
// The axe scans' comparison items: what `A11y / axe report` (and the site scans' check runs) count on an audit.
const SCAN_ITEMS = [
  { page: 'context-menu', theme: 'main', rule: 'aria-required-parent', target: '#ht_0123456789abcdef td.htSeparator[role="menuitem"]:nth-child(3)', impact: 'critical' },
  { page: 'grid', theme: 'horizon', rule: 'color-contrast', target: `div.  ${'y'.repeat(320)}`, impact: 'serious' },
  { page: 'dialog', theme: 'classic', rule: 'aria-allowed-attr', target: 'td.htSubmenu[role="menuitem"]', impact: null },
];

/**
 * The rows the collector reads from a run's files.
 *
 * @param {Array<{artifact: string, path: string, doc: object}>} files The files.
 * @returns {object[]} The night's findings.
 */
function rowsOf(files) {
  const read = readA11yArtifacts(files.map(({ artifact, path, doc }) => ({ artifact, path, text: JSON.stringify(doc) })));

  assert.deepEqual(read.notes, [], 'the collector read every file');

  return read.nights.flatMap(night => night.findings);
}

/**
 * An evidence document of a check holding the findings, as the reporter writes it.
 *
 * @param {string} check The check id.
 * @param {object} registry The checks' registry (`EVIDENCE_CHECKS`, or a site's).
 * @param {object[]} findings The findings.
 * @param {string|null} [baseUrl] The deploy a site check read.
 * @returns {object} The document.
 */
function evidenceDoc(check, registry, findings, baseUrl = null) {
  const items = findings.map(item => ({ state: 'none', variant: null, url: `/tests/fixtures/demo/${item.page}.html`, ...item }));
  const targets = [...new Map(items.map(item => [`${item.page}|${item.theme}|${item.variant ?? ''}`, item])).values()]
    .map(item => ({ page: item.page, theme: item.theme, state: item.state, variant: item.variant, status: 'measured', criteria: ['2.4.3'] }));

  return {
    schema: EVIDENCE_SCHEMA,
    check,
    title: registry[check].title,
    mode: 'report',
    triage: false,
    criteria: registry[check].criteria,
    run: { commit: '4813c183892bbbadd52b3c0d79b811bd6aacd7f1', ref: 'develop', runUrl: 'https://github.com/o/r/actions/runs/1', ...(baseUrl ? { baseUrl } : {}) },
    targets,
    findings: items.map((item, index) => ({ ...item, id: `${check}|${index}` })),
    problems: [],
    summary: { targets: targets.length, measured: targets.length, errors: 0, flaky: 0, findings: items.length, bySeverity: {}, byKind: {}, byCriterion: {} },
  };
}

/**
 * An axe scan's findings document (`a11y-findings.json`) holding the items: the first as a baselined location, the
 * rest as new findings, which the ledger reads from two lists.
 *
 * @param {object[]} items The comparison items.
 * @param {string|null} [baseUrl] The deploy a site scan read.
 * @returns {object} The document.
 */
function axeDoc(items, baseUrl = null) {
  const [known, ...fresh] = items;

  return {
    schema: A11Y_AXE_SCHEMA,
    ...(baseUrl ? { baseUrl } : {}),
    counts: { unverified: 0 },
    problems: [],
    issues: [{ id: 'menu-roles', title: 'Menu items', wcag: ['1.3.1'], locations: [{ ...known, nodes: 2 }] }],
    needsAction: fresh.map(item => ({ ...item, status: 'new', wcag: ['1.4.3'], help: 'h', nodes: 1 })),
  };
}

test('ledgerKey gives a check\'s finding the key the findings ledger gives its row', () => {
  for (const check of ['keyboard-walker', 'focus-contrast']) {
    const doc = evidenceDoc(check, EVIDENCE_CHECKS, FINDINGS);
    const rows = rowsOf([{ artifact: A11Y_EVIDENCE_ARTIFACT, path: `${check}.json`, doc }]);

    assert.equal(rows.length, FINDINGS.length, `the collector read every finding of ${check}`);
    assert.deepEqual(doc.findings.map(item => ledgerKey('checks', check, item)), rows.map(row => findingKey(row)),
      `${check}: tests/lib/a11y-pr-ledger.mjs keys a finding as findingKey() of .github/scripts/lib/a11y-ledger.mjs does`);
  }
});

test('ledgerKey gives a site check\'s finding the key the ledger gives its row, under the site\'s row source', () => {
  for (const [site, artifact, baseUrl] of [['docs', DOCS_CHECKS_ARTIFACT, DEFAULT_DOCS_BASE_URL], ['website', WEBSITE_CHECKS_ARTIFACT, DEFAULT_WEBSITE_BASE_URL]]) {
    const check = `${site}-keyboard`;
    const findings = FINDINGS.map(item => ({ ...item, page: `${site}-${item.page}`, theme: 'light' }));
    const doc = evidenceDoc(check, siteChecks(site), findings, baseUrl);
    const rows = rowsOf([{ artifact, path: `${check}.json`, doc }]);

    assert.equal(rows.length, findings.length, `the collector read every finding of ${check}`);
    assert.deepEqual(doc.findings.map(item => ledgerKey(`${site}-checks`, check, item)), rows.map(row => findingKey(row)), `${check}`);
  }
});

test('ledgerKey gives an axe scan\'s comparison item the key the ledger gives its row, for the product scan and both sites', () => {
  for (const [source, artifact, baseUrl] of [['axe', A11Y_AXE_ARTIFACT, null], ['docs', DOCS_AXE_ARTIFACT, DEFAULT_DOCS_BASE_URL],
    ['website', WEBSITE_AXE_ARTIFACT, DEFAULT_WEBSITE_BASE_URL]]) {
    const rows = rowsOf([{ artifact, path: A11Y_AXE_FILE, doc: axeDoc(SCAN_ITEMS, baseUrl) }]);

    assert.equal(rows.length, SCAN_ITEMS.length, `the collector read every location of the ${source} scan`);
    // The check run passes the scan's own check, but the key takes the scan's check from the source, as the ledger does.
    assert.deepEqual(SCAN_ITEMS.map(item => ledgerKey(source, 'any', item)), rows.map(row => findingKey(row)), `the ${source} scan`);
  }
});

test('ledgerKey gives a screen reader step, a reading traversal and a golden difference the key the ledger gives their rows', () => {
  const project = 'nvda-chromium';
  const transcript = {
    schema: READER_TRANSCRIPT_SCHEMA,
    project,
    scenario: 'grid-core',
    steps: [
      { id: 'arrow-right', tokens: { passed: false, groups: [{ synonyms: ['column'], matched: null, severity: 'moderate' }] } },
      { id: 'open-editor', tokens: { passed: true, groups: [{ synonyms: ['edit'], matched: 'edit' }] } },
      { id: 'reselect-cell', tokens: { passed: false, groups: [{ synonyms: ['selected'], matched: null }] } },
    ],
    traversal: { passed: false, items: [{ item: 'A1', count: 2 }], outOfOrder: [] },
    golden: { status: 'differs', differences: [{ id: 'open-editor', expected: 'edit A1', actual: 'edit' }] },
  };
  const rows = rowsOf([{ artifact: `${READER_ARTIFACT_PREFIX}${project}-keyboard`, path: `${READER_TRANSCRIPTS_DIR}/grid-core.json`, doc: transcript }]);
  const items = [
    { scenario: 'grid-core', step: 'arrow-right', kind: READER_TOKEN_MISSING },
    { scenario: 'grid-core', step: 'reselect-cell', kind: READER_TOKEN_MISSING },
    { scenario: 'grid-core', step: READER_TRAVERSAL_WHERE, kind: READER_TRAVERSAL_OFF },
    { scenario: 'grid-core', step: 'open-editor', kind: READER_GOLDEN_DIFFERS },
  ];

  assert.deepEqual(items.map(item => ledgerKey('reader', project, item)).sort(), rows.map(row => findingKey(row)).sort());
});

test('ledgerKey gives every shape of a real audit\'s findings the key of its real ledger row, for every row source', () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/a11y-audit-keys.json', import.meta.url), 'utf8'));

  assert.deepEqual([...new Set(fixture.findings.map(entry => entry.source))].sort(), Object.keys(NIGHT_OF_SOURCE).sort(),
    'the fixture holds a real finding of every row source');
  for (const { source, check, shape, finding, key } of fixture.findings) {
    assert.equal(ledgerKey(source, check, finding), key, `${source} ${check}, ${shape}`);
  }
  assert.throws(() => ledgerKey('nope', 'x', {}), /"nope" is not a row source of the findings ledger/);
});

test('ledgerMeasured reads a night\'s coverage as the ledger\'s nightMeasured() does, for every row source', () => {
  const docs = [
    { artifact: A11Y_EVIDENCE_ARTIFACT, path: 'keyboard-walker.json', doc: evidenceDoc('keyboard-walker', EVIDENCE_CHECKS, FINDINGS) },
    { artifact: A11Y_AXE_ARTIFACT, path: A11Y_AXE_FILE, doc: axeDoc(SCAN_ITEMS) },
  ];
  const rows = rowsOf(docs);
  const items = [
    ...docs[0].doc.findings.map(item => ({ source: 'checks', check: 'keyboard-walker', item })),
    ...SCAN_ITEMS.map(item => ({ source: 'axe', check: 'axe', item })),
  ];
  const reader = [
    { source: 'reader', check: 'nvda-chromium', item: { scenario: 'grid-core', step: 'arrow-right', kind: READER_TOKEN_MISSING } },
    { source: 'reader', check: 'vo-webkit', item: { scenario: 'grid-core', step: 'arrow-right', kind: READER_TOKEN_MISSING } },
    { source: 'reader', check: 'nvda-chromium', item: { scenario: 'grid-core', step: 'open-editor', kind: READER_GOLDEN_DIFFERS } },
  ];
  const readerRows = reader.map(({ check, item }) => ({ source: 'reader', check, kind: item.kind, page: item.scenario, theme: null, variant: null }));
  const coverages = [
    { checks: { 'keyboard-walker': ['autocomplete-editor|main|', 'formula-builder|horizon|dark'] }, axe: true, reader: ['nvda-chromium|grid-core'], golden: [] },
    { checks: {}, axe: false, reader: [], golden: ['nvda-chromium|grid-core'] },
    { checks: { 'keyboard-walker': ['grid|main|', 'pagination|classic|reflow-320'] }, axe: null, reader: ['vo-webkit|grid-core'], golden: [] },
  ];

  for (const coverage of coverages) {
    const index = { coverage };
    const night = { coverage };

    assert.deepEqual([...items, ...reader].map(({ source, check, item }) => ledgerMeasured(index, source, check, item)),
      [...rows, ...readerRows].map(row => nightMeasured(night, row)), JSON.stringify(coverage));
  }
  assert.equal(ledgerMeasured({ coverage: null }, 'checks', 'keyboard-walker', FINDINGS[0]), null, 'a night without coverage does not say');
  assert.equal(nightMeasured({}, rows[0]), null);
});

test('ledgerIndex reads the latest night of the source\'s own audit: its time, its run and its coverage', () => {
  const coverage = { checks: {}, axe: true, reader: ['nvda-chromium|grid-core'], golden: [] };
  const ledger = {
    latest: { a11y: { runId: '1', seenAt: '2026-11-17T12:09:26Z' }, reader: { runId: '2', seenAt: '2026-11-17T13:35:31Z' } },
    nights: [{ source: 'reader', runId: '2', coverage }, { source: 'reader', runId: '0' }, { source: 'a11y', runId: '1', coverage: { axe: false } }],
    rows: [{ source: 'reader', key: 'k', status: 'resolved', firstRun: '0', lastRun: '0', gaps: 1, seenSinceGap: 0 }],
  };
  const index = ledgerIndex(ledger, 'reader');

  assert.deepEqual([index.auditAt, index.auditRun, index.coverage], ['2026-11-17T13:35:31Z', '2', coverage]);
  assert.deepEqual(index.rows.get('k'), { status: 'resolved', firstRun: '0', lastRun: '0', gaps: 1, seenSinceGap: 0 });
  assert.deepEqual([ledgerIndex(ledger, 'axe').auditRun, ledgerIndex(ledger, 'axe').coverage], ['1', { axe: false }]);
  assert.deepEqual([ledgerIndex(ledger, 'docs').auditRun, ledgerIndex(ledger, 'docs').coverage], [null, null], 'a source with no night has no audit');
});
