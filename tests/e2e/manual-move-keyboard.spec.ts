import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { ManualMoveKeyboardPage } from '../fixtures/pages/ManualMoveKeyboardPage';

const COLUMNS = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'];
const ROWS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];
const BLOCKED = 'Cannot move further in this direction.';

/**
 * Moving columns and rows without a drag. The keyboard path is a move mode (`Ctrl`/`Cmd`+`Alt`+`G`, the arrow
 * keys, `Enter`, `Escape`); the single-pointer path is the "Move column left/right" and "Move row up/down" menu
 * items, which the default context menu (and, for columns, the default column menu) lists.
 */
test.describe('manual move without a drag', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: ManualMoveKeyboardPage;

  const press = async(...keys: string[]) => {
    for (const key of keys) {
      // eslint-disable-next-line no-await-in-loop
      await grid.page.keyboard.press(key);
    }
  };

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ManualMoveKeyboardPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('keyboard', () => {
    test('moves the column of the selected cell one place per arrow key, with the selection, in one undo step',
      async() => {
        await grid.cell(1, 1).click();
        await press('ControlOrMeta+Alt+g');

        await expect(grid.politeRegion()).toContainText('Moving the column');

        await press('ArrowRight', 'ArrowRight');

        await expect(grid.politeRegion()).toHaveText('Moved to column 4 of 6');
        expect(await grid.columnOrder()).toEqual(['A1', 'C1', 'D1', 'B1', 'E1', 'F1']);
        expect(await grid.selected()).toEqual([[1, 3, 1, 3]]);
        expect((await grid.moves()).map(move => move.finalIndex)).toEqual([2, 3]);

        await press('Enter');
        // Enter ends the move and opens no editor: the arrow keys move the selection again
        await press('ArrowRight');
        expect(await grid.selected()).toEqual([[1, 4, 1, 4]]);

        // the whole move is one undo step
        await press('ControlOrMeta+z');
        expect(await grid.columnOrder()).toEqual(COLUMNS);
        expect(await grid.isUndoAvailable()).toBe(false);
      });

    test('moves the selected row up and down', async() => {
      await grid.rowHeader(2).click();
      await press('ControlOrMeta+Alt+g');

      await expect(grid.politeRegion()).toContainText('Moving the row');

      await press('ArrowUp');

      await expect(grid.politeRegion()).toHaveText('Moved to row 2 of 6');
      expect(await grid.rowOrder()).toEqual(['A1', 'A3', 'A2', 'A4', 'A5', 'A6']);
      expect(await grid.selected()).toEqual([[1, -1, 1, 5]]);

      await press('ArrowDown', 'ArrowDown', 'Enter');

      expect(await grid.rowOrder()).toEqual(['A1', 'A2', 'A4', 'A3', 'A5', 'A6']);
    });

    test('moves a block of selected columns together', async() => {
      await grid.columnHeaderLabel(1).click();
      await grid.columnHeaderLabel(2).click({ modifiers: ['Shift'] });
      await press('ControlOrMeta+Alt+g', 'ArrowRight', 'Enter');

      expect(await grid.columnOrder()).toEqual(['A1', 'D1', 'B1', 'C1', 'E1', 'F1']);
      expect(await grid.selected()).toEqual([[-1, 2, 5, 3]]);
    });

    test('keeps the focus where it was inside a moved range', async() => {
      await grid.cell(1, 1).click();
      // a range of three cells in column B, with the focus moved by Enter to its second cell
      await press('Shift+ArrowDown', 'Shift+ArrowDown', 'Enter');
      expect(await grid.focus()).toEqual({ row: 2, col: 1 });

      await press('ControlOrMeta+Alt+g', 'ArrowRight', 'Enter');

      expect(await grid.columnOrder()).toEqual(['A1', 'C1', 'B1', 'D1', 'E1', 'F1']);
      expect(await grid.selected()).toEqual([[1, 2, 3, 2]]);
      expect(await grid.focus()).toEqual({ row: 2, col: 2 });
    });

    test('Escape puts the block back where the move started, records no undo step and announces the cancel',
      async() => {
        await grid.cell(2, 1).click();
        await press('ControlOrMeta+Alt+g', 'ArrowRight', 'ArrowRight', 'Escape');

        await expect(grid.politeRegion()).toHaveText('Canceled.');
        expect(await grid.columnOrder()).toEqual(COLUMNS);
        expect(await grid.selected()).toEqual([[2, 1, 2, 1]]);
        expect(await grid.isUndoAvailable()).toBe(false);

        await press('ArrowRight');
        expect(await grid.selected()).toEqual([[2, 2, 2, 2]]);
      });

    test('any other key ends the move where the block is', async() => {
      await grid.cell(1, 1).click();
      await press('ControlOrMeta+Alt+g', 'ArrowRight');
      // a letter opens the editor, and Escape closes it without changing the selection
      await press('x', 'Escape', 'ArrowRight');

      expect(await grid.columnOrder()).toEqual(['A1', 'C1', 'B1', 'D1', 'E1', 'F1']);
      expect(await grid.selected()).toEqual([[1, 3, 1, 3]]);
    });

    test('announces an arrow key that cannot move the block, and fires no move hook for it', async() => {
      await grid.cell(1, 0).click();
      await press('ControlOrMeta+Alt+g', 'ArrowLeft');

      await expect(grid.politeRegion()).toHaveText(BLOCKED);
      expect(await grid.columnOrder()).toEqual(COLUMNS);
      expect(await grid.moves()).toEqual([]);

      // the move is still running
      await press('ArrowRight', 'Enter');
      expect(await grid.columnOrder()).toEqual(['B1', 'A1', 'C1', 'D1', 'E1', 'F1']);
    });

    test('does not start with a selection of several ranges', async() => {
      await grid.selectCells([[0, 2, 0, 2], [3, 4, 3, 4]]);
      await press('ControlOrMeta+Alt+g', 'ArrowRight');

      expect(await grid.columnOrder()).toEqual(COLUMNS);
      expect(await grid.moves()).toEqual([]);
      // the arrow key moved the selection instead
      expect(await grid.selected()).toEqual([[3, 5, 3, 5]]);
    });

    test('keeps the order when a move hook refuses the move', async() => {
      await grid.vetoMoves();
      await grid.cell(1, 2).click();
      await press('ControlOrMeta+Alt+g', 'ArrowLeft');

      await expect(grid.politeRegion()).toHaveText(BLOCKED);
      expect(await grid.vetoedCount()).toBe(1);
      expect(await grid.columnOrder()).toEqual(COLUMNS);
      expect(await grid.selected()).toEqual([[1, 2, 1, 2]]);
    });

    test('steps over a hidden column, as a drop does', async() => {
      await grid.rebuild({ hiddenColumns: { columns: [2] } });
      await grid.cell(1, 1).click();
      await press('ControlOrMeta+Alt+g', 'ArrowRight', 'Enter');

      // B passes the hidden C and the visible D
      expect(await grid.columnOrder()).toEqual(['A1', 'C1', 'D1', 'B1', 'E1', 'F1']);
      await expect(grid.politeRegion()).toHaveText('Moved to column 3 of 5');
    });

    test('steps over a hidden row, as a lower-half drop does', async() => {
      await grid.rebuild({ hiddenRows: { rows: [2] } });
      await grid.rowHeader(1).click();
      await press('ControlOrMeta+Alt+g', 'ArrowDown', 'Enter');

      // A2 passes the hidden A3 and the visible A4
      expect(await grid.rowOrder()).toEqual(['A1', 'A3', 'A4', 'A2', 'A5', 'A6']);
    });

    test('does not move a column into the frozen end columns, and still moves it the other way', async() => {
      await grid.rebuild({ fixedColumnsEnd: 2 });
      await grid.cell(1, 3).click();
      await press('ControlOrMeta+Alt+g', 'ArrowRight');

      await expect(grid.politeRegion()).toHaveText(BLOCKED);
      expect(await grid.columnOrder()).toEqual(COLUMNS);

      await press('ArrowLeft', 'Enter');
      expect(await grid.columnOrder()).toEqual(['A1', 'B1', 'D1', 'C1', 'E1', 'F1']);
    });

    test('does not move a column past the columns maxCols draws', async() => {
      await grid.rebuild({ maxCols: 4 });
      await grid.cell(1, 3).click();
      await press('ControlOrMeta+Alt+g', 'ArrowRight');

      await expect(grid.politeRegion()).toHaveText(BLOCKED);
      expect(await grid.moves()).toEqual([]);
    });

    test('moves toward the side the arrow points to in a right-to-left grid', async() => {
      await grid.rebuild({ layoutDirection: 'rtl' });
      await grid.cell(1, 1).click();
      await press('ControlOrMeta+Alt+g', 'ArrowLeft', 'Enter');

      expect(await grid.columnOrder()).toEqual(['A1', 'C1', 'B1', 'D1', 'E1', 'F1']);
    });

    test('moves the row of a focused row header in the data grid mode', async() => {
      await grid.rebuild({ navigableHeaders: true });
      await grid.cell(2, 0).click();
      await press('ArrowLeft');
      expect(await grid.focus()).toEqual({ row: 2, col: -1 });

      await press('ControlOrMeta+Alt+g', 'ArrowDown', 'Enter');

      expect(await grid.rowOrder()).toEqual(['A1', 'A2', 'A4', 'A3', 'A5', 'A6']);
      expect(await grid.focus()).toEqual({ row: 3, col: -1 });
    });

    test('keeps running through the update cycle a wrapper sends, for columns and rows', async() => {
      await grid.cell(1, 1).click();
      await press('ControlOrMeta+Alt+g');
      await grid.updateSettings({ manualColumnMove: true });
      await press('ArrowRight', 'Enter');

      expect(await grid.columnOrder()).toEqual(['A1', 'C1', 'B1', 'D1', 'E1', 'F1']);

      await grid.rowHeader(1).click();
      await press('ControlOrMeta+Alt+g');
      await grid.updateSettings({ manualRowMove: true });
      await press('ArrowDown', 'Enter');

      expect(await grid.rowOrder()).toEqual(['A1', 'A3', 'A2', 'A4', 'A5', 'A6']);
    });

    test('ends when the plugin is turned off, and stays ended when it is turned on again', async() => {
      await grid.cell(1, 1).click();
      await press('ControlOrMeta+Alt+g');
      await grid.updateSettings({ manualColumnMove: false });
      await grid.updateSettings({ manualColumnMove: true });
      await press('ArrowRight');

      expect(await grid.columnOrder()).toEqual(COLUMNS);
      expect(await grid.selected()).toEqual([[1, 2, 1, 2]]);
    });

    test('ends when the selection changes', async() => {
      await grid.cell(1, 1).click();
      await press('ControlOrMeta+Alt+g');
      await grid.cell(3, 4).click();
      await press('ArrowRight');

      expect(await grid.columnOrder()).toEqual(COLUMNS);
      expect(await grid.selected()).toEqual([[3, 5, 3, 5]]);
    });

    test('is off for rows while NestedRows moves them', async() => {
      await grid.rebuild({
        data: [
          { name: 'Engineering', __children: [{ name: 'Ana García' }, { name: 'Li Wei' }] },
          { name: 'Marketing', __children: [{ name: 'James Okafor' }] },
        ],
        columns: [{ data: 'name' }],
        nestedRows: true,
      });
      await grid.rowHeader(1).click();
      await press('ControlOrMeta+Alt+g', 'ArrowDown');

      await expect(grid.politeRegion()).not.toContainText('Moving the row');
      expect(await grid.moves()).toEqual([]);
    });
  });

  test.describe('menu items', () => {
    test('the default context menu moves the column of the selected cell, and disables what cannot move',
      async() => {
        await grid.cell(1, 0).click({ button: 'right' });

        await expect(grid.contextMenuItem('Move column left')).toHaveClass(/htDisabled/);
        await grid.contextMenuItem('Move column right').click();

        expect(await grid.columnOrder()).toEqual(['B1', 'A1', 'C1', 'D1', 'E1', 'F1']);
        expect(await grid.selected()).toEqual([[1, 1, 1, 1]]);

        await press('ControlOrMeta+z');
        expect(await grid.columnOrder()).toEqual(COLUMNS);
      });

    test('the default context menu moves a selected row, and shows no column items for it', async() => {
      await grid.rowHeader(1).click();
      await grid.rowHeader(1).click({ button: 'right' });

      await expect(grid.contextMenuItem('Move column right')).toHaveCount(0);
      await grid.contextMenuItem('Move row down').click();

      expect(await grid.rowOrder()).toEqual(['A1', 'A3', 'A2', 'A4', 'A5', 'A6']);
    });

    test('the default column menu moves the column', async() => {
      await grid.dropdownButton(2).click();
      await grid.dropdownMenuItem('Move column left').click();

      expect(await grid.columnOrder()).toEqual(['A1', 'C1', 'B1', 'D1', 'E1', 'F1']);
    });

    test('"Move column left" moves toward the left side of the screen in a right-to-left grid', async() => {
      await grid.rebuild({ layoutDirection: 'rtl' });
      await grid.cell(1, 1).click({ button: 'right' });
      await grid.contextMenuItem('Move column left').click();

      expect(await grid.columnOrder()).toEqual(['A1', 'C1', 'B1', 'D1', 'E1', 'F1']);
    });

    test('the items are absent when the plugins are off', async() => {
      await grid.rebuild({ manualColumnMove: false, manualRowMove: false });
      await grid.cell(1, 1).click({ button: 'right' });

      await expect(grid.contextMenuItem('Move row up')).toHaveCount(0);
      await expect(grid.contextMenuItem('Move column left')).toHaveCount(0);
      expect(await grid.rowOrder()).toEqual(ROWS);
    });
  });
});
