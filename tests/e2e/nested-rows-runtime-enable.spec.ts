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
    expect(await nestedRows.visibleNames()).toEqual(FLAT_ROWS);

    expect(await nestedRows.expandParent(0)).toBe(true);
    expect(await nestedRows.collapsedParents()).toEqual([]);

    // Asserted on the model, unlike the toggle cases above. Collapse and expand are not paths this
    // PR touches, and on a `height: 'auto'` grid the expand's re-measure can land after the
    // assertion - which reddened the leg on a green-on-retry flake that said nothing about nesting.
    expect(await nestedRows.visibleNames()).toEqual(NESTED_ROWS);
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

    const COLLAPSED_A2 = ['Root A', 'A-1', 'A-2', 'A-3', 'Root B'];

    await nestedRows.goto();
    await nestedRows.setNestedRows(true);

    expect(await nestedRows.collapseParent(2)).toBe(true);
    await expect(nestedRows.paintedNames()).toHaveText(COLLAPSED_A2);

    // What every React, Angular and Vue re-render sends: the same value, again.
    await nestedRows.setNestedRows(true);

    await expect(nestedRows.paintedNames()).toHaveText(COLLAPSED_A2);
    expect(await nestedRows.collapsedParents()).toEqual([2]);
  });

  test('a round trip drops the collapsed parents rather than replaying them onto the new rows', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.setNestedRows(true);
    await nestedRows.collapseParent(0);
    expect(await nestedRows.visibleNames()).toEqual(FLAT_ROWS);

    await nestedRows.setNestedRows(false);
    await nestedRows.setNestedRows(true);

    // `disablePlugin()` unregisters the trimming map and `enablePlugin()` builds a new CollapsingUI,
    // so the collapse cannot survive - and must not come back pointing at whatever now sits there.
    expect(await nestedRows.collapsedParents()).toEqual([]);
    await expect(nestedRows.paintedNames()).toHaveText(NESTED_ROWS);
  });

  test('the row header is widened for the nesting it now has to show', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();

    const before = await nestedRows.rowHeaderWidths();

    await nestedRows.setNestedRows(true);

    const after = await nestedRows.rowHeaderWidths();

    // The seeding normally happens on `afterInit`, which has long since fired here. Without it the
    // header keeps the grid default and clips the indentation and the collapse button.
    expect(after.requested).not.toBeNull();
    expect(after.rendered).toBe(after.requested);
    expect(after.rendered).toBeGreaterThan(before.rendered);
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

    // Row 4 does not exist in the two-row grid. Left alone, a fill or a paste through those corners
    // sizes itself from them and appends records. The grid still has rows and columns, so the clamp
    // is deterministic and never the deselect branch.
    expect(await nestedRows.selection()).toEqual([0, 0, 1, 0]);
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

  test('the toggle drops the undo history instead of letting it delete rows', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.setCell(0, 0, 'Root A edited');

    await nestedRows.setNestedRows(true);
    await nestedRows.undo();

    // The recorded action measured itself against the old numbering - `countSourceRows` was 2 - and
    // on undo it removes every physical row past that baseline as one the change created. Unguarded,
    // one Ctrl+Z deleted A-3 and Root B outright. The history is dropped instead, the way `loadData`
    // drops it, so the edit stays and no record is lost.
    const painted = ['Root A edited', 'A-1', 'A-2', 'A-2-a', 'A-3', 'Root B'];

    await expect(nestedRows.paintedNames()).toHaveText(painted);
  });

  test('the toggle leaves the viewport where the user scrolled it', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto({ size: 'tall' });
    await nestedRows.selectRange(0, 0, 0, 0);

    const scrolledTo = await nestedRows.scrollToRow(11);

    expect(scrolledTo).toBeGreaterThan(0);

    await nestedRows.setNestedRows(true);

    // `refresh()` labels itself `refresh`, which the Core does not ignore for scrolling, so the
    // toggle used to scroll the viewport back onto the cell selected at the top.
    expect(await nestedRows.scrollTop()).toBe(scrolledTo);
  });

  test('re-sending the setting draws the grid once, not twice', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto({ size: 'tall' });
    await nestedRows.setNestedRows(true);

    const before = await nestedRows.renderCount();

    // In React, Angular and Vue this runs on every re-render, so a second draw here is paid per commit.
    await nestedRows.setNestedRows(true);

    expect(await nestedRows.renderCount() - before).toBe(1);
  });

  test('enabling on a dataset the plugin cannot handle reports it and stays off', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsRuntimeEnablePage(page, theme, bundle);

    await nestedRows.goto({ data: 'arrays' });

    await nestedRows.setNestedRows(true);

    expect(await nestedRows.isPluginEnabled()).toBe(false);
    expect(await nestedRows.nestedRowsSetting()).toBe(false);
    await expect(nestedRows.paintedNames()).toHaveText(FLAT_ROWS);
    expect(await nestedRows.consoleErrors()).toEqual([
      expect.stringContaining('The Nested Rows plugin requires an Array of Objects as a dataset'),
    ]);
  });
});
