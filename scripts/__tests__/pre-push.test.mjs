import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  changedPlaywrightSpecs,
  changedUnitTests,
  unitTestPattern,
  isJestInfraFailure,
} from '../pre-push.mjs';

test('selects changed Playwright specs and maps them relative to tests/', () => {
  const changed = [
    'tests/e2e/grid.spec.ts',
    'tests/e2e/filters/menu.spec.ts',
    'tests/fixtures/pages/GridPage.ts', // support, not a spec
    'handsontable/src/plugins/filters/filters.ts', // source
    'handsontable/src/plugins/filters/__tests__/x.spec.js', // legacy Jasmine
    'tests/visual/theme.spec.ts', // visual, not e2e
  ];

  assert.deepEqual(changedPlaywrightSpecs(changed), [
    'e2e/grid.spec.ts',
    'e2e/filters/menu.spec.ts',
  ]);
});

test('returns nothing when no e2e specs changed', () => {
  assert.deepEqual(changedPlaywrightSpecs([
    'handsontable/src/core.ts',
    'tests/fixtures/demo/grid.html',
  ]), []);
});

test('selects changed handsontable unit tests, excluding build output', () => {
  const changed = [
    'handsontable/src/helpers/__tests__/number.unit.js',
    'handsontable/src/plugins/filters/__tests__/dataFilter.unit.ts',
    'handsontable/src/core.ts', // source, not a test
    'handsontable/src/plugins/filters/__tests__/filters.spec.js', // Jasmine e2e, not unit
    'handsontable/tmp/helpers/number.unit.js', // build output — must be excluded
    'tests/e2e/grid.spec.ts', // Playwright, not unit
  ];

  assert.deepEqual(changedUnitTests(changed), [
    'handsontable/src/helpers/__tests__/number.unit.js',
    'handsontable/src/plugins/filters/__tests__/dataFilter.unit.ts',
  ]);
});

test('unitTestPattern is a single shell-safe handsontable-relative path (never a |-joined regex)', () => {
  assert.equal(
    unitTestPattern('handsontable/src/helpers/__tests__/number.unit.ts'),
    'src/helpers/__tests__/number.unit.ts',
  );
  // run.mjs appends the pattern to a cross-env-shell command UNQUOTED, so a `|`
  // (regex alternation) would be read as a shell pipe (the exit-126 bug). Never
  // emit one — the hooks run one jest per file instead.
  assert.ok(!unitTestPattern('handsontable/src/plugins/filters/__tests__/dataFilter.unit.ts').includes('|'));
});

test('treats a jest config/module-resolution failure as infra (non-blocking), not a test failure', () => {
  assert.equal(isJestInfraFailure('● Validation Error:\n  Module jest-jasmine2 was not found.'), true);
  assert.equal(isJestInfraFailure('No tests found, exiting with code 1'), true);
  // A real run that reports failures is NOT infra — it must block.
  assert.equal(isJestInfraFailure('Tests:       1 failed, 4 passed, 5 total'), false);
});
