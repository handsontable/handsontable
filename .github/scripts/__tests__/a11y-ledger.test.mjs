import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {
  A11Y_AXE_ARTIFACT,
  A11Y_AXE_FILE,
  A11Y_CAP_BYTES,
  A11Y_EVENTS,
  A11Y_EVIDENCE_ARTIFACT,
  A11Y_FILE_CAP_BYTES,
  A11Y_FLAP_NIGHTS,
  A11Y_LIMITS,
  A11Y_NIGHTLY_WORKFLOW,
  A11Y_RETENTION_DAYS,
  A11Y_TREND_NIGHTS,
  A11Y_TRIAGE_SHOWN,
  A11Y_VERSION,
  READER_ARTIFACT_PREFIX,
  READER_NIGHTLY_WORKFLOW,
  READER_TRANSCRIPTS_DIR,
  a11yView,
  assertA11yVersion,
  classifyA11yArtifact,
  emptyA11yLedger,
  findingKey,
  isA11yRun,
  mergeA11yLedger,
  readA11yArtifacts,
  readerArtifactProject,
  renderA11yLine,
  serializeA11yLedger,
} from '../lib/a11y-ledger.mjs';
import {
  classifyArtifact,
  collectArtifactFiles,
  emptyLedger,
  aggregate,
  renderPage,
  renderStepSummary,
  runContextFromRun,
} from '../lib/test-health.mjs';
import { ISSUES_SCHEMA, TRIAGE_ID, compileIssuesCatalog } from '../../../tests/lib/a11y-issues.mjs';
import { EVIDENCE_CHECKS, EVIDENCE_SCHEMA } from '../../../tests/lib/a11y-evidence.mjs';
import { SCENARIO_GROUPS } from '../../../tests/lib/screenreader-scenario.mjs';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, steps } from '../lib/workflow-text.mjs';

const NOW = new Date('2026-11-03T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const night = offset => new Date(NOW.getTime() + (offset * DAY)).toISOString();

// The A11y nightly on develop: a schedule, never a push, which is why the rule names the workflow and the event.
const NIGHTLY = {
  id: 41584742628,
  run_attempt: 1,
  html_url: 'https://github.com/handsontable/handsontable/actions/runs/41584742628',
  name: A11Y_NIGHTLY_WORKFLOW,
  head_branch: 'develop',
  head_sha: '4813c183892bbbadd52b3c0d79b811bd6aacd7f1',
  event: 'schedule',
  updated_at: '2026-11-03T05:44:30Z',
  conclusion: 'success',
};
const READER_RUN = { ...NIGHTLY, id: 41579067604, name: READER_NIGHTLY_WORKFLOW, updated_at: '2026-11-03T05:20:00Z' };
const PULL_REQUEST = { ...NIGHTLY, id: 41644897455, name: 'Tests', head_branch: 'feature/X-1_Branch', event: 'pull_request' };

const CATALOG = compileIssuesCatalog({
  schema: ISSUES_SCHEMA,
  triageLimit: 0,
  clusters: [
    { id: 'focus-not-returned-after-escape', title: 'The focus is not returned after Escape', tracker: ['DEV-3603', 'DEV-3604'],
      match: [{ source: 'checks', checks: ['keyboard-walker'], kinds: ['focus-not-returned', 'focus-lost'] },
        { source: 'reader', kinds: ['token-missing'], where: ['^close-'] }] },
    { id: 'overlay-clones-split-tree', title: 'The overlay clones split the tree', tracker: 'DEV-3652',
      match: [{ source: 'checks', checks: ['tree-snapshots'], kinds: ['headers-after-data', 'row-exposed-twice'] }] },
    { id: 'menu-semantics', title: 'Menu semantics', tracker: 'DEV-3491',
      match: [{ source: 'axe', axeIssues: ['menu-roles'] }, { source: 'checks', checks: ['axe-discovery'], rules: ['aria-required-parent'] }] },
    { id: 'contrast-and-focus-visibility', title: 'Contrast', tracker: 'DEV-2946',
      match: [{ source: 'checks', checks: ['axe-discovery'], rules: ['color-contrast'] }, { source: 'axe', rules: ['color-contrast'] }] },
  ],
});

/**
 * An evidence document as the checks reporter writes it, trimmed to what the collector reads.
 *
 * @param {string} check The check id.
 * @param {object[]} findings The findings, with their target fields.
 * @param {object[]} [targets] The targets; derived from the findings when absent.
 * @param {object} [extra] Fields to override.
 * @returns {object} The document.
 */
function evidenceDoc(check, findings, targets, extra = {}) {
  const located = findings.map(item => ({ state: 'none', variant: null, url: `/tests/fixtures/demo/${item.page}.html`, ...item }));
  const targetList = targets ?? [...new Map(located.map(item => [`${item.page}|${item.theme}|${item.variant ?? ''}`, item])).values()]
    .map(item => ({ page: item.page, theme: item.theme, state: item.state, variant: item.variant, status: 'measured', criteria: ['2.4.3'] }));

  return {
    schema: EVIDENCE_SCHEMA,
    check,
    title: EVIDENCE_CHECKS[check]?.title ?? check,
    mode: 'report',
    triage: check === 'axe-discovery',
    criteria: EVIDENCE_CHECKS[check]?.criteria ?? [],
    run: { commit: NIGHTLY.head_sha, ref: 'develop', runUrl: NIGHTLY.html_url },
    targets: targetList,
    findings: located.map(item => ({ ...item, id: [check, item.kind, item.page, item.theme, item.selector ?? item.step].join('|') })),
    problems: [],
    summary: { targets: targetList.length, measured: targetList.filter(item => item.status === 'measured').length, errors: 0, flaky: 0,
      findings: located.length, bySeverity: {}, byKind: {}, byCriterion: {} },
    ...extra,
  };
}

const WALKER_FINDINGS = [
  { kind: 'focus-not-returned', criteria: ['2.4.3'], severity: 'serious', step: 'Escape on the editor state',
    measured: { focus: 'grid grid|ht-grid|TEXTAREA#1|', presses: 1 },
    reason: 'After Escape closed the popup, the focus did not come back to the cell it was opened from',
    page: 'autocomplete-editor', theme: 'main', state: 'editor' },
  { kind: 'focus-lost', criteria: ['2.4.3'], severity: 'serious', selector: 'input.ht-multi-select-editor-search-input', step: 'Tab 1',
    reason: 'Tab from inside the grid left no element focused', page: 'multiselect-editor', theme: 'main', state: 'editor' },
  { kind: 'tab-keeps-focus', criteria: ['2.1.1'], severity: 'advisory', selector: 'textarea.handsontableInput[role="combobox"]', step: 'Tab 1',
    reason: 'Tab left the focus on the element it was on', page: 'autocomplete-editor', theme: 'main', state: 'editor' },
];
const TREE_FINDINGS = [
  { kind: 'headers-after-data', criteria: ['1.3.2'], severity: 'moderate', step: 'the grid in reading order',
    reason: 'A screen reader reads the data rows before the column headers', page: 'grid', theme: 'main' },
  { kind: 'headers-after-data', criteria: ['1.3.2'], severity: 'moderate', step: 'the grid in reading order',
    reason: 'A screen reader reads the data rows before the column headers', page: 'grid', theme: 'classic' },
];
const DISCOVERY_FINDINGS = [
  { kind: 'axe-needs-review', rule: 'color-contrast', cause: 'color-contrast:shortTextContent', criteria: ['1.4.3'], severity: 'advisory',
    selector: 'td.ht-formula-ref-fill-ht_3f7319f5810a6f01-2[role="gridcell"]', measured: { nodes: 2, example: '#ht_3f7319f5810a6f01 td' },
    reason: 'Element has insufficient color contrast of 2.9', page: 'formula-builder', theme: 'main', state: 'formula-builder' },
  { kind: 'axe-violation', rule: 'aria-required-parent', criteria: ['1.3.1'], severity: 'critical', selector: 'td.htSeparator[role="menuitem"]',
    measured: { nodes: 9, example: 'td[aria-label="x"]' }, reason: 'Certain ARIA roles must be contained by particular parents',
    page: 'context-menu', theme: 'main', state: 'context-menu' },
  { kind: 'axe-violation', rule: 'region', criteria: [], severity: 'minor', selector: 'div.wtHolder[role="presentation"]',
    measured: { nodes: 1, example: 'div' }, reason: 'All page content should be contained by landmarks', page: 'grid', theme: 'main' },
];

const AXE_DOC = {
  schema: 1,
  about: 'Accessibility findings of the axe scan',
  mode: 'warn',
  status: 'passed',
  headline: 'No new accessibility findings: 2 known, in 1 known issue',
  counts: { new: 1, grown: 0, matched: 2, improved: 0, stale: 0, unverified: 0, action: 1 },
  problems: [],
  reproduce: {},
  pages: {},
  needsAction: [{
    status: 'new', page: 'dark-grid', theme: 'classic', url: '/tests/fixtures/demo/grid.html?theme=classic&scheme=dark', steps: null,
    rule: 'color-contrast', impact: 'serious', wcag: ['1.4.3'], help: 'Elements must meet minimum color contrast ratio thresholds',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast', target: 'td.current[role="gridcell"]', nodes: 3,
    recordedNodes: null, issue: null, suggestedIssue: 'classic-contrast', remedy: 'fix it', elements: [],
  }],
  issues: [{
    id: 'menu-roles', title: 'Menu items have no menu parent', tracker: 'DEV-3491', rules: ['aria-required-parent'], wcag: ['1.3.1'],
    findings: 2, nodes: 22,
    locations: [
      { page: 'context-menu', theme: 'main', rule: 'aria-required-parent', target: 'td[role="menuitem"]', nodes: 13, selector: 'td', domPath: null },
      { page: 'context-menu', theme: 'classic', rule: 'aria-required-parent', target: 'td[role="menuitem"]', nodes: 9, selector: 'td', domPath: null },
    ],
  }],
};

/**
 * A transcript as the screen reader spec writes it: a step per entry of `steps`, passed unless its token
 * groups name a missing synonym list.
 *
 * @param {string} project The project.
 * @param {string} scenario The scenario.
 * @param {Array<[string, string[]|null]>} stepList `[step id, missing synonyms or null]`.
 * @param {object} [extra] Fields to override.
 * @returns {object} The transcript.
 */
function transcript(project, scenario, stepList, extra = {}) {
  return {
    schema: 1,
    scenario,
    surface: 'The grid body',
    project,
    mode: 'report',
    attempt: 0,
    environment: { screenReader: 'NVDA 2026.2', browser: 'chromium 151', platform: 'win32' },
    startedAt: '2026-11-03T04:38:40.402Z',
    durationMs: 46405,
    golden: { status: 'match', differences: [] },
    steps: stepList.map(([id, missing]) => ({
      id,
      action: { press: 'ArrowRight' },
      spoken: '34, Age, row 2, Name, column 3',
      normalized: '34 age row 2 name column 3',
      tokens: {
        passed: missing === null,
        groups: [{ synonyms: ['34'], matched: '34' }, ...(missing ? [{ synonyms: missing, matched: null }] : [])],
      },
      durationMs: 1372,
    })),
    ...extra,
  };
}

const GRID_CORE = [['arrow-right', null], ['close-editor', ['alice']], ['open-context-menu', ['menu']]];

/**
 * The artifact files of one A11y nightly: the three documents at the evidence artifact's root, the axe
 * findings at the axe artifact's root, plus the per-test folders the collector must ignore.
 *
 * @param {object} [docs] Overrides per artifact path.
 * @returns {Array<{artifact: string, path: string, text: string}>} The files.
 */
function nightlyFiles(docs = {}) {
  const files = {
    [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: evidenceDoc('keyboard-walker', WALKER_FINDINGS),
    [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: evidenceDoc('tree-snapshots', TREE_FINDINGS),
    [`${A11Y_EVIDENCE_ARTIFACT}/axe-discovery.json`]: evidenceDoc('axe-discovery', DISCOVERY_FINDINGS),
    [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker/grid--main.json`]: { detail: true },
    [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker-walk-grid-on-main-keyboard-walker/trace.json`]: { detail: true },
    [`${A11Y_AXE_ARTIFACT}/${A11Y_AXE_FILE}`]: AXE_DOC,
    [`${A11Y_AXE_ARTIFACT}/comparison.json`]: { mode: 'warn' },
    [`${A11Y_AXE_ARTIFACT}/scans/grid--main.json`]: { violations: [] },
    ...docs,
  };

  return Object.entries(files).filter(([, doc]) => doc !== null).map(([file, doc]) => {
    const [artifact, ...rest] = file.split('/');

    return { artifact, path: rest.join('/'), text: typeof doc === 'string' ? doc : JSON.stringify(doc) };
  });
}

/**
 * The transcript artifacts of one Screen reader nightly.
 *
 * @param {Record<string, object|null>} [docs] Overrides per artifact path.
 * @returns {Array<{artifact: string, path: string, text: string}>} The files.
 */
function readerFiles(docs = {}) {
  const files = {
    [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--grid-core.json`]: transcript('nvda-chromium', 'grid-core', GRID_CORE),
    [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--nested-rows.json`]: transcript('nvda-chromium', 'nested-rows',
      [['collapse-parent', null], ['down-to-child', ['level 2', '1 of 3']]]),
    [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/screenreader-grid-core-nvda-chromium/attachments/transcript-94f4.json`]: transcript('nvda-chromium', 'grid-core', GRID_CORE),
    [`${READER_ARTIFACT_PREFIX}vo-webkit/${READER_TRANSCRIPTS_DIR}/vo-webkit--grid-core.json`]: transcript('vo-webkit', 'grid-core',
      [['arrow-right', ['row 2', 'column 3']], ['close-editor', null], ['open-context-menu', null]],
      { golden: { status: 'differs', differences: [{ id: 'open-context-menu', expected: 'menu table', actual: 'table' }] } }),
    ...docs,
  };

  return Object.entries(files).filter(([, doc]) => doc !== null).map(([file, doc]) => {
    const [artifact, ...rest] = file.split('/');

    return { artifact, path: rest.join('/'), text: typeof doc === 'string' ? doc : JSON.stringify(doc) };
  });
}

const nightOf = (files) => {
  const read = readA11yArtifacts(files);

  assert.equal(read.nights.length, 1, read.notes.join('\n'));

  return read.nights[0];
};
const rowsByKind = (doc, kind) => doc.rows.filter(row => row.kind === kind);
const statusOf = (doc, key) => doc.rows.find(row => row.key === key)?.status;

test('a reader artifact names its project, with or without the scenario group its job ran', () => {
  assert.equal(readerArtifactProject(`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard`), 'nvda-chromium');
  assert.equal(readerArtifactProject(`${READER_ARTIFACT_PREFIX}vo-webkit-reading`), 'vo-webkit');
  assert.equal(readerArtifactProject(`${READER_ARTIFACT_PREFIX}vo-webkit`), 'vo-webkit', 'a name from before the split');
  SCENARIO_GROUPS.forEach(group => assert.equal(readerArtifactProject(`${READER_ARTIFACT_PREFIX}nvda-firefox-${group}`), 'nvda-firefox', group));
});

test('classifyA11yArtifact knows the three families, and the flake collector files them under one tier', () => {
  assert.equal(classifyA11yArtifact(A11Y_EVIDENCE_ARTIFACT), 'checks');
  assert.equal(classifyA11yArtifact(A11Y_AXE_ARTIFACT), 'axe');
  assert.equal(classifyA11yArtifact(`${READER_ARTIFACT_PREFIX}nvda-chromium`), 'reader');
  // Named outside the family on purpose: the HTML report, the Playwright reports and the recordings.
  assert.equal(classifyA11yArtifact('a11y-report.html'), null);
  assert.equal(classifyA11yArtifact('a11y-checks-evidence-2'), null);
  assert.equal(classifyA11yArtifact('screenreader-playwright-report-nvda-chromium'), null);
  assert.equal(classifyA11yArtifact('screenreader-recordings-vo-webkit'), null);
  assert.equal(classifyA11yArtifact('screenreader-goldens-nvda-firefox'), null);
  assert.equal(classifyA11yArtifact('playwright-report-main'), null);

  assert.equal(classifyArtifact(A11Y_EVIDENCE_ARTIFACT), 'a11y');
  assert.equal(classifyArtifact(A11Y_AXE_ARTIFACT), 'a11y');
  assert.equal(classifyArtifact(`${READER_ARTIFACT_PREFIX}vo-chromium`), 'a11y');
  assert.equal(classifyArtifact('a11y-report.html'), null);
});

test('isA11yRun takes the two nightlies on develop by schedule or dispatch, and nothing a pull request can start', () => {
  assert.equal(isA11yRun(runContextFromRun(NIGHTLY)), true);
  assert.equal(isA11yRun(runContextFromRun(READER_RUN)), true);
  assert.equal(isA11yRun(runContextFromRun({ ...NIGHTLY, event: 'workflow_dispatch' })), true, 'a proof run, or a missed night run again');
  assert.equal(isA11yRun(runContextFromRun({ ...NIGHTLY, event: 'push' })), false);
  assert.equal(isA11yRun(runContextFromRun({ ...NIGHTLY, event: 'pull_request' })), false, 'the nightly validating its own graph');
  assert.equal(isA11yRun(runContextFromRun(PULL_REQUEST)), false);
  // A fork's pull request opened from the fork's own develop reports develop as its branch, and the Tests pipeline
  // uploads the same artifacts from the pull request's code.
  assert.equal(isA11yRun(runContextFromRun({ ...PULL_REQUEST, head_branch: 'develop' })), false);
  assert.equal(isA11yRun(runContextFromRun({ ...NIGHTLY, name: 'Tests' })), false, 'a Tests dispatch on develop');
  assert.equal(isA11yRun(runContextFromRun({ ...NIGHTLY, name: 'E2E nightly' })), false);
  assert.equal(isA11yRun(runContextFromRun({ ...NIGHTLY, head_branch: 'master' })), false);
  assert.equal(isA11yRun(runContextFromRun({ ...NIGHTLY, head_branch: 'release/18.1.x' })), false);
  assert.deepEqual(A11Y_EVENTS, ['schedule', 'workflow_dispatch']);

  // The merge refuses such a run itself, and a night of another source than the run's workflow.
  assert.throws(() => mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun({ ...PULL_REQUEST, head_branch: 'develop' }), CATALOG,
    { now: NOW }), /only the A11y and Screen reader nightlies on develop/);

  const wrong = mergeA11yLedger(null, nightOf(readerFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW });

  assert.equal(wrong.changed, false);
  assert.match(wrong.notes[0], /run 41584742628 \(reader\): a A11y nightly run holds no reader night, nothing recorded/);
});

test('collectArtifactFiles hands the a11y family over unparsed, root documents and transcripts only', () => {
  const run = runContextFromRun(NIGHTLY);
  const { entries, durations, a11y, notes } = collectArtifactFiles([...nightlyFiles(), ...readerFiles()], run);

  assert.deepEqual(entries, [], 'nothing in the family is a flake');
  assert.deepEqual(durations, []);
  assert.deepEqual(notes, []);
  assert.deepEqual(a11y.map(file => `${file.artifact}/${file.path}`).sort(), [
    `${A11Y_AXE_ARTIFACT}/${A11Y_AXE_FILE}`,
    `${A11Y_EVIDENCE_ARTIFACT}/axe-discovery.json`,
    `${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`,
    `${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`,
    `${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--grid-core.json`,
    `${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--nested-rows.json`,
    `${READER_ARTIFACT_PREFIX}vo-webkit/${READER_TRANSCRIPTS_DIR}/vo-webkit--grid-core.json`,
  ], 'the per-test folders, the comparison and the scans are not read');
});

test('readA11yArtifacts turns a night\'s documents into masked findings with their coverage', () => {
  const { nights, notes } = readA11yArtifacts(nightlyFiles());

  assert.deepEqual(notes, []);
  assert.equal(nights.length, 1);

  const [night] = nights;

  assert.equal(night.source, 'a11y');
  assert.equal(night.findings.length, WALKER_FINDINGS.length + TREE_FINDINGS.length + DISCOVERY_FINDINGS.length + 3,
    'every check finding, the two known axe locations and the new axe finding');

  const walker = night.findings.filter(item => item.check === 'keyboard-walker');

  assert.deepEqual(walker.map(item => item.where), ['Escape on the editor state', 'input.ht-multi-select-editor-search-input @ Tab 1',
    'textarea.handsontableInput[role="combobox"] @ Tab 1'], 'a selector and a step are both kept, in that order');
  assert.deepEqual(walker[0], {
    source: 'checks', check: 'keyboard-walker', kind: 'focus-not-returned', rule: null, cause: null, page: 'autocomplete-editor',
    theme: 'main', state: 'editor', variant: null, where: 'Escape on the editor state', criteria: ['2.4.3'], severity: 'serious',
    reason: 'After Escape closed the popup, the focus did not come back to the cell it was opened from',
    url: '/tests/fixtures/demo/autocomplete-editor.html', issue: null,
  });

  const discovery = night.findings.filter(item => item.check === 'axe-discovery');

  assert.equal(discovery[0].where, 'td.ht-formula-ref-fill-ht_*-2[role="gridcell"]', 'the instance hash is masked');
  assert.equal(discovery[0].cause, 'color-contrast:shortTextContent');
  assert.deepEqual(discovery[2].criteria, [], 'a triage record may name no criterion');

  const axe = night.findings.filter(item => item.source === 'axe');

  assert.deepEqual(axe.map(item => [item.kind, item.page, item.theme, item.where, item.issue, item.severity]), [
    ['axe-violation', 'context-menu', 'main', 'td[role="menuitem"]', 'menu-roles', null],
    ['axe-violation', 'context-menu', 'classic', 'td[role="menuitem"]', 'menu-roles', null],
    ['axe-violation', 'dark-grid', 'classic', 'td[role="gridcell"]', 'classic-contrast', 'serious'],
  ], 'one kind for the scan: a baselined location has no impact of its own; a new finding carries axe\'s and the issue the scan suggests');
  assert.deepEqual(axe[2].criteria, ['1.4.3']);
  assert.equal(axe[0].check, 'axe');

  assert.deepEqual(Object.keys(night.coverage.checks).sort(), ['axe-discovery', 'keyboard-walker', 'tree-snapshots']);
  assert.deepEqual(night.coverage.checks['tree-snapshots'], ['grid|classic|', 'grid|main|']);
  assert.equal(night.coverage.axe, true, 'a complete scan resolves what it does not find');
  assert.deepEqual(night.coverage.reader, []);
  assert.deepEqual(night.coverage.golden, []);
  assert.equal(night.problems, 0);
  assert.deepEqual(night.checks['keyboard-walker'], { targets: 2, measured: 2, findings: 3, problems: 0 });
});

test('a reader step is recorded at the severity of the worst group it missed, as its check run counts it', () => {
  const declared = transcript('nvda-chromium', 'grid-core', [['close-editor', ['alice']]]);

  declared.steps[0].tokens.groups[1].severity = 'minor';

  const critical = transcript('nvda-chromium', 'nested-rows', [['down-to-child', ['level 2']]]);

  critical.steps[0].tokens.groups.push({ synonyms: ['1 of 3'], matched: null, severity: 'critical' });

  const night = nightOf(readerFiles({
    [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--grid-core.json`]: declared,
    [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--nested-rows.json`]: critical,
    [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/screenreader-grid-core-nvda-chromium/attachments/transcript-94f4.json`]: null,
    [`${READER_ARTIFACT_PREFIX}vo-webkit/${READER_TRANSCRIPTS_DIR}/vo-webkit--grid-core.json`]: null,
  }));

  assert.deepEqual(night.findings.map(item => [item.page, item.where, item.severity]), [
    ['grid-core', 'close-editor', 'minor'],
    ['nested-rows', 'down-to-child', 'critical'],
  ], 'a declared severity is kept; a group without one (a transcript recorded before groups carried one) is serious');
});

test('readA11yArtifacts turns a reader night\'s transcripts into step findings, failed tokens and golden differences', () => {
  const { nights, notes } = readA11yArtifacts(readerFiles());

  assert.deepEqual(notes, []);
  assert.equal(nights.length, 1);

  const [night] = nights;

  assert.equal(night.source, 'reader');
  assert.deepEqual(night.findings.map(item => [item.check, item.page, item.kind, item.where, item.severity, item.reason]), [
    ['nvda-chromium', 'grid-core', 'token-missing', 'close-editor', 'serious', 'the announcement lacks: alice'],
    ['nvda-chromium', 'grid-core', 'token-missing', 'open-context-menu', 'serious', 'the announcement lacks: menu'],
    ['nvda-chromium', 'nested-rows', 'token-missing', 'down-to-child', 'serious', 'the announcement lacks: level 2 | 1 of 3'],
    ['vo-webkit', 'grid-core', 'token-missing', 'arrow-right', 'serious', 'the announcement lacks: row 2 | column 3'],
    ['vo-webkit', 'grid-core', 'golden-differs', 'open-context-menu', 'advisory', 'expected "menu table", heard "table"'],
  ]);
  assert.deepEqual(night.findings[0], {
    source: 'reader', check: 'nvda-chromium', kind: 'token-missing', rule: null, cause: null, page: 'grid-core', theme: null, state: null,
    variant: null, where: 'close-editor', criteria: [], severity: 'serious', reason: 'the announcement lacks: alice', url: null, issue: null,
  });
  assert.deepEqual(night.coverage.reader, ['nvda-chromium|grid-core', 'nvda-chromium|nested-rows', 'vo-webkit|grid-core']);
  assert.deepEqual(night.coverage.golden, ['nvda-chromium|grid-core', 'nvda-chromium|nested-rows', 'vo-webkit|grid-core'],
    'every transcript was compared with its golden');
  assert.deepEqual(night.reader['nvda-chromium']['grid-core'], {
    steps: ['arrow-right', 'close-editor', 'open-context-menu'], failed: ['close-editor', 'open-context-menu'], golden: 'match', incomplete: null,
  });
  assert.deepEqual(night.reader['vo-webkit']['grid-core'].golden, 'differs');
});

test('readA11yArtifacts refuses what it cannot trust, one note each, and keeps the rest of the night', () => {
  const huge = 'x'.repeat(A11Y_FILE_CAP_BYTES + 1);
  const walker = evidenceDoc('keyboard-walker', WALKER_FINDINGS);
  const badFinding = evidenceDoc('tree-snapshots', [
    ...TREE_FINDINGS,
    { kind: 'Bad Kind', criteria: ['1.3.2'], severity: 'moderate', step: 'x', reason: 'r', page: 'grid', theme: 'main' },
    { kind: 'unnamed-control', criteria: ['9.9.9'], severity: 'moderate', selector: 'div', reason: 'r', page: 'grid', theme: 'main' },
    { kind: 'unnamed-control', criteria: ['4.1.2'], severity: 'fatal', selector: 'div', reason: 'r', page: 'grid', theme: 'main' },
    { kind: 'unnamed-control', criteria: ['4.1.2'], severity: 'serious', selector: 'div', reason: 'r', page: '../etc', theme: 'main' },
    { kind: 'unnamed-control', criteria: ['4.1.2'], severity: 'serious', selector: 's'.repeat(2000), reason: 'r'.repeat(2000),
      url: 'https://example.com/x', page: 'grid', theme: 'main' },
  ]);
  const { nights, notes } = readA11yArtifacts([
    ...nightlyFiles({
      [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: { ...walker, schema: 99 },
      [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: badFinding,
      [`${A11Y_EVIDENCE_ARTIFACT}/axe-discovery.json`]: huge,
      [`${A11Y_EVIDENCE_ARTIFACT}/no-such-check.json`]: evidenceDoc('no-such-check', []),
      [`${A11Y_EVIDENCE_ARTIFACT}/reflow.json`]: 'not json',
      [`${A11Y_EVIDENCE_ARTIFACT}/pointer.json`]: null,
      [`${A11Y_EVIDENCE_ARTIFACT}/forced-colors-motion.json`]: evidenceDoc('focus-contrast', []),
      [`${A11Y_AXE_ARTIFACT}/${A11Y_AXE_FILE}`]: { ...AXE_DOC, schema: 2 },
    }),
    ...readerFiles({
      [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--nested-rows.json`]: transcript('nvda-firefox', 'nested-rows', []),
      [`${READER_ARTIFACT_PREFIX}vo-webkit/${READER_TRANSCRIPTS_DIR}/vo-webkit--grid-core.json`]: transcript('vo-webkit', 'grid-core', [['x'.repeat(200), ['a']]]),
      [`${READER_ARTIFACT_PREFIX}Bad Project/${READER_TRANSCRIPTS_DIR}/x.json`]: transcript('Bad Project', 'grid-core', []),
    }),
  ]);
  const expectNote = (pattern) => assert.ok(notes.some(note => pattern.test(note)), `expected a note matching ${pattern}; got:\n${notes.join('\n')}`);

  expectNote(/keyboard-walker\.json: schema 99/);
  expectNote(/axe-discovery\.json: .*bytes.*cap/);
  expectNote(/no-such-check\.json: .*not a check/);
  expectNote(/reflow\.json: could not be read/);
  expectNote(/forced-colors-motion\.json: .*names check focus-contrast/);
  expectNote(/tree-snapshots\.json: 4 malformed finding\(s\) dropped/);
  expectNote(/a11y-findings\.json: schema 2/);
  expectNote(/nvda-chromium--nested-rows\.json: .*names project nvda-firefox/);
  expectNote(/vo-webkit--grid-core\.json: 1 malformed step\(s\) dropped/);
  expectNote(/Bad Project: not a project name/);

  const a11y = nights.find(item => item.source === 'a11y');
  const reader = nights.find(item => item.source === 'reader');

  assert.ok(a11y && reader, 'both nights survive');
  assert.deepEqual(Object.keys(a11y.coverage.checks), ['tree-snapshots'], 'the refused documents cover nothing');
  assert.deepEqual(a11y.coverage.checks['tree-snapshots'], [], 'a dropped finding with no readable target: the check covers nothing');
  assert.equal(a11y.coverage.axe, null, 'and an unreadable axe document resolves nothing');
  assert.equal(a11y.findings.length, TREE_FINDINGS.length + 1, 'the dropped findings are gone, the bounded one stays');
  expectNote(/tree-snapshots\.json: 4 malformed finding\(s\) dropped; one names no readable target, so the check resolves nothing tonight/);

  const bounded = a11y.findings.at(-1);

  assert.equal(bounded.where.length, 300);
  assert.equal(bounded.reason.length, 300);
  assert.equal(bounded.url, null, 'only a fixture path is kept as a url');
  assert.deepEqual(reader.coverage.reader, ['nvda-chromium|grid-core'], 'a transcript that lost a step covers nothing');
  assert.equal(reader.findings.filter(item => item.check === 'vo-webkit').length, 0);
});

test('coverage leaves out what the night did not fully measure: a target with a tooling problem, a dropped finding\'s target, a cut document', () => {
  // A target measured with a step that did not run, as mergeEvidence() writes it: `measured` with `problems`.
  const walker = evidenceDoc('keyboard-walker', [], [
    { page: 'autocomplete-editor', theme: 'main', status: 'measured', problems: 1 },
    { page: 'multiselect-editor', theme: 'main', status: 'measured', problems: 0 },
  ]);
  const tree = evidenceDoc('tree-snapshots', [...TREE_FINDINGS,
    { kind: 'Bad Kind', criteria: ['1.3.2'], severity: 'moderate', step: 'x', reason: 'r', page: 'grid', theme: 'main' }]);
  const { nights: [read], notes } = readA11yArtifacts(nightlyFiles({
    [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: walker,
    [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: tree,
  }));

  assert.deepEqual(read.coverage.checks['keyboard-walker'], ['multiselect-editor|main|']);
  assert.deepEqual(read.coverage.checks['tree-snapshots'], ['grid|classic|'], 'the dropped finding\'s target covers nothing, the other does');
  assert.ok(notes.some(note => /tree-snapshots\.json: 1 malformed finding\(s\) dropped; their targets resolve nothing tonight/.test(note)));

  // A row found on one night is not resolved on the next night its step could not run, and comes back as nothing.
  const first = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW }).doc;
  const second = mergeA11yLedger(first, nightOf(nightlyFiles({ [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: walker })),
    runContextFromRun({ ...NIGHTLY, id: 41600000000, updated_at: night(1) }), CATALOG, { now: new Date(night(1)) }).doc;
  const walkerRows = second.rows.filter(row => row.check === 'keyboard-walker');

  assert.deepEqual(walkerRows.map(row => [row.page, row.kind, row.status]), [
    ['multiselect-editor', 'focus-lost', 'resolved'],
    ['autocomplete-editor', 'focus-not-returned', 'new'],
    ['autocomplete-editor', 'tab-keeps-focus', 'new'],
  ], 'the target whose step could not run keeps its rows; the measured one resolves');

  // A document cut at the findings limit covers nothing, whatever its targets say.
  const many = Array.from({ length: A11Y_LIMITS.findings + 1 }, (_, index) => ({ ...TREE_FINDINGS[0], step: `step ${index}` }));
  const cut = readA11yArtifacts(nightlyFiles({ [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: evidenceDoc('tree-snapshots', many) }));

  assert.deepEqual(cut.nights[0].coverage.checks['tree-snapshots'], []);
  assert.ok(cut.notes.some(note => new RegExp(`${A11Y_LIMITS.findings + 1} findings, only the first ${A11Y_LIMITS.findings} read; `
    + 'the check resolves nothing tonight').test(note)));
});

test('the axe scan is one row per location: a grown entry is the location, a baselined new finding keeps its row, a malformed entry covers nothing', () => {
  const grown = {
    ...AXE_DOC,
    needsAction: [...AXE_DOC.needsAction,
      { status: 'grown', page: 'context-menu', theme: 'main', rule: 'aria-required-parent', target: 'td[role="menuitem"]', wcag: ['1.3.1'],
        impact: 'critical', nodes: 15, recordedNodes: 13, issue: 'menu-roles' },
      { status: 'fixed', page: 'context-menu', theme: 'horizon', rule: 'aria-required-parent', target: 'td[role="menuitem"]', wcag: ['1.3.1'],
        issue: 'menu-roles' }],
  };
  const [read] = readA11yArtifacts(nightlyFiles({ [`${A11Y_AXE_ARTIFACT}/${A11Y_AXE_FILE}`]: grown })).nights;

  assert.equal(read.findings.filter(item => item.source === 'axe').length, 3, 'the grown entry is the location issues[] already holds');
  assert.equal(read.coverage.axe, true);

  // Baselining the new finding moves it from needsAction to its issue's locations; its row keeps its history.
  const first = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW }).doc;
  const baselined = {
    ...AXE_DOC,
    needsAction: [],
    issues: [...AXE_DOC.issues, {
      id: 'classic-contrast', title: 'Text contrast is below 4.5:1 in the classic theme', tracker: 'DEV-3494', rules: ['color-contrast'],
      wcag: ['1.4.3'], findings: 1, nodes: 3,
      locations: [{ page: 'dark-grid', theme: 'classic', rule: 'color-contrast', target: 'td.current[role="gridcell"]', nodes: 3, selector: 'td',
        domPath: null }],
    }],
  };
  const second = mergeA11yLedger(first, nightOf(nightlyFiles({ [`${A11Y_AXE_ARTIFACT}/${A11Y_AXE_FILE}`]: baselined })),
    runContextFromRun({ ...NIGHTLY, id: 41600000000, updated_at: night(1) }), CATALOG, { now: new Date(night(1)) }).doc;
  const axeRows = second.rows.filter(row => row.source === 'axe');

  assert.equal(axeRows.length, 3);
  assert.ok(axeRows.every(row => row.status === 'persisting' && row.nightsSeen === 2));
  assert.equal(axeRows.find(row => row.page === 'dark-grid').issue, 'classic-contrast');

  // An entry the collector cannot read: the scan resolves nothing that night.
  const broken = { ...AXE_DOC, needsAction: [...AXE_DOC.needsAction, { status: 'new', page: '../x', theme: 'main', rule: 'region', target: 'div',
    wcag: [] }] };
  const { nights: [partial], notes } = readA11yArtifacts(nightlyFiles({ [`${A11Y_AXE_ARTIFACT}/${A11Y_AXE_FILE}`]: broken }));

  assert.equal(partial.coverage.axe, false);
  assert.ok(notes.some(note => /a11y-findings\.json: 1 malformed finding\(s\) dropped; the scan resolves nothing tonight/.test(note)));
});

test('a transcript covers its golden rows only when its wording was compared with a golden', () => {
  const first = mergeA11yLedger(null, nightOf(readerFiles()), runContextFromRun(READER_RUN), CATALOG, { now: NOW }).doc;
  const goldenKey = 'reader|vo-webkit|golden-differs|||grid-core||||open-context-menu';

  assert.equal(statusOf(first, goldenKey), 'new');

  // The update-goldens dispatch records the golden, and a project without one compares nothing: no difference
  // is listed, and none is resolved.
  for (const [offset, status] of [[1, 'recorded'], [2, 'missing']]) {
    const uncompared = readerFiles({
      [`${READER_ARTIFACT_PREFIX}vo-webkit/${READER_TRANSCRIPTS_DIR}/vo-webkit--grid-core.json`]: transcript('vo-webkit', 'grid-core',
        [['arrow-right', ['row 2', 'column 3']], ['close-editor', null], ['open-context-menu', null]], { golden: { status, differences: [] } }),
    });
    const [read] = readA11yArtifacts(uncompared).nights;

    assert.ok(read.coverage.reader.includes('vo-webkit|grid-core') && !read.coverage.golden.includes('vo-webkit|grid-core'), status);

    const next = mergeA11yLedger(first, read, runContextFromRun({ ...READER_RUN, id: 41579067604 + offset, updated_at: night(offset) }),
      CATALOG, { now: new Date(night(offset)) }).doc;

    assert.equal(statusOf(next, goldenKey), 'new', `a ${status} golden resolves no difference`);
    assert.equal(statusOf(next, 'reader|vo-webkit|token-missing|||grid-core||||arrow-right'), 'persisting', 'its token rows still count');
  }
});

test('a project or scenario named like an Object property stays the night\'s own data', () => {
  const files = readerFiles({
    [`${READER_ARTIFACT_PREFIX}constructor/${READER_TRANSCRIPTS_DIR}/constructor--grid-core.json`]: transcript('constructor', 'grid-core', GRID_CORE),
    [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--constructor.json`]: transcript('nvda-chromium', 'constructor',
      [['arrow-right', ['row 2']]]),
  });
  const { nights: [read], notes } = readA11yArtifacts(files);

  assert.deepEqual(notes, []);
  assert.equal(Object.hasOwn(Object, 'grid-core'), false, 'nothing is written onto Object');
  assert.ok(Object.hasOwn(read.reader, 'constructor'));
  assert.deepEqual(read.reader.constructor['grid-core'].failed, ['close-editor', 'open-context-menu']);
  assert.deepEqual(read.reader['nvda-chromium'].constructor.failed, ['arrow-right']);

  const view = a11yView(mergeA11yLedger(null, read, runContextFromRun(READER_RUN), CATALOG, { now: NOW }).doc, CATALOG);

  assert.deepEqual(view.reader.projects, ['constructor', 'nvda-chromium', 'vo-webkit']);
  assert.deepEqual(Object.keys(view.reader.scenarios.find(item => item.scenario === 'constructor').verdicts), ['nvda-chromium'],
    'a project without the scenario has no verdicts for it, never the prototype\'s');
  assert.deepEqual(view.reader.scenarios.find(item => item.scenario === 'grid-core').verdicts.constructor,
    { 'arrow-right': 'pass', 'close-editor': 'fail', 'open-context-menu': 'fail' });
});

test('an incomplete axe scan covers nothing: an unverified page or a tooling problem leaves the known rows as they were', () => {
  const unverified = { ...AXE_DOC, counts: { ...AXE_DOC.counts, unverified: 2 } };
  const problem = { ...AXE_DOC, problems: ['dark-grid on classic: the fixture did not load'] };

  for (const [label, doc] of [['unverified', unverified], ['problem', problem]]) {
    const [night] = readA11yArtifacts(nightlyFiles({ [`${A11Y_AXE_ARTIFACT}/${A11Y_AXE_FILE}`]: doc })).nights;

    assert.equal(night.coverage.axe, false, label);
    assert.deepEqual(night.axe, { complete: false, findings: 3, problems: label === 'problem' ? 1 : 0 });
    assert.equal(night.problems, label === 'problem' ? 1 : 0);
  }

  const first = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW }).doc;
  const gone = { ...unverified, issues: [], needsAction: [] };
  const second = mergeA11yLedger(first, nightOf(nightlyFiles({ [`${A11Y_AXE_ARTIFACT}/${A11Y_AXE_FILE}`]: gone })),
    runContextFromRun({ ...NIGHTLY, id: 41600000000, updated_at: night(1) }), CATALOG, { now: new Date(night(1)) });

  assert.ok(second.doc.rows.filter(row => row.source === 'axe').every(row => row.status === 'new' && row.resolvedAt === null),
    'nothing of the scan is resolved by a scan that did not reach every page');
  assert.equal(second.doc.nights[0].resolved, 0);

  const complete = { ...AXE_DOC, issues: [], needsAction: [], counts: { ...AXE_DOC.counts, matched: 0, new: 0, action: 0 } };
  const third = mergeA11yLedger(second.doc, nightOf(nightlyFiles({ [`${A11Y_AXE_ARTIFACT}/${A11Y_AXE_FILE}`]: complete })),
    runContextFromRun({ ...NIGHTLY, id: 41700000000, updated_at: night(2) }), CATALOG, { now: new Date(night(2)) });

  assert.ok(third.doc.rows.filter(row => row.source === 'axe').every(row => row.status === 'resolved' && row.resolvedAt === night(2)),
    'a complete scan without them resolves them');
});

test('findingKey keys on check, kind, rule, cause, page, theme, state, variant and the masked where, never on the reason', () => {
  const [night] = readA11yArtifacts(nightlyFiles()).nights;
  const [first] = night.findings;

  assert.equal(findingKey(first), 'checks|keyboard-walker|focus-not-returned|||autocomplete-editor|main|editor||Escape on the editor state');
  assert.equal(findingKey({ ...first, reason: 'another reason', url: '/x', severity: 'minor', criteria: [] }), findingKey(first));
  assert.notEqual(findingKey({ ...first, state: 'none' }), findingKey(first));
  assert.notEqual(findingKey({ ...first, variant: 'dark' }), findingKey(first));
  assert.notEqual(findingKey({ ...first, theme: 'classic' }), findingKey(first));

  const discovery = night.findings.find(item => item.cause);

  assert.equal(findingKey(discovery), 'checks|axe-discovery|axe-needs-review|color-contrast|color-contrast:shortTextContent|formula-builder|main|formula-builder||td.ht-formula-ref-fill-ht_*-2[role="gridcell"]');
  assert.equal(new Set(night.findings.map(findingKey)).size, night.findings.length, 'no two findings of a night share a key');
});

test('mergeA11yLedger records a first night as new rows, each with its cluster and tracker', () => {
  const run = runContextFromRun(NIGHTLY);
  const { doc, changed, notes, recorded } = mergeA11yLedger(null, nightOf(nightlyFiles()), run, CATALOG, { now: NOW });

  assert.equal(changed, true);
  assert.deepEqual(notes, []);
  assert.equal(doc.version, A11Y_VERSION);
  assert.equal(doc.retentionDays, A11Y_RETENTION_DAYS);
  assert.equal(doc.capBytes, A11Y_CAP_BYTES);
  assert.equal(doc.rows.length, 11);
  assert.ok(doc.rows.every(row => row.status === 'new' && row.nightsSeen === 1 && row.firstRun === '41584742628'
    && row.lastRun === '41584742628' && row.firstSeen === NIGHTLY.updated_at && row.lastSeen === NIGHTLY.updated_at
    && row.gaps === 0 && row.resolvedAt === null));

  const byKind = kind => doc.rows.find(row => row.kind === kind);

  assert.deepEqual([byKind('focus-not-returned').cluster, byKind('focus-not-returned').tracker], ['focus-not-returned-after-escape', ['DEV-3603', 'DEV-3604']]);
  assert.deepEqual([byKind('headers-after-data').cluster, byKind('headers-after-data').tracker], ['overlay-clones-split-tree', 'DEV-3652']);
  const axeRow = page => doc.rows.find(row => row.source === 'axe' && row.page === page);

  assert.deepEqual([axeRow('context-menu').cluster, axeRow('context-menu').tracker], ['menu-semantics', 'DEV-3491']);
  assert.deepEqual([axeRow('dark-grid').cluster, axeRow('dark-grid').tracker], ['contrast-and-focus-visibility', 'DEV-2946']);
  assert.deepEqual([byKind('tab-keeps-focus').cluster, byKind('tab-keeps-focus').tracker], [TRIAGE_ID, null]);
  assert.deepEqual(byKind('axe-needs-review').cluster, 'contrast-and-focus-visibility');

  assert.equal(doc.nights.length, 1);
  assert.deepEqual(doc.nights[0], {
    runId: '41584742628', runAttempt: 1, source: 'a11y', workflow: A11Y_NIGHTLY_WORKFLOW, event: 'schedule', branch: 'develop',
    headSha: NIGHTLY.head_sha, seenAt: NIGHTLY.updated_at, findings: 11, new: 11, resolved: 0, flapping: 0, triage: 2, triageShapes: 2,
    problems: 0,
    clusters: {
      'contrast-and-focus-visibility': { seen: 2, new: 2, resolved: 0 },
      'focus-not-returned-after-escape': { seen: 2, new: 2, resolved: 0 },
      'menu-semantics': { seen: 3, new: 3, resolved: 0 },
      'needs-triage': { seen: 2, new: 2, resolved: 0 },
      'overlay-clones-split-tree': { seen: 2, new: 2, resolved: 0 },
    },
    checks: {
      'axe-discovery': { targets: 3, measured: 3, findings: 3, problems: 0 },
      'keyboard-walker': { targets: 2, measured: 2, findings: 3, problems: 0 },
      'tree-snapshots': { targets: 2, measured: 2, findings: 2, problems: 0 },
    },
    axe: { complete: true, findings: 3, problems: 0 },
    // What a later attempt of this night is measured against; only the latest night of a source keeps it.
    coverage: {
      checks: {
        'axe-discovery': ['context-menu|main|', 'formula-builder|main|', 'grid|main|'],
        'keyboard-walker': ['autocomplete-editor|main|', 'multiselect-editor|main|'],
        'tree-snapshots': ['grid|classic|', 'grid|main|'],
      },
      axe: true,
      reader: [],
      golden: [],
    },
  });
  assert.deepEqual(doc.latest, { a11y: { runId: '41584742628', seenAt: NIGHTLY.updated_at }, reader: null });
  assert.deepEqual(recorded, { source: 'a11y', runId: '41584742628', runAttempt: 1, amended: false, findings: 11, new: 11, resolved: 0,
    flapping: 0, triage: 2, triageShapes: 2,
    clusters: [['menu-semantics', 3], ['contrast-and-focus-visibility', 2], ['focus-not-returned-after-escape', 2], ['overlay-clones-split-tree', 2], ['needs-triage', 2]] });
  assert.equal(doc.updatedAt, NOW.toISOString());
});

test('a second night resolves what its measured targets no longer show, keeps the unmeasured, and a third marks a comeback flapping', () => {
  const first = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW }).doc;
  // Night 2: the walker's focus-lost is gone and its target was measured; the tree snapshots did not run at all;
  // the discovery's context-menu target was not measured (an error target), so its finding is not resolved.
  const secondRun = { ...NIGHTLY, id: 41600000000, updated_at: night(1) };
  const second = mergeA11yLedger(first, nightOf(nightlyFiles({
    [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: evidenceDoc('keyboard-walker', WALKER_FINDINGS.filter(item => item.kind !== 'focus-lost'),
      [{ page: 'autocomplete-editor', theme: 'main', status: 'measured' }, { page: 'multiselect-editor', theme: 'main', status: 'measured' }]),
    [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: null,
    [`${A11Y_EVIDENCE_ARTIFACT}/axe-discovery.json`]: evidenceDoc('axe-discovery', DISCOVERY_FINDINGS.filter(item => item.rule !== 'aria-required-parent'),
      [{ page: 'formula-builder', theme: 'main', status: 'measured' }, { page: 'grid', theme: 'main', status: 'measured' },
        { page: 'context-menu', theme: 'main', status: 'error' }]),
  })), runContextFromRun(secondRun), CATALOG, { now: new Date(night(1)) });

  assert.deepEqual(second.notes, []);
  assert.equal(statusOf(second.doc, 'checks|keyboard-walker|focus-lost|||multiselect-editor|main|editor||input.ht-multi-select-editor-search-input @ Tab 1'), 'resolved');
  assert.equal(statusOf(second.doc, 'checks|keyboard-walker|focus-not-returned|||autocomplete-editor|main|editor||Escape on the editor state'), 'persisting');
  assert.equal(statusOf(second.doc, 'checks|tree-snapshots|headers-after-data|||grid|main|none||the grid in reading order'), 'new',
    'a check that did not run leaves its rows as they were');
  assert.equal(statusOf(second.doc, 'checks|axe-discovery|axe-violation|aria-required-parent||context-menu|main|context-menu||td.htSeparator[role="menuitem"]'), 'new',
    'a target that was not measured resolves nothing');

  const resolved = second.doc.rows.find(row => row.kind === 'focus-lost');

  assert.equal(resolved.resolvedAt, night(1));
  assert.equal(resolved.gaps, 1);
  assert.equal(resolved.lastSeen, NIGHTLY.updated_at, 'lastSeen is the last sighting, not the night it went');
  assert.deepEqual([second.doc.nights[0].resolved, second.doc.nights[0].new, second.doc.nights[0].runId], [1, 0, '41600000000']);
  assert.equal(second.doc.nights[0].clusters['focus-not-returned-after-escape'].resolved, 1);
  assert.equal(second.recorded.resolved, 1);

  // Night 3: focus-lost is back.
  const thirdRun = { ...NIGHTLY, id: 41700000000, updated_at: night(2) };
  const third = mergeA11yLedger(second.doc, nightOf(nightlyFiles()), runContextFromRun(thirdRun), CATALOG, { now: new Date(night(2)) });
  const back = third.doc.rows.find(row => row.kind === 'focus-lost');

  assert.equal(back.status, 'flapping');
  assert.equal(back.nightsSeen, 2);
  assert.equal(back.gaps, 1);
  assert.equal(back.seenSinceGap, 1);
  assert.equal(back.resolvedAt, null);
  assert.equal(back.lastSeen, night(2));
  assert.equal(third.doc.nights[0].flapping, 1);
  assert.equal(third.recorded.flapping, 1);
  assert.equal(statusOf(third.doc, 'checks|keyboard-walker|focus-not-returned|||autocomplete-editor|main|editor||Escape on the editor state'), 'persisting');

  // A flapping row is persisting again on the A11Y_FLAP_NIGHTS-th night in a row it is seen, the comeback included.
  let doc = third.doc;

  for (let inRow = 2; inRow <= A11Y_FLAP_NIGHTS; inRow += 1) {
    const offset = inRow + 1;

    doc = mergeA11yLedger(doc, nightOf(nightlyFiles()), runContextFromRun({ ...NIGHTLY, id: 41700000000 + offset, updated_at: night(offset) }),
      CATALOG, { now: new Date(night(offset)) }).doc;

    const row = doc.rows.find(item => item.kind === 'focus-lost');

    assert.equal(row.seenSinceGap, inRow);
    assert.equal(row.status, inRow < A11Y_FLAP_NIGHTS ? 'flapping' : 'persisting', `night ${inRow} in a row since the gap`);
  }
});

test('a reader night touches only reader rows, and the two sources keep their own latest night', () => {
  const a11y = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW }).doc;
  const reader = mergeA11yLedger(a11y, nightOf(readerFiles()), runContextFromRun(READER_RUN), CATALOG, { now: NOW });

  assert.deepEqual(reader.notes, []);
  assert.equal(reader.doc.rows.length, 11 + 5);
  assert.ok(reader.doc.rows.filter(row => row.source !== 'reader').every(row => row.status === 'new' && row.lastRun === '41584742628'));
  assert.deepEqual(reader.doc.latest, {
    a11y: { runId: '41584742628', seenAt: NIGHTLY.updated_at },
    reader: { runId: '41579067604', seenAt: READER_RUN.updated_at },
  });
  assert.equal(reader.doc.rows.find(row => row.where === 'close-editor').cluster, 'focus-not-returned-after-escape');

  // The reader nightly completes before the A11y nightly, so it sorts after it; the sources keep their own order.
  const readerNight = reader.doc.nights.find(night => night.source === 'reader');

  assert.deepEqual(reader.doc.nights.map(night => night.source), ['a11y', 'reader']);
  assert.deepEqual(readerNight.reader['vo-webkit']['grid-core'].failed, ['arrow-right']);

  // The next reader night without the vo-webkit transcript resolves nothing of that project, and the nvda step
  // that passes now is resolved.
  const next = mergeA11yLedger(reader.doc, nightOf(readerFiles({
    [`${READER_ARTIFACT_PREFIX}vo-webkit/${READER_TRANSCRIPTS_DIR}/vo-webkit--grid-core.json`]: null,
    [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--grid-core.json`]: transcript('nvda-chromium', 'grid-core',
      [['arrow-right', null], ['close-editor', null], ['open-context-menu', ['menu']]]),
  })), runContextFromRun({ ...READER_RUN, id: 41579999999, updated_at: night(1) }), CATALOG, { now: new Date(night(1)) });

  assert.equal(statusOf(next.doc, 'reader|nvda-chromium|token-missing|||grid-core||||close-editor'), 'resolved');
  assert.equal(statusOf(next.doc, 'reader|nvda-chromium|token-missing|||grid-core||||open-context-menu'), 'persisting');
  assert.equal(statusOf(next.doc, 'reader|vo-webkit|token-missing|||grid-core||||arrow-right'), 'new');
  assert.equal(statusOf(next.doc, 'checks|keyboard-walker|focus-lost|||multiselect-editor|main|editor||input.ht-multi-select-editor-search-input @ Tab 1'), 'new',
    'a reader night never resolves a check row');

  // An incomplete transcript covers nothing: its missing steps are not resolved.
  const stopped = mergeA11yLedger(next.doc, nightOf(readerFiles({
    [`${READER_ARTIFACT_PREFIX}vo-webkit/${READER_TRANSCRIPTS_DIR}/vo-webkit--grid-core.json`]: transcript('vo-webkit', 'grid-core',
      [['arrow-right', null]], { incomplete: { step: 'close-editor', error: 'VoiceOver did not answer' } }),
    [`${READER_ARTIFACT_PREFIX}nvda-chromium-keyboard/${READER_TRANSCRIPTS_DIR}/nvda-chromium--grid-core.json`]: transcript('nvda-chromium', 'grid-core',
      [['arrow-right', null], ['close-editor', null], ['open-context-menu', ['menu']]]),
  })), runContextFromRun({ ...READER_RUN, id: 41580000001, updated_at: night(2) }), CATALOG, { now: new Date(night(2)) });

  assert.equal(statusOf(stopped.doc, 'reader|vo-webkit|token-missing|||grid-core||||arrow-right'), 'new');
  assert.equal(stopped.doc.nights[0].problems, 1, 'the stop is counted as a problem');
  assert.deepEqual(stopped.doc.nights[0].reader['vo-webkit']['grid-core'].incomplete, 'close-editor');
});

test('a night is recorded once, in order, and a re-collection or an older night changes nothing', () => {
  const first = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW });
  const again = mergeA11yLedger(first.doc, nightOf(nightlyFiles()), runContextFromRun({ ...NIGHTLY, run_attempt: 2 }), CATALOG,
    { now: new Date(night(1)) });

  assert.equal(again.changed, false);
  assert.equal(serializeA11yLedger(again.doc), serializeA11yLedger(first.doc), 'byte-identical, updatedAt included');
  assert.match(again.notes[0], /run 41584742628 \(a11y\) attempt 2 measured nothing attempt 1 had not; the night is already recorded/);
  assert.equal(again.recorded, null);

  const same = mergeA11yLedger(first.doc, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: new Date(night(1)) });

  assert.equal(same.changed, false);
  assert.match(same.notes[0], /run 41584742628 \(a11y\) attempt 1 is already recorded \(attempt 1\); a run is read once per attempt/);

  const older = mergeA11yLedger(first.doc, nightOf(nightlyFiles()), runContextFromRun({ ...NIGHTLY, id: 41500000000, updated_at: night(-1) }),
    CATALOG, { now: new Date(night(1)) });

  assert.equal(older.changed, false);
  assert.match(older.notes[0], /run 41500000000 .*before the latest a11y night 41584742628/);

  // A night with nothing of its source (every document refused) records nothing either.
  const empty = mergeA11yLedger(first.doc, { source: 'a11y', findings: [], coverage: { checks: {}, axe: null, reader: [] }, problems: 0, checks: {}, axe: null, reader: {} },
    runContextFromRun({ ...NIGHTLY, id: 41600000000, updated_at: night(1) }), CATALOG, { now: new Date(night(1)) });

  assert.equal(empty.changed, false);
  assert.match(empty.notes[0], /run 41600000000 .*no readable accessibility document/);
});

test('a later attempt of the latest night fills in what the recorded attempt did not measure, and leaves what it measured', () => {
  // Attempt 1: the walker's autocomplete target hit a tooling problem after one finding, and the tree snapshots
  // left no document.
  const attempt1 = nightlyFiles({
    [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: evidenceDoc('keyboard-walker',
      WALKER_FINDINGS.filter(item => item.page === 'multiselect-editor' || item.kind === 'focus-not-returned'), [
        { page: 'autocomplete-editor', theme: 'main', status: 'measured', problems: 1 },
        { page: 'multiselect-editor', theme: 'main', status: 'measured' },
      ]),
    [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: null,
  });
  // "Re-run failed jobs": attempt 2 measured every target, the tree too. On the multiselect target attempt 1
  // measured, it no longer saw attempt 1's finding and saw another one: attempt 1's verdict there stands.
  const attempt2 = nightlyFiles({
    [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: evidenceDoc('keyboard-walker', [
      ...WALKER_FINDINGS.filter(item => item.page === 'autocomplete-editor'),
      { kind: 'focus-stop-unnamed', criteria: ['4.1.2'], severity: 'serious', selector: 'input.ht-multi-select-editor-search-input',
        step: 'where the popup put the focus', reason: 'The focus lands on a textbox with no accessible name', page: 'multiselect-editor',
        theme: 'main', state: 'editor' },
    ], [
      { page: 'autocomplete-editor', theme: 'main', status: 'measured' },
      { page: 'multiselect-editor', theme: 'main', status: 'measured' },
    ]),
  });
  const first = mergeA11yLedger(null, nightOf(attempt1), runContextFromRun(NIGHTLY), CATALOG, { now: NOW });

  assert.equal(first.doc.rows.length, 8);

  const rerun = runContextFromRun({ ...NIGHTLY, run_attempt: 2, updated_at: '2026-11-03T07:10:00Z' });
  const second = mergeA11yLedger(first.doc, nightOf(attempt2), rerun, CATALOG, { now: new Date(night(0.1)) });
  const kinds = second.doc.rows.filter(row => row.check === 'keyboard-walker' || row.check === 'tree-snapshots')
    .map(row => [row.kind, row.page, row.theme, row.status, row.lastSeen]);

  assert.equal(second.changed, true);
  assert.deepEqual(kinds, [
    ['focus-lost', 'multiselect-editor', 'main', 'new', NIGHTLY.updated_at],
    ['focus-not-returned', 'autocomplete-editor', 'main', 'new', NIGHTLY.updated_at],
    ['tab-keeps-focus', 'autocomplete-editor', 'main', 'new', NIGHTLY.updated_at],
    ['headers-after-data', 'grid', 'classic', 'new', NIGHTLY.updated_at],
    ['headers-after-data', 'grid', 'main', 'new', NIGHTLY.updated_at],
  ], 'the night keeps its time; on the target attempt 1 measured, its verdict stands, and attempt 2\'s new finding there is not added');
  assert.ok(second.doc.rows.every(row => row.nightsSeen === 1), 'a row attempt 1 sighted on a target it could not finish is not counted twice');
  assert.equal(second.doc.nights.length, 1);
  assert.deepEqual([second.doc.nights[0].runAttempt, second.doc.nights[0].seenAt, second.doc.nights[0].findings, second.doc.nights[0].new],
    [2, NIGHTLY.updated_at, 11, 11]);
  assert.deepEqual(second.doc.nights[0].coverage.checks['keyboard-walker'], ['autocomplete-editor|main|', 'multiselect-editor|main|']);
  assert.deepEqual(second.doc.nights[0].coverage.checks['tree-snapshots'], ['grid|classic|', 'grid|main|']);
  assert.deepEqual(second.doc.latest.a11y, { runId: '41584742628', seenAt: NIGHTLY.updated_at });
  assert.deepEqual([second.recorded.amended, second.recorded.runAttempt, second.recorded.findings], [true, 2, 11]);
  assert.match(renderA11yLine([second.recorded]), /^Accessibility: a11y night 41584742628 amended by attempt 2, now 11 findings \(11 new,/);

  // An attempt that measured nothing new changes nothing.
  const third = mergeA11yLedger(second.doc, nightOf(attempt2), runContextFromRun({ ...NIGHTLY, run_attempt: 3 }), CATALOG,
    { now: new Date(night(0.2)) });

  assert.equal(third.changed, false);
  assert.match(third.notes[0], /attempt 3 measured nothing attempt 2 had not/);

  // Once a later night of the source is recorded, an attempt of the earlier one changes nothing, and only the latest
  // night of a source keeps its coverage.
  const later = mergeA11yLedger(second.doc, nightOf(nightlyFiles()), runContextFromRun({ ...NIGHTLY, id: 41600000000, updated_at: night(1) }),
    CATALOG, { now: new Date(night(1)) }).doc;
  const refused = mergeA11yLedger(later, nightOf(attempt2), runContextFromRun({ ...NIGHTLY, run_attempt: 4 }), CATALOG, { now: new Date(night(1)) });

  assert.equal(refused.changed, false);
  assert.match(refused.notes[0], /attempt 4: attempt 2 is recorded and a later a11y night followed it/);
  assert.ok(later.nights.find(entry => entry.runId === '41600000000').coverage);
  assert.equal('coverage' in later.nights.find(entry => entry.runId === '41584742628'), false);

  // The rule is the latest night, not the stored coverage: an older night that still carries one is refused too.
  const tampered = { ...later, nights: later.nights.map(entry => (entry.runId === '41584742628' ? { ...entry, coverage: second.doc.nights[0].coverage } : entry)) };

  assert.equal(mergeA11yLedger(tampered, nightOf(attempt2), runContextFromRun({ ...NIGHTLY, run_attempt: 4 }), CATALOG,
    { now: new Date(night(1)) }).changed, false);
});

test('the catalog decides the cluster on every merge, and an ambiguous rule is noted and sorted to the first', () => {
  const first = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW }).doc;
  const renamed = compileIssuesCatalog({
    schema: ISSUES_SCHEMA,
    triageLimit: 0,
    clusters: [
      { id: 'escape-focus', title: 'Renamed', match: [{ source: 'checks', kinds: ['focus-not-returned', 'focus-lost', 'tab-keeps-focus'] }] },
      { id: 'editors', title: 'Overlaps the first', match: [{ source: 'checks', pages: ['autocomplete-editor'] }] },
    ],
  });
  const next = mergeA11yLedger(first, nightOf(nightlyFiles()), runContextFromRun({ ...NIGHTLY, id: 41600000000, updated_at: night(1) }),
    renamed, { now: new Date(night(1)) });
  const walker = next.doc.rows.filter(row => row.check === 'keyboard-walker');

  assert.deepEqual(walker.map(row => row.cluster), ['escape-focus', 'escape-focus', 'escape-focus']);
  assert.ok(next.doc.rows.filter(row => row.check !== 'keyboard-walker').every(row => row.cluster === TRIAGE_ID));
  // One note per set of clusters, with its row count: an overlapping rule over hundreds of rows is one line.
  assert.deepEqual(next.ambiguous, [{ clusters: ['escape-focus', 'editors'], rows: 2 }]);
  assert.deepEqual(next.notes.filter(note => /match clusters/.test(note)),
    ['2 row(s) match clusters escape-focus, editors; sorted to escape-focus; tests/a11y/issues.json needs one rule per finding']);
});

test('rows and nights fall out after the retention window, and the cap evicts the oldest resolved rows first', () => {
  const start = new Date('2026-06-01T06:00:00Z');
  const at = offset => new Date(start.getTime() + (offset * DAY)).toISOString();
  let doc = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun({ ...NIGHTLY, id: 41000000000, updated_at: at(0) }), CATALOG,
    { now: new Date(at(0)) }).doc;

  // Night 2, ten days later: the tree rows are resolved. Then a night 100 days after the first.
  doc = mergeA11yLedger(doc, nightOf(nightlyFiles({ [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: evidenceDoc('tree-snapshots', [],
    [{ page: 'grid', theme: 'main', status: 'measured' }, { page: 'grid', theme: 'classic', status: 'measured' }]) })),
  runContextFromRun({ ...NIGHTLY, id: 41000000010, updated_at: at(10) }), CATALOG, { now: new Date(at(10)) }).doc;
  assert.equal(rowsByKind(doc, 'headers-after-data').length, 2);

  const late = mergeA11yLedger(doc, nightOf(nightlyFiles()), runContextFromRun({ ...NIGHTLY, id: 41000000100, updated_at: at(100) }), CATALOG,
    { now: new Date(at(100)) });

  assert.equal(rowsByKind(late.doc, 'headers-after-data').length, 2, 'seen again on night 3, so the rows stay');
  assert.ok(late.doc.rows.every(row => row.lastSeen === at(100)), 'every row was seen on the last night');
  assert.deepEqual(late.doc.nights.map(item => item.runId), ['41000000100', '41000000010'], 'the first night is 100 days old: gone');
  assert.ok(late.doc.rows.every(row => row.firstSeen === at(0) || row.firstSeen === at(100)), 'a row keeps its first sighting');

  // Retention on rows: a row resolved on night 2 and never seen again is gone once its last sighting is 90 days old.
  const parked = mergeA11yLedger(doc, nightOf(nightlyFiles({ [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: evidenceDoc('tree-snapshots', [],
    [{ page: 'grid', theme: 'main', status: 'measured' }, { page: 'grid', theme: 'classic', status: 'measured' }]) })),
  runContextFromRun({ ...NIGHTLY, id: 41000000100, updated_at: at(100) }), CATALOG, { now: new Date(at(100)) });

  assert.equal(rowsByKind(parked.doc, 'headers-after-data').length, 0);
  assert.match(parked.notes.join('\n'), /2 row\(s\) older than 90 days dropped/);

  // The cap: resolved rows go first, oldest resolved first, then the oldest nights. Night 3 resolves the three
  // walker rows while the two tree rows stay resolved from night 2; a cap that fits everything but those two
  // evicts exactly them.
  const emptyNight = () => nightOf(nightlyFiles({
    [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: evidenceDoc('keyboard-walker', [],
      [{ page: 'autocomplete-editor', theme: 'main', status: 'measured' }, { page: 'multiselect-editor', theme: 'main', status: 'measured' }]),
    [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: evidenceDoc('tree-snapshots', [],
      [{ page: 'grid', theme: 'main', status: 'measured' }, { page: 'grid', theme: 'classic', status: 'measured' }]),
  }));
  const third = runContextFromRun({ ...NIGHTLY, id: 41000000011, updated_at: at(11) });
  const uncapped = mergeA11yLedger(doc, emptyNight(), third, CATALOG, { now: new Date(at(11)) }).doc;
  const treeRows = uncapped.rows.filter(row => row.kind === 'headers-after-data');

  assert.equal(treeRows.length, 2);
  assert.ok(treeRows.every(row => row.status === 'resolved' && row.resolvedAt === at(10)));
  assert.equal(uncapped.rows.filter(row => row.status === 'resolved').length, 5);

  const fullSize = Buffer.byteLength(serializeA11yLedger(uncapped));
  const treeBytes = treeRows.reduce((sum, row) => sum + Buffer.byteLength(JSON.stringify(row)) + 2, 0);
  const capBytes = fullSize - treeBytes + 1;
  const small = mergeA11yLedger(doc, emptyNight(), third, CATALOG, { now: new Date(at(11)), capBytes });
  const resolvedLeft = small.doc.rows.filter(row => row.status === 'resolved');

  assert.ok(Buffer.byteLength(serializeA11yLedger(small.doc)) <= capBytes,
    `${Buffer.byteLength(serializeA11yLedger(small.doc))} bytes against ${capBytes}; notes: ${small.notes.join(' / ')}`);
  assert.equal(small.doc.rows.filter(row => row.kind === 'headers-after-data').length, 0, 'the rows resolved on night 2 went');
  assert.deepEqual(resolvedLeft.map(row => [row.kind, row.resolvedAt]).sort(),
    [['focus-lost', at(11)], ['focus-not-returned', at(11)], ['tab-keeps-focus', at(11)]], 'the rows resolved on night 3 stayed');
  assert.equal(small.doc.rows.filter(row => row.status !== 'resolved').length, 6, 'every open row survives the cap');
  assert.equal(small.doc.nights.length, 3, 'no night was needed');
  assert.deepEqual(small.notes, [`a11y.json: dropped 2 resolved row(s) to stay under ${capBytes} bytes`]);
  assert.equal(small.doc.capBytes, capBytes);

  // Past what the resolved rows free, the oldest night goes first, never an open row or the latest night of a source.
  const withReader = mergeA11yLedger(doc, nightOf(readerFiles()), runContextFromRun({ ...READER_RUN, id: 41000000005, updated_at: at(5) }),
    CATALOG, { now: new Date(at(10)) }).doc;
  const full = mergeA11yLedger(withReader, emptyNight(), third, CATALOG, { now: new Date(at(11)) }).doc;
  const openRows = full.rows.filter(row => row.status !== 'resolved');
  const oneNightLess = serializeA11yLedger({ ...full, rows: openRows, nights: full.nights.filter(entry => entry.runId !== '41000000000') });
  const nightCap = Buffer.byteLength(oneNightLess);
  const evicted = mergeA11yLedger(withReader, emptyNight(), third, CATALOG, { now: new Date(at(11)), capBytes: nightCap });

  assert.deepEqual(evicted.doc.nights.map(entry => entry.runId), ['41000000011', '41000000010', '41000000005'], 'the oldest night went first');
  assert.deepEqual(evicted.doc.rows, openRows, 'every open row stayed');
  assert.deepEqual(evicted.notes, [
    `a11y.json: dropped 5 resolved row(s) to stay under ${nightCap} bytes`,
    `a11y.json: dropped the 1 oldest night(s) to stay under ${nightCap} bytes`,
  ]);

  // A cap no history fits: every older night goes, the latest a11y and reader nights stay, and the note says it is over.
  const tiny = mergeA11yLedger(withReader, emptyNight(), third, CATALOG, { now: new Date(at(11)), capBytes: 1000 });

  assert.deepEqual(tiny.doc.nights.map(entry => entry.runId), ['41000000011', '41000000005']);
  assert.deepEqual(tiny.doc.rows, openRows);
  assert.match(tiny.notes.at(-1), /^a11y\.json: \d+ bytes even without resolved rows and older nights, over the 1000-byte cap$/);
});

test('serializeA11yLedger writes one night and one row per line, and reads back as the same document', () => {
  const { doc } = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW });
  const text = serializeA11yLedger(doc);

  assert.deepEqual(JSON.parse(text), doc);
  assert.equal(text.split('\n').filter(line => line.startsWith('{"key":')).length, doc.rows.length);
  assert.equal(text.split('\n').filter(line => line.startsWith('{"runId":')).length, doc.nights.length);
  assert.ok(text.endsWith('}\n'));
  assert.throws(() => assertA11yVersion({ version: A11Y_VERSION + 1 }), /a11y\.json has version 2/);
  assert.doesNotThrow(() => assertA11yVersion(null));
  assert.doesNotThrow(() => assertA11yVersion(emptyA11yLedger()));
});

test('a11yView derives the clusters, their trend, the criteria, the reader verdicts and the triage queue, and is null before any night', () => {
  assert.equal(a11yView(null, CATALOG), null);
  assert.equal(a11yView(emptyA11yLedger(), CATALOG), null);

  let doc = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW }).doc;

  doc = mergeA11yLedger(doc, nightOf(readerFiles()), runContextFromRun(READER_RUN), CATALOG, { now: NOW }).doc;
  doc = mergeA11yLedger(doc, nightOf(nightlyFiles({
    [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: evidenceDoc('keyboard-walker', WALKER_FINDINGS.filter(item => item.kind !== 'focus-lost'),
      [{ page: 'autocomplete-editor', theme: 'main', status: 'measured' }, { page: 'multiselect-editor', theme: 'main', status: 'measured' }]),
  })), runContextFromRun({ ...NIGHTLY, id: 41600000000, updated_at: night(1) }), CATALOG, { now: new Date(night(1)) }).doc;

  const view = a11yView(doc, CATALOG);

  assert.equal(view.updatedAt, doc.updatedAt);
  // Six rows need triage: the walker's tab-keeps-focus, the discovery's region rule, and the reader steps the
  // test catalog has no rule for (the vo-webkit position, the nvda context menu and nested-rows level, a golden).
  assert.deepEqual(view.totals, { open: 15, new: 5, persisting: 10, flapping: 0, resolved: 1, triage: 6, clusters: 4, nights: 3 });
  assert.deepEqual(view.latest, {
    a11y: { runId: '41600000000', runAttempt: 1, seenAt: night(1), headSha: NIGHTLY.head_sha.slice(0, 10), workflow: A11Y_NIGHTLY_WORKFLOW },
    reader: { runId: '41579067604', runAttempt: 1, seenAt: READER_RUN.updated_at, headSha: NIGHTLY.head_sha.slice(0, 10), workflow: READER_NIGHTLY_WORKFLOW },
  });
  // Nights oldest first, as the trend reads them: [run id, seen at, source, findings, new, resolved, triage, problems, attempt].
  assert.deepEqual(view.nights, [
    ['41579067604', READER_RUN.updated_at, 'reader', 5, 5, 0, 4, 0, 1],
    ['41584742628', NIGHTLY.updated_at, 'a11y', 11, 11, 0, 2, 0, 1],
    ['41600000000', night(1), 'a11y', 10, 0, 1, 2, 0, 1],
  ]);

  const focus = view.clusters.find(cluster => cluster.id === 'focus-not-returned-after-escape');

  assert.equal(focus.title, 'The focus is not returned after Escape');
  assert.equal(focus.tracked, true, 'the page says whether a tracker exists, never which');
  assert.ok(!JSON.stringify(view).includes('DEV-3603'), 'no task id reaches the page');
  assert.deepEqual([focus.open, focus.new, focus.persisting, focus.flapping, focus.resolved], [2, 1, 1, 0, 1]);
  assert.equal(focus.nightsSeen, 3);
  assert.equal(focus.lastSeen, night(1));
  // One series per nightly the cluster comes from, over that nightly's nights only: [night index, seen, new, resolved].
  assert.deepEqual(focus.trends, [
    { source: 'a11y', points: [[1, 2, 2, 0], [2, 1, 0, 1]] },
    { source: 'reader', points: [[0, 1, 1, 0]] },
  ]);
  assert.deepEqual(view.clusters.find(cluster => cluster.id === 'overlay-clones-split-tree').trends.map(series => series.source), ['a11y'],
    'a cluster of the checks alone draws no reader night at zero');
  assert.deepEqual(focus.sources, [['checks', 1], ['reader', 1]]);
  assert.deepEqual(focus.kinds, [['focus-not-returned', 1], ['token-missing', 1]]);
  assert.deepEqual(focus.pages, [['autocomplete-editor', 1], ['grid-core', 1]]);
  assert.deepEqual(focus.severities, { serious: 2 });
  assert.deepEqual(focus.criteria, [['2.4.3', 1]]);

  const triage = view.clusters.find(cluster => cluster.id === TRIAGE_ID);

  assert.equal(triage.title, 'Needs triage');
  assert.equal(triage.open, 6);
  assert.deepEqual(view.clusters.map(cluster => cluster.id), ['menu-semantics', 'contrast-and-focus-visibility', 'focus-not-returned-after-escape',
    'overlay-clones-split-tree', TRIAGE_ID], 'most open first, triage last');

  assert.deepEqual(view.criteria.find(item => item.id === '1.4.3'), { id: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', open: 2,
    clusters: ['contrast-and-focus-visibility'] });
  assert.deepEqual(view.criteria.map(item => item.id), ['1.3.1', '1.3.2', '1.4.3', '2.1.1', '2.4.3']);
  assert.deepEqual(view.checks, [
    { check: 'axe', title: 'axe scan', targets: null, measured: null, findings: 3, problems: 0 },
    { check: 'axe-discovery', title: 'axe discovery run', targets: 3, measured: 3, findings: 3, problems: 0 },
    { check: 'keyboard-walker', title: 'Keyboard walker', targets: 2, measured: 2, findings: 2, problems: 0 },
    { check: 'tree-snapshots', title: 'Accessibility-tree snapshots', targets: 2, measured: 2, findings: 2, problems: 0 },
  ]);
  assert.deepEqual(view.reader.projects, ['nvda-chromium', 'vo-webkit']);
  assert.deepEqual(view.reader.scenarios[0], {
    scenario: 'grid-core',
    steps: ['arrow-right', 'close-editor', 'open-context-menu'],
    verdicts: {
      'nvda-chromium': { 'arrow-right': 'pass', 'close-editor': 'fail', 'open-context-menu': 'fail' },
      'vo-webkit': { 'arrow-right': 'fail', 'close-editor': 'pass', 'open-context-menu': 'golden' },
    },
    golden: { 'nvda-chromium': 'match', 'vo-webkit': 'differs' },
    incomplete: {},
  });
  assert.deepEqual(view.reader.scenarios[1].verdicts, { 'nvda-chromium': { 'collapse-parent': 'pass', 'down-to-child': 'fail' } },
    'a project that ran no transcript of a scenario has no verdicts for it');

  assert.equal(view.triage.total, 6);
  // Widest shape first, then the worst severity, then by check, kind and where: every shape here is one page, so
  // the serious reader steps lead, in id order.
  assert.deepEqual(view.triage.rows[0], { source: 'reader', check: 'nvda-chromium', kind: 'token-missing', rule: null, cause: null,
    where: 'down-to-child', severity: 'serious', criteria: [], reason: 'the announcement lacks: level 2 | 1 of 3',
    pages: 1, examplePage: 'nested-rows', nightsSeen: 1, status: 'new' });
  assert.deepEqual(view.triage.rows.map(row => [row.check, row.where]), [
    ['nvda-chromium', 'down-to-child'], ['nvda-chromium', 'open-context-menu'], ['vo-webkit', 'arrow-right'],
    ['axe-discovery', 'div.wtHolder[role="presentation"]'], ['keyboard-walker', 'textarea.handsontableInput[role="combobox"] @ Tab 1'],
    ['vo-webkit', 'open-context-menu'],
  ]);
  assert.deepEqual(view.triage.rows[3], { source: 'checks', check: 'axe-discovery', kind: 'axe-violation', rule: 'region', cause: null,
    where: 'div.wtHolder[role="presentation"]', severity: 'minor', criteria: [], reason: 'All page content should be contained by landmarks',
    pages: 1, examplePage: 'grid', nightsSeen: 2, status: 'persisting' });
  assert.ok(view.triage.rows.length <= A11Y_TRIAGE_SHOWN);
  assert.equal(view.trendNights, A11Y_TREND_NIGHTS);
  assert.equal(view.flapNights, A11Y_FLAP_NIGHTS);
});

test('a11yView groups the triage queue by shape across pages and caps what the page lists', () => {
  // One shape per selector, so the queue holds more shapes than the page lists.
  const many = Array.from({ length: A11Y_TRIAGE_SHOWN + 20 }, (_, index) => ({
    kind: 'unnamed-header', criteria: ['1.3.1'], severity: 'moderate', selector: `th.col-${index}[role="columnheader"]`, reason: 'A columnheader has no name',
    page: 'complex-demo', theme: 'main',
  }));
  const spread = [
    { kind: 'focusable-without-role', criteria: ['4.1.2'], severity: 'serious', selector: 'div.htFocusCatcher', reason: 'No role', page: 'grid', theme: 'main' },
    { kind: 'focusable-without-role', criteria: ['4.1.2'], severity: 'serious', selector: 'div.htFocusCatcher', reason: 'No role', page: 'comments', theme: 'main' },
    { kind: 'focusable-without-role', criteria: ['4.1.2'], severity: 'serious', selector: 'div.htFocusCatcher', reason: 'No role', page: 'comments', theme: 'classic' },
  ];
  const { doc } = mergeA11yLedger(null, nightOf(nightlyFiles({
    [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: evidenceDoc('tree-snapshots', [...spread, ...many]),
  })), runContextFromRun(NIGHTLY), CATALOG, { now: NOW });
  const view = a11yView(doc, CATALOG);

  assert.equal(view.triage.total, many.length + spread.length + 2);
  assert.equal(view.triage.shapes, many.length + 3, 'one shape per selector, one for the three focus-catcher rows');
  assert.equal(view.triage.rows.length, A11Y_TRIAGE_SHOWN);
  assert.deepEqual(view.triage.rows[0], { source: 'checks', check: 'tree-snapshots', kind: 'focusable-without-role', rule: null, cause: null,
    where: 'div.htFocusCatcher', severity: 'serious', criteria: ['4.1.2'], reason: 'No role', pages: 2,
    examplePage: 'comments', nightsSeen: 1, status: 'new' }, 'the widest shape first: two pages, three rows');
  assert.ok(view.triage.rows.slice(1).every(row => row.pages === 1));
});

test('renderA11yLine and the step summary name the night, its counts and its clusters', () => {
  const { recorded } = mergeA11yLedger(null, nightOf(nightlyFiles()), runContextFromRun(NIGHTLY), CATALOG, { now: NOW });
  const line = renderA11yLine([recorded]);

  assert.equal(line, 'Accessibility: a11y night 41584742628 recorded 11 findings (11 new, 0 resolved, 0 flapping, 2 need triage); '
    + 'clusters: menu-semantics 3, contrast-and-focus-visibility 2, focus-not-returned-after-escape 2, overlay-clones-split-tree 2, needs-triage 2.');
  assert.equal(renderA11yLine([]), '');

  const summary = aggregate(emptyLedger(), { now: NOW });
  const markdown = renderStepSummary({ run: runContextFromRun(NIGHTLY), added: [], notes: [], summary, pageUrl: 'https://x/', a11y: [recorded] });

  assert.ok(markdown.includes(line));
  assert.ok(!renderStepSummary({ run: runContextFromRun(NIGHTLY), added: [], notes: [], summary, pageUrl: 'https://x/' }).includes('Accessibility:'));
});

test('renderPage inlines the accessibility view escaped, the template reads it, and nothing in it becomes a link or markup', () => {
  const template = readFileSync(path.join(repoRoot(), '.github/test-health/index.template.html'), 'utf8');
  const hostile = evidenceDoc('tree-snapshots', [{
    kind: 'unnamed-control', criteria: ['4.1.2'], severity: 'serious', selector: 'div.x</script><b>bold</b>[role="listbox"]',
    reason: 'A listbox <img src=x onerror=alert(1)> has no name', page: 'grid', theme: 'main', url: 'javascript:alert(1)',
  }]);
  let doc = mergeA11yLedger(null, nightOf(nightlyFiles({ [`${A11Y_EVIDENCE_ARTIFACT}/tree-snapshots.json`]: hostile })),
    runContextFromRun(NIGHTLY), CATALOG, { now: NOW }).doc;

  doc = mergeA11yLedger(doc, nightOf(readerFiles()), runContextFromRun(READER_RUN), CATALOG, { now: NOW }).doc;

  const view = a11yView(doc, CATALOG);
  const summary = aggregate(emptyLedger(), { now: NOW });
  const html = renderPage(template, summary, null, view);

  assert.ok(!html.includes('__A11Y_JSON__'));
  assert.match(html, /<h2 id="a11y">Accessibility<\/h2>/);
  assert.match(html, /<nav class="sections"[^>]*>.*<a href="#a11y">Accessibility<\/a>/);
  assert.ok(html.includes('div.x\\u003c/script>\\u003cb>bold\\u003c/b>[role=\\"listbox\\"]'), 'a selector cannot close the data element');
  assert.equal((html.match(/<\/script>/g) ?? []).length, 4, 'three data elements and the code');

  const open = '<script id="a11y-data" type="application/json">';
  const start = html.indexOf(open) + open.length;
  const data = html.slice(start, html.indexOf('</script>', start));

  assert.ok(!data.includes('<'), 'no `<` reaches the data element');
  assert.deepEqual(JSON.parse(data), JSON.parse(JSON.stringify(view)));
  assert.ok(!JSON.parse(data).triage.rows.some(row => 'url' in row), 'the page gets no URL from the data');

  const empty = renderPage(template, summary);

  assert.ok(empty.includes('<script id="a11y-data" type="application/json">null</script>'), 'a page rendered before any night still parses');

  const code = html.split('<script>').slice(1).map(part => part.slice(0, part.indexOf('</script>')));

  assert.equal(code.length, 1);
  assert.doesNotThrow(() => new vm.Script(code[0]));
  // Every link the section sets comes from the run-number helper, never from the data.
  const section = code[0].slice(code[0].indexOf('a11y-body'));

  assert.ok(!/\.href = (?!href;)/.test(section), 'every link the accessibility section sets comes from runPage');
  assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML/.test(code[0]), 'the page never builds markup from strings');
});

test('the rendered accessibility section is accessible markup: tables with header cells, headings in order, every chart named', () => {
  const template = readFileSync(path.join(repoRoot(), '.github/test-health/index.template.html'), 'utf8');
  const start = template.indexOf('<section class="a11y ');
  const section = template.slice(start, template.indexOf('</section>', start));

  assert.ok(start > 0, 'the section is there');

  assert.ok(section.includes('aria-labelledby="a11y"'));
  for (const table of section.match(/<table[\s\S]*?<\/table>/g) ?? []) {
    assert.match(table, /<thead><tr>(<th[^>]*>[^<]+<\/th>)+<\/tr><\/thead>/, `a table has a header row: ${table.slice(0, 80)}`);
  }
  assert.ok((section.match(/<h3/g) ?? []).length >= 4, 'the section has its subsections');
  assert.ok(!section.includes('<h4') || section.includes('<h3'), 'no heading level is skipped');
  // The status of a row is a word in a badge, never a color alone.
  assert.ok(!section.includes('style="color'), 'no inline color conveys a state');

  const code = template.slice(template.indexOf("document.getElementById('a11y-data').textContent"));

  assert.ok(code.includes("chart.setAttribute('role', 'img')") && code.includes("chart.setAttribute('aria-label', cluster.title + ', ' + name"),
    'a trend chart is an image named after its cluster and its nightly');
});

test('test-health.yml chains on the two nightlies, downloads the three artifacts for a develop run only, and hands the collector the catalog', () => {
  const health = readFileSync(path.join(repoRoot(), '.github/workflows/test-health.yml'), 'utf8');
  const collect = steps(job(health, 'collect'));
  const describe = collect.find(step => step.startsWith('- name: Describe the run\n'));
  const download = collect.find(step => step.startsWith('- name: Download the run\'s test artifacts\n'));
  const update = collect.find(step => step.startsWith('- name: Update the ledger on GitHub Pages\n'));

  assert.ok(describe && download && update, 'lost a step');
  assert.match(health, /workflows: \['Tests', 'Develop', 'Publish', 'Visual nightly', 'E2E nightly', 'A11y nightly', 'Screen reader nightly'\]/);
  assert.match(readFileSync(path.join(repoRoot(), '.github/workflows/a11y-nightly.yml'), 'utf8'), new RegExp(`^name: ${A11Y_NIGHTLY_WORKFLOW}$`, 'm'));
  assert.match(readFileSync(path.join(repoRoot(), '.github/workflows/screenreader-nightly.yml'), 'utf8'), new RegExp(`^name: ${READER_NIGHTLY_WORKFLOW}$`, 'm'));
  assert.ok(describe.includes('import { isA11yRun } from \'./.github/scripts/lib/a11y-ledger.mjs\';'), 'the lib owns the develop rule');
  // eslint-disable-next-line no-template-curly-in-string
  assert.ok(describe.includes('echo "A11Y_RUN=${A11Y_RUN}" >> "$GITHUB_ENV"'));
  const family = `"^(${A11Y_EVIDENCE_ARTIFACT}$|${A11Y_AXE_ARTIFACT}$|${READER_ARTIFACT_PREFIX})"`;

  assert.ok(download.includes(`or (.name | test(${family}))`), 'the family is in the allowlist, by exact names and the transcript prefix');
  assert.ok(download.includes(`select((.name | test(${family}) | not) or env.A11Y_RUN == "true")`), 'and filtered on the flag');
  assert.match(update, /--catalog tests\/a11y\/issues\.json/);

  // The names the collector reads are the ones the workflows upload.
  const a11y = readFileSync(path.join(repoRoot(), '.github/workflows/a11y.yml'), 'utf8');
  const screenreader = readFileSync(path.join(repoRoot(), '.github/workflows/screenreader.yml'), 'utf8');

  assert.match(a11y, new RegExp(`^ {10}name: ${A11Y_EVIDENCE_ARTIFACT}$`, 'm'));
  assert.match(a11y, new RegExp(`^ {10}name: ${A11Y_AXE_ARTIFACT}$`, 'm'));
  assert.match(a11y, /^ {10}path: tests\/test-results\/a11y-checks$/m, 'the documents sit at the evidence artifact\'s root');
  assert.match(a11y, /^ {10}path: tests\/test-results\/a11y$/m, 'the findings sit at the axe artifact\'s root');
  assert.match(screenreader, new RegExp(`^ {10}name: ${READER_ARTIFACT_PREFIX}nvda-\\$\\{\\{ matrix\\.browser \\}\\}-\\$\\{\\{ matrix\\.group \\}\\}$`, 'm'));
  assert.match(screenreader, new RegExp(`^ {10}name: ${READER_ARTIFACT_PREFIX}vo-\\$\\{\\{ matrix\\.browser \\}\\}-\\$\\{\\{ matrix\\.group \\}\\}$`, 'm'));
  assert.match(screenreader, /^ {10}path: tests\/test-results\/screenreader$/m, `the transcripts sit under ${READER_TRANSCRIPTS_DIR}/ in the artifact`);
  assert.ok(readFileSync(path.join(repoRoot(), 'tests/screenreader/screenreader.spec.ts'), 'utf8')
    .includes(`'test-results/screenreader/${READER_TRANSCRIPTS_DIR}'`), 'the spec writes the transcripts where the collector reads them');
});

const PAGE_FILES = ['ledger.json', 'summary.json', 'durations.json', 'a11y.json', 'index.html'];

/**
 * A temporary gh-pages checkout and artifact directories for the collector CLI.
 *
 * @returns {object} The sandbox.
 */
function collectorSandbox() {
  const dir = mkdtempSync(path.join(tmpdir(), 'a11y-collect-'));
  const ledgerDir = path.join(dir, 'gh-pages/test-health');

  return {
    ledgerDir,
    artifacts(name, files) {
      const root = path.join(dir, name);

      mkdirSync(root, { recursive: true });

      for (const file of files) {
        const target = path.join(root, file.artifact, file.path);

        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, file.text);
      }

      return root;
    },
    collect(run, artifactsDir, now, { catalog = path.join(repoRoot(), 'tests/a11y/issues.json') } = {}) {
      const runFile = path.join(dir, `run-${run.id}-${run.run_attempt}.json`);

      writeFileSync(runFile, JSON.stringify(run));

      const result = spawnSync(process.execPath, [path.join(repoRoot(), '.github/scripts/test-health-collect.mjs'),
        '--run', runFile,
        '--artifacts', artifactsDir,
        '--ledger-dir', ledgerDir,
        '--template', path.join(repoRoot(), '.github/test-health/index.template.html'),
        ...(catalog ? ['--catalog', catalog] : []),
        '--now', now,
      ], { cwd: repoRoot(), encoding: 'utf8', env: { ...process.env, GITHUB_RUN_ID: '', GITHUB_RUN_ATTEMPT: '' } });

      return { status: result.status, stdout: result.stdout, stderr: result.stderr };
    },
    snapshot() {
      return Object.fromEntries(PAGE_FILES.filter(name => existsSync(path.join(ledgerDir, name)))
        .map(name => [name, readFileSync(path.join(ledgerDir, name), 'utf8')]));
    },
    remove() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test('the collector records a develop nightly into a11y.json and the page, and a second collection is byte-identical', () => {
  const sandbox = collectorSandbox();

  try {
    const first = sandbox.collect(NIGHTLY, sandbox.artifacts('nightly', nightlyFiles()), '2026-11-03T06:00:00Z');

    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /Accessibility: a11y night 41584742628 recorded 11 findings/);

    const written = JSON.parse(readFileSync(path.join(sandbox.ledgerDir, 'a11y.json'), 'utf8'));

    assert.equal(written.version, A11Y_VERSION);
    assert.equal(written.rows.length, 11);
    assert.ok(written.rows.some(row => row.cluster !== TRIAGE_ID), 'the committed catalog mapped something');

    const page = readFileSync(path.join(sandbox.ledgerDir, 'index.html'), 'utf8');

    assert.ok(page.includes('<script id="a11y-data" type="application/json">{"updatedAt":'));

    const before = sandbox.snapshot();

    // No durations.json: a schedule is not a develop push.
    assert.deepEqual(Object.keys(before).sort(), ['a11y.json', 'index.html', 'ledger.json', 'summary.json']);

    const reader = sandbox.collect(READER_RUN, sandbox.artifacts('reader', readerFiles()), '2026-11-03T06:30:00Z');

    assert.equal(reader.status, 0, reader.stderr);
    assert.match(reader.stdout, /Accessibility: reader night 41579067604 recorded 5 findings/);
    assert.equal(JSON.parse(readFileSync(path.join(sandbox.ledgerDir, 'a11y.json'), 'utf8')).rows.length, 16);

    const after = sandbox.snapshot();
    const again = sandbox.collect({ ...READER_RUN, run_attempt: 2 }, sandbox.artifacts('reader-again', readerFiles()), '2026-11-03T07:00:00Z');

    assert.equal(again.status, 0, again.stderr);
    assert.deepEqual(sandbox.snapshot(), after, 'collecting the same run again changes no published byte');
    assert.match(again.stdout, /already recorded/);
  } finally {
    sandbox.remove();
  }
});

test('a pull request run with accessibility artifacts records nothing, and a run without them leaves the files alone', () => {
  const sandbox = collectorSandbox();

  try {
    const first = sandbox.collect(NIGHTLY, sandbox.artifacts('nightly', nightlyFiles()), '2026-11-03T06:00:00Z');

    assert.equal(first.status, 0, first.stderr);

    const before = sandbox.snapshot();
    const pullRequest = sandbox.collect(PULL_REQUEST, sandbox.artifacts('pr', nightlyFiles()), '2026-11-03T08:00:00Z');

    assert.equal(pullRequest.status, 0, pullRequest.stderr);
    assert.deepEqual(sandbox.snapshot(), before, 'a pull request\'s evidence changes no published byte');
    assert.match(pullRequest.stdout, /4 accessibility artifact file\(s\) not recorded: only the A11y and Screen reader nightlies on develop are/);

    // A fork's pull request opened from the fork's own develop: its Tests run reports develop as its branch, and its
    // evidence would resolve every walker row its code no longer shows.
    const forkDevelop = sandbox.collect({ ...PULL_REQUEST, id: 41799999999, head_branch: 'develop' }, sandbox.artifacts('fork', nightlyFiles({
      [`${A11Y_EVIDENCE_ARTIFACT}/keyboard-walker.json`]: evidenceDoc('keyboard-walker', [], [
        { page: 'autocomplete-editor', theme: 'main', status: 'measured' }, { page: 'multiselect-editor', theme: 'main', status: 'measured' }]),
    })), '2026-11-03T08:30:00Z');

    assert.equal(forkDevelop.status, 0, forkDevelop.stderr);
    assert.deepEqual(sandbox.snapshot(), before, 'a pull request from a branch named develop changes no published byte');
    assert.ok(!forkDevelop.stdout.includes('Accessibility:'));

    const nothing = sandbox.collect({ ...NIGHTLY, id: 41584742999, name: 'E2E nightly' }, sandbox.artifacts('empty', []), '2026-11-03T09:00:00Z');

    assert.equal(nothing.status, 0, nothing.stderr);
    assert.deepEqual(sandbox.snapshot(), before, 'a develop run without the family changes nothing');
    assert.ok(!nothing.stdout.includes('Accessibility:'));
  } finally {
    sandbox.remove();
  }
});

test('the collector warns on the run when a row matches two clusters or a night has more triage shapes than the catalog allows', () => {
  const sandbox = collectorSandbox();

  try {
    const catalogFile = path.join(sandbox.ledgerDir, '..', 'overlapping-catalog.json');

    mkdirSync(sandbox.ledgerDir, { recursive: true });
    writeFileSync(catalogFile, JSON.stringify({
      schema: ISSUES_SCHEMA,
      triageLimit: 1,
      clusters: [
        { id: 'escape-focus', title: 'Escape', match: [{ source: 'checks', kinds: ['focus-not-returned', 'focus-lost'] }] },
        { id: 'editors', title: 'Overlaps the first', match: [{ source: 'checks', pages: ['autocomplete-editor'] }] },
      ],
    }));

    const run = sandbox.collect(NIGHTLY, sandbox.artifacts('nightly', nightlyFiles()), '2026-11-03T06:00:00Z', { catalog: catalogFile });

    // The walker's focus-not-returned on the autocomplete editor page matches both clusters. Eight rows need triage
    // (the discovery's three, the scan's three, the tree's two), in six shapes: a shape leaves the theme out.
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stderr, /^::warning title=Test health::1 accessibility row\(s\) match clusters escape-focus, editors: tests\/a11y\/issues\.json needs one rule per finding$/m);
    assert.match(run.stderr, /^::warning title=Test health::the a11y night 41584742628 has 6 finding shape\(s\) in needs-triage, over the catalog's triageLimit of 1/m);
    assert.match(run.stdout, /has 6 finding shape\(s\) in needs-triage/, 'and the step summary says it too');

    // The committed catalog over the same night raises neither.
    const clean = sandbox.collect({ ...NIGHTLY, id: 41584742700, updated_at: '2026-11-04T05:44:30Z' }, sandbox.artifacts('nightly-2', nightlyFiles()),
      '2026-11-04T06:00:00Z');

    assert.equal(clean.status, 0, clean.stderr);
    assert.ok(!clean.stderr.includes('::warning'), clean.stderr);
  } finally {
    sandbox.remove();
  }
});

test('an a11y.json the collector cannot read, or a missing catalog, is left as it is with a warning, and the flake ledger is still written', () => {
  const sandbox = collectorSandbox();

  try {
    mkdirSync(sandbox.ledgerDir, { recursive: true });
    writeFileSync(path.join(sandbox.ledgerDir, 'a11y.json'), '{"version": 1, "rows": [');

    const broken = sandbox.collect(NIGHTLY, sandbox.artifacts('nightly', nightlyFiles()), '2026-11-03T06:00:00Z');

    assert.equal(broken.status, 0, 'never fails the job over its input');
    assert.equal(readFileSync(path.join(sandbox.ledgerDir, 'a11y.json'), 'utf8'), '{"version": 1, "rows": [', 'left as it is');
    assert.match(broken.stderr, /::warning title=Test health::a11y\.json was left as it is/);
    assert.match(broken.stdout, /a11y\.json was left as it is/);
    assert.ok(existsSync(path.join(sandbox.ledgerDir, 'ledger.json')), 'the flake ledger is written all the same');
    assert.ok(readFileSync(path.join(sandbox.ledgerDir, 'index.html'), 'utf8').includes('<script id="a11y-data" type="application/json">{"error":'));

    rmSync(path.join(sandbox.ledgerDir, 'a11y.json'));

    const noCatalog = sandbox.collect(NIGHTLY, sandbox.artifacts('nightly-2', nightlyFiles()), '2026-11-03T06:00:00Z', { catalog: null });

    assert.equal(noCatalog.status, 0, noCatalog.stderr);
    assert.ok(!existsSync(path.join(sandbox.ledgerDir, 'a11y.json')), 'nothing recorded without the catalog');
    assert.match(noCatalog.stdout, /no --catalog/);

    const badCatalog = path.join(sandbox.ledgerDir, 'bad-catalog.json');

    writeFileSync(badCatalog, JSON.stringify({ schema: ISSUES_SCHEMA, triageLimit: 0, clusters: [{ id: 'x', title: 'T', match: [] }] }));

    const invalid = sandbox.collect(NIGHTLY, sandbox.artifacts('nightly-3', nightlyFiles()), '2026-11-03T06:00:00Z', { catalog: badCatalog });

    assert.equal(invalid.status, 0, invalid.stderr);
    assert.ok(!existsSync(path.join(sandbox.ledgerDir, 'a11y.json')), 'an invalid catalog records nothing');
    assert.match(invalid.stderr, /::warning title=Test health::a11y\.json was left as it is: .*no match rule/);
  } finally {
    sandbox.remove();
  }
});
