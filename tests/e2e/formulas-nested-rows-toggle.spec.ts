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

    // Read off the painted cells too, not only the model: "renders as raw text" is what the user
    // reports, and a fix that corrected the data while leaving the paint stale would pass above.
    await expect(grid.cell(1, 1)).toHaveText('A-1');
    await expect(grid.cell(3, 1)).toHaveText('ROOT A');
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

  test('rebuilds the sheet once per toggle', async() => {
    await grid.goto();

    // DEV-3006: the mid-update pass used to scan the pre-flatten tree and the late listener scanned
    // again, so the toggle paid two full rebuilds and the first one was discarded. The mid-update
    // pass now only records that a resync is owed, and the late listener performs the one scan.
    await grid.resetSheetWriteCount();
    await grid.setNestedRows(true);

    expect(await grid.sheetWriteCount()).toBe(1);
    expect(await grid.sheetHeight()).toBe(4);

    await grid.resetSheetWriteCount();
    await grid.setNestedRows(false);

    expect(await grid.sheetWriteCount()).toBe(1);
    expect(await grid.sheetContent()).toEqual([
      ['Root A', ''],
      ['Root B', '=UPPER(A1)'],
    ]);
  });

  test('leaves the sheet alone when the row count did not change', async() => {
    await grid.goto();

    await grid.setNestedRows(true);
    await grid.resetSheetWriteCount();

    // A payload that touches no row. The mid-update pass rebuilds the sheet once, as it always
    // has; what must NOT happen is the late listener adding a second rebuild. The React wrapper
    // sends a payload of this shape on every re-render.
    await grid.updateUnrelatedSetting(false);

    expect(await grid.sheetWriteCount()).toBe(1);
    expect(await grid.rowCount()).toBe(4);
    expect(await grid.sheetHeight()).toBe(4);
  });

  test('does not write the grid back into a sheet it just switched to', async() => {
    await grid.goto({ scenario: 'sheet-switch' });

    // Q2 is taller than Q1 and three columns wide; the grid declares only the first column. The
    // switch changes the row count for a reason this plugin caused itself, so treating it as a
    // foreign layout change wrote the grid's one-column projection over Q2 and destroyed the other
    // two columns for every grid sharing the engine.
    await grid.switchSheet('Q2');

    expect(await grid.sharedSheetContent('Q2')).toEqual([
      ['q2-a', 'q2-b', 'q2-c'],
      ['q2-d', 'q2-e', 'q2-f'],
      ['q2-g', 'q2-h', 'q2-i'],
      ['q2-j', 'q2-k', 'q2-l'],
    ]);

    // Q1 is deliberately not asserted whole: the grid is bound to it and declares one column, so
    // the plugin narrows Q1 to that projection at build time. That is long-standing behavior for
    // the sheet a grid OWNS; the defect was doing it to a sheet the grid merely switched to.
    expect(await grid.rowCount()).toBe(4);
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
