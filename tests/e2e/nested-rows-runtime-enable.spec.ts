import { test, expect } from '../fixtures/test';
import { NestedRowsRuntimeEnablePage } from '../fixtures/pages/NestedRowsRuntimeEnablePage';

/**
 * Turning NestedRows on with `updateSettings()` threw `Cannot read properties of null
 * (reading 'length')` inside `DataManager#rewriteCache` (DEV-2938). The data manager is fed by the
 * `beforeLoadData` / `beforeUpdateData` hooks, and neither of them runs on a settings update, so
 * `updatePlugin()` was handing the manager the `null` it starts with.
 *
 * The fixture's tree, once the plugin flattens it:
 *   0 Root A / 1 A-1 / 2 A-2 / 3 A-2-a / 4 A-3 / 5 Root B
 */

const FLAT_ROWS = ['Root A', 'Root B'];
const NESTED_ROWS = ['Root A', 'A-1', 'A-2', 'A-2-a', 'A-3', 'Root B'];

test.describe('NestedRows enabled at runtime', () => {
  test('updateSettings turns the plugin on and flattens the tree', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    expect(await nestedRows.visibleNames()).toEqual(FLAT_ROWS);

    await nestedRows.setNestedRows(true);

    expect(await nestedRows.isPluginEnabled()).toBe(true);
    expect(await nestedRows.visibleNames()).toEqual(NESTED_ROWS);
  });

  test('a plugin enabled at runtime collapses and expands like any other', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.setNestedRows(true);

    expect(await nestedRows.collapseParent(0)).toBe(true);
    expect(await nestedRows.collapsedParents()).toEqual([0]);
    expect(await nestedRows.visibleNames()).toEqual(FLAT_ROWS);
  });

  test('the tree survives an off and on round trip', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();

    await nestedRows.setNestedRows(true);
    expect(await nestedRows.visibleNames()).toEqual(NESTED_ROWS);

    await nestedRows.setNestedRows(false);
    expect(await nestedRows.isPluginEnabled()).toBe(false);
    expect(await nestedRows.visibleNames()).toEqual(FLAT_ROWS);

    await nestedRows.setNestedRows(true);
    expect(await nestedRows.isPluginEnabled()).toBe(true);
    expect(await nestedRows.visibleNames()).toEqual(NESTED_ROWS);
  });

  test('enabling on a dataset the plugin cannot handle reports it and stays off', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto({ data: 'arrays' });

    await nestedRows.setNestedRows(true);

    expect(await nestedRows.isPluginEnabled()).toBe(false);
    expect(await nestedRows.visibleNames()).toEqual(FLAT_ROWS);
    expect((await nestedRows.consoleErrors()).join('\n')).toContain('requires an Array of Objects');
  });
});
