import { test, expect, THEMES_TAG } from '../fixtures/test';
import {
  AutoColumnSizeUniformColumnPage,
  type UniformColumnCase,
} from '../fixtures/pages/AutoColumnSizeUniformColumnPage';

/**
 * AutoColumnSize reads a column whose cells share their meta (no `beforeGetCellMeta` or `afterGetCellMeta`
 * listener, no `cells` function) with one meta object and one bulk value read, and leaves a cell with
 * stored meta and a hidden row to the per-cell read. Each case is built twice, once with a no-op
 * `afterGetCellMeta` listener that sends every cell down the per-cell read, and the two builds must
 * measure the same widths. The widths come from the theme, so the cases compare builds, never literals.
 */
const CASES: UniformColumnCase[] = [
  'plain',
  'storedValueFormatter',
  'cellOption',
  'modifyData',
  'hidingMap',
  'pagination',
  'sorted',
  'numeric',
  'keyValueDropdown',
  'dotNotation',
  'cellsFunction',
  'checkboxLabel',
  'seedListener',
];

test.describe('AutoColumnSize uniform column sampling', { tag: THEMES_TAG }, () => {
  let grid: AutoColumnSizeUniformColumnPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new AutoColumnSizeUniformColumnPage(page, theme, bundle);
    await grid.goto();
  });

  for (const name of CASES) {
    test(`measures the same widths as the per-cell read (${name})`, async() => {
      const perCell = await grid.widths(name, true);
      const uniform = await grid.widths(name, false);

      expect(uniform).toEqual(perCell);
    });
  }

  test('lets the content of a single deep row widen its column', async() => {
    const plain = await grid.widths('plain', false);

    // A cell with stored meta, a `cell` option entry, and a `modifyData` listener each lengthen one value
    // in the deep row of their own column.
    expect((await grid.widths('storedValueFormatter', false))[0]).toBeGreaterThan(plain[0]);
    expect((await grid.widths('cellOption', false))[1]).toBeGreaterThan(plain[1]);
    expect((await grid.widths('modifyData', false))[2]).toBeGreaterThan(plain[2]);
    expect((await grid.widths('sorted', false))[1]).toBeGreaterThan(plain[1]);
  });

  test('leaves the long value of a row the grid does not show out of the width', async() => {
    const plain = await grid.widths('plain', false);

    expect((await grid.widths('hidingMap', false))[0]).toBe(plain[0]);
    expect((await grid.widths('pagination', false))[0]).toBe(plain[0]);
  });
});
