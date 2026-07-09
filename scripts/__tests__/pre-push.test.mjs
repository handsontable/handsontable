import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changedPlaywrightSpecs } from '../pre-push.mjs';

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
