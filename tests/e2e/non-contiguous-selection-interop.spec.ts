import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { NonContiguousSelectionPage } from '../fixtures/pages/NonContiguousSelectionPage';

/**
 * A Ctrl/Cmd+click selection holds several ranges, and three features used to read only the active
 * one: "Hide columns" and "Hide rows" hid that range alone, "Merge cells" (the context menu and
 * Ctrl+M) merged it alone, and a header drag moved its columns or rows alone. The other ranges were
 * ignored without a word.
 *
 * Hiding now covers every range selected by its header. Merging and moving refuse a selection of
 * several ranges, as spreadsheet applications do: there is no one block to merge, and no one place to
 * put several separate columns or rows. A single range keeps working as before, which every group
 * proves with a control.
 */
test.describe('features that read a selection of several ranges', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: NonContiguousSelectionPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new NonContiguousSelectionPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('hiding', () => {
    test('hides one column from a single header selection', async() => {
      await grid.selectColumnHeaders([2]);
      await grid.openContextMenuOn(grid.columnHeader(2));
      await grid.clickContextMenuItem('Hide column');

      expect(await grid.hiddenColumns()).toEqual([2]);
    });

    test('hides every column of a Ctrl/Cmd+click header selection', async() => {
      await grid.selectColumnHeaders([1, 3]);

      expect(await grid.selected()).toHaveLength(2);

      await grid.openContextMenuOn(grid.columnHeader(3));
      await grid.clickContextMenuItem('Hide columns');

      expect((await grid.hiddenColumns()).sort()).toEqual([1, 3]);
      // The selection moves to the first visible column after the last hidden one.
      expect(await grid.selected()).toEqual([[-1, 4, 7, 4]]);
    });

    test('hides the columns of the header ranges and leaves a cell range out', async() => {
      await grid.selectColumnHeaders([1]);
      await grid.cell(5, 4).click({ modifiers: ['ControlOrMeta'] });
      await grid.columnHeader(3).click({ modifiers: ['ControlOrMeta'] });

      expect(await grid.selected()).toHaveLength(3);

      await grid.openContextMenuOn(grid.columnHeader(3));
      await grid.clickContextMenuItem('Hide columns');

      expect((await grid.hiddenColumns()).sort()).toEqual([1, 3]);
    });

    test('offers "Hide columns" whichever range was added last', async() => {
      // The cell range comes last here, so it is the range the selection reports as its latest layer.
      await grid.selectColumnHeaders([1, 3]);
      await grid.cell(5, 4).click({ modifiers: ['ControlOrMeta'] });

      expect(await grid.selected()).toHaveLength(3);

      await grid.openContextMenuOn(grid.columnHeader(1));
      await grid.clickContextMenuItem('Hide columns');

      expect((await grid.hiddenColumns()).sort()).toEqual([1, 3]);
    });

    test('hides the header range left after a Ctrl/Cmd+click removed a cell range', async() => {
      // The second click on C3 removes the first C3 layer, so the column range moves to layer 0.
      await grid.cell(2, 2).click();
      await grid.columnHeader(3).click({ modifiers: ['ControlOrMeta'] });
      await grid.cell(2, 2).click({ modifiers: ['ControlOrMeta'] });

      expect(await grid.selected()).toEqual([[-1, 3, 7, 3], [2, 2, 2, 2]]);

      await grid.openContextMenuOn(grid.columnHeader(3));
      await grid.clickContextMenuItem('Hide column');

      expect(await grid.hiddenColumns()).toEqual([3]);
    });

    test('hides only the clicked column after a select-all and a Ctrl/Cmd+click on its header', async() => {
      await grid.clickCorner();
      await grid.columnHeader(3).click({ modifiers: ['ControlOrMeta'] });

      expect(await grid.selected()).toHaveLength(2);

      await grid.openContextMenuOn(grid.columnHeader(3));
      await grid.clickContextMenuItem('Hide column');

      expect(await grid.hiddenColumns()).toEqual([3]);
    });

    test('hides only the clicked column after Ctrl/Cmd+A on a grid with column headers alone', async({ page }) => {
      // With one header rendered, the select-all carries one header flag only. The move plugin is off: with
      // it on, a press on a header inside a header-flagged range arms a column move instead of selecting.
      await grid.initGrid({ rowHeaders: false, manualColumnMove: false });
      await grid.cell(0, 0).click();
      await page.keyboard.press('ControlOrMeta+a');
      await grid.columnHeader(3).click({ modifiers: ['ControlOrMeta'] });
      await grid.openContextMenuOn(grid.columnHeader(3));
      await grid.clickContextMenuItem('Hide column');

      expect(await grid.hiddenColumns()).toEqual([3]);
    });

    test('hides only the clicked row after Ctrl/Cmd+A on a grid with row headers alone', async({ page }) => {
      await grid.initGrid({ colHeaders: false, manualRowMove: false });
      await grid.cell(0, 0).click();
      await page.keyboard.press('ControlOrMeta+a');
      await grid.rowHeader(4).click({ modifiers: ['ControlOrMeta'] });
      await grid.openContextMenuOn(grid.rowHeader(4));
      await grid.clickContextMenuItem('Hide row');

      expect(await grid.hiddenRows()).toEqual([4]);
    });

    test('hides a column on a grid that renders no column headers', async({ page }) => {
      await grid.initGrid({ colHeaders: false });
      await grid.cell(1, 2).click();
      await page.keyboard.press('Control+Space');
      await grid.openContextMenuOn(grid.cell(1, 2));
      await grid.clickContextMenuItem('Hide column');

      expect(await grid.hiddenColumns()).toEqual([2]);
    });

    test('hides a row on a grid that renders no row headers', async({ page }) => {
      await grid.initGrid({ rowHeaders: false });
      await grid.cell(3, 1).click();
      await page.keyboard.press('Shift+Space');
      await grid.openContextMenuOn(grid.cell(3, 1));
      await grid.clickContextMenuItem('Hide row');

      expect(await grid.hiddenRows()).toEqual([3]);
    });

    test('hides every row of a Ctrl/Cmd+click header selection', async() => {
      await grid.selectRowHeaders([1, 4]);

      expect(await grid.selected()).toHaveLength(2);

      await grid.openContextMenuOn(grid.rowHeader(4));
      await grid.clickContextMenuItem('Hide rows');

      expect((await grid.hiddenRows()).sort()).toEqual([1, 4]);
    });
  });

  test.describe('merging', () => {
    test('merges a single range from the context menu', async() => {
      await grid.selectRanges([[1, 1, 2, 2]]);
      await grid.openContextMenuOn(grid.cell(1, 1));
      await grid.clickContextMenuItem('Merge cells');

      expect(await grid.mergedAreas()).toEqual([{ row: 1, col: 1, rowspan: 2, colspan: 2 }]);
    });

    test('disables "Merge cells" in the context menu for two ranges', async() => {
      await grid.selectRanges([[1, 1, 2, 2], [4, 3, 5, 4]]);
      await grid.openContextMenuOn(grid.cell(4, 3));

      expect(await grid.selected()).toHaveLength(2);
      await expect(grid.contextMenuItem('Merge cells')).toHaveAttribute('aria-disabled', 'true');
    });

    test('merges nothing through executeCommand() for two ranges, and one range on its own', async() => {
      await grid.selectRanges([[1, 1, 2, 2], [4, 3, 5, 4]]);
      await grid.executeContextMenuCommand('mergeCells');

      expect(await grid.mergedAreas()).toEqual([]);

      // Control: the same command merges a single range.
      await grid.selectRanges([[4, 3, 5, 4]]);
      await grid.executeContextMenuCommand('mergeCells');

      expect(await grid.mergedAreas()).toEqual([{ row: 4, col: 3, rowspan: 2, colspan: 2 }]);
    });

    test('merges nothing on Ctrl+M for two ranges, and the active range on its own', async({ page }) => {
      await grid.selectRanges([[1, 1, 2, 2], [4, 3, 5, 4]]);
      await page.keyboard.press('Control+m');

      expect(await grid.mergedAreas()).toEqual([]);

      // Control: the same chord merges a single range.
      await grid.selectRanges([[4, 3, 5, 4]]);
      await page.keyboard.press('Control+m');

      expect(await grid.mergedAreas()).toEqual([{ row: 4, col: 3, rowspan: 2, colspan: 2 }]);
    });

    test('unmerges nothing for two ranges, from the context menu or Ctrl+M', async({ page }) => {
      const merged = [{ row: 1, col: 1, rowspan: 2, colspan: 2 }];

      await grid.initGrid({ mergeCells: merged });
      await grid.selectRanges([[4, 3, 4, 3], [1, 1, 2, 2]]);
      await grid.openContextMenuOn(grid.cell(1, 1));

      await expect(grid.contextMenuItem('Unmerge cells')).toHaveAttribute('aria-disabled', 'true');

      await page.keyboard.press('Escape');
      await expect(grid.contextMenu()).toHaveCount(0);
      await page.keyboard.press('Control+m');

      expect(await grid.mergedAreas()).toEqual(merged);

      // Control: the same chord unmerges the block when it is the only range.
      await grid.selectRanges([[1, 1, 2, 2]]);
      await page.keyboard.press('Control+m');

      expect(await grid.mergedAreas()).toEqual([]);
    });
  });

  // Which side of the target header a drop lands on depends on the half of the header the pointer is
  // over, so the controls assert that the dragged column or row moved ahead of its old neighbor,
  // not the exact slot.
  test.describe('moving', () => {
    test('moves a column dragged by its header', async() => {
      await grid.selectColumnHeaders([3]);
      await grid.dragColumnHeaderOnto(3, 0);

      const order = await grid.firstRow();

      expect(order.indexOf('D1')).toBeLessThan(order.indexOf('C1'));
    });

    test('shows the grab cursor on one header range and not on two', async() => {
      await grid.selectColumnHeaders([1]);

      expect(await grid.showsMoveCursor('columns')).toBe(true);

      await grid.columnHeader(3).click({ modifiers: ['ControlOrMeta'] });

      expect(await grid.showsMoveCursor('columns')).toBe(false);

      await grid.selectRowHeaders([2]);

      expect(await grid.showsMoveCursor('rows')).toBe(true);

      await grid.rowHeader(5).click({ modifiers: ['ControlOrMeta'] });

      expect(await grid.showsMoveCursor('rows')).toBe(false);
    });

    test('moves no column when the selection holds two header ranges', async() => {
      await grid.selectColumnHeaders([1, 3]);
      await grid.dragColumnHeaderOnto(3, 0);

      expect(await grid.firstRow()).toEqual(['A1', 'B1', 'C1', 'D1', 'E1', 'F1']);
    });

    test('moves a row dragged by its header', async() => {
      await grid.selectRowHeaders([4]);
      await grid.dragRowHeaderOnto(4, 0);

      const order = await grid.firstColumn();

      expect(order.indexOf('A5')).toBeLessThan(order.indexOf('A4'));
    });

    test('moves no row when the selection holds two header ranges', async() => {
      await grid.selectRowHeaders([1, 4]);
      await grid.dragRowHeaderOnto(4, 0);

      expect(await grid.firstColumn()).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8']);
    });
  });
});
