import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { classify } from '../lib/presence-gate.mjs';
import {
  parseUnifiedDiff,
  countNewTestBlocks,
  frozenSuiteGrowth,
  stripHtmlComments,
  redSpecFieldMissing,
  rtlCorrelation,
  walkontableRouting,
  collectWarnings,
  renderWarnings,
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
