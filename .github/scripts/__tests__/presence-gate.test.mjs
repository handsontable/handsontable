import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  classify, isCoverage, isNewJasmineSpec, refactorDeclared, evaluate,
  sourceGroup, coverageGroups, waivedFiles, isRefactorCommit, isRevertCommit,
  stripComments, isCommentOnlyChange, commitsTouching, undeclaredCommits, isWaived, bodyWaiver, isSource,
  commentOnlyCandidate, TEXT_REWRITTEN_SOURCE,
} from '../lib/presence-gate.mjs';
import { stripHtmlComments } from '../lib/strip-html-comments.mjs';

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

test('refactorDeclared ignores the <reason> placeholder copied from the docs', () => {
  assert.equal(refactorDeclared(['Refactor-only: <reason>']), false);
  assert.equal(refactorDeclared(['Refactor-only:  <why this needs no test> ']), false);
  assert.equal(refactorDeclared(['Refactor-only: &lt;reason&gt;']), false, 'an HTML-escaped copy');
  assert.equal(refactorDeclared(['Refactor-only: <reason>', 'Refactor-only: renamed a private field']), true,
    'a real trailer beside a pasted one still counts');
  assert.equal(refactorDeclared(['Refactor-only: moved <T> generics to one file']), true,
    'angle brackets inside a real reason are fine');
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
    { message: 'DEV-1: extract a helper\n\nRefactor-only: pure extraction, no behavior change', files: [FILE_A] },
    { message: 'DEV-1: change the rounding', files: [FILE_B] },
  ]);

  assert.equal(r.pass, false);
  assert.deepEqual(r.waived, [FILE_A]);
  assert.deepEqual(r.uncovered, [{ group: 'core', files: [FILE_B] }]);
});

test('a file changed by a refactor commit and by an ordinary commit is not waived', () => {
  const FILE = 'handsontable/src/helpers/a.ts';
  const commits = [
    { message: 'Refactor-only: renamed a local variable', files: [FILE] },
    { message: 'DEV-1: change the behavior', files: [FILE] },
  ];

  assert.deepEqual([...waivedFiles(commits)], []);
  assert.equal(evaluate([{ status: 'M', path: FILE }], commits).reason, 'missing-coverage');
});

test('every uncovered file waived: pass as a declared refactor, listing the waived files', () => {
  const FILE = 'handsontable/src/helpers/a.ts';
  const r = evaluate([{ status: 'M', path: FILE }], [{ message: 'Refactor-only: renamed a local variable', files: [FILE] }]);

  assert.equal(r.pass, true);
  assert.equal(r.reason, 'refactor-declared');
  assert.deepEqual(r.waived, [FILE]);
});

test('a waiver never hides behind coverage: a covered package needs no waiver and reports ok', () => {
  const r = evaluate(
    [{ status: 'M', path: CORE_SRC }, { status: 'A', path: 'tests/e2e/filters/menu.spec.ts' }],
    [{ message: 'Refactor-only: renamed a local variable', files: [CORE_SRC] }],
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

// --- comment-only changes need no test ---
test('stripComments drops comments, keeps literals verbatim, and reports the lines that hold code', () => {
  const r = stripComments([
    '/**',
    ' * The doc.',
    ' */',
    'export const a = "// not a comment"; // trailing',
    'const t = `x /* kept */ y`;',
    '',
    'const b = \'/* also kept */\';',
  ].join('\n'));

  assert.equal(r.text, 'export const a = "// not a comment"; const t = `x /* kept */ y`; '
    + 'const b = \'/* also kept */\';');
  assert.deepEqual([...r.codeLines], [4, 5, 7]);
  assert.equal(r.complete, true);
});

test('stripComments reports an incomplete lex, which callers treat as code', () => {
  assert.equal(stripComments('const x = 1; /* never closed\n').complete, false);
  assert.equal(stripComments('const s = "never closed\nconst y = 2;\n').complete, false);
  assert.equal(stripComments('const re = /never closed\nconst y = 2;\n').complete, false, 'a regex spans no lines');
  assert.equal(stripComments('const t = `${a\n').complete, false, 'an open ${ is not a finished lex');
});

test('stripComments lexes regex literals and nested templates, so a comment opener inside one is not a comment', () => {
  // Reported in review: `/\/*/g` used to open a block comment that the next
  // JSDoc closed, so the code in between vanished from both versions.
  const regex = stripComments('const re = /\\/*/g;\nreturn 10;\n/** doc */\n');

  assert.equal(regex.text, 'const re = /\\/*/g; return 10;');
  assert.deepEqual([...regex.codeLines], [1, 2]);
  assert.equal(regex.complete, true);
  assert.equal(stripComments('return /a[/*]b/.test(s);\n').text, 'return /a[/*]b/.test(s);', 'a class holds a /');
  assert.equal(stripComments('const x = a / b; // c\n').text, 'const x = a / b;', 'division is not a regex');

  const nested = stripComments('const s = `${a ? `/*` : \'\'}`;\nreturn 10;\n');

  assert.equal(nested.text, 'const s = `${a ? `/*` : \'\'}`; return 10;');
  assert.equal(nested.complete, true);
});

test('the review\'s exploits are code changes, not comment-only ones', () => {
  const regexBase = 'const re = /\\/*/g;\nfunction f() {\n  return 10;\n}\n/** doc */\n';
  const nestedBase = 'const s = `${a ? `/*` : \'\'}`;\nfunction f() {\n  return 10;\n}\n/** doc */\n';

  for (const base of [regexBase, nestedBase]) {
    assert.equal(isCommentOnlyChange({
      baseText: base, headText: base.replace('return 10', 'return 999999'), removed: [3], added: [3],
    }), false, JSON.stringify(base));
  }
});

/**
 * Does editing `from` to `to` on line `line` of `base` pass as comment-only?
 *
 * @param {string} base The base version.
 * @param {string} from The text the edit replaces.
 * @param {string} to Its replacement.
 * @param {number} line The 1-based line the edit is on.
 * @returns {boolean} The verdict.
 */
function commentOnlyEdit(base, from, to, line) {
  return isCommentOnlyChange({ baseText: base, headText: base.replace(from, to), removed: [line], added: [line] });
}

test('an uncertain `/` is read both ways, so no guess about regex or division can hide code', () => {
  // Reported in review: guessing regex-or-division from the character before
  // the `/` read these the wrong way, a later JSDoc closed the comment the
  // guess opened, and `limit(10)` → `limit(999)` passed as comment-only.
  const tail = 'limit(10);\n/**\n * Doc.\n */\nfunction f() {}\n';
  const exploits = [
    'if (x) /[/*]/.test(s) && y;\n', // a regex after the `)` of an `if` head
    'const y = x! / 2; // see a/*b\n', // a division after TypeScript's non-null `!`
    'const y = a++ / 2; // a/*b\n',
    'const y = a-- / 2; // a/*b\n',
    'const y = +class {} / 2; // a/*b\n',
    'const y = of / 2; // a/*b\n', // an identifier named `of`
    'const y = it.return / 2; // a/*b\n', // a keyword used as a property name divides
    'const y = [...typeof /[/*]/];\n', // but a keyword after a spread is an operator
    'const y = obj.if(x) / 2; // a/*b\n',
    'for await (const v of w) /[/*]/.test(v);\n',
  ];

  for (const head of exploits) {
    assert.equal(commentOnlyEdit(head + tail, 'limit(10)', 'limit(999)', 2), false, JSON.stringify(head));
  }

  // A division read as a regex after `!` swallows a template's opening
  // backtick, so the template's text on line 2 looked like a block comment at
  // the start of a line – no `/*` after code anywhere.
  const shifted = "const r = a! / '`' + `/\n/* 10 */\n`;\n// `\n";

  assert.equal(commentOnlyEdit(shifted, '10', '999', 2), false, 'the template text is runtime data');
});

test('the readings of an uncertain `/` must agree on every line, or the lex is incomplete', () => {
  // The JSDoc closes the comment the regex reading opens, so only the
  // disagreement between the readings can make this incomplete.
  assert.equal(stripComments('const y = x! / 2; // see a/*b\n/**\n * Doc.\n */\n').complete, false,
    'the readings disagree');

  // They agree when no comment opener or quote follows the `/` on its line.
  const agree = stripComments('if (!/^a/.test(s)) {}\n/**\n * Doc.\n */\n');

  assert.equal(agree.complete, true);
  assert.equal(agree.text, 'if (!/^a/.test(s)) {}');
  // A reading whose regex runs into a line break is dropped, not a disagreement.
  assert.equal(stripComments('const r = !/a/.test(s) // note\n').complete, true);
});

test('the certain cases need no second reading: a statement head, a call, a property, a keyword', () => {
  const cases = [
    ['if (x) /[/*]/.test(s); // c\n', 'if (x) /[/*]/.test(s);'],
    ['const y = size(a) / 2; // half\n', 'const y = size(a) / 2;'],
    ['const y = mod.default / 2; // c\n', 'const y = mod.default / 2;'],
    ['return /[/*]/.test(s); // c\n', 'return /[/*]/.test(s);'],
    ['const y = a / b / c; // c\n', 'const y = a / b / c;'],
    ['const f = () => /[/*]/; // c\n', 'const f = () => /[/*]/;'],
    ['const y = [1, 2][0] / 2; // c\n', 'const y = [1, 2][0] / 2;'],
  ];

  for (const [source, text] of cases) {
    const r = stripComments(source);

    assert.equal(r.complete, true, source);
    assert.equal(r.text, text, source);
  }
});

test('across a line break a division is never certain, because ASI can end the statement first', () => {
  // Reported by the red team: after `let x`, a type, an import, or `debugger`,
  // a `/` on the next line starts a regex; the rules called it a division.
  const tail = '/[/*]/.test(s);\nexport const limit = 1;\n/**\n * Doc.\n */\nexport const z = 1;\n';
  const heads = [
    'let x\n', 'debugger\n', 'import s from "./s.mjs"\n', 'let x: number\n', 'type A = string\n',
    'type T = \'a\' | \'b\'\n', 'let x: string[]\n', 'declare function f(a: string)\n', 'x: for (;;) { break x\n}\n',
  ];

  for (const head of heads) {
    const base = `const s = "";\n${head}${tail}`;
    const line = base.split('\n').indexOf('export const limit = 1;') + 1;

    assert.equal(commentOnlyEdit(base, 'limit = 1', 'limit = 2', line), false, JSON.stringify(head));
  }

  // A division continued on the next line still lexes: its regex reading dies.
  assert.equal(commentOnlyEdit('const y = a\n  / b;\n/**\n * Old.\n */\n', 'Old', 'New', 4), true);
});

test('identifiers are Unicode and may hold escapes, so no keyword hides inside a longer name', () => {
  // Reported by the red team: `ñreturn` read as `ñ` plus the keyword `return`.
  const tail = ' / 2 + "x/" + "/*";\nexport function limit() {\n  return 10;\n}\n/** doc */\nexport const z = 1;\n';

  for (const name of ['ñreturn', '\\u{62}return', 'total\u200Creturn', 'Δtypeof']) {
    const base = `export const ${name} = 4;\nexport const y = ${name}${tail}`;

    assert.equal(commentOnlyEdit(base, 'return 10', 'return 999', 4), false, name);
  }
  assert.equal(commentOnlyEdit(
    'declare function ñif(x: number): number;\nexport const y = ñif(1) / 2 + "x/" + "/*";\nlimit(10);\n/** doc */\n',
    'limit(10)', 'limit(999)', 3,
  ), false, 'a call to a function whose name ends in `if` divides');
});

test('`void` can be a type and a number can end in a dot, so neither settles the next `/`', () => {
  const tail = '\nlimit(10);\n/**\n * Doc.\n */\n';

  for (const head of [
    'const y = x as void / 2 + "x/" + "/*";', 'const y = x satisfies void / 2 + "x/" + "/*";',
    'const y = 1. in /[/*]/;', 'const y = 1..in / y + "x/" + "/*";',
  ]) {
    assert.equal(commentOnlyEdit(head + tail, 'limit(10)', 'limit(999)', 2), false, head);
  }
});

test('a line terminator git does not count makes the file code', () => {
  // Reported by the red team: JavaScript ends a `//` comment at a CR, U+2028,
  // or U+2029, so code after one sits on what git numbers as a comment line.
  for (const terminator of ['\r', '\u2028', '\u2029']) {
    const base = `// note${terminator}export const limit = 10;\n/**\n * Doc.\n */\n`;

    assert.equal(stripComments(base).complete, false, JSON.stringify(terminator));
    assert.equal(commentOnlyEdit(base, '10', '999', 1), false, JSON.stringify(terminator));
  }
  // CR LF line endings are fine, and so is a CR LF line continuation.
  const crlf = 'const y = a! / "x/\\\r\n" + "/*";\r\nexport function limit() { return 10; }\r\n/**\r\n * Doc.\r\n */\r\n';

  assert.equal(stripComments(crlf).complete, true);
  assert.equal(commentOnlyEdit(crlf, 'return 10', 'return 999', 3), false, 'the division reading survives');
});

test('a backslash outside a literal kills its reading, and a dead reading ends the lex', { timeout: 5000 }, () => {
  // Reported by the red team: a division reading kept `\` as code and read
  // `\//` as a line comment (a false block), and a reading that died at `\/*`
  // was re-queued forever (a hang).
  const noSlash = 'export const tracked = f => !/\\/(dist|tmp)\\//.test(f);\n/**\n * Old.\n */\nexport const z = 1;\n';

  assert.equal(stripComments(noSlash).complete, true);
  assert.equal(commentOnlyEdit(noSlash, 'Old', 'New', 3), true);
  assert.equal(stripComments('declare const s: string;\nlet x: string\n/\\/*/.test(s);\n').complete, true);
  assert.equal(stripComments('export const x = 1 \\/* note */;\n').complete, false, 'a stray backslash');
});

test('a leading `#!` line is kept as code, so a `/*` inside it opens nothing', () => {
  const base = '#!/usr/bin/env node --no-warnings /* see the docs\nexport function limit() {\n  return 10;\n}\n/**\n * Doc.\n */\n';

  assert.equal(commentOnlyEdit(base, 'return 10', 'return 999', 3), false);
  assert.equal(commentOnlyEdit(base, ' * Doc.', ' * New doc.', 6), true, 'a JSDoc edit below it still passes');
});

test('a comment a tool acts on is code: annotations, directives, bundler and coverage hints', () => {
  // Reported by the red team: an added `/*#__PURE__*/` line makes the minifier
  // drop the call on the next line, and `/// <reference>` changes type checking.
  const base = '/**\n * Registers every module.\n */\nregisterAllModules();\nexport const ready = true;\n';
  const added = [
    '/*#__PURE__*/', '// @ts-expect-error', '/// <reference types="node" />', '/* istanbul ignore next */',
    '//# sourceMappingURL=index.js.map', '/* webpackChunkName: "all" */', '/* @__NO_SIDE_EFFECTS__ */',
  ];

  for (const comment of added) {
    const head = base.replace('registerAllModules();', `${comment}\nregisterAllModules();`);

    assert.equal(isCommentOnlyChange({ baseText: base, headText: head, removed: [], added: [4] }), false, comment);
  }
  assert.equal(commentOnlyEdit(base, ' * Registers every module.', ' * @__PURE__', 2), false, 'a JSDoc tag');
  assert.equal(commentOnlyEdit(base, 'Registers every', 'Registers all', 2), true, 'plain prose is still prose');
});

test('a diff that names no changed lines is judged as code', () => {
  // Reported by the red team: git prints no hunks for a file it calls binary.
  const base = 'export function limit() {\n  return 10;\n}\n';
  const head = 'export function limit() {\n  return\n  10;\n}\n';

  assert.equal(isCommentOnlyChange({ baseText: base, headText: head, removed: [], added: [] }), false);
});

test('only an in-place edit of a .ts or .js file no build rewrites as text is a comment-only candidate', () => {
  assert.equal(commentOnlyCandidate({ status: 'M', path: 'handsontable/src/core.ts' }), true);
  assert.equal(commentOnlyCandidate({ status: 'M', path: 'wrappers/vue3/src/helpers.js' }), true);
  for (const status of ['A', 'D', 'R', 'C']) {
    assert.equal(commentOnlyCandidate({ status, path: 'handsontable/src/core.ts' }), false, status);
  }
  assert.equal(commentOnlyCandidate({ status: 'M', path: 'wrappers/react-wrapper/src/hotTable.tsx' }), false);
  assert.equal(commentOnlyCandidate({ status: 'M', path: 'handsontable/src/themes/theme/main.ts' }), false);
  assert.equal(commentOnlyCandidate({
    status: 'M', path: 'handsontable/src/themes/static/variables/colors/ant.ts',
  }), false);
});

test('the text-rewritten sources are exactly the theme build\'s string-replace-loader rules', () => {
  // Reported by the red team: the theme UMD build rewrites these files with
  // regexes that see comments. A new loader rule must join the list.
  const config = readFileSync(new URL('../../../handsontable/.config/themes-umd-development.js', import.meta.url), 'utf8');
  const rules = [...config.matchAll(/test:\s*\/(.+)\/,\s*\n\s*loader:\s*'string-replace-loader'/g)].map(m => m[1]);

  assert.deepEqual(rules, TEXT_REWRITTEN_SOURCE.map(r => r.source));
});

test('a JSDoc-only edit is comment-only; a code edit, or a blank line, is judged exactly', () => {
  const base = '/**\n * Old words.\n */\nexport function f() {\n  return 1;\n}\n';

  assert.equal(isCommentOnlyChange({
    baseText: base, headText: base.replace('Old words.', 'New words.'), removed: [2], added: [2],
  }), true, 'rewording the JSDoc');
  assert.equal(isCommentOnlyChange({
    baseText: base, headText: base.replace('return 1', 'return 2'), removed: [5], added: [5],
  }), false, 'changing the returned value');
  assert.equal(isCommentOnlyChange({
    baseText: base, headText: base.replace('export function', '\nexport function'), removed: [], added: [4],
  }), true, 'adding a blank line');
});

test('conservative by design: a trailing comment on a code line, or a reindent, still counts as code', () => {
  // The stripped texts are identical in both cases, but a changed line holds
  // code, so the gate asks for a test or a trailer rather than guess.
  assert.equal(isCommentOnlyChange({
    baseText: 'const x = 1;\n', headText: 'const x = 1; // why\n', removed: [1], added: [1],
  }), false);
  assert.equal(isCommentOnlyChange({
    baseText: 'if (a) {\nx();\n}\n', headText: 'if (a) {\n  x();\n}\n', removed: [2], added: [2],
  }), false);
  assert.equal(isCommentOnlyChange({
    baseText: 'const re = /\\/*/;\n', headText: 'const re = /\\/*/; // x\n', removed: [1], added: [1],
  }), false, 'an incomplete lex is code');
});

test('evaluate: comment-only files need no test; any other uncovered file still does', () => {
  const DOC = 'handsontable/src/core.ts';
  const CODE = 'handsontable/src/helpers/a.ts';
  const only = evaluate([{ status: 'M', path: DOC }], [], { commentOnly: [DOC] });

  assert.equal(only.pass, true);
  assert.equal(only.reason, 'comments-only');
  assert.deepEqual(only.commentOnly, [DOC]);

  const mixed = evaluate([{ status: 'M', path: DOC }, { status: 'M', path: CODE }], [], { commentOnly: [DOC] });

  assert.equal(mixed.pass, false);
  assert.deepEqual(mixed.uncovered, [{ group: 'core', files: [CODE] }]);
});

// --- review round: lineage, merges, the PR-description waiver ---
test('a waiver follows a rename: edits under the old name still need a test', () => {
  // Reported in review: an untrailered commit edits a.ts, then a Refactor-only
  // commit renames it to b.ts, and b.ts used to pass as waived. Commits come
  // newest first, as `git log` lists them.
  const commits = [
    {
      hash: 'b2', subject: 'rename', message: 'Refactor-only: renamed a to b only', files: ['a.ts', 'b.ts'],
      renames: [['a.ts', 'b.ts']],
    },
    { hash: 'a1', subject: 'edit a', message: 'DEV-1: change a', files: ['a.ts'] },
  ];

  assert.deepEqual(commitsTouching('b.ts', commits).map(c => c.hash), ['b2', 'a1']);
  assert.equal(isWaived('b.ts', commits), false);
  assert.deepEqual(undeclaredCommits('b.ts', commits).map(c => c.hash), ['a1']);
  assert.equal(isWaived('b.ts', commits.slice(0, 1)), true, 'the rename alone is a declared refactor');
});

test('a merge commit\'s own edits never waive, even beside a refactor commit', () => {
  // Reported in review: a conflict resolution in a merge was invisible, so a
  // `return 999` it wrote was waived by an earlier refactor commit.
  const commits = [
    { hash: 'm1', subject: 'Merge develop (merge)', message: '', merge: true, files: ['a.ts'] },
    { hash: 'r1', subject: 'extract', message: 'Refactor-only: extracted a shared helper', files: ['a.ts'] },
  ];

  assert.equal(isWaived('a.ts', commits), false);
  assert.deepEqual(undeclaredCommits('a.ts', commits).map(c => c.hash), ['m1']);
});

test('bodyWaiver reads [refactor-only: <reason>] from the PR description, and needs a reason', () => {
  assert.equal(bodyWaiver('Some text.\n\n[refactor-only: renamed a private field]\n'), 'renamed a private field');
  assert.equal(bodyWaiver('[Refactor-Only:  internal types only ]'), 'internal types only');
  assert.equal(bodyWaiver('[refactor-only: ]'), null, 'an empty reason is no waiver');
  assert.equal(bodyWaiver(''), null);
  assert.equal(bodyWaiver(undefined), null);
  assert.equal(bodyWaiver(stripHtmlComments('<!-- [refactor-only: hidden in a comment] -->')), null,
    'the CLI strips comments first');
});

test('bodyWaiver ignores the <reason> placeholder from a pasted instruction or red verdict', () => {
  // Reported in review: the red verdict tells the author to write
  // `[refactor-only: <reason>]`, so pasting it must not turn the job green.
  // Plain text, so the placeholder rule decides, not the code stripping.
  assert.equal(bodyWaiver('[refactor-only: <reason>]'), null);
  assert.equal(bodyWaiver('write [refactor-only: <why this needs no test>] in the PR description instead'), null);
  assert.equal(bodyWaiver('[refactor-only: &lt;reason&gt;]'), null, 'an HTML-escaped copy');
  assert.equal(bodyWaiver('any [refactor-only: …] token, or [refactor-only: ...]'), null, 'an elided reason');
  assert.equal(
    bodyWaiver('CI said: write [refactor-only: <reason>].\n\n[refactor-only: renamed a private field]'),
    'renamed a private field',
    'a real waiver after a pasted placeholder still counts',
  );
});

test('a waiver reason needs at least three words, in a trailer and in the description', () => {
  // Reported in review: TBD, reason, x, and .... used to pass as reasons.
  for (const reason of ['TBD', 'reason', 'x', '....', 'types only', 'a b c d']) {
    assert.equal(bodyWaiver(`[refactor-only: ${reason}]`), null, reason);
    assert.equal(refactorDeclared([`Refactor-only: ${reason}`]), false, reason);
  }
  // The shortest real reason in develop's history.
  assert.equal(bodyWaiver('[refactor-only: JSDoc wording only.]'), 'JSDoc wording only.');
  assert.equal(refactorDeclared(['Refactor-only: JSDoc wording only.']), true);
  assert.equal(refactorDeclared(['Refactor-only: renommé un champ privé']), true, 'any language counts');
});

test('a waiver inside Markdown code is a quotation, not a declaration', () => {
  // Reported in review: a [refactor-only: …] inside a code fence waived the PR.
  const reason = 'moved helpers into one file';
  const quoted = [
    `Example:\n\n\`\`\`\n[refactor-only: ${reason}]\n\`\`\`\n`,
    `CI log:\n~~~text\n[refactor-only: ${reason}]\n~~~\n`,
    `- item\n\n    \`\`\`\n    [refactor-only: ${reason}]\n    \`\`\`\n`,
    `\`\`\`\`\n\`\`\`\n[refactor-only: ${reason}]\n\`\`\`\n\`\`\`\`\n`, // a shorter fence inside a longer one
    `Unclosed:\n\`\`\`\n[refactor-only: ${reason}]\n`,
    `write \`[refactor-only: ${reason}]\` like this`,
    `write \`\` [refactor-only: ${reason}] \`\` like this`,
  ];

  for (const body of quoted) {
    assert.equal(bodyWaiver(body), null, JSON.stringify(body));
  }
  assert.equal(bodyWaiver(`\`\`\`\n[refactor-only: ${reason}]\n\`\`\`\n\n[refactor-only: renamed a private field]`),
    'renamed a private field', 'a real waiver after a fence still counts');
});

test('a waiver GitHub shows as code stays a quotation: CR LF, indented blocks, HTML code, quoted fences', () => {
  // Reported by the red team: each of these counted as a waiver.
  const w = '[refactor-only: moved helpers into one file]';
  const quoted = [
    `CI log:\r\n~~~text\r\n${w}\r\n~~~\r\n`, // the GitHub editor writes CR LF
    `Unclosed:\r\n\`\`\`\r\n${w}\r\n`,
    `Log:\n\n    ${w}\n`, // an indented code block
    `Log:\n\n\t${w}\n`,
    `<code>${w}</code>`,
    `<pre>\n${w}\n</pre>`,
    `<kbd>${w}</kbd> and <samp>${w}</samp> and <tt>${w}</tt>`,
    `> ~~~\n> ${w}\n> ~~~\n`, // a fence in a quote
    `- \`\`\`\n  ${w}\n  \`\`\`\n`, // a fence in a list item
    `\`\`\`md\nNested example:\n    \`\`\`\n${w}\n\`\`\`\n`, // a 4-space line cannot close a fence
    `- item\n  \`\`\`\n  code\n\`\`\`\n${w}\n\`\`\`\n`, // the list ends, and a new fence opens
    'It doesn`t change behavior.\n\nThe verdict suggested `' + w + '`, but I added a test.\n',
    '## Don`t merge yet\n`' + w + '`\n',
    'Use \\`x` ' + w + ' `y`', // an escaped backtick opens nothing
    '`<!--`\n```\n-->\n' + w + '\n```\n', // `<!--` in code is text, so the fence stands
  ];

  for (const body of quoted) {
    assert.equal(bodyWaiver(body), null, JSON.stringify(body));
  }
});

test('a plain-text waiver still counts beside code, and its reason keeps its code and links', () => {
  // Reported by the red team: these real waivers were refused or cut short.
  assert.equal(bodyWaiver('Fixes the don`t typo.\n\n[refactor-only: renamed a private field]\n\nUse `bar` now.\n'),
    'renamed a private field', 'a stray backtick in another paragraph');
  assert.equal(bodyWaiver('[refactor-only: extracted `getRange` into `rangeHelpers`]'),
    'extracted `getRange` into `rangeHelpers`', 'code in the reason counts as words');
  assert.equal(bodyWaiver('[refactor-only: follow-up to [#1](https://example.com/1), internal types only]'),
    'follow-up to [#1](https://example.com/1), internal types only', 'a link in the reason');
  assert.equal(bodyWaiver('[refactor-only: renamed arr[i] to a named local]'), 'renamed arr[i] to a named local');
  assert.equal(bodyWaiver('```\ncode\n```\n\n[refactor-only: renamed a private field]'), 'renamed a private field');
  assert.equal(bodyWaiver('- ```\n  code\n  ```\n\n[refactor-only: renamed a private field]'), 'renamed a private field');
  // Fails closed, deliberately: an unterminated `<!--` hides the rest in one
  // of the two readings, even when GitHub shows it as text inside code.
  assert.equal(bodyWaiver('The gate strips `<!--` first.\n\n[refactor-only: renamed a private field]'), null);
});

test('the PR-description waiver clears what no commit declared, and nothing else', () => {
  const FILE = 'handsontable/src/helpers/a.ts';
  const r = evaluate([{ status: 'M', path: FILE }], [{ message: 'DEV-1: change a', files: [FILE] }], {
    bodyWaiver: 'types only',
  });

  assert.equal(r.pass, true);
  assert.equal(r.reason, 'refactor-declared');
  assert.deepEqual(r.bodyWaived, [FILE]);
  assert.equal(r.bodyWaiver, 'types only');

  const jasmine = evaluate([
    { status: 'M', path: FILE },
    { status: 'A', path: 'handsontable/src/plugins/filters/__tests__/new.spec.js' },
  ], [], { bodyWaiver: 'types only' });

  assert.equal(jasmine.reason, 'new-jasmine-spec', 'a waiver never admits a new Jasmine spec');
});

test('translation dictionaries need no test, but stay source to the changelog gate', () => {
  const dictionary = 'handsontable/src/i18n/languages/fa-IR.ts';

  assert.equal(isSource({ path: dictionary }), false);
  assert.equal(classify(dictionary), 'source', 'classify() is what changelog-gate.mjs reads');
  assert.equal(evaluate([{ status: 'M', path: dictionary }]).reason, 'ok');
  assert.equal(isSource({ path: 'handsontable/src/i18n/registry.ts' }), true, 'the i18n code itself still needs one');
});
