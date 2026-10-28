import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeMarkdownText } from '../a11y-baseline.mjs';
import {
  EVIDENCE_CHECKS,
  EVIDENCE_MODE,
  EVIDENCE_SCHEMA,
  SEVERITIES,
  WCAG_CRITERIA,
  buildEvidenceCheckRun,
  checkRunName,
  checksForSuite,
  compareCriteria,
  criterionInfo,
  evidenceHeadline,
  findingId,
  measuredText,
  mergeEvidence,
  renderEvidenceSummary,
  runCommit,
  targetFileName,
  validateEvidence,
  validatePart,
} from '../a11y-evidence.mjs';

// tests/AGENTS.md ("A11y: the checks beyond axe"): every check writes one evidence document in this
// shape, the conformance report generator cites it per criterion, and the check run that reports it is
// never a failure. Plain `node --test`, no packages: the root `test:tooling` installs nothing.

const CHECKS = {
  'demo-check': { title: 'Demo check', criteria: ['2.4.3', '2.1.2'] },
};

/**
 * One evidence part, as a check's test attaches it.
 *
 * @param {object} [overrides] Fields to replace.
 * @returns {object} The part.
 */
function part(overrides = {}) {
  return {
    schema: EVIDENCE_SCHEMA,
    target: { page: 'grid', theme: 'main', state: 'none', url: '/tests/fixtures/demo/grid.html?theme=main' },
    durationMs: 812.4,
    environment: { browser: 'chromium', browserVersion: '140.0', handsontableVersion: '18.2.0', handsontableBuildDate: '27/10/2026' },
    findings: [],
    ...overrides,
  };
}

const TRAP = {
  kind: 'keyboard-trap',
  criteria: ['2.1.2'],
  severity: 'serious',
  selector: 'td.current',
  measured: { presses: 40 },
  reason: 'Tab never left the grid',
};
const ORDER = {
  kind: 'tab-order-changed',
  criteria: ['2.4.3'],
  severity: 'advisory',
  step: 'Tab 3',
  reason: 'The tab order differs from the golden',
};

test('the tier is report-only, and the mode is one pinned constant', () => {
  assert.equal(EVIDENCE_MODE, 'report', 'flipping a check to gating changes EVIDENCE_MODE, this test and tests/AGENTS.md together');
  assert.deepEqual(SEVERITIES, ['critical', 'serious', 'moderate', 'minor', 'advisory']);
});

test('every registered check names a spec that exists, criteria from the table, and whether pull requests run it', () => {
  const specs = readdirSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../a11y/checks'));

  for (const [id, check] of Object.entries(EVIDENCE_CHECKS)) {
    assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(specs.includes(check.spec), `${id}: a11y/checks/${check.spec} exists`);
    assert.ok(check.criteria.length > 0 && check.criteria.every(criterion => criterionInfo(criterion)), `${id}: WCAG 2.2 criteria`);
    assert.equal(typeof check.pullRequest, 'boolean', `${id}: says whether pull requests run it`);
  }
});

test('a suite picks its checks: pull requests run the quick ones, the nightly and a local run every one', () => {
  const checks = { quick: { pullRequest: true }, slow: { pullRequest: false } };

  assert.deepEqual(checksForSuite('pull-request', checks), ['quick']);
  assert.deepEqual(checksForSuite('nightly', checks), ['quick', 'slow']);
  assert.deepEqual(checksForSuite(undefined, checks), ['quick', 'slow']);
  assert.throws(() => checksForSuite('pr', checks), /must be one of pull-request, nightly/);
});

test('the WCAG table is WCAG 2.2: 31 A, 24 AA and 31 AAA criteria, without the obsolete 4.1.1', () => {
  const levels = Object.values(WCAG_CRITERIA).reduce((counts, { level }) => ({ ...counts, [level]: (counts[level] ?? 0) + 1 }), {});

  assert.deepEqual(levels, { A: 31, AA: 24, AAA: 31 });
  assert.equal(criterionInfo('4.1.1'), null, '4.1.1 Parsing is obsolete in WCAG 2.2');
  assert.deepEqual(criterionInfo('2.4.11'), { id: '2.4.11', name: 'Focus Not Obscured (Minimum)', level: 'AA' });
  assert.equal(criterionInfo('constructor'), null, 'an inherited property is not a criterion');
  assert.deepEqual(['1.4.10', '1.4.9', '1.4.1', '2.1.1', '1.10.1'].sort(compareCriteria), ['1.4.1', '1.4.9', '1.4.10', '1.10.1', '2.1.1']);
});

test('the names a check writes under: the check run, the detail file, the finding id', () => {
  assert.equal(checkRunName('keyboard-walker'), 'A11y / keyboard-walker report');
  assert.equal(targetFileName({ page: 'grid', theme: 'main' }), 'grid--main.json');
  assert.equal(targetFileName({ page: 'grid', theme: 'main', variant: 'dark' }), 'grid--main--dark.json');
  assert.equal(findingId('demo-check', { ...TRAP, page: 'grid', theme: 'main' }), 'demo-check|keyboard-trap|grid|main||td.current');
  assert.equal(findingId('demo-check', { ...ORDER, page: 'grid', theme: 'main', variant: 'rtl' }), 'demo-check|tab-order-changed|grid|main|rtl|Tab 3');
  assert.equal(findingId('demo-check', { ...TRAP, step: 'Shift+Tab 2', page: 'grid', theme: 'main' }), 'demo-check|keyboard-trap|grid|main||td.current|Shift+Tab 2',
    'a finding that names an element and a step keys on both');
});

test('run.commit is the pull request\'s head, never the merge commit', () => {
  const readHead = () => 'checkout-head';

  assert.equal(runCommit({ A11Y_HEAD_SHA: 'head', GITHUB_SHA: 'merge', GITHUB_EVENT_NAME: 'pull_request' }, readHead), 'head');
  assert.equal(runCommit({ GITHUB_SHA: 'merge', GITHUB_EVENT_NAME: 'pull_request' }, readHead), null,
    'on a pull request GITHUB_SHA and the checkout are the merge commit');
  assert.equal(runCommit({ GITHUB_SHA: 'base', GITHUB_EVENT_NAME: 'pull_request_target' }, readHead), null);
  assert.equal(runCommit({ GITHUB_SHA: 'tip', GITHUB_EVENT_NAME: 'schedule' }, readHead), 'tip');
  assert.equal(runCommit({}, readHead), 'checkout-head');
});

test('a well-formed part has no problems, and every malformed field is named', () => {
  assert.deepEqual(validatePart(part({ findings: [TRAP, ORDER] })), []);
  assert.deepEqual(validatePart(part({ criteria: ['2.4.3'] })), []);

  const problems = validatePart(part({
    schema: 2,
    target: { page: '', theme: 'main', state: 3 },
    durationMs: -1,
    criteria: ['9.9.9'],
    findings: [
      { ...TRAP, severity: 'blocker' },
      { ...TRAP, criteria: ['4.1.1'] },
      { ...TRAP, criteria: [] },
      { kind: 'Not Kebab', criteria: ['2.1.1'], severity: 'minor', reason: ' ' },
      { ...TRAP, measured: 'forty' },
      { ...TRAP, file: '../outside.json', line: 0 },
    ],
  }));

  assert.deepEqual(problems, [
    'schema is 2, not 1',
    'target.page is not a non-empty string',
    'target.state is not a string',
    'durationMs is not a non-negative number',
    'criteria names "9.9.9", which is not a WCAG 2.2 criterion',
    'findings[0].severity is "blocker", not one of critical, serious, moderate, minor, advisory',
    'findings[1].criteria names "4.1.1", which is not a WCAG 2.2 criterion',
    'findings[2].criteria is not a non-empty array',
    'findings[3].kind is not a kebab-case id',
    'findings[3].reason is empty',
    'findings[3] names neither a selector nor a step',
    'findings[4].measured is not an object',
    'findings[5].file is not a path under tests/',
    'findings[5].line is not a positive integer',
  ]);
  assert.deepEqual(validatePart(null), ['the part is not an object']);
});

test('merging the parts counts every criterion a measured target evaluated, findings or none', () => {
  const doc = mergeEvidence({
    check: 'demo-check',
    checks: CHECKS,
    parts: [
      part({ findings: [ORDER, TRAP] }),
      part({ target: { page: 'grid', theme: 'horizon', state: 'none' }, findings: [] }),
      part({ target: { page: 'dialog', theme: 'main', state: 'none' }, criteria: ['2.1.2'], findings: [], detail: { stops: [] } }),
    ],
    run: { commit: 'abc123', ref: 'develop', startedAt: '2026-10-27T10:00:00.000Z', durationMs: 4000 },
  });

  assert.deepEqual(validateEvidence(doc, { checks: CHECKS }), []);
  assert.equal(doc.schema, EVIDENCE_SCHEMA);
  assert.equal(doc.mode, 'report');
  assert.deepEqual(doc.criteria, ['2.4.3', '2.1.2']);
  assert.deepEqual(doc.run, {
    commit: 'abc123', ref: 'develop', runUrl: null, startedAt: '2026-10-27T10:00:00.000Z', durationMs: 4000, project: 'demo-check',
    browser: 'chromium', browserVersion: '140.0', handsontableVersion: '18.2.0', handsontableBuildDate: '27/10/2026',
  });
  assert.deepEqual(doc.targets.map(target => [target.page, target.theme, target.status, target.criteria, target.findings, target.detail]), [
    ['dialog', 'main', 'measured', ['2.1.2'], 0, 'demo-check/dialog--main.json'],
    ['grid', 'horizon', 'measured', ['2.1.2', '2.4.3'], 0, null],
    ['grid', 'main', 'measured', ['2.1.2', '2.4.3'], 2, null],
  ]);
  assert.deepEqual(doc.findings.map(finding => [finding.severity, finding.kind, finding.page, finding.id]), [
    ['serious', 'keyboard-trap', 'grid', 'demo-check|keyboard-trap|grid|main||td.current'],
    ['advisory', 'tab-order-changed', 'grid', 'demo-check|tab-order-changed|grid|main||Tab 3'],
  ], 'worst first');
  assert.equal(doc.findings[0].url, '/tests/fixtures/demo/grid.html?theme=main', 'a finding carries its target, so it locates on its own');
  assert.deepEqual(doc.summary.byCriterion, {
    '2.1.2': { name: 'No Keyboard Trap', level: 'A', evaluated: 3, findings: 1, pages: ['grid'] },
    '2.4.3': { name: 'Focus Order', level: 'A', evaluated: 2, findings: 1, pages: ['grid'] },
  });
  assert.deepEqual(doc.summary.bySeverity, { critical: 0, serious: 1, moderate: 0, minor: 0, advisory: 1 });
  assert.deepEqual(doc.summary.byKind, { 'keyboard-trap': 1, 'tab-order-changed': 1 });
  assert.deepEqual(doc.problems, []);
});

test('a finding outside the check\'s criteria is counted under its own criterion, evaluated by none', () => {
  const unnamed = { kind: 'focus-stop-unnamed', criteria: ['4.1.2'], severity: 'serious', selector: 'button', reason: 'no name' };
  const doc = mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part({ findings: [unnamed] })] });

  assert.deepEqual(doc.summary.byCriterion['4.1.2'], { name: 'Name, Role, Value', level: 'A', evaluated: 0, findings: 1, pages: ['grid'] });
});

test('a test that did not measure is an error target and a problem; one that measured on a retry is flagged', () => {
  const doc = mergeEvidence({
    check: 'demo-check',
    checks: CHECKS,
    parts: [part()],
    failures: [
      { title: 'dialog on main', target: { page: 'dialog', theme: 'main', state: 'none' }, error: '\u001b[31mError: the menu did not open\u001b[39m\n    at spec.ts:10' },
      { title: 'grid on main', target: { page: 'grid', theme: 'main' }, error: 'Timeout 20000ms exceeded', flaky: true },
      { title: 'a test with no target', target: null, error: '' },
    ],
  });

  assert.deepEqual(doc.targets.map(target => [target.page, target.status, target.flaky, target.error]), [
    ['dialog', 'error', false, 'Error: the menu did not open'],
    ['grid', 'measured', true, undefined],
    [null, 'error', false, 'unknown error'],
  ], 'a target the reporter could not name sorts last');
  assert.deepEqual(doc.problems, [
    'dialog on main did not measure: Error: the menu did not open',
    'a test with no target did not measure: unknown error',
    'grid on main measured only on a retry (a flaky check is a finding against the check): Timeout 20000ms exceeded',
  ]);
  assert.deepEqual([doc.summary.targets, doc.summary.measured, doc.summary.errors, doc.summary.flaky], [3, 1, 2, 1]);
  assert.deepEqual(validateEvidence(doc, { checks: CHECKS }), [], 'an error target is part of a valid document');
});

test('a part that measured can report a step it could not take as a problem, and keep its findings', () => {
  const doc = mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part({ findings: [TRAP], problems: ['probe Ctrl+M: the range was not selected'] })] });

  assert.deepEqual(doc.problems, ['grid on main: probe Ctrl+M: the range was not selected']);
  assert.equal(doc.findings.length, 1);
  assert.deepEqual(validatePart(part({ problems: [3] })), ['problems is not an array of strings']);
});

test('a finding cannot move itself to another target or take another id', () => {
  const stray = { ...TRAP, id: 'focus-visible', page: 'dialog', theme: 'horizon', variant: 'rtl', url: '/elsewhere.html' };
  const doc = mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part({ findings: [stray] })] });

  assert.deepEqual([doc.findings[0].id, doc.findings[0].page, doc.findings[0].theme, doc.findings[0].variant, doc.findings[0].url],
    ['demo-check|keyboard-trap|grid|main||td.current', 'grid', 'main', null, '/tests/fixtures/demo/grid.html?theme=main']);
  assert.deepEqual(doc.summary.byCriterion['2.1.2'].pages, ['grid']);
});

test('two findings that share an id are a problem; one element at two steps is two findings', () => {
  const doc = mergeEvidence({
    check: 'demo-check',
    checks: CHECKS,
    parts: [part({ findings: [{ ...TRAP, step: 'Tab 2' }, { ...TRAP, step: 'ArrowDown from (1, 1)' }, ORDER, ORDER] })],
  });

  assert.deepEqual(doc.findings.map(finding => finding.id), [
    'demo-check|keyboard-trap|grid|main||td.current|ArrowDown from (1, 1)',
    'demo-check|keyboard-trap|grid|main||td.current|Tab 2',
    'demo-check|tab-order-changed|grid|main||Tab 3',
    'demo-check|tab-order-changed|grid|main||Tab 3',
  ]);
  assert.deepEqual(doc.problems, ['2 findings share the id demo-check|tab-order-changed|grid|main||Tab 3: give each its own selector or step']);
});

test('two parts for one target: the first is kept, the second is a problem, and the target counts once', () => {
  const doc = mergeEvidence({
    check: 'demo-check',
    checks: CHECKS,
    parts: [
      part({ findings: [TRAP], detail: { first: true } }),
      part({ target: { page: 'grid', theme: 'main', state: 'context-menu' }, findings: [ORDER] }),
      part({ target: { page: 'grid', theme: 'main', variant: 'rtl' } }),
    ],
  });

  assert.deepEqual(doc.targets.map(target => [target.page, target.variant, target.state, target.findings]), [
    ['grid', null, 'none', 1],
    ['grid', 'rtl', null, 0],
  ]);
  assert.deepEqual(doc.findings.map(finding => finding.kind), ['keyboard-trap']);
  assert.deepEqual(doc.problems, ['two evidence parts name grid on main: the second is dropped; give each target its own variant']);
  assert.equal(doc.summary.byCriterion['2.1.2'].evaluated, 2);
});

test('a malformed part and an unknown check are problems, never a crash', () => {
  const doc = mergeEvidence({ check: 'not-registered', checks: CHECKS, parts: [part({ findings: [{ ...TRAP, severity: 'blocker' }] }), part()] });

  assert.equal(doc.targets.length, 1, 'the malformed part is dropped');
  assert.deepEqual(doc.problems, [
    '"not-registered" is not a check of EVIDENCE_CHECKS (tests/lib/a11y-evidence.mjs); add its entry with its criteria',
    'an evidence part of grid on main is malformed: findings[0].severity is "blocker", not one of critical, serious, moderate, minor, advisory',
  ]);
  assert.deepEqual(validateEvidence(doc, { checks: CHECKS }), ['check "not-registered" is not in EVIDENCE_CHECKS']);
});

test('validateEvidence names what a generator could not read', () => {
  const doc = mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part({ findings: [TRAP] })] });

  assert.deepEqual(validateEvidence({ ...doc, schema: 0, mode: 'gate', criteria: ['2.4.3', '1.9.9'] }, { checks: CHECKS }), [
    'schema is 0, not 1',
    'mode is "gate", not "report"',
    'criteria names "1.9.9", which is not a WCAG 2.2 criterion',
  ]);
  assert.deepEqual(validateEvidence({ ...doc, findings: [{ ...doc.findings[0], id: '', page: undefined }] }, { checks: CHECKS }), [
    'findings[0].page is not a non-empty string',
    'findings[0].id is missing',
  ]);
  assert.deepEqual(validateEvidence({ ...doc, targets: [{ status: 'skipped' }] }, { checks: CHECKS }),
    ['targets[0].status is "skipped", not one of measured, error']);
  assert.deepEqual(validateEvidence([], { checks: CHECKS }), ['the document is not an object']);
});

test('validateEvidence refuses a summary the headline and the summary table cannot read', () => {
  const doc = mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part({ findings: [TRAP] })] });
  const withoutSeverity = { ...doc.summary };

  delete withoutSeverity.bySeverity;

  assert.deepEqual(validateEvidence({ ...doc, summary: withoutSeverity }, { checks: CHECKS }),
    ['summary.bySeverity does not count every severity (critical, serious, moderate, minor, advisory)']);
  assert.deepEqual(validateEvidence({ ...doc, title: undefined, summary: { ...doc.summary, measured: '1', byCriterion: { '2.1.2': null } } }, { checks: CHECKS }), [
    'title is not a non-empty string',
    'summary.measured is not a non-negative integer',
    'summary.byCriterion["2.1.2"] does not count its evaluated targets and findings',
  ]);
  assert.deepEqual(validateEvidence({ ...doc, summary: null }, { checks: CHECKS }), ['summary is not an object']);
  assert.throws(() => evidenceHeadline({ ...doc, summary: withoutSeverity }), TypeError, 'what validation lets through, the headline reads');
});

test('the headline counts findings by severity and the targets measured', () => {
  const clean = mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part()] });
  const found = mergeEvidence({
    check: 'demo-check',
    checks: CHECKS,
    parts: [part({ findings: [TRAP, ORDER] }), part({ target: { page: 'dialog', theme: 'main' } })],
    failures: [{ title: 'menu on main', target: { page: 'menu', theme: 'main' }, error: 'x' }],
  });

  assert.equal(evidenceHeadline(clean), 'No findings on 1 target measured');
  assert.equal(evidenceHeadline(found), '2 findings (1 serious, 1 advisory) on 2 targets measured, 1 not measured');
});

test('the check run is neutral on any finding or problem, success when clean, and never a failure', () => {
  const pages = new Map([['grid', 12], ['dialog', 40]]);
  const clean = buildEvidenceCheckRun({ doc: mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part()] }), pages });
  const advisory = buildEvidenceCheckRun({ doc: mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part({ findings: [ORDER] })] }), pages });
  const errored = buildEvidenceCheckRun({
    doc: mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part()], failures: [{ title: 'x', target: null, error: 'boom' }] }), pages,
  });
  const missing = buildEvidenceCheckRun({ doc: null, check: 'demo-check' });
  const unreadable = buildEvidenceCheckRun({ doc: {}, check: 'demo-check', problems: ['demo-check.json is not valid JSON'] });

  assert.deepEqual([clean.conclusion, clean.title], ['success', '✔ No findings on 1 target measured']);
  assert.equal(advisory.conclusion, 'neutral', 'an advisory difference still needs someone to look');
  assert.equal(errored.conclusion, 'neutral');
  assert.match(errored.title, /· 1 tooling problem$/);
  assert.deepEqual([missing.name, missing.conclusion, missing.title], ['A11y / demo-check report', 'neutral', '⚠ Tooling: the check left no evidence document']);
  assert.deepEqual([unreadable.conclusion, unreadable.title], ['neutral', '⚠ Tooling: demo-check.json is not valid JSON']);
  assert.match(unreadable.summary, /- demo-check\.json is not valid JSON/);
  for (const payload of [clean, advisory, errored, missing, unreadable]) {
    assert.notEqual(payload.conclusion, 'failure', 'report-only: a check run of this tier never turns a pull request red');
  }
});

test('an annotation sits on the page\'s line in pages.mjs, or on the file and line the finding names', () => {
  const pages = new Map([['grid', 12]]);
  const inventory = { ...TRAP, kind: 'no-drag-alternative', criteria: ['2.5.7'], file: 'tests/a11y/drag-alternatives.mjs', line: 30 };
  const payload = buildEvidenceCheckRun({
    doc: mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part({ findings: [TRAP, ORDER, inventory] })] }),
    pages,
  });

  assert.deepEqual(payload.annotations.map(item => [item.path, item.start_line, item.annotation_level, item.title]), [
    ['tests/a11y/pages.mjs', 12, 'warning', '2.1.2 keyboard-trap'],
    ['tests/a11y/drag-alternatives.mjs', 30, 'warning', '2.5.7 no-drag-alternative'],
    ['tests/a11y/pages.mjs', 12, 'notice', '2.4.3 tab-order-changed'],
  ]);
  assert.equal(payload.annotations[0].message,
    'grid on main: Tab never left the grid (presses=40). Element: td.current. Fixture: /tests/fixtures/demo/grid.html?theme=main');
});

test('a check run carries at most a hundred annotations; the summary lists sixty findings and says how many more', () => {
  const findings = Array.from({ length: 130 }, (_, index) => ({ ...TRAP, selector: `td:nth-child(${index + 1})` }));
  const doc = mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part({ findings })] });
  const payload = buildEvidenceCheckRun({ doc });

  assert.equal(payload.annotations.length, 100);
  assert.match(payload.summary, /… and 70 more in `test-results\/a11y-checks\/demo-check\.json`\./);
});

test('every value the summary renders is escaped the scan\'s way, and only a plain https link is linked', () => {
  const hostile = { ...TRAP, selector: 'td|<img src=x onerror=alert(1)>', reason: 'a `code` **bold** [link](javascript:alert(1)) {#+!} reason' };
  const summary = renderEvidenceSummary(mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part({ findings: [hostile] })] }), {
    runUrl: 'javascript:alert(1)',
    artifactUrl: 'https://github.com/o/r/actions/runs/1/artifacts/2',
  });

  assert.ok(summary.includes(`<code>${escapeMarkdownText(hostile.selector)}</code>`), 'the selector is escaped by escapeMarkdownText()');
  assert.ok(summary.includes(escapeMarkdownText(hostile.reason)), 'the reason is escaped by escapeMarkdownText()');
  assert.match(summary, /<code>td\\\|\\<img src=x onerror=alert\(1\)\\><\/code>/);
  assert.doesNotMatch(summary, /\[The workflow run\]/, 'an unsafe URL is never a link');
  assert.match(summary, /\[The evidence JSON\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\/artifacts\/2\)/);
  assert.match(summary, /\| 2\.1\.2 No Keyboard Trap \| A \| 1 \| 1 \|/);
  assert.doesNotMatch(renderEvidenceSummary(mergeEvidence({ check: 'demo-check', checks: CHECKS, parts: [part()] }), {
    artifactUrl: 'https://github.com/o/r/a|b',
  }), /\[The evidence JSON\]/, 'a URL with a pipe would end the table cell, so it is not linked');
});

test('a tooling check run lists twenty problems and stays under the Checks API limit', () => {
  const problems = Array.from({ length: 5000 }, (_, index) => `targets[${index}].status is "skipped", not one of measured, error`);
  const many = buildEvidenceCheckRun({ doc: null, check: 'demo-check', problems });
  const huge = buildEvidenceCheckRun({ doc: null, check: 'demo-check', problems: [`targets[0].status is "${'x'.repeat(70000)}"`] });

  assert.equal(many.summary.match(/^- targets/gm).length, 20);
  assert.match(many.summary, /^- … and 4980 more\.$/m);
  assert.ok(huge.summary.length <= 65535, `${huge.summary.length} characters`);
  assert.match(huge.summary, /… cut at 65000 characters/);
});

test('measured values read as key=value pairs, numbers to two decimals', () => {
  assert.equal(measuredText({ ratio: 2.4567, presses: 3, color: 'rgb(0, 0, 0)', box: { x: 1 } }), 'ratio=2.46, presses=3, color=rgb(0, 0, 0), box={"x":1}');
});
