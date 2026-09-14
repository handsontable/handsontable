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

    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);
  });

  test('leaves the chord unclaimed when there is nothing to select', async() => {
    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('rowHeader', /^Remove rows$/);

    await expect(grid.overlay).toBeVisible();

    await grid.page.keyboard.press('ControlOrMeta+a');

    expect(await grid.selection()).toBeNull();
  });

  test('lets Tab out of the overlay instead of swallowing it', async() => {
    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('columnHeader', /^Hide columns$/);
    await expect(grid.overlay).toBeVisible();

    // A LIVE selection is the whole point: the grid's tab-navigation pair calls `preventDefault()`
    // exactly when the selection is still in range, and the overlay inherits it. The rows are still
    // there behind the hidden columns, so select-all leaves one alive - after removing every row there
    // is nothing to select and the pair bows out on its own, which proves nothing.
    await grid.clickOverlay();
    await grid.page.keyboard.press('ControlOrMeta+a');
    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);

    // Unguarded, this is `true` and the user has no way out of the overlay at all: the key is
    // consumed and focus never moves.
    expect(await grid.pressAndReadDefaultPrevented('Tab')).toBe(false);
  });

  test('lets Tab out of the overlay with navigable headers too', async() => {
    // `navigableHeaders` keeps the grid navigable even when it draws no cell, so the tab-navigation
    // pair DOES run here - the other Tab test covers the path where it bows out. Tab still gets
    // through: with no column left to move into, the move wraps at once and `after()` takes its
    // deselect branch instead of reaching `preventDefault()`. This pins that second route; it is a
    // regression guard, not a control for the guard itself.
    await grid.updateSettings({ navigableHeaders: true });

    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('columnHeader', /^Hide columns$/);
    await expect(grid.overlay).toBeVisible();

    await grid.clickOverlay();
    await grid.page.keyboard.press('ControlOrMeta+a');
    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);

    expect(await grid.pressAndReadDefaultPrevented('Tab')).toBe(false);
    expect(await grid.selection()).toBeNull();
  });

  test('does not let Delete clear the data it cannot show', async() => {
    const before = await grid.allValues();

    // Positive control: the same key, on the same grid, with the cells on screen. Without it the
    // negative half below would pass just as well on a grid where Delete never worked at all.
    await grid.selectAllWithKeyboard(1, 1);
    await grid.page.keyboard.press('Delete');
    await expect.poll(() => grid.allValues()).not.toEqual(before);
    await grid.page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => grid.allValues()).toEqual(before);

    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('columnHeader', /^Hide columns$/);
    await expect(grid.overlay).toBeVisible();

    await grid.clickOverlay();
    await grid.page.keyboard.press('ControlOrMeta+a');
    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);

    await grid.page.keyboard.press('Delete');

    // Clearing the selection is a real round trip through the event loop and a render, so a write
    // that was merely late has landed by the time it settles.
    await grid.clickOverlay();
    await expect.poll(() => grid.selection()).toBeNull();

    expect(await grid.allValues()).toEqual(before);
  });

  test('does not let Ctrl+Enter overwrite the data it cannot show', async() => {
    const before = await grid.allValues();

    // Positive control, as above: Ctrl+Enter fills the selection from the highlighted cell when the
    // cells are on screen, so the negative half below is about the guard and not about the chord.
    await grid.selectAllWithKeyboard(1, 1);
    await grid.page.keyboard.press('ControlOrMeta+Enter');
    await expect.poll(() => grid.allValues()).not.toEqual(before);
    await grid.page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => grid.allValues()).toEqual(before);

    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('columnHeader', /^Hide columns$/);
    await expect(grid.overlay).toBeVisible();

    await grid.clickOverlay();
    await grid.page.keyboard.press('ControlOrMeta+a');
    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);

    await grid.page.keyboard.press('ControlOrMeta+Enter');

    await grid.clickOverlay();
    await expect.poll(() => grid.selection()).toBeNull();

    expect(await grid.allValues()).toEqual(before);
  });

  test('does not let Ctrl+M merge the cells it cannot show', async() => {
    const before = await grid.allValues();

    // Positive control: `Ctrl`+`M` un-merges by clearing every cell but the top-left one, so on a
    // visible grid it really does destroy content. `mergeCells` registers it into the GRID context,
    // which the overlay inherits.
    await grid.selectAllWithKeyboard(1, 1);
    await grid.page.keyboard.press('Control+m');
    await expect.poll(() => grid.allValues()).not.toEqual(before);
    await grid.page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => grid.allValues()).toEqual(before);

    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('columnHeader', /^Hide columns$/);
    await expect(grid.overlay).toBeVisible();

    await grid.clickOverlay();
    await grid.page.keyboard.press('ControlOrMeta+a');
    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);

    await grid.page.keyboard.press('Control+m');

    await grid.clickOverlay();
    await expect.poll(() => grid.selection()).toBeNull();

    expect(await grid.allValues()).toEqual(before);
  });

  test('does not let Space toggle the checkboxes it cannot show', async() => {
    const before = await grid.allValues();

    // Positive control on ONE checkbox cell: `checkboxRenderer` binds space to the GRID context with
    // its own `runOnlyIf`, so a group-level guard would never have reached it, and the overlay
    // inherits it with the rest. The selection is a single checkbox on purpose - with a text cell in
    // it the handler lets the press through to the editor, which writes a space into the highlighted
    // cell and muddies the comparison.
    await grid.cell(0, 0).click();
    await grid.selectCell(1, 5);
    await grid.page.keyboard.press('Space');
    await expect.poll(() => grid.allValues()).not.toEqual(before);

    // Whatever the control left behind is the baseline for the negative half. Space is not its own
    // inverse over a mixed selection, and undo leaves one row flipped, so neither way back is a
    // reliable reset - and neither is what this test is about.
    const baseline = await grid.allValues();

    await grid.selectAllWithKeyboard(2, 2);
    await grid.runContextMenuItem('columnHeader', /^Hide columns$/);
    await expect(grid.overlay).toBeVisible();

    await grid.clickOverlay();
    await grid.page.keyboard.press('ControlOrMeta+a');
    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);

    await grid.page.keyboard.press('Space');

    await grid.clickOverlay();
    await expect.poll(() => grid.selection()).toBeNull();

    expect(await grid.allValues()).toEqual(baseline);
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

    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);
  });
});
