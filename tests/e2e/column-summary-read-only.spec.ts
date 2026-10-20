import { test, expect } from '../fixtures/test';
import { ColumnSummaryReadOnlyPage } from '../fixtures/pages/ColumnSummaryReadOnlyPage';

/**
 * DEV-148. The ColumnSummary plugin makes a summary cell read-only, but the "Read only" menu item
 * could unlock it: clicked on the summary cell itself, or on a column that holds one. The column
 * case was worse than it looks - the always-read-only summary made the selection count as "at
 * least one read-only", so the click always chose "make writable" and the column could never be
 * made read-only at all. Undo after a column toggle unlocked the summary a third way.
 *
 * Product decision: on a summary cell the item does not appear. On a wider selection it acts on the
 * other cells only, and its check mark reflects only those.
 */
test.describe('column summary read-only lock', () => {
  let grid: ColumnSummaryReadOnlyPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ColumnSummaryReadOnlyPage(page, theme, bundle);
    await grid.goto();
  });

  test('hides "Read only" in the context menu of a summary cell', async () => {
    // Positive control first: on a plain cell the item is there, so its absence below is not a
    // menu that failed to build its item list.
    await grid.openContextMenuOnCell(0, 0);

    expect(await grid.visibleItems()).toContain('Read only');

    await grid.closeMenu();
    await grid.openContextMenuOnCell(4, 0);

    const items = await grid.visibleItems();

    expect(items).not.toContain('Read only');
    // The rest of the menu is still there - only the one item is hidden.
    expect(items).toContain('Undo');
    expect(await grid.readOnly(4, 0)).toBe(true);
  });

  test('toggles a whole column from its header without unlocking the summary', async () => {
    await grid.openContextMenuOnHeader(0);

    // The summary is the only read-only cell in the column, and it does not count.
    expect(await grid.readOnlyItemChecked()).toBe('false');

    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);

    await grid.openContextMenuOnHeader(0);

    expect(await grid.readOnlyItemChecked()).toBe('true');

    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([false, false, false, false, true]);
  });

  test('toggles a whole column from the column menu without unlocking the summary', async () => {
    await grid.openColumnMenu(0);
    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);

    await grid.openColumnMenu(0);
    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([false, false, false, false, true]);
  });

  test('keeps the summary read-only through undo and redo of a column toggle', async () => {
    await grid.openContextMenuOnHeader(0);
    await grid.clickReadOnlyItem();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);

    // The undo snapshot of a "make read-only" click is empty by design (every cell was writable),
    // and undo restores an absent entry as `false` - which, without the lock, unlocked the summary.
    await grid.undoWithKeyboard();

    expect(await grid.columnReadOnly(0)).toEqual([false, false, false, false, true]);

    // The undo step above is what proves the fix: on unfixed code the summary comes back
    // `false` too. Redo restoring the whole column to `true` passes either way - it is here for
    // completeness, not as evidence of the fix.
    await grid.redo();

    expect(await grid.columnReadOnly(0)).toEqual([true, true, true, true, true]);
  });

  test('refuses to unlock a summary cell through setCellMeta', async () => {
    await grid.setReadOnly(4, 0, false);

    expect(await grid.readOnly(4, 0)).toBe(true);

    // Control: the same call on a plain cell still goes through.
    await grid.setReadOnly(0, 0, true);

    expect(await grid.readOnly(0, 0)).toBe(true);

    await grid.setReadOnly(0, 0, false);

    expect(await grid.readOnly(0, 0)).toBe(false);
  });

  test('keeps the lock on the summary after a row is inserted above it', async () => {
    await grid.insertRowAbove(0);

    // The summary moved down to row 5 with its row.
    expect(await grid.readOnly(5, 0)).toBe(true);

    await grid.setReadOnly(5, 0, false);

    expect(await grid.readOnly(5, 0)).toBe(true);

    await grid.openContextMenuOnCell(5, 0);

    expect(await grid.visibleItems()).not.toContain('Read only');

    await grid.closeMenu();

    // And the row that now sits where the summary used to be is an ordinary cell.
    await grid.openContextMenuOnCell(4, 0);

    expect(await grid.visibleItems()).toContain('Read only');
  });

  test('leaves a summary configured with `readOnly: false` toggleable', async () => {
    expect(await grid.readOnly(4, 1)).toBe(false);

    await grid.openContextMenuOnCell(4, 1);

    expect(await grid.visibleItems()).toContain('Read only');

    await grid.clickReadOnlyItem();

    expect(await grid.readOnly(4, 1)).toBe(true);

    await grid.openContextMenuOnCell(4, 1);
    await grid.clickReadOnlyItem();

    expect(await grid.readOnly(4, 1)).toBe(false);
  });
});
