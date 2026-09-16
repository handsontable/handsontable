import { test, expect } from '../fixtures/test';
import { RemoveHooksFiringPage } from '../fixtures/pages/RemoveHooksFiringPage';

/**
 * DEV-2523: `beforeRemoveRow`/`afterRemoveRow` and their column counterparts fire once per
 * *consecutive run* of removed indexes, not once per removed row.
 *
 * The distinction only shows up in a mixed selection, where some of the Ctrl/Cmd-picked rows
 * touch each other and others stand alone. That case is the one the hook documentation used to
 * leave out, and the one nothing pinned before these specs.
 */
test.describe('remove row/column hooks fire once per consecutive run', () => {
  test('a mixed row selection fires once per run, not once per row', async({ page, theme, bundle }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();

    // Rows 0 and 1 touch; row 3 stands alone. Two runs, so two calls.
    await grid.ctrlSelectRows([0, 1, 3]);
    await grid.removeViaContextMenu(grid.rowHeader(3), 'rows');

    expect(await grid.callsFor('afterRemoveRow')).toEqual([
      { hook: 'afterRemoveRow', index: 0, amount: 2, physicalIndexes: [0, 1], source: 'ContextMenu.removeRow' },
      { hook: 'afterRemoveRow', index: 1, amount: 1, physicalIndexes: [1], source: 'ContextMenu.removeRow' },
    ]);

    // The rows that actually went are the three that were picked.
    expect(await grid.remainingRowIds()).toEqual(['r2c0', 'r4c0', 'r5c0']);
    expect(grid.pageErrors).toEqual([]);
  });

  test('a mixed column selection fires once per run, not once per column', async({ page, theme, bundle }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();

    await grid.ctrlSelectColumns([0, 1, 3]);
    await grid.removeViaContextMenu(grid.columnHeader(3), 'columns');

    expect(await grid.callsFor('afterRemoveCol')).toEqual([
      { hook: 'afterRemoveCol', index: 0, amount: 2, physicalIndexes: [0, 1], source: 'ContextMenu.removeColumn' },
      { hook: 'afterRemoveCol', index: 1, amount: 1, physicalIndexes: [1], source: 'ContextMenu.removeColumn' },
    ]);

    expect(await grid.remainingColumnIds()).toEqual(['r0c2', 'r0c4', 'r0c5']);
    expect(grid.pageErrors).toEqual([]);
  });

  test('one solid block of rows fires a single call carrying the whole block', async({ page, theme, bundle }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();

    await grid.ctrlSelectRows([1, 2, 3]);
    await grid.removeViaContextMenu(grid.rowHeader(3), 'rows');

    expect(await grid.callsFor('afterRemoveRow')).toEqual([
      { hook: 'afterRemoveRow', index: 1, amount: 3, physicalIndexes: [1, 2, 3], source: 'ContextMenu.removeRow' },
    ]);
    expect(await grid.remainingRowIds()).toEqual(['r0c0', 'r4c0', 'r5c0']);
    expect(grid.pageErrors).toEqual([]);
  });

  test('rows that all stand alone fire one call each, carrying one row', async({ page, theme, bundle }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();

    await grid.ctrlSelectRows([0, 2]);
    await grid.removeViaContextMenu(grid.rowHeader(2), 'rows');

    expect(await grid.callsFor('afterRemoveRow')).toEqual([
      { hook: 'afterRemoveRow', index: 0, amount: 1, physicalIndexes: [0], source: 'ContextMenu.removeRow' },
      { hook: 'afterRemoveRow', index: 1, amount: 1, physicalIndexes: [1], source: 'ContextMenu.removeRow' },
    ]);
    expect(await grid.remainingRowIds()).toEqual(['r1c0', 'r3c0', 'r4c0', 'r5c0']);
    expect(grid.pageErrors).toEqual([]);
  });

  test('the before hook fires on the same schedule, paired with the after hook', async({ page, theme, bundle }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();

    await grid.ctrlSelectRows([0, 1, 3]);
    await grid.removeViaContextMenu(grid.rowHeader(3), 'rows');

    // Each run is wrapped by its own before/after pair, rather than one before spanning both runs.
    expect((await grid.hookLog()).map(entry => `${entry.hook}:${entry.amount}`)).toEqual([
      'beforeRemoveRow:2',
      'afterRemoveRow:2',
      'beforeRemoveRow:1',
      'afterRemoveRow:1',
    ]);
    expect(grid.pageErrors).toEqual([]);
  });

  test('a later call reports indexes that already account for the earlier removal', async({
    page, theme, bundle,
  }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();

    // Ask for source rows 0 and 2 through the documented array form.
    await grid.alter('remove_row', [[0, 1], [2, 1]], 'test.arrayForm');

    // Source rows 0 and 2 are the ones that went...
    expect(await grid.remainingRowIds()).toEqual(['r1c0', 'r3c0', 'r4c0', 'r5c0']);

    // ...but the second call reports 1, not 2, because row 0 had already been spliced out by
    // then. Collecting these across one gesture therefore names the wrong rows, which is the
    // caveat the hook documentation now spells out.
    expect((await grid.callsFor('afterRemoveRow')).map(entry => entry.physicalIndexes)).toEqual([[0], [1]]);
    expect(grid.pageErrors).toEqual([]);
  });
});
