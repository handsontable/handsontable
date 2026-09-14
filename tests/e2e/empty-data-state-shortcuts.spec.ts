import { test, expect } from '../fixtures/test';
import { EmptyDataStateShortcutsPage } from '../fixtures/pages/EmptyDataStateShortcutsPage';

/**
 * DEV-2917 (found in DEV-53) – the emptyDataState overlay used to swallow every keyboard shortcut.
 *
 * Showing the overlay activates the plugin's focus scope, which switches the shortcut manager to
 * `plugin:emptyDataState`. That context was empty and the manager runs the active context only, so
 * undo, redo and select all all died for as long as the overlay was up. A second defect kept the
 * context on `plugin:emptyDataState` after the overlay hid again, leaving a grid full of data with
 * no working shortcuts until the user clicked a cell.
 *
 * The overlay now inherits the grid's shortcut context instead of listing keys, so the two tests that
 * press Delete and Ctrl+Enter are the other half of the fix: a shortcut that writes cell content must
 * refuse while the grid renders nothing, or inheriting would hand the user a way to destroy data they
 * cannot see.
 */
test.describe('emptyDataState keyboard shortcuts', () => {
  let grid: EmptyDataStateShortcutsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EmptyDataStateShortcutsPage(page, theme, bundle);
    await grid.goto();
  });

  test('undoes a full row removal with the keyboard while the overlay is shown', async() => {
    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('rowHeader', /^Remove rows$/);

    await expect(grid.overlay).toBeVisible();
    expect(await grid.rowCount()).toBe(0);
    expect(await grid.activeShortcutContext()).toBe('plugin:emptyDataState');

    await grid.page.keyboard.press('ControlOrMeta+z');

    await expect(grid.cell(0, 0)).toHaveText('A1');
    expect(await grid.rowCount()).toBe(8);
    expect(await grid.isEmptyDataStateVisible()).toBe(false);
  });

  test('redoes with both bindings, back into the overlay', async() => {
    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('rowHeader', /^Remove rows$/);
    await grid.page.keyboard.press('ControlOrMeta+z');
    await expect(grid.cell(0, 0)).toHaveText('A1');

    await grid.page.keyboard.press('ControlOrMeta+Shift+z');

    await expect(grid.overlay).toBeVisible();
    expect(await grid.rowCount()).toBe(0);

    await grid.page.keyboard.press('ControlOrMeta+z');
    await expect(grid.cell(0, 0)).toHaveText('A1');

    await grid.page.keyboard.press('ControlOrMeta+y');

    await expect(grid.overlay).toBeVisible();
    expect(await grid.rowCount()).toBe(0);
  });

  test('selects all cells with the keyboard while every column is hidden', async() => {
    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('columnHeader', /^Hide columns$/);

    await expect(grid.overlay).toBeVisible();
    expect(await grid.renderableColumnCount()).toBe(0);

    // The overlay covers the row headers, so aiming at one lands here. It also clears the
    // selection, which is what made the next Ctrl+A visibly do nothing before the fix.
    await grid.clickOverlay();
    expect(await grid.selection()).toBeNull();

    await grid.page.keyboard.press('ControlOrMeta+a');

    expect(await grid.selection()).toEqual([[-1, -1, 7, 4]]);
  });

  test('leaves the chord unclaimed when there is nothing to select', async() => {
    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('rowHeader', /^Remove rows$/);

    await expect(grid.overlay).toBeVisible();

    await grid.page.keyboard.press('ControlOrMeta+a');

    expect(await grid.selection()).toBeNull();
  });

  test('does not let Delete clear the data it cannot show', async() => {
    const before = await grid.allValues();

    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('columnHeader', /^Hide columns$/);
    await expect(grid.overlay).toBeVisible();

    await grid.clickOverlay();
    await grid.page.keyboard.press('ControlOrMeta+a');
    expect(await grid.selection()).toEqual([[-1, -1, 7, 4]]);

    await grid.page.keyboard.press('Delete');

    expect(await grid.allValues()).toEqual(before);
  });

  test('does not let Ctrl+Enter overwrite the data it cannot show', async() => {
    const before = await grid.allValues();

    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('columnHeader', /^Hide columns$/);
    await expect(grid.overlay).toBeVisible();

    await grid.clickOverlay();
    await grid.page.keyboard.press('ControlOrMeta+a');

    await grid.page.keyboard.press('ControlOrMeta+Enter');

    expect(await grid.allValues()).toEqual(before);
  });

  test('restores the grid shortcut context once the overlay hides', async() => {
    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('rowHeader', /^Remove rows$/);
    await expect(grid.overlay).toBeVisible();

    // Undo through the menu, not the keyboard: that path fires no focus event, so nothing else
    // rolls the shortcut context back to 'grid'.
    await grid.runContextMenuItem('columnHeader', /^Undo$/);

    await expect(grid.cell(0, 0)).toHaveText('A1');
    expect(await grid.isEmptyDataStateVisible()).toBe(false);
    expect(await grid.activeShortcutContext()).toBe('grid');

    // The proof that matters: a grid shortcut works again without clicking a cell first.
    await grid.page.keyboard.press('ControlOrMeta+a');

    expect(await grid.selection()).toEqual([[-1, -1, 7, 4]]);
  });
});
