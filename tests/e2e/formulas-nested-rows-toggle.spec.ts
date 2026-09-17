import { test, expect } from '../fixtures/test';
import { FormulasNestedRowsTogglePage } from '../fixtures/pages/FormulasNestedRowsTogglePage';

/**
 * DEV-2978: turning NestedRows on with `updateSettings()` changes how many rows the grid holds,
 * and the HyperFormula sheet has to follow. Nothing on the settings path replays the new layout
 * for it on its own - `afterLoadData` / `afterUpdateData` never fire, and `afterCellMetaReset`
 * fires before the plugins update - so the engine kept the two-row layout it was built with.
 */
test.describe('Formulas across a nestedRows runtime toggle', () => {
  let grid: FormulasNestedRowsTogglePage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FormulasNestedRowsTogglePage(page, theme, bundle);
  });

  test('keeps the engine sheet the same height as the flattened grid', async() => {
    await grid.goto();

    expect(await grid.rowCount()).toBe(2);
    expect(await grid.sheetHeight()).toBe(2);

    await grid.setNestedRows(true);

    expect(await grid.rowCount()).toBe(4);
    expect(await grid.sheetHeight()).toBe(4);
  });

  test('computes every formula against the row it now sits on', async() => {
    await grid.goto();

    await grid.setNestedRows(true);

    // `A-1` holds `=UPPER(A2)`, which is its own name once the tree is flat; `Root B` holds
    // `=UPPER(A1)`, which is `Root A`. On the stale sheet `Root B` rendered its own formula as raw
    // text and the computed value had slid onto `A-1`.
    expect(await grid.visibleRows()).toEqual([
      ['Root A', ''],
      ['A-1', 'A-1'],
      ['A-2', ''],
      ['Root B', 'ROOT A'],
    ]);
  });

  test('matches a grid built with both settings at construction', async() => {
    await grid.goto({ nested: 'on' });

    const reference = await grid.visibleRows();

    await grid.goto();
    await grid.setNestedRows(true);

    expect(await grid.visibleRows()).toEqual(reference);
  });

  test('re-evaluates a later edit against the new layout', async() => {
    await grid.goto();

    await grid.setNestedRows(true);

    await grid.setCell(0, 0, 'Renamed');

    // The dependent is `Root B`, the last row. Against the stale sheet the edit landed on a
    // different row and `Root B` never moved.
    await expect.poll(() => grid.visibleRows()).toEqual([
      ['Renamed', ''],
      ['A-1', 'A-1'],
      ['A-2', ''],
      ['Root B', 'RENAMED'],
    ]);

    expect(await grid.consoleErrors()).toEqual([]);
  });

  test('follows the grid back down when the plugin is turned off again', async() => {
    await grid.goto();

    await grid.setNestedRows(true);
    await grid.setNestedRows(false);

    expect(await grid.rowCount()).toBe(2);
    // Read as content rather than as dimensions: the engine keeps the extent it grew to, so
    // `getSheetDimensions()` still reports four rows here while the sheet holds two.
    expect(await grid.sheetContent()).toEqual([
      ['Root A', ''],
      ['Root B', '=UPPER(A1)'],
    ]);
    expect(await grid.visibleRows()).toEqual([
      ['Root A', ''],
      ['Root B', 'ROOT A'],
    ]);
  });
});
