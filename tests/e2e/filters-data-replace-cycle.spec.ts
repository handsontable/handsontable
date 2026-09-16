import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

/**
 * Regression coverage for DEV-2889.
 *
 * Applying a filter and then replacing the grid's data — while re-sending the `filters` option, the
 * way the React and Angular wrappers re-send their whole settings object on every update (the Vue 3
 * wrapper diffs each key against the current settings and skips unchanged ones) — used to leave the
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
 *
 * The crash surfaces as a rejection of the `page.evaluate` that triggers it — the throw is synchronous
 * inside a hook dispatched within `updateSettings` / `setDataAtCell`, so the awaited `replaceData()` /
 * `setCellValue()` call fails the test directly, which is the load-bearing assertion here.
 */
test.describe('Filters — replacing data with an active filter', () => {
  test('does not crash when data is replaced twice with an active filter', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();

    // Cycle 1: filter, then replace the data.
    await grid.addFilter(0, 'eq', ['Alice']);
    expect(await grid.visibleRowCount()).toBe(1);
    await grid.replaceData([['Alice', 'Red'], ['Bob', 'Green'], ['Charlie', 'Blue']]);

    // Cycle 2: filter again, then replace the data again. The second replacement drives the stale
    // observer through `afterUpdateData`, which is where the crash was thrown. The row-count check
    // matters: that path only reaches the observer while a condition is active (`#onAfterUpdateData`
    // returns early when `getFilteredColumns()` is empty), so a condition that stopped landing after
    // a replace would make this test pass on unfixed code.
    await grid.addFilter(0, 'eq', ['Bob']);
    expect(await grid.visibleRowCount()).toBe(1);
    await grid.replaceData([['Xavier', 'Red'], ['Yara', 'Green'], ['Zoe', 'Blue']]);

    // The plugin is still functional: a fresh filter after the second replacement trims correctly.
    await grid.addFilter(0, 'eq', ['Zoe']);
    expect(await grid.visibleRowCount()).toBe(1);
  });

  test('does not crash when a cell in a filtered column is edited after a data replace',
    async({ page, theme, bundle }) => {
      const grid = new FiltersValueListPage(page, theme, bundle);

      await grid.goto();

      await grid.addFilter(0, 'eq', ['Alice']);
      await grid.replaceData([['Alice', 'Red'], ['Bob', 'Green'], ['Charlie', 'Blue']]);

      // Re-apply a filter on the same column, then edit its one visible cell. The edit reaches the
      // Filters plugin's `afterChange` handler, which refreshes the value component through the same
      // observer — the second path into the stranded collection.
      await grid.addFilter(0, 'eq', ['Bob']);
      expect(await grid.visibleRowCount()).toBe(1);

      await grid.setCellValue(0, 0, 'Bobby');

      // The edit landed and the grid is still responsive.
      await expect(grid.cell(0, 0)).toHaveText('Bobby');
    });
});

/**
 * The Filters plugin's menu focus navigator (`#menuFocusNavigator`) caches the component elements it
 * moves the Tab focus between. Replacing the data while re-sending `filters` disables and enables the
 * plugin, which destroys and recreates those components — so the navigator has to be rebuilt with
 * them, or Tab focus keeps pointing at detached elements and never reaches the live value list. This
 * is the same stale-reference family as the crash above; `disablePlugin()` now drops the navigator
 * too.
 */
test('keeps filter-menu keyboard focus navigation working after a data replace',
  async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle);

    await grid.goto();

    // Baseline: from the keyboard, Tab into the value list and focus an item.
    await grid.openMenuWithKeyboard(0, 0);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await expect(grid.focusedListItems()).toHaveCount(1);
    await grid.escapeMenu();

    // Replace the data while re-sending `filters`, the shape the React and Angular wrappers commit.
    await grid.replaceData([['Xavier', 'Red'], ['Yara', 'Green'], ['Zoe', 'Blue']]);

    // The same keyboard path must still reach the (rebuilt) value list.
    await grid.openMenuWithKeyboard(0, 0);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await expect(grid.focusedListItems()).toHaveCount(1);
  });
