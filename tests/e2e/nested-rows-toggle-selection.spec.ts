import { test, expect } from '../fixtures/test';
import { NestedRowsPage } from '../fixtures/pages/NestedRowsPage';

/**
 * A collapse or an expand changes which rows are shown, not which rows are selected (DEV-509). The
 * selection holds VISUAL rows and a collapse is a trim, so before the fix the coordinates stayed put
 * while the rows moved under them: with rows A-2, A-3, and Root B selected, expanding A-2 left A-2
 * and its two children selected.
 *
 * Each case asserts the NAMES of the selected rows as well as the coordinates, because the bug is a
 * selection that keeps valid coordinates on other records.
 *
 * Physical layout of the fixture:
 *   0 Root A / 1 A-1 / 2 A-2 / 3 A-2-a / 4 A-2-b / 5 A-3 / 6 Root B / 7 B-1 / 8 B-2
 */
test.describe('NestedRows selection follows its rows across a collapse or an expand', () => {
  test('expanding the first selected parent keeps the row-header selection on the same rows',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.collapseButton(6).click();
      await nestedRows.collapseButton(2).click();

      expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-3', 'Root B']);

      await nestedRows.selectRows(2, 4);
      expect(await nestedRows.selectedNames()).toEqual([['A-2', 'A-3', 'Root B']]);

      await nestedRows.recordSelectionEnds();
      await nestedRows.collapseButton(2).click();

      // One range between the same two rows: the children the expand revealed between them join it.
      expect(await nestedRows.selectedNames()).toEqual([['A-2', 'A-2-a', 'A-2-b', 'A-3', 'Root B']]);
      expect(await nestedRows.selectedRanges()).toEqual([[2, -1, 6, 0]]);
      // The selection moved, so a listener hears about it once, with the new rows.
      expect(await nestedRows.selectionEnds()).toEqual([[2, 6]]);
    });

  test('each separately selected row stays on its own row after an expand', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.collapseButton(6).click();
    await nestedRows.collapseButton(2).click();
    await nestedRows.selectCells([[2, 0, 2, 0], [3, 0, 3, 0], [4, 0, 4, 0]]);

    expect(await nestedRows.selectedNames()).toEqual([['A-2'], ['A-3'], ['Root B']]);

    await nestedRows.collapseButton(2).click();

    // A single row stays a single row: the children of A-2 do not join its layer.
    expect(await nestedRows.selectedNames()).toEqual([['A-2'], ['A-3'], ['Root B']]);
    expect(await nestedRows.selectedRanges()).toEqual([[2, 0, 2, 0], [5, 0, 5, 0], [6, 0, 6, 0]]);
  });

  test('the focus stays in the layer the keyboard walked it to', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.collapseButton(0).click();
    // A click first, so the grid listens to the keyboard the way it does for a user.
    await nestedRows.cell(1, 0).click();
    await nestedRows.selectCells([[1, 0, 1, 0], [2, 0, 2, 0], [3, 0, 3, 0]]);
    // Enter leaves the last layer (B-2) and wraps to the first one (Root B).
    await page.keyboard.press('Enter');
    expect(await nestedRows.focusedName()).toBe('Root B');

    // Through the API, as an app's toolbar button does. A press on the row header button makes the
    // last layer active by itself, whether or not the selection moves, which is not what this pins.
    await nestedRows.callPlugin('expandParent', 0);

    expect(await nestedRows.selectedNames()).toEqual([['Root B'], ['B-1'], ['B-2']]);
    // Re-laying the layers leaves the last one active unless the repair puts the focus back.
    expect(await nestedRows.focusedName()).toBe('Root B');

    await page.keyboard.press('Enter');
    expect(await nestedRows.focusedName()).toBe('B-1');
  });

  test('collapsing a parent above the selection moves the selection up with its rows',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.selectRows(5, 6);
      expect(await nestedRows.selectedNames()).toEqual([['A-3', 'Root B']]);

      await nestedRows.collapseButton(2).click();

      // Both corners stayed in range, so nothing dropped the selection: before the fix it covered
      // Root B and B-1.
      expect(await nestedRows.selectedNames()).toEqual([['A-3', 'Root B']]);
      expect(await nestedRows.selectedRanges()).toEqual([[3, -1, 4, 0]]);
    });

  test('collapsing a parent inside the selected range shrinks the range onto the rows that are left',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.selectRows(0, 6);

      await nestedRows.collapseButton(2).click();

      expect(await nestedRows.selectedNames()).toEqual([['Root A', 'A-1', 'A-2', 'A-3', 'Root B']]);

      // And back: the expand restores the range the user selected.
      await nestedRows.collapseButton(2).click();

      expect(await nestedRows.selectedNames())
        .toEqual([['Root A', 'A-1', 'A-2', 'A-2-a', 'A-2-b', 'A-3', 'Root B']]);
    });

  test('a cell range below an expanded parent stays on its cells', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.collapseButton(0).click();

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);

    await nestedRows.cell(2, 0).click();
    await page.keyboard.press('Shift+ArrowDown');
    expect(await nestedRows.selectedNames()).toEqual([['B-1', 'B-2']]);

    await nestedRows.collapseButton(0).click();

    expect(await nestedRows.selectedNames()).toEqual([['B-1', 'B-2']]);
    expect(await nestedRows.selectedRanges()).toEqual([[7, 0, 8, 0]]);

    // The keyboard carries on from the row the user was on, not from the old coordinate.
    await page.keyboard.press('ArrowUp');
    expect(await nestedRows.selectedCell()).toEqual([6, 0]);
  });

  test('a toggle that moves no selected row fires no selection hook', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.selectRows(0, 1);
    await nestedRows.recordSelectionEnds();

    // Root B sits below the selection, so its rows leave and come back without moving Root A or A-1.
    // Through the API: two presses on one button in a row are a double click.
    await nestedRows.callPlugin('collapseParent', 6);
    await nestedRows.callPlugin('expandParent', 6);

    expect(await nestedRows.visibleNames()).toHaveLength(9);

    expect(await nestedRows.selectedNames()).toEqual([['Root A', 'A-1']]);
    expect(await nestedRows.selectionEnds()).toEqual([]);

    // The positive control for the empty log: a toggle above the selection does report.
    await nestedRows.selectRows(6, 6);
    await nestedRows.recordSelectionEnds();
    await nestedRows.collapseButton(2).click();

    expect(await nestedRows.selectionEnds()).toEqual([[4, 4]]);
  });

  test('the public API moves the selection the same way, without scrolling to it',
    async({ page, theme, bundle }) => {
      const nestedRows = new NestedRowsPage(page, theme, bundle);

      await nestedRows.goto();
      await nestedRows.updateSettings({ height: 120 });
      await nestedRows.callPlugin('collapseParent', 0);
      await nestedRows.selectRows(1, 1);
      expect(await nestedRows.selectedNames()).toEqual([['Root B']]);

      await nestedRows.callPlugin('expandParent', 0);

      expect(await nestedRows.selectedNames()).toEqual([['Root B']]);
      expect(await nestedRows.selectedRanges()).toEqual([[6, -1, 6, 0]]);
      // Root B is now below the 120px viewport, and the grid stays where the user left it.
      expect(await nestedRows.firstVisibleRow()).toBe(0);
    });

  test('toggles made inside one batch move the selection too', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.selectRows(5, 6);
    await nestedRows.recordSelectionEnds();

    // The plugin flushes each collapse at once, also inside a batch, so Root B is visual row 4 by
    // the time the second call names it.
    await nestedRows.callPluginInBatch([['collapseParent', 2], ['collapseParent', 4]]);

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-3', 'Root B']);
    expect(await nestedRows.selectedNames()).toEqual([['A-3', 'Root B']]);
    expect(await nestedRows.selectionEnds()).toEqual([[3, 4]]);
  });

  test('undo and redo of a collapse keep the selection on its rows', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto();
    // A click first, so the grid listens to the keyboard the way it does for a user.
    await nestedRows.cell(7, 0).click();
    await page.keyboard.press('Shift+ArrowDown');
    expect(await nestedRows.selectedNames()).toEqual([['B-1', 'B-2']]);

    await nestedRows.callPlugin('collapseParent', 0);
    expect(await nestedRows.selectedRanges()).toEqual([[2, 0, 3, 0]]);

    await page.keyboard.press('ControlOrMeta+z');

    // The rows of Root A are back above the selection, which stays on B-1 and B-2.
    expect(await nestedRows.visibleNames()).toHaveLength(9);
    expect(await nestedRows.selectedNames()).toEqual([['B-1', 'B-2']]);
    expect(await nestedRows.selectedRanges()).toEqual([[7, 0, 8, 0]]);

    await page.keyboard.press('ControlOrMeta+Shift+z');

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'Root B', 'B-1', 'B-2']);
    expect(await nestedRows.selectedNames()).toEqual([['B-1', 'B-2']]);
  });

  test('a press on the row header button leaves the focus in its layer', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.cell(6, 0).click();
    await nestedRows.selectCells([[6, 0, 6, 0], [7, 0, 7, 0], [8, 0, 8, 0]]);
    await page.keyboard.press('Enter');
    expect(await nestedRows.focusedName()).toBe('Root B');

    // The press selects nothing, and its `mouseup` re-lays the layers, which used to leave the last
    // one active.
    await nestedRows.collapseButton(2).click();

    expect(await nestedRows.selectedNames()).toEqual([['Root B'], ['B-1'], ['B-2']]);
    expect(await nestedRows.focusedName()).toBe('Root B');
    // The drawn grid agrees with the API: the focus border and the browser focus are on Root B.
    expect(await nestedRows.drawnFocus()).toEqual({ current: ['Root B'], focused: 'Root B' });

    await page.keyboard.press('Enter');
    expect(await nestedRows.focusedName()).toBe('B-1');
  });

  test('removing a row above the selection keeps the selection on its rows', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.collapseButton(2).click();
    // Rows shown: Root A, A-1, A-2, A-3, Root B, B-1, B-2.
    await nestedRows.selectRows(5, 6);
    expect(await nestedRows.selectedNames()).toEqual([['B-1', 'B-2']]);

    // A-1 goes while A-2 is collapsed: the grid expands for the removal and collapses again a tick
    // later, and the selection was stranded on the way.
    await nestedRows.removeRow(1);

    await expect.poll(() => nestedRows.visibleNames()).toEqual(['Root A', 'A-2', 'A-3', 'Root B', 'B-1', 'B-2']);
    await expect.poll(() => nestedRows.selectedNames()).toEqual([['B-1', 'B-2']]);
    expect(await nestedRows.selectedRanges()).toEqual([[4, -1, 5, 0]]);
  });

  test('adding a child above the selection keeps the selection on its rows', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto();
    await nestedRows.selectRows(7, 8);

    await nestedRows.addChildTo(0);

    expect(await nestedRows.countRows()).toBe(10);
    expect(await nestedRows.selectedNames()).toEqual([['B-1', 'B-2']]);
    expect(await nestedRows.selectedRanges()).toEqual([[8, -1, 9, 0]]);
  });

  test('a blocked expand leaves the selection where it was', async({ page, theme, bundle }) => {
    const nestedRows = new NestedRowsPage(page, theme, bundle);

    await nestedRows.goto({ block: 'rowExpand' });
    await nestedRows.collapseButton(2).click();
    await nestedRows.selectRows(2, 4);
    await nestedRows.recordSelectionEnds();

    await nestedRows.collapseButton(2).click();

    expect(await nestedRows.visibleNames()).toEqual(['Root A', 'A-1', 'A-2', 'A-3', 'Root B', 'B-1', 'B-2']);
    expect(await nestedRows.selectedRanges()).toEqual([[2, -1, 4, 0]]);
    expect(await nestedRows.selectionEnds()).toEqual([]);
  });
});
