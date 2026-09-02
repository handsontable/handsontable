import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseUnifiedDiff,
  countNewTestBlocks,
  frozenSuiteGrowth,
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

// --- redSpecFieldMissing ---
const TEMPLATE_LINE = '- For a bug fix — the spec that fails without this fix: <!-- name -->';
const BUG_FIX_TICKED = '- [x] Bug fix (non-breaking change which fixes an issue)';
const BUG_FIX_UNTICKED = '- [ ] Bug fix (non-breaking change which fixes an issue)';

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
