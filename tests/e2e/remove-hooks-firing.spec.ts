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

  test('alter() merges two neighboring groups into one run', async({ page, theme, bundle }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();

    // Two groups that touch. `normalizeIndexesGroup()` is the only thing that folds them, since
    // the context-menu path is not involved here, so this is the case that pins that function.
    await grid.alter('remove_row', [[0, 1], [1, 1]], 'test.arrayForm');

    expect(await grid.callsFor('afterRemoveRow')).toEqual([
      { hook: 'afterRemoveRow', index: 0, amount: 2, physicalIndexes: [0, 1], source: 'test.arrayForm' },
    ]);
    expect(await grid.remainingRowIds()).toEqual(['r2c0', 'r3c0', 'r4c0', 'r5c0']);
    expect(grid.pageErrors).toEqual([]);
  });

  test('physical indexes are reported, not visual ones, on a sorted grid', async({ page, theme, bundle }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();
    await grid.rebuild({ columnSorting: true });
    await grid.sortByColumn(0, 'desc');

    // Visual rows 0 and 1 now hold physical rows 5 and 4.
    await grid.alter('remove_row', [[0, 2]], 'test.sorted');

    // One run, but its physical indexes are neither ascending nor contiguous in the usual sense.
    // The same assertion on visual indexes would read [0, 1], so this pins the physical half.
    expect(await grid.callsFor('afterRemoveRow')).toEqual([
      { hook: 'afterRemoveRow', index: 0, amount: 2, physicalIndexes: [5, 4], source: 'test.sorted' },
    ]);
    expect(await grid.remainingRowIds()).toEqual(['r3c0', 'r2c0', 'r1c0', 'r0c0']);
    expect(grid.pageErrors).toEqual([]);
  });

  test('editing physicalRows in beforeRemoveRow changes what is removed and the reported amount', async({
    page, theme, bundle,
  }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();
    await grid.setBeforeRemoveRowRewrite([0, 1, 2]);

    // Ask for one row at index 4; the handler rewrites the list to three different rows.
    await grid.alter('remove_row', [[4, 1]], 'test.mutation');

    // The rewritten list is what went, and `amount` followed it rather than staying at 1.
    expect(await grid.callsFor('afterRemoveRow')).toEqual([
      { hook: 'afterRemoveRow', index: 4, amount: 3, physicalIndexes: [0, 1, 2], source: 'test.mutation' },
    ]);
    expect(await grid.remainingRowIds()).toEqual(['r3c0', 'r4c0', 'r5c0']);
    expect(grid.pageErrors).toEqual([]);
  });

  test('afterRemoveCol reports the requested amount, which can overrun the last column', async({
    page, theme, bundle,
  }) => {
    const grid = new RemoveHooksFiringPage(page, theme, bundle);

    await grid.goto();

    // Ask for five columns starting at 4 on a six-column grid. Only two exist to remove.
    await grid.alterWithAmount('remove_col', 4, 5, 'test.overrun');

    const calls = await grid.callsFor('afterRemoveCol');

    expect(calls).toHaveLength(1);
    // `amount` is the requested count and overruns; the array is the truth. The row hooks do
    // not behave this way, which is why only the column docs carry the warning.
    expect(calls[0].amount).toBe(5);
    expect(calls[0].physicalIndexes).toEqual([4, 5]);
    expect(await grid.remainingColumnIds()).toEqual(['r0c0', 'r0c1', 'r0c2', 'r0c3']);
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
