import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * A column move that takes a cell out of a merge, undone and redone. The redo restores the moved column
 * order before MergeCells restores its merges, so the cell the move released must not keep the flags the
 * merge stored on it (`hidden` and `copyable: false`): such a cell cannot be copied or edited.
 *
 * The fixture's data is `R<row+1>C<col+1>` over a 10x10 grid, so cell (0, 0) reads `R1C1`.
 */
test.describe('redo of a column move that took a cell out of a merge', { tag: THEMES_TAG }, () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new SelectionFeaturesPage(page, theme, bundle);
    await grid.goto();
    await grid.initGrid({
      undo: true,
      manualColumnMove: true,
      mergeCells: [{ row: 1, col: 4, rowspan: 1, colspan: 3 }],
    });
  });

  test('the released cell copies as its value after the undo and the redo', async () => {
    // Column 5 is the middle of the merge B..: the move takes it out.
    await grid.moveColumns([5], 8);
    await grid.undo();

    // Back in the merge, the cell is covered and cannot be copied.
    expect(await grid.columnOrder()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(await grid.copyableText(1, 5)).toBe('');

    await grid.redo();

    const releasedColumn = (await grid.columnOrder()).indexOf(5);

    expect(releasedColumn).toBe(8);

    await grid.setCellValue(1, releasedColumn, 'released');

    // The redo left `hidden` and `copyable: false` on this cell, so it copied as an empty string.
    expect(await grid.copyableText(1, releasedColumn)).toBe('released');
  });
});
