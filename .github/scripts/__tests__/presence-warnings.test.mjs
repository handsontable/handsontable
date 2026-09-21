import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { classify, isCoverage } from '../lib/presence-gate.mjs';
import {
  parseUnifiedDiff,
  countNewTestBlocks,
  frozenSuiteGrowth,
  stripHtmlComments,
  redSpecFieldMissing,
  rtlCorrelation,
  walkontableRouting,
  visualOnlyCoverage,
  VISUAL_SPEC_RE,
  collectWarnings,
  renderWarnings,
  isAdvisoryPath,
} from '../lib/presence-warnings.mjs';

// Every warning here is advisory: the tests pin what fires, what stays silent,
// and that a gap in the input (no body, no diff) is silence — never a finding.

/**
 * Build a unified-diff file section, `--unified=0` style.
 *
 * @param {string} path The head-side path.
 * @param {string[]} added The added lines (without the `+`).
 * @param {{isNew?: boolean, oldPath?: string, removed?: string[]}} [options] Shape switches.
 * @returns {string} The diff section.
 */
function fileDiff(path, added, { isNew = false, oldPath = path, removed = [] } = {}) {
  return [
    `diff --git a/${oldPath} b/${path}`,
    isNew ? 'new file mode 100644' : 'index 1111111..2222222 100644',
    isNew ? '--- /dev/null' : `--- a/${oldPath}`,
    `+++ b/${path}`,
    `@@ -10,${removed.length} +10,${added.length} @@`,
    ...removed.map(line => `-${line}`),
    ...added.map(line => `+${line}`),
  ].join('\n');
}

const FROZEN_SPEC = 'handsontable/src/plugins/filters/__tests__/filters.spec.js';
const THREE_ITS = [
  '  it(\'filters by value\', async() => {',
  '    expect(countRows()).toBe(3);',
  '  });',
  '  it.each([1, 2])(\'filters %s\', async() => {',
  '    expect(countRows()).toBe(1);',
  '  });',
  '  fit(\'focused for now\', async() => {',
  '    expect(true).toBe(true);',
  '  });',
];

// --- parseUnifiedDiff ---
test('parseUnifiedDiff yields per-file added lines, marks new files, and ignores headers and removals', () => {
  const diff = [
    fileDiff('handsontable/src/core.ts', ['const a = 1;', '++b;'], { removed: ['const a = 0;'] }),
    fileDiff('tests/e2e/new.spec.ts', ['test(\'x\', () => {});'], { isNew: true }),
    fileDiff('handsontable/src/renamed.ts', ['x'], { oldPath: 'handsontable/src/old.ts' }),
  ].join('\n');
  const files = parseUnifiedDiff(diff);

  assert.deepEqual(files.map(f => f.path), [
    'handsontable/src/core.ts', 'tests/e2e/new.spec.ts', 'handsontable/src/renamed.ts',
  ]);
  // An added line whose content starts with `++` is still content, not a header.
  assert.deepEqual(files[0].added, ['const a = 1;', '++b;']);
  assert.equal(files[0].isNew, false);
  assert.equal(files[1].isNew, true);
  assert.equal(files[2].isNew, false, 'a rename is not a new file');
});

test('parseUnifiedDiff returns [] for empty or malformed input', () => {
  assert.deepEqual(parseUnifiedDiff(''), []);
  assert.deepEqual(parseUnifiedDiff(undefined), []);
  assert.deepEqual(parseUnifiedDiff('not a diff at all\n+nor this'), []);
});

// --- countNewTestBlocks ---
test('countNewTestBlocks counts it(, it.each( and fit( openers only', () => {
  assert.equal(countNewTestBlocks(THREE_ITS), 3);
  assert.equal(countNewTestBlocks([
    'describe(\'suite\', () => {',
    '  xit(\'skipped\', async() => {});',
    '  const ok = /\\d/.test(value);',
    '  suite.it(\'member call\');',
    '  beforeEach(() => {});',
    '  // it(\'in a comment\')',
  ]), 0);
});

// --- frozenSuiteGrowth ---
test('three or more new it blocks in a MODIFIED frozen spec warn; two do not', () => {
  const growth = frozenSuiteGrowth(parseUnifiedDiff(fileDiff(FROZEN_SPEC, THREE_ITS)));

  assert.ok(growth, 'expected a finding');
  assert.equal(growth.total, 3);
  assert.deepEqual(growth.files, [{ path: FROZEN_SPEC, added: 3 }]);

  const small = frozenSuiteGrowth(parseUnifiedDiff(fileDiff(FROZEN_SPEC, THREE_ITS.slice(0, 6))));

  assert.equal(small, null);
});

test('frozen-suite growth ignores a NEW Jasmine spec (already blocked) and every non-frozen tier', () => {
  const newJasmine = parseUnifiedDiff(fileDiff(FROZEN_SPEC, THREE_ITS, { isNew: true }));
  const playwright = parseUnifiedDiff(fileDiff('tests/e2e/filters.spec.ts', THREE_ITS));
  const unit = parseUnifiedDiff(fileDiff('handsontable/src/helpers/__tests__/x.unit.js', THREE_ITS));
  const wrapperSpec = parseUnifiedDiff(fileDiff('wrappers/react-wrapper/test/hotTable.spec.tsx', THREE_ITS));

  assert.equal(frozenSuiteGrowth(newJasmine), null);
  assert.equal(frozenSuiteGrowth(playwright), null);
  assert.equal(frozenSuiteGrowth(unit), null);
  assert.equal(frozenSuiteGrowth(wrapperSpec), null);
});

test('frozen-suite growth sums across files and honors a custom threshold', () => {
  const two = THREE_ITS.slice(0, 6);
  const files = parseUnifiedDiff([
    fileDiff(FROZEN_SPEC, two),
    fileDiff('handsontable/src/3rdparty/walkontable/test/spec/table.spec.js', two),
  ].join('\n'));
  const growth = frozenSuiteGrowth(files);

  assert.equal(growth.total, 4);
  assert.equal(growth.files.length, 2);
  assert.equal(frozenSuiteGrowth(files, { threshold: 5 }), null);
});

// --- stripHtmlComments ---
test('stripHtmlComments removes every comment, including one that a single pass would re-form', () => {
  assert.equal(stripHtmlComments('a <!-- x --> b'), 'a  b');
  assert.equal(stripHtmlComments('a<!-- x -->b<!-- y -->c'), 'abc');

  // Removing the inner `<!-- -->` splices `<!` and `--` into a new `<!--`. A
  // single regex pass leaves it behind (CodeQL js/incomplete-multi-character-sanitization).
  const nested = '<!<!-- -->--';

  assert.equal(stripHtmlComments(nested).includes('<!--'), false, nested);
  assert.equal(stripHtmlComments(`${nested} tail`).includes('<!--'), false, `${nested} tail`);
  assert.equal(stripHtmlComments(`<!<!<!-- --><!-- -->----`).includes('<!--'), false, 'two seams');

  // Comments do not nest: the first `-->` closes the comment.
  assert.equal(stripHtmlComments('a<!-- x <!-- y -->b -->c'), 'ab -->c');
  // An unterminated comment hides the rest, as it does in the rendered body.
  assert.equal(stripHtmlComments('kept <!-- lost'), 'kept ');
  assert.equal(stripHtmlComments(''), '');
});

// --- redSpecFieldMissing ---
const TEMPLATE_LINE = '- For a bug fix — the spec that fails without this fix: <!-- name -->';
const BUG_FIX_TICKED = '- [x] Bug fix (non-breaking change which fixes an issue)';
const BUG_FIX_UNTICKED = '- [ ] Bug fix (non-breaking change which fixes an issue)';
const EMPTY_LINE = '- For a bug fix — the spec that fails without this fix:';
const NEXT_TEMPLATE_LINE = '- Demo page / recorded trace (for UI changes): n/a';

test('a ticked Bug fix box with the red-spec line left as the template placeholder warns', () => {
  const body = ['### Test evidence', TEMPLATE_LINE, '', '### Types of changes', BUG_FIX_TICKED].join('\n');

  assert.equal(redSpecFieldMissing(body), true);
  // Uppercase X and an emptied line (comment deleted, nothing written) count the same.
  assert.equal(redSpecFieldMissing(body.replace('[x]', '[X]').replace('<!-- name -->', '')), true);
});

test('a ticked Bug fix box with the red-spec line filled in does not warn', () => {
  const filled = TEMPLATE_LINE.replace('<!-- name -->', '`tests/e2e/filters.spec.ts` — "keeps the filter after undo"');
  const body = [filled, BUG_FIX_TICKED].join('\n');

  assert.equal(redSpecFieldMissing(body), false);
  // A filled line that also keeps the placeholder comment is still filled.
  assert.equal(redSpecFieldMissing(`${filled} <!-- name -->\n${BUG_FIX_TICKED}`), false);
});

test('the red-spec field is not demanded when Bug fix is unticked, the line is gone, or there is no body', () => {
  assert.equal(redSpecFieldMissing([TEMPLATE_LINE, BUG_FIX_UNTICKED].join('\n')), false);
  // Author removed the Test-evidence section: nothing to judge, stay silent.
  assert.equal(redSpecFieldMissing(BUG_FIX_TICKED), false);
  assert.equal(redSpecFieldMissing(''), false);
  assert.equal(redSpecFieldMissing(null), false);
  assert.equal(redSpecFieldMissing(undefined), false);
});

test('the red-spec line is matched with a hyphen or an en dash as well as the template em dash', () => {
  for (const dash of ['-', '–', '—']) {
    const line = `- For a bug fix ${dash} the spec that fails without this fix:`;

    assert.equal(redSpecFieldMissing([line, BUG_FIX_TICKED].join('\n')), true, `dash ${JSON.stringify(dash)}`);
  }
});

test('a red-spec answer written on the next line — free text or a nested list — counts as filled', () => {
  const freeText = [EMPTY_LINE, '  `tests/e2e/filters.spec.ts` — "keeps the filter after undo"', NEXT_TEMPLATE_LINE, BUG_FIX_TICKED];
  const nestedList = [EMPTY_LINE, '  - `tests/e2e/filters.spec.ts`', '  - `tests/e2e/undo.spec.ts`', NEXT_TEMPLATE_LINE, BUG_FIX_TICKED];
  const afterBlank = [EMPTY_LINE, '', '  n/a — tooling change', NEXT_TEMPLATE_LINE, BUG_FIX_TICKED];

  assert.equal(redSpecFieldMissing(freeText.join('\n')), false, 'free text on the next line');
  assert.equal(redSpecFieldMissing(nestedList.join('\n')), false, 'a nested list under the line');
  assert.equal(redSpecFieldMissing(afterBlank.join('\n')), false, 'text after a blank line');
  // GitHub bodies carry CRLF line endings.
  assert.equal(redSpecFieldMissing(freeText.join('\r\n')), false, 'CRLF body');
});

test('an empty red-spec line followed by the next template item or a heading is still empty', () => {
  const nextItem = [EMPTY_LINE, NEXT_TEMPLATE_LINE, BUG_FIX_TICKED];
  const nextHeading = [EMPTY_LINE, '', '### How has this been tested?', 'Ran it.', BUG_FIX_TICKED];
  const endOfBody = [BUG_FIX_TICKED, EMPTY_LINE];

  assert.equal(redSpecFieldMissing(nextItem.join('\n')), true, 'a sibling list item is not an answer');
  assert.equal(redSpecFieldMissing(nextHeading.join('\n')), true, 'the next section is not an answer');
  assert.equal(redSpecFieldMissing(endOfBody.join('\n')), true, 'nothing follows');
  assert.equal(redSpecFieldMissing(nextItem.join('\r\n')), true, 'CRLF body');
});

test('the presence job reads the live body on a step that cannot fail the job, and hands the file to the gate', () => {
  const workflow = readFileSync(path.join(repoRoot(), '.github/workflows/checks.yml'), 'utf8');
  const lines = workflow.split('\n');
  const at = lines.findIndex(line => /-\s+name:\s+Read the live pull-request body/.test(line));

  assert.notEqual(at, -1, 'the body-reading step exists');

  // The step's own keys run until the next `- name:` (its sibling step).
  const step = [];

  for (let i = at + 1; i < lines.length && !/^\s*-\s+name:/.test(lines[i]); i += 1) {
    step.push(lines[i]);
  }

  // An action-runtime failure here must skip one advisory check, never fail
  // `presence` — and through test.yml's needs, the CI Gate.
  assert.ok(step.some(line => /^\s*continue-on-error:\s*true\s*$/.test(line)), 'continue-on-error: true on the body step');

  const gateStep = lines.findIndex(line => /-\s+name:\s+Evaluate test-presence gate \(warn\)/.test(line));

  assert.ok(gateStep > at, 'the gate runs after the body is read');
  assert.ok(lines.slice(gateStep, gateStep + 8).some(line => /GATE_PR_BODY_FILE:/.test(line)), 'the gate gets the body file');
});

// --- rtlCorrelation ---
const RTL_SOURCE = fileDiff('handsontable/src/tableView.ts', [
  '  if (this.hot.isRtl()) {',
  '    offset = -offset;',
  '  }',
]);

test('RTL logic added to source with no RTL-mentioning test line warns', () => {
  const finding = rtlCorrelation(parseUnifiedDiff([
    RTL_SOURCE,
    fileDiff('tests/e2e/overlays.spec.ts', ['  await grid.expectCell(0, 0, \'A1\');']),
  ].join('\n')));

  assert.ok(finding);
  assert.deepEqual(finding.sourceFiles, ['handsontable/src/tableView.ts']);
});

test('RTL logic in source is paired by any test line mentioning rtl or layoutDirection (case-insensitive)', () => {
  for (const testLine of [
    '  await grid.initGrid({ layoutDirection: \'rtl\' });',
    '  test.describe(\'RTL layout\', () => {',
    '  it(\'works in rtl\', async() => {',
  ]) {
    const files = parseUnifiedDiff([RTL_SOURCE, fileDiff('tests/e2e/overlays.spec.ts', [testLine])].join('\n'));

    assert.equal(rtlCorrelation(files), null, testLine);
  }
});

test('RTL logic in source is paired by a Playwright page object or helper under tests/**, which the gate classifies as neither', () => {
  const pageObject = 'tests/fixtures/pages/GridPage.ts';
  const helper = 'tests/support/layout.ts';

  assert.equal(classify(pageObject), 'neither', 'a page object is not coverage for the gate');

  for (const testSide of [pageObject, helper]) {
    const paired = parseUnifiedDiff([
      RTL_SOURCE,
      fileDiff(testSide, ['  async initRtlGrid() { return this.initGrid({ layoutDirection: \'rtl\' }); }']),
    ].join('\n'));

    assert.equal(rtlCorrelation(paired), null, `${testSide} pairs the source change`);
  }

  // The tests/** file has to mention RTL itself — its presence alone pairs nothing.
  const silentHelper = parseUnifiedDiff([RTL_SOURCE, fileDiff(pageObject, ['  async goto() {}'])].join('\n'));

  assert.ok(rtlCorrelation(silentHelper), 'a tests/** change that never mentions RTL does not pair');

  // Outside tests/** and outside the gate's test set, a mention is prose, not coverage.
  const docsOnly = parseUnifiedDiff([RTL_SOURCE, fileDiff('docs/content/guides/rtl.md', ['RTL layout'])].join('\n'));

  assert.ok(rtlCorrelation(docsOnly), 'a docs mention does not pair');
});

test('the advisory diff admits every file the RTL pairing can accept — tests/** included — and nothing else', () => {
  // The CLI builds its `git diff` pathspec from this predicate. It must agree
  // with isTestSide(): a page object the gate calls 'neither' still has to
  // reach the parser, or the pairing the lib promises never happens in CI.
  for (const path of [
    'tests/fixtures/pages/GridPage.ts',
    'tests/support/layout.ts',
    'tests/e2e/overlays.spec.ts',
    'handsontable/src/tableView.ts',
    'handsontable/src/__tests__/core/rtl.spec.js',
    'wrappers/react-wrapper/test/hotColumn.spec.tsx',
  ]) {
    assert.equal(isAdvisoryPath(path), true, `${path} feeds the detectors`);
  }

  assert.equal(classify('tests/fixtures/pages/GridPage.ts'), 'neither', 'the gate itself still does not count a page object');

  for (const path of [
    'docs/content/guides/rtl.md',
    'pnpm-lock.yaml',
    '.github/workflows/checks.yml',
    'handsontable/CHANGELOG.md',
    'visual-tests/src/config.mjs',
  ]) {
    assert.equal(isAdvisoryPath(path), false, `${path} stays out of the buffer`);
  }
});

test('RTL correlation is silent when no source line mentions isRtl/layoutDirection, or only a test does', () => {
  const plainSource = fileDiff('handsontable/src/tableView.ts', ['  offset += 1; // rtl-agnostic']);
  const rtlInTestOnly = fileDiff('handsontable/src/__tests__/core/rtl.spec.js', ['  expect(hot.isRtl()).toBe(true);']);

  assert.equal(rtlCorrelation(parseUnifiedDiff(plainSource)), null, 'lowercase "rtl" in a comment is not the API');
  assert.equal(rtlCorrelation(parseUnifiedDiff(rtlInTestOnly)), null, 'a __tests__ file is never source');
  assert.equal(rtlCorrelation([]), null);
});

test('RTL correlation detects layoutDirection in source and reads a removed-only hunk as no addition', () => {
  const layout = fileDiff('handsontable/src/core/settings.ts', ['  layoutDirection: \'inherit\',']);

  assert.ok(rtlCorrelation(parseUnifiedDiff(layout)));

  const removedOnly = fileDiff('handsontable/src/tableView.ts', [], { removed: ['  if (this.hot.isRtl()) {'] });

  assert.equal(rtlCorrelation(parseUnifiedDiff(removedOnly)), null);
});

// --- walkontableRouting ---
const WT_SRC = { status: 'M', path: 'handsontable/src/3rdparty/walkontable/src/overlay/top.ts' };

test('a Walkontable engine change with no engine-tier test change warns and names the engine files', () => {
  const finding = walkontableRouting([
    WT_SRC,
    { status: 'M', path: 'handsontable/src/tableView.ts' },
    { status: 'A', path: 'tests/e2e/overlays.spec.ts' },
  ]);

  assert.ok(finding, 'a core-tier Playwright spec is not engine-tier coverage');
  assert.deepEqual(finding.engineFiles, [WT_SRC.path]);
});

test('a Walkontable engine change paired with a Walkontable Jasmine or Playwright change is silent', () => {
  for (const testPath of [
    'handsontable/src/3rdparty/walkontable/test/spec/overlay/top.spec.js',
    'handsontable/src/3rdparty/walkontable/test/helpers/common.js',
    'tests/e2e/walkontable/overlays.spec.ts',
  ]) {
    assert.equal(walkontableRouting([WT_SRC, { status: 'M', path: testPath }]), null, testPath);
  }
});

test('Walkontable routing ignores changes outside the engine source, including its own tests', () => {
  assert.equal(walkontableRouting([{ status: 'M', path: 'handsontable/src/tableView.ts' }]), null);
  assert.equal(walkontableRouting([{ status: 'M', path: 'handsontable/src/3rdparty/walkontable/test/spec/x.spec.js' }]), null);
  assert.equal(walkontableRouting([{ status: 'D', path: WT_SRC.path }]), null, 'a deletion needs no new coverage');
  assert.equal(walkontableRouting([]), null);
});

// --- visualOnlyCoverage ---
// The #12086 shape — the one commit in 1251 first-parent commits since
// 2026-03-01 that would have fired: a scroll fix in the engine proven by a new
// visual spec, with a demo edit and a changelog entry (both 'neither' to the
// gate) beside it.
const VISUAL_SRC = { status: 'M', path: 'handsontable/src/3rdparty/walkontable/src/overlays.js' };
const VISUAL_SPEC = { status: 'A', path: 'visual-tests/tests/js-only/wrapper/wrapper-preventOverflow.spec.ts' };
const VISUAL_ONLY_PR = [
  VISUAL_SRC,
  VISUAL_SPEC,
  { status: 'M', path: 'examples/next/visual-tests/js/demo/src/demos/wrapper/index.js' },
  { status: 'A', path: '.changelogs/12086.json' },
];

test('a source change whose only coverage is a new visual spec warns and names both sides', () => {
  // Prevents: the detector staying silent on the exact shape it exists for, or
  // a demo or changelog file — 'neither' to the gate — masking the finding.
  const finding = visualOnlyCoverage(VISUAL_ONLY_PR);

  assert.ok(finding, 'expected a finding');
  assert.deepEqual(finding.sourceFiles, [VISUAL_SRC.path]);
  assert.deepEqual(finding.visualSpecs, [`${VISUAL_SPEC.path} (A)`]);
});

test('visual-only coverage is silent when any non-visual coverage accompanies the visual spec', () => {
  // Prevents: a false positive on a pull request that did pair the source
  // change with a behavioral test — the shape that gets a hook disabled.
  for (const coverage of [
    { status: 'A', path: 'handsontable/src/plugins/filters/__tests__/x.unit.js' },
    { status: 'A', path: 'tests/e2e/filters.spec.ts' },
    { status: 'M', path: FROZEN_SPEC }, // a MODIFIED Jasmine spec is coverage to the gate
    { status: 'A', path: 'wrappers/react-wrapper/test/hotColumn.spec.tsx' },
    { status: 'A', path: 'handsontable/src/__tests__/core/x.types.ts' },
  ]) {
    assert.equal(isCoverage(coverage), true, `${coverage.path} is coverage to the gate`);
    assert.equal(visualOnlyCoverage([...VISUAL_ONLY_PR, coverage]), null, `${coverage.path} pairs the source change`);
  }
});

test('visual-only coverage is silent with no source change — a visual spec alone, a helper, a demo, or the codemod shape', () => {
  // Prevents: firing on pull requests confined to the visual package. The
  // codemod pull requests (the visualTest() rename, the disable lines, the
  // docblocks) touch `visual-tests/src/test-runner.ts` and every spec under
  // `visual-tests/tests/` and nothing else — that change set is the pinned
  // silent example.
  const helper = { status: 'M', path: 'visual-tests/src/page-helpers.ts' };
  const demo = { status: 'M', path: 'examples/next/visual-tests/js/demo/src/main.ts' };

  assert.equal(visualOnlyCoverage([VISUAL_SPEC]), null, 'a visual spec alone');
  assert.equal(visualOnlyCoverage([helper, VISUAL_SPEC]), null, 'a visual helper is neither source nor coverage');
  assert.equal(visualOnlyCoverage([demo, VISUAL_SPEC]), null, 'a visual demo is neither source nor coverage');

  const codemod = [
    { status: 'M', path: 'visual-tests/src/test-runner.ts' },
    { status: 'M', path: 'visual-tests/tests/js-only/wrapper/wrapper-size.spec.ts' },
    { status: 'M', path: 'visual-tests/tests/multi-frameworks/change-rows-order.spec.ts' },
    { status: 'M', path: 'visual-tests/tests/cross-browser/alignment.spec.ts' },
  ];

  assert.equal(classify('visual-tests/src/test-runner.ts'), 'neither', 'the runner is not source to the gate');
  assert.equal(visualOnlyCoverage(codemod), null, 'the codemod shape: runner plus specs, no source');
});

test('visual-only coverage fires on a modified or renamed visual spec and ignores a deleted one', () => {
  // Prevents: exempting M — a one-line edit to an existing capture spec is the
  // cheapest gate-pass of all — and listing a deleted spec that no longer exists.
  const modified = visualOnlyCoverage([VISUAL_SRC, { ...VISUAL_SPEC, status: 'M' }]);
  const renamed = visualOnlyCoverage([VISUAL_SRC, { ...VISUAL_SPEC, status: 'R' }]);

  assert.deepEqual(modified?.visualSpecs, [`${VISUAL_SPEC.path} (M)`],
    'a modified visual spec as the only coverage fires');
  assert.deepEqual(renamed?.visualSpecs, [`${VISUAL_SPEC.path} (R)`],
    'a renamed visual spec as the only coverage fires');

  const deletedSpec = { ...VISUAL_SPEC, status: 'D' };

  // The gate quirk, documented next to the detector's choice: a deleted spec
  // still satisfies the gate (COVERAGE_ANY_STATUS is status-independent), yet
  // the detector does not count it — the message must never name a file that
  // is gone. Fixing the gate itself changes verdicts and is not this detector's job.
  assert.equal(isCoverage(deletedSpec), true, 'the gate accepts a deleted visual spec as coverage');
  assert.equal(visualOnlyCoverage([VISUAL_SRC, deletedSpec]), null, 'the detector does not');
  assert.equal(visualOnlyCoverage([{ ...VISUAL_SRC, status: 'D' }, VISUAL_SPEC]), null,
    'a deleted source file needs no coverage');
});

test('a unit test under visual-tests/ is behavioral coverage, not a capture, so it pairs the source change', () => {
  // Prevents: VISUAL_SPEC_RE regressing to a bare package prefix, which reported
  // a `*.unit.js` for the visual package's own lib as "a visual spec" and drew
  // the screenshot message on a change set that carried a real assertion. No
  // such file exists yet; the G3 and G5 guardrails add lib code under
  // visual-tests/lib/, and someone will test it beside a core change.
  const visualUnit = { status: 'A', path: 'visual-tests/lib/__tests__/manifest.unit.js' };

  assert.equal(isCoverage(visualUnit), true, 'a unit test under visual-tests/ is coverage to the gate');
  assert.equal(visualOnlyCoverage([VISUAL_SRC, visualUnit]), null,
    'as the only coverage: a unit test, not a capture');
  assert.equal(visualOnlyCoverage([VISUAL_SRC, visualUnit, VISUAL_SPEC]), null,
    'beside a capture spec: it pairs the change');
});

test('visual-only coverage is silent when the gate itself is red, and fires beside a new Jasmine spec', () => {
  // Prevents: a warning that repeats the `missing-coverage` verdict printed
  // above it. A NEW `*.spec.js` is not coverage (the gate blocks it), so the
  // visual spec is the only coverage and the warning prints below the red
  // `new-jasmine-spec` verdict — the established behavior for every advisory.
  assert.equal(visualOnlyCoverage([VISUAL_SRC]), null, 'no coverage at all: the verdict already says it');
  assert.equal(visualOnlyCoverage([]), null);

  const newJasmine = { status: 'A', path: 'handsontable/src/plugins/filters/__tests__/new.spec.js' };

  assert.equal(isCoverage(newJasmine), false, 'a new Jasmine spec is not coverage to the gate');
  assert.ok(visualOnlyCoverage([VISUAL_SRC, newJasmine, VISUAL_SPEC]), 'so the visual spec is the only coverage');
});

test('VISUAL_SPEC_RE matches a capture spec under visual-tests/tests/ and nothing else', () => {
  // Prevents: the matcher drifting to admit `tests/e2e` or `docs/tests` specs
  // (a paired change would become a finding) or the visual demos — and, as a
  // bare package prefix, the visual package's own unit tests or a spec outside
  // its Playwright `testDir`.
  assert.equal(VISUAL_SPEC_RE.test('visual-tests/tests/cross-browser/alignment.spec.ts'), true);
  assert.equal(VISUAL_SPEC_RE.test('tests/e2e/x.spec.ts'), false);
  assert.equal(VISUAL_SPEC_RE.test('docs/tests/visualDocs.spec.ts'), false);
  assert.equal(VISUAL_SPEC_RE.test('examples/next/visual-tests/js/demo/src/main.ts'), false);
  assert.equal(VISUAL_SPEC_RE.test('visual-tests/lib/__tests__/manifest.unit.js'), false, 'a unit test in the package');
  assert.equal(VISUAL_SPEC_RE.test('visual-tests/src/page-helpers.spec.ts'), false, 'a spec outside the testDir');
});

test('VISUAL_SPEC_RE matches every capture spec that actually exists', () => {
  // Prevents the one silent failure this detector cannot survive: the population moving out from under
  // the matcher. `tests/playwright.config.ts` already reserves `tests/visual/` as a later home for these
  // specs, and the day they move, the regex stops matching, the detector goes quiet for good, and the
  // month-later tally reads that silence as "nobody shipped a screenshot alone" — a false zero that
  // decides a policy question. Every other input to that tally is pinned for the same reason (the
  // annotation title, the check-run name, `headRefOid`, the PR-only `if:`); this is the last one, and it
  // is pinned against the real tree rather than against a fixture, because a fixture would move with the
  // regex and prove nothing.
  const root = repoRoot();
  const walk = (dir) => readdirSync(path.join(root, dir), { withFileTypes: true })
    .flatMap(entry => (entry.isDirectory()
      ? walk(path.join(dir, entry.name))
      : [path.join(dir, entry.name)]));
  const specs = walk('visual-tests/tests').filter(file => file.endsWith('.spec.ts'));

  assert.ok(specs.length >= 100,
    `only ${specs.length} capture specs found under visual-tests/tests — the tree moved, and this pin `
    + 'is now checking almost nothing');

  const missed = specs.filter(file => !VISUAL_SPEC_RE.test(file));

  assert.deepEqual(missed, [],
    'VISUAL_SPEC_RE no longer matches every capture spec in the tree, so visual-only-coverage would go '
    + 'silent for the ones it misses and the month-later tally would read a false zero');
});

test('the visual-only-coverage message says a screenshot proves pixels, not behavior, and points at the decision rule', () => {
  // Prevents: the message losing its pointer (visual-tests/AGENTS.md → Decision
  // rule), its remedy (tests/e2e), or gaining markdown that the CLI's
  // annotation() strips before the text reaches the check run.
  const warnings = collectWarnings({ changes: VISUAL_ONLY_PR });
  const warning = warnings.find(w => w.type === 'visual-only-coverage');

  assert.ok(warning, 'the composed run carries the warning');
  assert.match(warning.message, /screenshot proves pixels, not behavior/);
  assert.match(warning.message, /tests\/e2e/);
  assert.match(warning.message, /visual-tests\/AGENTS\.md/);
  assert.match(warning.message, /Decision rule/);
  assert.doesNotMatch(warning.message, /[`*\n]/, 'one line, no backticks or asterisks');
  assert.deepEqual(warning.files, [VISUAL_SRC.path, `${VISUAL_SPEC.path} (A)`],
    'source first, then the spec with its status');

  const lines = renderWarnings([warning]);

  assert.match(lines[0], /non-blocking/);
  assert.ok(lines.some(l => l.includes('⚠️ **visual-only-coverage**')));
  assert.ok(lines.some(l => l.includes(`\`${VISUAL_SPEC.path} (A)\``)));
});

// The prose enumerations of the detectors and the month-later tally recipe are
// pinned in visual-only-coverage-pins.test.mjs (doc pins live in their own file,
// region-sliced so a deleted enumeration cannot hide behind another mention).

// --- collectWarnings / renderWarnings ---
test('collectWarnings composes every detector and stays silent on a clean change', () => {
  const warnings = collectWarnings({
    changes: [
      { status: 'M', path: 'handsontable/src/3rdparty/walkontable/src/overlay/top.ts' },
      { status: 'M', path: FROZEN_SPEC },
      { status: 'M', path: 'handsontable/src/tableView.ts' },
    ],
    diff: [RTL_SOURCE, fileDiff(FROZEN_SPEC, THREE_ITS)].join('\n'),
    prBody: [TEMPLATE_LINE, BUG_FIX_TICKED].join('\n'),
  });

  assert.deepEqual(
    warnings.map(w => w.type).sort(),
    ['frozen-suite-growth', 'red-spec-field', 'rtl-correlation', 'walkontable-routing'],
  );

  for (const warning of warnings) {
    assert.equal(typeof warning.message, 'string');
    assert.ok(warning.message.length > 0);
  }

  const clean = collectWarnings({
    changes: [
      { status: 'M', path: 'handsontable/src/plugins/filters/filters.ts' },
      { status: 'A', path: 'tests/e2e/filters.spec.ts' },
    ],
    diff: fileDiff('handsontable/src/plugins/filters/filters.ts', ['  return value;']),
    prBody: [TEMPLATE_LINE, BUG_FIX_UNTICKED].join('\n'),
  });

  assert.deepEqual(clean, []);

  // A second composed call whose only coverage is a visual spec: the fifth
  // detector joins the routing one (#12086 touched the engine, too). Kept as a
  // separate call so the four-type assertion above keeps pinning that a
  // modified Jasmine spec beside the source change silences it.
  const visualOnly = collectWarnings({ changes: VISUAL_ONLY_PR, diff: '', prBody: undefined });

  assert.deepEqual(visualOnly.map(w => w.type).sort(), ['visual-only-coverage', 'walkontable-routing']);
});

test('collectWarnings skips the body-dependent check when no body is available (local runs)', () => {
  const warnings = collectWarnings({ changes: [], diff: '', prBody: undefined });

  assert.deepEqual(warnings, []);
  assert.deepEqual(collectWarnings({}), []);
});

test('the frozen-suite-growth message steers to Playwright and asks for a justification', () => {
  const [warning] = collectWarnings({
    changes: [{ status: 'M', path: FROZEN_SPEC }],
    diff: fileDiff(FROZEN_SPEC, THREE_ITS),
  });

  assert.equal(warning.type, 'frozen-suite-growth');
  assert.match(warning.message, /large Jasmine additions/);
  assert.match(warning.message, /tests\/e2e/);
  assert.match(warning.message, /justification/);
  assert.deepEqual(warning.files, [`${FROZEN_SPEC} (+3)`]);
});

test('renderWarnings is empty for no warnings and a non-blocking Markdown section otherwise', () => {
  assert.deepEqual(renderWarnings([]), []);

  const lines = renderWarnings([
    { type: 'rtl-correlation', message: 'RTL logic changed …', files: ['handsontable/src/tableView.ts'] },
  ]);

  assert.match(lines[0], /^### .*non-blocking/i);
  assert.ok(lines.some(l => l.includes('⚠️') && l.includes('RTL logic changed')));
  assert.ok(lines.some(l => l.includes('`handsontable/src/tableView.ts`')));
});
