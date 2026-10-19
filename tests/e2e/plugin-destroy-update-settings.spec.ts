import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * A plugin destroyed on its own, ahead of the grid, with `getPlugin(name).destroy()` (DEV-775).
 *
 * `BasePlugin` registers its `afterUpdateSettings` listener straight on the grid, so it outlived the
 * plugin's `destroy()`, which deletes `hot`. Every later `updateSettings()` call then threw
 * `Cannot read properties of undefined (reading 'getSettings')`, whatever setting it carried, and
 * for any destroyed plugin. The fill handle also stayed drawn after the Autofill plugin was gone,
 * because selection drew it from the `fillHandle` setting alone.
 */
test.describe('plugin destroyed ahead of the grid', { tag: THEMES_TAG }, () => {
  let grid: SelectionFeaturesPage;

  const DATA = Array.from({ length: 6 }, (_, row) => [`A${row + 1}`, `B${row + 1}`, null, null]);

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionFeaturesPage(page, theme, bundle);
    await grid.goto();
    await grid.initGrid({ data: DATA, fillHandle: true, comments: true });
  });

  test('updateSettings({ fillHandle: false }) does not throw after the Autofill plugin was destroyed', async () => {
    await grid.destroyPlugin('autofill');

    expect(await grid.tryUpdateSettings({ fillHandle: false })).toBeNull();

    // The grid keeps working after the call.
    await grid.setCellValue(0, 2, 'after');
    await expect(grid.cell(0, 2)).toHaveText('after');
  });

  test('updateSettings() with a setting the plugin does not own does not throw after it was destroyed', async () => {
    await grid.destroyPlugin('autofill');

    expect(await grid.tryUpdateSettings({ colHeaders: false })).toBeNull();
  });

  // Each lifecycle method returns early once `destroy()` deleted `hot`; dropping any one guard fails here.
  for (const method of ['enablePlugin', 'disablePlugin', 'updatePlugin'] as const) {
    test(`${method}() on a kept reference to a destroyed Autofill plugin does not throw`, async () => {
      await grid.destroyPlugin('autofill');

      expect(await grid.tryCallDestroyedAutofill(method)).toBeNull();
    });
  }

  // The listener lives on the base class, so the fix has to hold for a plugin other than Autofill.
  test('updateSettings() does not throw after another plugin (Comments) was destroyed', async () => {
    await grid.destroyPlugin('comments');

    expect(await grid.tryUpdateSettings({ colHeaders: false })).toBeNull();
  });

  // Filters registers its header listener in the constructor, straight on the grid, so the base class
  // cannot remove it. `updateSettings()` re-renders the headers, which runs it.
  test('rendering column headers does not throw after the Filters plugin was destroyed', async () => {
    await grid.destroyPlugin('filters');

    expect(await grid.tryUpdateSettings({ colHeaders: true })).toBeNull();
    await expect(grid.cell(0, 0)).toHaveText('A1');
  });

  // These plugins run their own teardown before the base class's, reading `hot` or their own fields.
  // The grid's `destroy()` must not run it a second time, or the throw skips every later plugin and
  // the `afterDestroy` hook.
  for (const pluginName of ['autoColumnSize', 'nestedHeaders', 'filters'] as const) {
    test(`destroying the grid completes after the ${pluginName} plugin was destroyed ahead of it`, async () => {
      await grid.destroyPlugin(pluginName);

      expect(await grid.tryDestroyGrid()).toEqual({ error: null, afterDestroyFired: true });
    });
  }

  test('hides the fill handle once the Autofill plugin is destroyed', async () => {
    await grid.selectCells(1, 0, 1, 0);
    await expect(grid.fillHandle()).toBeVisible();

    // No other render follows: the plugin has to take the handle down on its own.
    await grid.destroyPlugin('autofill');

    await expect(grid.fillHandle()).toHaveCount(0);
    await expect(grid.cell(1, 0)).toHaveClass(/current/);
  });

  // The handle follows the plugin, not the setting: `disablePlugin()` leaves `fillHandle: true` in the
  // settings, and the handle must still go away and come back with the plugin, without a render
  // forced from outside.
  test('hides the fill handle while the Autofill plugin is disabled and shows it again once re-enabled', async () => {
    await grid.selectCells(1, 0, 1, 0);

    await grid.setAutofillPluginEnabled(false);
    await expect(grid.fillHandle()).toHaveCount(0);

    await grid.setAutofillPluginEnabled(true);
    await expect(grid.fillHandle()).toBeVisible();

    await grid.dragFillHandleTo(3, 0);
    await expect(grid.cell(3, 0)).toHaveText('A2');
  });
});
