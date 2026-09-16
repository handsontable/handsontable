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

  test('moves between the headers above the overlay with navigable headers', async() => {
    // The overlay covers the CELLS; the headers stay on screen above it. This is the path the
    // empty-data-state visual tests drive to reach a column's filter menu - Tab into the grid, Tab to a
    // header, `Alt`+`Shift`+`ArrowDown` - and a covering check that also blocked headers left the filter
    // unapplied and the overlay showing the wrong message on 20 screenshots.
    await grid.updateSettings({ navigableHeaders: true });
    await grid.loadEmptyDataAndLeaveFocus();

    await grid.page.keyboard.press('Tab');
    expect(await grid.selection()).toEqual([[-1, -1, -1, -1]]);

    await grid.page.keyboard.press('Tab');
    expect(await grid.selection()).toEqual([[-1, 0, -1, 0]]);

    await grid.page.keyboard.press('ArrowRight');
    expect(await grid.selection()).toEqual([[-1, 1, -1, 1]]);
  });

  test('keeps an arrow key from walking the selection under the overlay', async() => {
    // `canNavigateGrid()` runs before the move and only knows where the selection IS, so it lets a
    // move start from a header - the test above depends on that. Nothing re-checked where the move
    // LANDED: `ArrowDown` from a column header put the selection on row 0, a drawn cell hidden under
    // the overlay, and then no arrow could bring it back, because the entry check fails for a
    // non-header highlight. Measured on DEV-2917 before the fix: [[-1, 2]] became [[0, 2]].
    await grid.cell(0, 0).click();
    await grid.updateSettings({ navigableHeaders: true });
    await grid.selectCell(-1, 2);

    // Positive control: with no overlay up, the very same key does move into the cells. Without it
    // the assertion below would pass on a grid where `ArrowDown` never worked from a header at all.
    await grid.page.keyboard.press('ArrowDown');
    expect(await grid.selection()).toEqual([[0, 2, 0, 2]]);

    await grid.selectCell(-1, 2);
    await grid.startDataProviderFetch();

    // The cells are still drawn - this is the covered case, not the empty one.
    expect(await grid.renderedCounts()).toEqual({ rows: 8, cols: 6 });

    await grid.page.keyboard.press('ArrowDown');

    expect(await grid.selection()).toEqual([[-1, 2, -1, 2]]);
  });

  test('still lets Tab off the headers it keeps the selection on', async() => {
    // The guard above reverts a move that would leave the headers while the body is covered, and Tab
    // moves through the same commands pool. Reverting Tab could have re-armed the trap this PR exists
    // to remove: `tabNavigation`'s `after()` reads the selection AFTER the callback, so a reverted move
    // leaves it looking at a header, and it calls `preventDefault()` whenever the grid is navigable.
    //
    // It does not, and the reason is worth pinning: `after()` releases Tab on the WRAP state, which the
    // revert never touches. Tab walks the headers and then lets go at the end of the row.
    await grid.cell(0, 0).click();
    await grid.updateSettings({ navigableHeaders: true });
    await grid.selectCell(-1, 3);
    await grid.startDataProviderFetch();

    expect(await grid.renderedCounts()).toEqual({ rows: 8, cols: 6 });

    // Along the headers Tab claims the key, which is the header navigation the test above relies on.
    expect(await grid.pressAndReadDefaultPrevented('Tab')).toBe(true);
    expect(await grid.selection()).toEqual([[-1, 4, -1, 4]]);

    expect(await grid.pressAndReadDefaultPrevented('Tab')).toBe(true);
    expect(await grid.selection()).toEqual([[-1, 5, -1, 5]]);

    // Off the last header the move wraps, so Tab is released and the user leaves the grid.
    expect(await grid.pressAndReadDefaultPrevented('Tab')).toBe(false);
    expect(await grid.selection()).toBeNull();
  });

  test('does not select the covered cells while a data provider fetch is in flight', async() => {
    // The plugin overrides Ctrl+A so select all still works with every column hidden, where the
    // grid's own entry is inert and selecting the data is the way back to a context menu. That
    // override used to claim the chord during a fetch too, selecting a whole grid of drawn cells the
    // overlay hides - the move the arrow keys are refused above.
    await grid.cell(1, 1).click();
    expect(await grid.selection()).toEqual([[1, 1, 1, 1]]);

    await grid.startDataProviderFetch();
    expect(await grid.renderedCounts()).toEqual({ rows: 8, cols: 6 });

    await grid.page.keyboard.press('ControlOrMeta+a');

    expect(await grid.selection()).toEqual([[1, 1, 1, 1]]);

    // Positive control: end the fetch and the same key selects everything again, so the assertion
    // above cannot pass on a grid where Ctrl+A is simply broken.
    await grid.finishDataProviderFetch();
    await grid.page.keyboard.press('ControlOrMeta+a');

    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);
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

  test('does not let Delete clear the data the loading overlay covers', async() => {
    const before = await grid.allValues();

    // Positive control: the very same selection and key, with the overlay NOT up. Delete works, so the
    // negative half below is about the overlay and not about a grid where Delete never worked.
    await grid.selectAllWithKeyboard(1, 1);
    await grid.page.keyboard.press('Delete');
    await expect.poll(() => grid.allValues()).not.toEqual(before);
    await grid.page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => grid.allValues()).toEqual(before);

    await grid.selectAllWithKeyboard(2, 2);
    await grid.startDataProviderFetch();

    // The point of this test: the cells are still DRAWN, only covered. A guard that asks "does the grid
    // draw a cell" answers yes here and lets the keystroke through.
    expect(await grid.renderedCounts()).toEqual({ rows: 8, cols: 6 });
    expect(await grid.selection()).toEqual([[-1, -1, 7, 5]]);

    await grid.page.keyboard.press('Delete');

    await grid.finishDataProviderFetch();
    expect(await grid.allValues()).toEqual(before);
  });

  test('does not move a selection hidden under the loading overlay with Home, End or Ctrl+Shift+arrows', async() => {
    // These keys declare their own `runOnlyIf`, which REPLACES the navigation group's guard instead of
    // adding to it - so they kept moving a selection the overlay hides, and `Home`/`End` consumed the key.
    await grid.cell(0, 0).click();

    // Positive control: with the overlay down, `End` does move the selection.
    await grid.selectCell(1, 2);
    await grid.page.keyboard.press('End');
    expect(await grid.selection()).toEqual([[1, 5, 1, 5]]);

    await grid.selectCell(1, 2);
    await grid.startDataProviderFetch();

    for (const key of ['Home', 'End', 'ControlOrMeta+Shift+ArrowDown']) {
      expect(await grid.pressAndReadDefaultPrevented(key)).toBe(false);
      expect(await grid.selection()).toEqual([[1, 2, 1, 2]]);
    }
  });

  test('lets Tab out of the loading overlay it covers the grid with', async() => {
    await grid.cell(0, 0).click();
    await grid.startDataProviderFetch();

    expect(await grid.selection()).toEqual([[0, 0, 0, 0]]);

    // Drawn cells would otherwise make the tab-navigation pair claim the chord and trap the user under
    // an overlay they cannot leave.
    expect(await grid.pressAndReadDefaultPrevented('Tab')).toBe(false);
  });

  test('does not take the keyboard from an open dialog when settings change', async() => {
    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('rowHeader', /^Remove rows$/);
    await expect(grid.overlay).toBeVisible();

    await grid.showDialog('Working');
    expect(await grid.activeScopeId()).toBe('dialog');

    // `updatePlugin()` re-registers the overlay's scope. Re-activating it whenever the overlay happens
    // to be visible stole the keyboard from the modal that actually owns it.
    await grid.updateSettings({ emptyDataState: { message: 'Nothing here' } });

    expect(await grid.activeScopeId()).toBe('dialog');
    expect(await grid.activeShortcutContext()).toBe('plugin:dialog');
  });

  test('keeps the keyboard through a settings change when it already had it', async() => {
    await grid.selectAllWithKeyboard();
    await grid.runContextMenuItem('rowHeader', /^Remove rows$/);
    await expect(grid.overlay).toBeVisible();
    expect(await grid.activeScopeId()).toBe('emptyDataState');

    await grid.updateSettings({ emptyDataState: { message: 'Still nothing' } });

    expect(await grid.activeScopeId()).toBe('emptyDataState');
    expect(await grid.activeShortcutContext()).toBe('plugin:emptyDataState');
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
