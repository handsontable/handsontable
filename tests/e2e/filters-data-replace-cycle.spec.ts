import { test, expect } from '../fixtures/test';
import { FiltersDataReplacePage } from '../fixtures/pages/FiltersDataReplacePage';

/**
 * Regression coverage for DEV-2889.
 *
 * Applying a filter and then replacing the grid's data — while re-sending the `filters` option, the
 * way the framework wrappers re-send their whole settings object on every commit — used to leave the
 * Filters plugin's `ConditionUpdateObserver` bound to a `ConditionCollection` that `disablePlugin()`
 * had already destroyed. `disablePlugin()` destroyed and nulled the collection but never touched the
 * observer, and `enablePlugin()` skipped rebuilding an observer it still held. The next time a data
 * change drove that stale observer, it read the destroyed collection and threw:
 *
 *   TypeError: Cannot read properties of null (reading 'getEntries')
 *       at ConditionCollection.exportAllConditions
 *       at ConditionUpdateObserver.updateStatesAtColumn
 *
 * A single filter-then-replace cycle is fine: the observer is only stranded once the plugin is
 * disabled/enabled, and it is not read until a later data change. The crash needs the sequence twice.
 * Two data-change paths reach the stale observer, and both are covered below: `afterUpdateData`
 * (a second data replacement) and `afterChange` (editing a cell in a filtered column).
 */
test.describe('Filters — replacing data with an active filter', () => {
  test('does not crash when data is replaced twice with an active filter', async({ page, theme, bundle }) => {
    const grid = new FiltersDataReplacePage(page, theme, bundle);

    await grid.goto();

    // Cycle 1: filter, then replace the data.
    await grid.applyCondition(0, 'eq', ['Alice']);
    expect(await grid.visibleRowCount()).toBe(1);
    await grid.replaceData([['Alice', 'Red'], ['Bob', 'Green'], ['Charlie', 'Blue']]);

    // Cycle 2: filter again, then replace the data again. The second replacement drives the stale
    // observer through `afterUpdateData`, which is where the crash was thrown.
    await grid.applyCondition(0, 'eq', ['Bob']);
    await grid.replaceData([['Xavier', 'Red'], ['Yara', 'Green'], ['Zoe', 'Blue']]);

    // The plugin is still functional: a fresh filter after the second replacement trims correctly.
    await grid.applyCondition(0, 'eq', ['Zoe']);
    expect(await grid.visibleRowCount()).toBe(1);

    expect(grid.pageErrors).toEqual([]);
  });

  test('does not crash when a cell in a filtered column is edited after a data replace',
    async({ page, theme, bundle }) => {
      const grid = new FiltersDataReplacePage(page, theme, bundle);

      await grid.goto();

      await grid.applyCondition(0, 'eq', ['Alice']);
      await grid.replaceData([['Alice', 'Red'], ['Bob', 'Green'], ['Charlie', 'Blue']]);

      // Re-apply a filter on the same column, then edit its one visible cell. The edit reaches the
      // Filters plugin's `afterChange` handler, which refreshes the value component through the same
      // observer — the second path into the stranded collection.
      await grid.applyCondition(0, 'eq', ['Bob']);
      expect(await grid.visibleRowCount()).toBe(1);

      await grid.setCell(0, 0, 'Bobby');

      // The edit landed and the grid is still responsive.
      await expect(grid.cell(0, 0)).toHaveText('Bobby');
      expect(grid.pageErrors).toEqual([]);
    });
});
