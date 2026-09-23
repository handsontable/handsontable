import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classify, isCoverage, isNewJasmineSpec, refactorDeclared, evaluate,
  sourceGroup, coverageGroups, waivedFiles, isRefactorCommit, isRevertCommit,
} from '../lib/presence-gate.mjs';

// --- classify: the 17 real-repo paths validated during scoping ---
const CLASSIFY_CASES = [
  ['handsontable/src/plugins/copyPaste/copyPaste.ts', 'source'],
  ['handsontable/src/plugins/copyPaste/__tests__/settings/rowsLimit.spec.js', 'test'],
  ['handsontable/src/renderers/baseRenderer/__tests__/baseRenderer.types.ts', 'test'],
  ['handsontable/src/i18n/languages/de-DE.js', 'source'],
  ['handsontable/src/3rdparty/walkontable/src/table.ts', 'source'],
  ['handsontable/src/3rdparty/walkontable/test/spec/table.spec.js', 'test'],
  ['wrappers/angular-wrapper/projects/hot-table/src/lib/hot-table.component.ts', 'source'],
  ['wrappers/angular-wrapper/projects/hot-table/src/lib/hot-table.component.spec.ts', 'test'],
  ['wrappers/angular-wrapper/projects/hot-table/src/lib/test-helpers/create-spreadsheet-data.ts', 'neither'],
  ['wrappers/react-wrapper/src/hotTableInner.tsx', 'source'],
  ['wrappers/react-wrapper/src/json.d.ts', 'neither'],
  ['wrappers/react-wrapper/test/hotColumn.spec.tsx', 'test'],
  ['wrappers/vue3/src/HotTable.vue', 'source'],
  ['docs/content/guides/foo.md', 'neither'],
  ['handsontable/CHANGELOG.md', 'neither'],
  ['.changelogs/12345.json', 'neither'],
  ['visual-tests/tests/js-only/filters/menu.spec.ts', 'test'],
];

test('classify matches the 17 validated real-repo paths', () => {
  for (const [p, want] of CLASSIFY_CASES) {
    assert.equal(classify(p), want, `${p} should be ${want}`);
  }
});

test('a new Playwright spec under tests/e2e classifies as test', () => {
  assert.equal(classify('tests/e2e/filters/menu.spec.ts'), 'test');
});

// --- isCoverage: new vs modified .spec.js ---
test('a modified Jasmine spec counts as coverage; a new one does not', () => {
  const spec = 'handsontable/src/plugins/filters/__tests__/filters.spec.js';
  assert.equal(isCoverage({ status: 'M', path: spec }), true, 'modified .spec.js counts');
  assert.equal(isCoverage({ status: 'A', path: spec }), false, 'added .spec.js does not count');
});

test('unit, types, and Playwright specs count as coverage when added', () => {
  assert.equal(isCoverage({ status: 'A', path: 'handsontable/src/plugins/filters/__tests__/x.unit.js' }), true);
  assert.equal(isCoverage({ status: 'A', path: 'handsontable/src/__tests__/core/x.types.ts' }), true);
  assert.equal(isCoverage({ status: 'A', path: 'tests/e2e/filters.spec.ts' }), true);
});

// --- isNewJasmineSpec ---
test('added .spec.js under a Jasmine tree is a new-Jasmine violation; modified is not', () => {
  const spec = 'handsontable/src/plugins/filters/__tests__/filters.spec.js';
  assert.equal(isNewJasmineSpec({ status: 'A', path: spec }), true);
  assert.equal(isNewJasmineSpec({ status: 'M', path: spec }), false);
  // A .spec.ts is never a Jasmine violation.
  assert.equal(isNewJasmineSpec({ status: 'A', path: 'tests/e2e/filters.spec.ts' }), false);
});

// --- refactorDeclared ---
test('refactorDeclared requires a non-empty reason', () => {
  assert.equal(refactorDeclared(['Refactor-only: extracted duplicate range logic']), true);
  assert.equal(refactorDeclared(['Refactor-only:']), false, 'empty reason does not count');
  assert.equal(refactorDeclared(['DEV-123: some feature']), false);
});

// --- evaluate: the end-to-end decisions ---
test('source change with a matching unit test passes', () => {
  const r = evaluate([
    { status: 'M', path: 'handsontable/src/plugins/filters/filters.ts' },
    { status: 'A', path: 'handsontable/src/plugins/filters/__tests__/x.unit.js' },
  ]);
  assert.equal(r.pass, true);
  assert.equal(r.reason, 'ok');
});

test('source change with no test fails with missing-coverage', () => {
  const r = evaluate([{ status: 'M', path: 'handsontable/src/plugins/filters/filters.ts' }]);
  assert.equal(r.pass, false);
  assert.equal(r.reason, 'missing-coverage');
  assert.deepEqual(r.sourceFiles, ['handsontable/src/plugins/filters/filters.ts']);
});

test('source change with a Refactor-only trailer passes as a declared refactor', () => {
  const r = evaluate(
    [{ status: 'M', path: 'handsontable/src/plugins/filters/filters.ts' }],
    ['Refactor-only: renamed a private field, no behavior change'],
  );
  assert.equal(r.pass, true);
  assert.equal(r.reason, 'refactor-declared');
});

test('a new Jasmine spec fails even when other coverage exists', () => {
  const r = evaluate([
    { status: 'M', path: 'handsontable/src/plugins/filters/filters.ts' },
    { status: 'A', path: 'handsontable/src/plugins/filters/__tests__/x.unit.js' },
    { status: 'A', path: 'handsontable/src/plugins/filters/__tests__/new.spec.js' },
  ]);
  assert.equal(r.pass, false);
  assert.equal(r.reason, 'new-jasmine-spec');
  assert.deepEqual(r.newJasmine, ['handsontable/src/plugins/filters/__tests__/new.spec.js']);
});

test('source change satisfied by a new Playwright spec passes', () => {
  const r = evaluate([
    { status: 'M', path: 'handsontable/src/plugins/filters/filters.ts' },
    { status: 'A', path: 'tests/e2e/filters/menu.spec.ts' },
  ]);
  assert.equal(r.pass, true);
});

test('docs-only / .d.ts-only / changelog-only changes never trigger the gate', () => {
  for (const path of [
    'docs/content/guides/foo.md',
    'wrappers/react-wrapper/src/json.d.ts',
    '.changelogs/12345.json',
  ]) {
    const r = evaluate([{ status: 'M', path }]);
    assert.equal(r.pass, true, `${path} should pass`);
    assert.equal(r.sourceFiles.length, 0);
  }
});

test('editing an existing Jasmine spec alongside a source change passes (migrate later)', () => {
  const r = evaluate([
    { status: 'M', path: 'handsontable/src/plugins/filters/filters.ts' },
    { status: 'M', path: 'handsontable/src/plugins/filters/__tests__/filters.spec.js' },
  ]);
  assert.equal(r.pass, true);
});

// --- test-only changes never demand "a test for the test" ---
test('a test-only PR does not demand new coverage (no source changed)', () => {
  const cases = [
    // modifying existing tests of every kind
    [{ status: 'M', path: 'handsontable/src/plugins/filters/__tests__/filters.spec.js' }],
    [{ status: 'M', path: 'handsontable/src/plugins/filters/__tests__/x.unit.js' }],
    [{ status: 'M', path: 'tests/e2e/filters/menu.spec.ts' }],
    [{ status: 'M', path: 'visual-tests/tests/js-only/filters/menu.spec.ts' }],
    // adding new non-Jasmine tests (allowed kinds)
    [{ status: 'A', path: 'handsontable/src/plugins/filters/__tests__/x.unit.js' }],
    [{ status: 'A', path: 'tests/e2e/filters/new.spec.ts' }],
    [{ status: 'A', path: 'handsontable/src/__tests__/core/x.types.ts' }],
    // touching test helpers only
    [{ status: 'M', path: 'handsontable/test/helpers/common.js' }],
    [{ status: 'M', path: 'wrappers/angular-wrapper/projects/hot-table/src/lib/test-helpers/create-spreadsheet-data.ts' }],
  ];
  for (const changes of cases) {
    const r = evaluate(changes);
    assert.equal(r.pass, true, `${changes[0].path} (${changes[0].status}) should pass`);
    assert.equal(r.sourceFiles.length, 0, `${changes[0].path} must not be seen as source`);
  }
});

test('the Jasmine freeze still blocks a NEW .spec.js even in a test-only PR', () => {
  // Not a "test for a test" demand — the freeze: new E2E must be Playwright.
  const r = evaluate([{ status: 'A', path: 'handsontable/src/plugins/filters/__tests__/new.spec.js' }]);
  assert.equal(r.pass, false);
  assert.equal(r.reason, 'new-jasmine-spec');
});

// --- Walkontable is frozen like the main suite (it has a Playwright home) ---
test('a NEW Walkontable Jasmine spec is frozen (blocked, not coverage); editing one is allowed', () => {
  const wtSpec = 'handsontable/src/3rdparty/walkontable/test/spec/overlay/top.spec.js';
  assert.equal(isNewJasmineSpec({ status: 'A', path: wtSpec }), true, 'a new walkontable spec is a freeze violation');
  assert.equal(isCoverage({ status: 'A', path: wtSpec }), false, 'a new walkontable spec does not count');
  assert.equal(isCoverage({ status: 'M', path: wtSpec }), true, 'editing an existing walkontable spec counts');
});

test('a Walkontable source change is satisfied by a Playwright spec, blocked by a new Jasmine spec', () => {
  const withPlaywright = evaluate([
    { status: 'M', path: 'handsontable/src/3rdparty/walkontable/src/table.ts' },
    { status: 'A', path: 'tests/e2e/walkontable/overlays.spec.ts' },
  ]);
  assert.equal(withPlaywright.pass, true, 'walkontable source + Playwright spec passes');

  const withNewJasmine = evaluate([
    { status: 'M', path: 'handsontable/src/3rdparty/walkontable/src/table.ts' },
    { status: 'A', path: 'handsontable/src/3rdparty/walkontable/test/spec/table.spec.js' },
  ]);
  assert.equal(withNewJasmine.pass, false, 'a new walkontable Jasmine spec is blocked');
  assert.equal(withNewJasmine.reason, 'new-jasmine-spec');
});

// --- specs directly under src/__tests__/ (no intermediate directory) ---
test('a spec under src/__tests__/ with no intermediate directory is inside the frozen tree', () => {
  // `handsontable/src/__tests__/` holds the bulk of the frozen suite (core/,
  // hooks/, settings/, ...). The tree pattern must not require an intermediate
  // directory between `src/` and `__tests__/`.
  const spec = 'handsontable/src/__tests__/settings/rowHeights.spec.js';
  assert.equal(isNewJasmineSpec({ status: 'A', path: spec }), true, 'a new spec there is a freeze violation');
  assert.equal(isNewJasmineSpec({ status: 'M', path: spec }), false, 'editing one is not a violation');
  assert.equal(isCoverage({ status: 'M', path: spec }), true, 'editing an existing spec there counts as coverage');
  assert.equal(isCoverage({ status: 'A', path: spec }), false, 'a new spec there does not count as coverage');
});

// --- DEV-3066: a matching test, not any test ---
const CORE_SRC = 'handsontable/src/plugins/filters/filters.ts';
const REACT_SRC = 'wrappers/react-wrapper/src/hotTableInner.tsx';
const ANGULAR_SRC = 'wrappers/angular-wrapper/projects/hot-table/src/lib/hot-table.component.ts';

test('a deleted test is never coverage, whatever its kind', () => {
  // Prevents: removing a failing test next to a source change passing the gate
  // (the patterns used to ignore the git status).
  for (const path of [
    'handsontable/src/plugins/filters/__tests__/x.unit.js',
    'handsontable/src/__tests__/core/x.types.ts',
    'tests/e2e/filters/menu.spec.ts',
    'handsontable/src/plugins/filters/__tests__/filters.spec.js',
    'wrappers/react-wrapper/test/hotColumn.spec.tsx',
  ]) {
    assert.equal(isCoverage({ status: 'D', path }), false, `a deleted ${path} is not coverage`);
    assert.equal(isCoverage({ status: 'M', path }), true, `a modified ${path} still is`);
  }
});

test('a source change whose only test change is a deletion fails with missing-coverage', () => {
  const r = evaluate([
    { status: 'M', path: CORE_SRC },
    { status: 'D', path: 'tests/e2e/filters/menu.spec.ts' },
  ]);

  assert.equal(r.pass, false);
  assert.equal(r.reason, 'missing-coverage');
  assert.deepEqual(r.uncovered, [{ group: 'core', files: [CORE_SRC] }]);
});

test('sourceGroup maps each production tree to its package', () => {
  assert.equal(sourceGroup(CORE_SRC), 'core');
  assert.equal(sourceGroup('handsontable/src/3rdparty/walkontable/src/table.ts'), 'core');
  assert.equal(sourceGroup(REACT_SRC), 'react-wrapper');
  assert.equal(sourceGroup('wrappers/vue3/src/HotTable.vue'), 'vue3');
  assert.equal(sourceGroup(ANGULAR_SRC), 'angular-wrapper');
});

test('coverageGroups maps each test root to the packages it can cover, and nothing else', () => {
  assert.deepEqual(coverageGroups('handsontable/src/plugins/filters/__tests__/x.unit.js'), ['core']);
  assert.deepEqual(coverageGroups('tests/e2e/filters/menu.spec.ts'), ['core']);
  assert.deepEqual(coverageGroups('wrappers/react-wrapper/test/hotColumn.spec.tsx'), ['react-wrapper']);
  assert.deepEqual(coverageGroups('wrappers/vue3/test/types/vue3.types.ts'), ['vue3']);
  assert.deepEqual(coverageGroups(ANGULAR_SRC.replace(/\.ts$/, '.spec.ts')), ['angular-wrapper']);
  assert.deepEqual(coverageGroups('visual-tests/tests/js-only/filters/menu.spec.ts'),
    ['core', 'react-wrapper', 'vue3', 'angular-wrapper'], 'a capture spec renders every package');

  for (const path of [
    'docs/tests/search.spec.ts',
    'evals/fixtures/bug-fix-number-helper/reference/number.unit.ts',
    'examples/next/docs/js/demo/spec/Smoke.spec.js',
    'performance-tests/scenarios/scroll/scroll.spec.ts',
  ]) {
    assert.deepEqual(coverageGroups(path), [], `${path} covers no library source`);
    assert.equal(isCoverage({ status: 'M', path }), false, `${path} is not coverage`);
  }
});

test('a core change is not covered by a wrapper test, and a wrapper change is not covered by a core test', () => {
  const core = evaluate([
    { status: 'M', path: CORE_SRC },
    { status: 'A', path: 'wrappers/react-wrapper/test/x.spec.tsx' },
  ]);

  assert.equal(core.pass, false);
  assert.deepEqual(core.uncovered, [{ group: 'core', files: [CORE_SRC] }]);

  const wrapper = evaluate([
    { status: 'M', path: REACT_SRC },
    { status: 'A', path: 'handsontable/src/plugins/filters/__tests__/x.unit.js' },
  ]);

  assert.equal(wrapper.pass, false);
  assert.deepEqual(wrapper.uncovered, [{ group: 'react-wrapper', files: [REACT_SRC] }]);
});

test('a wrapper change is covered by its own suite', () => {
  const r = evaluate([
    { status: 'M', path: REACT_SRC },
    { status: 'M', path: 'wrappers/react-wrapper/test/hotColumn.spec.tsx' },
  ]);

  assert.equal(r.pass, true);
  assert.equal(r.reason, 'ok');
});

test('a PR touching two packages needs a test for each, and the verdict names only the uncovered one', () => {
  const r = evaluate([
    { status: 'M', path: CORE_SRC },
    { status: 'M', path: REACT_SRC },
    { status: 'A', path: 'tests/e2e/filters/menu.spec.ts' },
  ]);

  assert.equal(r.pass, false);
  assert.deepEqual(r.uncovered, [{ group: 'react-wrapper', files: [REACT_SRC] }]);
  assert.deepEqual(r.sourceFiles, [CORE_SRC, REACT_SRC], 'sourceFiles still lists every source file');
});

test('a visual spec still covers any package (the visual-only advisory owns that question)', () => {
  const r = evaluate([
    { status: 'M', path: CORE_SRC },
    { status: 'M', path: REACT_SRC },
    { status: 'A', path: 'visual-tests/tests/multi-frameworks/filters.spec.ts' },
  ]);

  assert.equal(r.pass, true);
});

test('isRefactorCommit reads the trailer anywhere in the message and needs a reason', () => {
  assert.equal(isRefactorCommit('DEV-1: move helpers\n\nRefactor-only: moved, no behavior change\n'), true);
  assert.equal(isRefactorCommit('DEV-1: move helpers\n\nRefactor-only:\n'), false, 'an empty reason does not count');
  assert.equal(isRefactorCommit('DEV-1: fix the filter\n'), false);
  assert.equal(isRefactorCommit(undefined), false);
});

test('a Refactor-only trailer waives only the files its own commit changed', () => {
  // Prevents: one trailer anywhere in the branch waiving every file in it.
  const FILE_A = 'handsontable/src/helpers/a.ts';
  const FILE_B = 'handsontable/src/helpers/b.ts';
  const r = evaluate([{ status: 'M', path: FILE_A }, { status: 'M', path: FILE_B }], [
    { message: 'DEV-1: extract a helper\n\nRefactor-only: pure extraction', files: [FILE_A] },
    { message: 'DEV-1: change the rounding', files: [FILE_B] },
  ]);

  assert.equal(r.pass, false);
  assert.deepEqual(r.waived, [FILE_A]);
  assert.deepEqual(r.uncovered, [{ group: 'core', files: [FILE_B] }]);
});

test('a file changed by a refactor commit and by an ordinary commit is not waived', () => {
  const FILE = 'handsontable/src/helpers/a.ts';
  const commits = [
    { message: 'Refactor-only: rename a local', files: [FILE] },
    { message: 'DEV-1: change the behavior', files: [FILE] },
  ];

  assert.deepEqual([...waivedFiles(commits)], []);
  assert.equal(evaluate([{ status: 'M', path: FILE }], commits).reason, 'missing-coverage');
});

test('every uncovered file waived: pass as a declared refactor, listing the waived files', () => {
  const FILE = 'handsontable/src/helpers/a.ts';
  const r = evaluate([{ status: 'M', path: FILE }], [{ message: 'Refactor-only: rename a local', files: [FILE] }]);

  assert.equal(r.pass, true);
  assert.equal(r.reason, 'refactor-declared');
  assert.deepEqual(r.waived, [FILE]);
});

test('a waiver never hides behind coverage: a covered package needs no waiver and reports ok', () => {
  const r = evaluate(
    [{ status: 'M', path: CORE_SRC }, { status: 'A', path: 'tests/e2e/filters/menu.spec.ts' }],
    [{ message: 'Refactor-only: rename', files: [CORE_SRC] }],
  );

  assert.equal(r.reason, 'ok');
  assert.deepEqual(r.waived, [], 'nothing needed waiving');
});

test('the squashed form (message lines for the whole change set) waives every changed file', () => {
  // The shape of one squash commit, which is what a replay of develop's
  // first-parent history sees; the CLI passes real commits.
  const r = evaluate([{ status: 'M', path: CORE_SRC }], ['Refactor-only: renamed a private field']);

  assert.equal(r.pass, true);
  assert.equal(r.reason, 'refactor-declared');
  assert.equal(evaluate([{ status: 'M', path: CORE_SRC }], ['DEV-1: no trailer']).reason, 'missing-coverage');
});

test('a git revert waives its own files: it restores code that was tested before', () => {
  // The one verdict the new rules flipped in a 300-commit replay of develop
  // (#13508): a revert restored a source file and deleted the reverted
  // feature's spec, which is no longer coverage.
  const FILE = 'handsontable/src/dataMap/metaManager/metaSchema.ts';
  const revert = 'Revert "DEV-1: add the option"\n\nThis reverts commit 031ce6d229f710a67d655e3b9cd66acfc6e5f2d4.\n';
  const r = evaluate(
    [{ status: 'M', path: FILE }, { status: 'D', path: 'tests/e2e/option.spec.ts' }],
    [{ message: revert, files: [FILE, 'tests/e2e/option.spec.ts'] }],
  );

  assert.equal(isRevertCommit(revert), true);
  assert.equal(r.pass, true);
  assert.equal(r.reason, 'refactor-declared');
  assert.equal(isRevertCommit('DEV-1: this reverts commit abc1234 in prose'), false, 'only the line git writes counts');
  assert.equal(isRevertCommit('DEV-1: fix'), false);
});
