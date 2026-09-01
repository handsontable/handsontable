import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintable } from '../lint-files.mjs';

test('lintable keeps files inside a CI lint scope', () => {
  assert.deepEqual(
    lintable([
      'handsontable/src/core.ts',
      'handsontable/test/e2e/x.spec.js',
      'handsontable/scripts/run.mjs',
      'wrappers/vue3/src/HotTable.vue',
      'tests/e2e/x.spec.ts',
      'tests/fixtures/pages/GridPage.ts',
      'scripts/pre-push.mjs',
    ]),
    [
      'handsontable/src/core.ts',
      'handsontable/test/e2e/x.spec.js',
      'handsontable/scripts/run.mjs',
      'wrappers/vue3/src/HotTable.vue',
      'tests/e2e/x.spec.ts',
      'tests/fixtures/pages/GridPage.ts',
      'scripts/pre-push.mjs',
    ],
  );
});

test('lintable drops files outside every CI lint scope (react/angular/docs, package roots)', () => {
  assert.deepEqual(
    lintable([
      'wrappers/react-wrapper/src/hotTable.tsx', // no plain-eslint script
      'wrappers/angular-wrapper/projects/hot-table/src/lib/x.ts', // ng lint, not eslint CLI
      'docs/src/x.js', // no lint script
      'handsontable/hot.config.js', // package root — not in src/test/scripts
      'README.md',
    ]),
    [],
  );
});

test('lintable drops dotfiles and dot-directory paths CI lints only as directories (or never)', () => {
  assert.deepEqual(
    lintable([
      'handsontable/.eslintrc.js', // NOT in any lint scope — has pre-existing max-len; must never block
      'handsontable/.config/plugin/eslint/rules/no-focused-test.js', // ignored-by-default as a file arg
      '.github/scripts/lib/presence-gate.mjs', // dot-dir
      '.claude/settings.json',
    ]),
    [],
  );
});

test('lintable drops paths the owning package .eslintignore excludes', () => {
  // Inside the `handsontable/scripts/` scope, but `handsontable/.eslintignore` excludes it.
  // The hook runs ESLint from the repo root where that ignore does not apply, and the file is
  // outside every tsconfig project, so ESLint answers with a parsing error — exit 1, which
  // would block the commit on a file CI never lints.
  assert.deepEqual(
    lintable([
      'handsontable/scripts/themes/figma/templates/iconsMap.ts',
      'handsontable/test/lib/jquery.min.js', // vendored
      'handsontable/test/dist/helpers.js', // built test bundle
      'handsontable/src/3rdparty/autoResize/autoResize.js',
      'handsontable/src/3rdparty/walkontable/test/lib/jquery.js',
      'handsontable/scripts/themes/figma/utils/helpers/iconsMap.mjs', // NOT ignored — must survive
      'handsontable/test/e2e/x.spec.js', // NOT ignored — must survive
    ]),
    [
      'handsontable/scripts/themes/figma/utils/helpers/iconsMap.mjs',
      'handsontable/test/e2e/x.spec.js',
    ],
  );
});

test('lintable drops non-lintable extensions', () => {
  assert.deepEqual(
    lintable(['handsontable/src/x.css', 'tests/fixtures/demo/grid.html', 'handsontable/.ai/TESTING.md']),
    [],
  );
});
