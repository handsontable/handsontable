import { test, expect } from '../fixtures/test';
import { NestedRowsRuntimeEnablePage } from '../fixtures/pages/NestedRowsRuntimeEnablePage';

/**
 * Turning NestedRows on with `updateSettings()` threw `Cannot read properties of null
 * (reading 'length')` inside `DataManager#rewriteCache` (DEV-2938). The data manager is fed by the
 * `beforeLoadData` / `beforeUpdateData` hooks, and neither of them runs on a settings update, so
 * `updatePlugin()` was handing the manager the `null` it starts with.
 *
 * The row count is the other half, and it is why these tests read the PAINTED rows rather than
 * `countRows()`: the count and the cell values both come from the plugin's own model, so they report
 * a flattened tree whether or not the index maps were resized and the grid redrew.
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
    await expect(nestedRows.paintedNames()).toHaveText(FLAT_ROWS);

    await nestedRows.setNestedRows(true);

    expect(await nestedRows.isPluginEnabled()).toBe(true);
    await expect(nestedRows.paintedNames()).toHaveText(NESTED_ROWS);
    expect(await nestedRows.consoleErrors()).toEqual([]);
  });

  test('a plugin enabled at runtime collapses and expands like any other', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.setNestedRows(true);

    expect(await nestedRows.collapseParent(0)).toBe(true);
    expect(await nestedRows.collapsedParents()).toEqual([0]);
    await expect(nestedRows.paintedNames()).toHaveText(FLAT_ROWS);

    expect(await nestedRows.expandParent(0)).toBe(true);
    expect(await nestedRows.collapsedParents()).toEqual([]);
    await expect(nestedRows.paintedNames()).toHaveText(NESTED_ROWS);
  });

  test('the tree survives an off and on round trip', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();

    await nestedRows.setNestedRows(true);
    await expect(nestedRows.paintedNames()).toHaveText(NESTED_ROWS);

    await nestedRows.setNestedRows(false);
    expect(await nestedRows.isPluginEnabled()).toBe(false);
    await expect(nestedRows.paintedNames()).toHaveText(FLAT_ROWS);

    await nestedRows.setNestedRows(true);
    expect(await nestedRows.isPluginEnabled()).toBe(true);
    await expect(nestedRows.paintedNames()).toHaveText(NESTED_ROWS);
    expect(await nestedRows.consoleErrors()).toEqual([]);
  });

  test('re-sending the same setting leaves the rows and the collapsed state alone', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.setNestedRows(true);
    await nestedRows.collapseParent(2);

    const painted = await nestedRows.paintedNames().allTextContents();

    // What every React, Angular and Vue re-render sends: the same value, again.
    await nestedRows.setNestedRows(true);

    await expect(nestedRows.paintedNames()).toHaveText(painted);
    expect(await nestedRows.collapsedParents()).toEqual([2]);
  });

  test('a round trip drops the collapsed parents rather than replaying them onto the new rows', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.setNestedRows(true);
    await nestedRows.collapseParent(0);
    await expect(nestedRows.paintedNames()).toHaveText(FLAT_ROWS);

    await nestedRows.setNestedRows(false);
    await nestedRows.setNestedRows(true);

    // `disablePlugin()` unregisters the trimming map and `enablePlugin()` builds a new CollapsingUI,
    // so the collapse cannot survive - and must not come back pointing at whatever now sits there.
    expect(await nestedRows.collapsedParents()).toEqual([]);
    await expect(nestedRows.paintedNames()).toHaveText(NESTED_ROWS);
  });

  test('edits still reach the data array the caller passed in', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.setNestedRows(true);

    await nestedRows.setCell(0, 0, 'Root A edited');
    await nestedRows.setCell(1, 0, 'A-1 edited');

    expect(await nestedRows.callerDataNames()).toEqual({ parent: 'Root A edited', child: 'A-1 edited' });
  });

  test('turning the plugin off clamps a selection that covered the flattened rows', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.setNestedRows(true);
    await nestedRows.selectRange(0, 0, 4, 0);

    await nestedRows.setNestedRows(false);

    const selection = await nestedRows.selection();

    // Row 4 does not exist in the two-row grid. Left alone, a fill or a paste through those corners
    // sizes itself from them and appends records.
    expect(selection === null || selection[2] <= 1).toBe(true);
  });

  test('turning the plugin off discards an editor open on a row that disappears', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.setNestedRows(true);
    await nestedRows.openEditor(4, 0);

    expect(await nestedRows.isEditorOpen()).toBe(true);

    await nestedRows.setNestedRows(false);

    expect(await nestedRows.isEditorOpen()).toBe(false);
    await expect(nestedRows.paintedNames()).toHaveText(FLAT_ROWS);
    expect(await nestedRows.callerDataNames()).toEqual({ parent: 'Root A', child: 'A-1' });
  });

  test('enabling on a dataset the plugin cannot handle reports it and stays off', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto({ data: 'arrays' });

    await nestedRows.setNestedRows(true);

    expect(await nestedRows.isPluginEnabled()).toBe(false);
    expect(await nestedRows.nestedRowsSetting()).toBe(false);
    await expect(nestedRows.paintedNames()).toHaveText(FLAT_ROWS);
    expect(await nestedRows.consoleErrors()).toHaveLength(1);
  });
});
