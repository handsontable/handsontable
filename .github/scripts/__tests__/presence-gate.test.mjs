import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classify, isCoverage, isNewJasmineSpec, refactorDeclared, evaluate,
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
