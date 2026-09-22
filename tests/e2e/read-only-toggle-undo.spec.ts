import { test, expect } from '../fixtures/test';
import { ReadOnlyToggleUndoPage } from '../fixtures/pages/ReadOnlyToggleUndoPage';

/**
 * DEV-136. Toggling "Read only" through the context menu / column menu called `setCellMeta`
 * directly, which never reached the undo/redo stack - `Ctrl+Z` did nothing after the toggle.
 *
 * The fix records exactly one undo entry per click (`setCellMeta` fires per cell, with no bulk
 * hook, so a naive listener would record one entry per selected cell instead), and restores each
 * affected cell to its OWN prior state on undo - the case a uniform "restore to `false`" fix would
 * get wrong for a mixed-state selection.
 */
test.describe('read-only toggle undo/redo', () => {
  let grid: ReadOnlyToggleUndoPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ReadOnlyToggleUndoPage(page, theme, bundle);
    await grid.goto();
  });

  test('undoes and redoes a single-cell toggle made through the context menu', async () => {
    await grid.selectRange(0, 0);
    await grid.openContextMenu(0, 0);
    await grid.clickReadOnlyItem();

    expect(await grid.readOnly(0, 0)).toBe(true);

    await grid.undoWithKeyboard();

    expect(await grid.readOnly(0, 0)).toBe(false);

    await grid.redo();

    expect(await grid.readOnly(0, 0)).toBe(true);
  });

  test('undoes a range toggle in one action', async () => {
    await grid.selectRange(0, 0, 2, 2);
    await grid.openContextMenu(0, 0);
    await grid.clickReadOnlyItem();

    expect(await grid.readOnly(0, 0)).toBe(true);
    expect(await grid.readOnly(1, 1)).toBe(true);
    expect(await grid.readOnly(2, 2)).toBe(true);

    await grid.undoWithKeyboard();

    expect(await grid.readOnly(0, 0)).toBe(false);
    expect(await grid.readOnly(1, 1)).toBe(false);
    expect(await grid.readOnly(2, 2)).toBe(false);
  });

  test('restores each cell to its OWN prior state when undoing a mixed-state selection', async () => {
    // Seed a mixed selection: (0, 0) and (2, 2) already read-only, the rest writable.
    await grid.setReadOnly(0, 0, true);
    await grid.setReadOnly(2, 2, true);

    await grid.selectRange(0, 0, 2, 2);
    await grid.openContextMenu(0, 0);
    await grid.clickReadOnlyItem();

    // "At least one read-only" -> the whole range is made writable.
    expect(await grid.readOnly(0, 0)).toBe(false);
    expect(await grid.readOnly(0, 1)).toBe(false);
    expect(await grid.readOnly(1, 1)).toBe(false);
    expect(await grid.readOnly(2, 2)).toBe(false);

    await grid.undoWithKeyboard();

    // Each cell comes back to what IT carried before the toggle, not to a single uniform value.
    expect(await grid.readOnly(0, 0)).toBe(true);
    expect(await grid.readOnly(0, 1)).toBe(false);
    expect(await grid.readOnly(1, 1)).toBe(false);
    expect(await grid.readOnly(2, 2)).toBe(true);

    // Redo is the case that diverges from undo for this action: it replays the single recorded
    // value uniformly, rather than recomputing per cell - so it must land back on all-writable,
    // not on the mixed state undo just restored.
    await grid.redo();

    expect(await grid.readOnly(0, 0)).toBe(false);
    expect(await grid.readOnly(0, 1)).toBe(false);
    expect(await grid.readOnly(1, 1)).toBe(false);
    expect(await grid.readOnly(2, 2)).toBe(false);
  });

  test('undoes a sequence of independent toggles in reverse order', async () => {
    await grid.selectRange(0, 0);
    await grid.openContextMenu(0, 0);
    await grid.clickReadOnlyItem();

    await grid.selectRange(1, 1);
    await grid.openContextMenu(1, 1);
    await grid.clickReadOnlyItem();

    await grid.selectRange(2, 2);
    await grid.openContextMenu(2, 2);
    await grid.clickReadOnlyItem();

    expect(await grid.readOnly(0, 0)).toBe(true);
    expect(await grid.readOnly(1, 1)).toBe(true);
    expect(await grid.readOnly(2, 2)).toBe(true);

    await grid.undoWithKeyboard();

    expect(await grid.readOnly(2, 2)).toBe(false);
    expect(await grid.readOnly(1, 1)).toBe(true);

    await grid.undoWithKeyboard();

    expect(await grid.readOnly(1, 1)).toBe(false);
    expect(await grid.readOnly(0, 0)).toBe(true);

    await grid.undoWithKeyboard();

    expect(await grid.readOnly(0, 0)).toBe(false);
  });

  test('records and undoes a toggle made through the column (dropdown) menu', async () => {
    await grid.selectRange(0, 0, 3, 0);
    await grid.openColumnMenu(0);
    await grid.clickReadOnlyItem();

    expect(await grid.readOnly(0, 0)).toBe(true);
    expect(await grid.readOnly(3, 0)).toBe(true);

    await grid.undoWithKeyboard();

    expect(await grid.readOnly(0, 0)).toBe(false);
    expect(await grid.readOnly(3, 0)).toBe(false);
  });
});
