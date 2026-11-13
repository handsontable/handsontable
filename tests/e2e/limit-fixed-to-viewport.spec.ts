import { test, expect, THEMES_TAG, BUNDLES_TAG } from '../fixtures/test';
import { LimitFixedToViewportPage } from '../fixtures/pages/LimitFixedToViewportPage';

/**
 * The `limitFixedToViewport` option: a frozen area bigger than the grid is drawn at the size that fits and leaves a
 * scrollable strip, instead of covering the whole grid. The fixture is a 500 x 300 grid of 100px columns.
 */
test.describe('limitFixedToViewport', { tag: [THEMES_TAG, BUNDLES_TAG] }, () => {
  let grid: LimitFixedToViewportPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new LimitFixedToViewportPage(page, theme, bundle);
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test.describe('a frozen area bigger than the grid', () => {
    test('frozen start columns leave a strip, and the last column is reachable', async() => {
      await grid.goto({ start: 20 });

      expect(await grid.drawnCounts()).toEqual(await grid.expectedCounts({ start: 20 }));
      // what is on screen, not only what the grid reports
      expect(await grid.renderedCount('start')).toBe((await grid.expectedCounts({ start: 20 })).start);
      expect((await grid.drawnCounts()).start).toBeGreaterThan(0);
      // the promise is about what is left to scroll, with the scrollbars of the holder taken out
      expect(await grid.scrollableStrip('start')).toBeGreaterThanOrEqual(40);
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('start')).toBeLessThanOrEqual(width - 40);
      expect(await grid.setting('fixedColumnsStart')).toBe(20);

      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });

    test('frozen end columns leave a strip, and the first scrollable column is reachable', async() => {
      await grid.goto({ end: 20 });

      expect(await grid.drawnCounts()).toEqual(await grid.expectedCounts({ end: 20 }));
      expect(await grid.renderedCount('end')).toBe((await grid.expectedCounts({ end: 20 })).end);
      expect((await grid.drawnCounts()).end).toBeGreaterThan(0);
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('end')).toBeLessThanOrEqual(width - 40);
      expect(await grid.setting('fixedColumnsEnd')).toBe(20);

      await grid.selectCell(0, 5);
      await expect.poll(() => grid.isCellUncovered(0, 5)).toBe(true);
    });

    test('frozen top rows leave a strip, and the last row is reachable', async() => {
      await grid.goto({ top: 40 });

      expect(await grid.drawnCounts()).toEqual(await grid.expectedCounts({ top: 40 }));
      expect(await grid.renderedCount('top')).toBe((await grid.expectedCounts({ top: 40 })).top);
      expect((await grid.drawnCounts()).top).toBeGreaterThan(0);
      expect(await grid.scrollableStrip('top')).toBeGreaterThanOrEqual(40);
      const { height } = await grid.gridSize();

      expect(await grid.bandSize('top')).toBeLessThanOrEqual(height - 40);
      expect(await grid.setting('fixedRowsTop')).toBe(40);

      await grid.selectCell(59, 0);
      await expect.poll(() => grid.isCellUncovered(59, 0)).toBe(true);
    });

    test('frozen bottom rows leave a strip, and the first scrollable row is reachable', async() => {
      await grid.goto({ bottom: 40 });

      expect(await grid.drawnCounts()).toEqual(await grid.expectedCounts({ bottom: 40 }));
      expect(await grid.renderedCount('bottom')).toBe((await grid.expectedCounts({ bottom: 40 })).bottom);
      expect((await grid.drawnCounts()).bottom).toBeGreaterThan(0);
      const { height } = await grid.gridSize();

      expect(await grid.bandSize('bottom')).toBeLessThanOrEqual(height - 40);
      expect(await grid.setting('fixedRowsBottom')).toBe(40);

      await grid.selectCell(5, 0);
      await expect.poll(() => grid.isCellUncovered(5, 0)).toBe(true);
    });

    test('the start band has priority over the end band', async() => {
      await grid.goto({ start: 20, end: 20 });

      // not an even split: the start band takes what fits, and the end band gets what is left of it
      expect(await grid.drawnCounts()).toEqual(await grid.expectedCounts({ start: 20, end: 20 }));
      expect((await grid.drawnCounts()).start).toBeGreaterThan((await grid.drawnCounts()).end);
    });

    test('the top band has priority over the bottom band', async() => {
      await grid.goto({ top: 40, bottom: 40 });

      expect(await grid.drawnCounts()).toEqual(await grid.expectedCounts({ top: 40, bottom: 40 }));
      expect((await grid.drawnCounts()).top).toBeGreaterThan((await grid.drawnCounts()).bottom);
    });

    test('a cut start band does not hand its columns to the end band', async() => {
      // 30 columns, start 28 and end 5: without the option the end band is 30 - 28 = 2 columns, never more
      await grid.goto({ start: 28, end: 5 });

      expect(await grid.drawnCounts()).toEqual(await grid.expectedCounts({ start: 28, end: 5 }));
      expect((await grid.drawnCounts()).end).toBeLessThanOrEqual(2);
    });
  });

  test.describe('the frozen area that fits', () => {
    test('is drawn in full', async() => {
      await grid.goto({ start: 2, top: 2 });

      expect(await grid.drawnCounts()).toEqual({ start: 2, end: 0, top: 2, bottom: 0 });
      expect(await grid.isCellUncovered(4, 3)).toBe(true);
    });
  });

  test.describe('resizing the grid', () => {
    test('shrinking turns the clamp on and growing reverses it', async() => {
      await grid.goto({ start: 4 });

      await grid.resize({ width: 900 });
      const wide = await grid.bandSize('start');

      expect(wide).toBeGreaterThanOrEqual(400);

      await grid.resize({ width: 300 });
      expect(await grid.bandSize('start')).toBeLessThan(300 - 40);
      expect(await grid.setting('fixedColumnsStart')).toBe(4);

      await grid.resize({ width: 900 });
      await expect.poll(() => grid.bandSize('start')).toBe(wide);
    });
  });

  test.describe('keyboard navigation', () => {
    test('Ctrl+ArrowRight reaches the last column and shows it', async() => {
      await grid.goto({ start: 20 });
      await grid.selectCell(0, 0);
      await grid.page.keyboard.press('ControlOrMeta+ArrowRight');

      expect(await grid.selected()).toEqual([0, 29]);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });

    test('Ctrl+ArrowDown reaches the last row and shows it', async() => {
      await grid.goto({ top: 40 });
      await grid.selectCell(0, 0);
      await grid.page.keyboard.press('ControlOrMeta+ArrowDown');

      expect(await grid.selected()).toEqual([59, 0]);
      await expect.poll(() => grid.isCellUncovered(59, 0)).toBe(true);
    });

    test('the editor opens over the cell it edits', async() => {
      await grid.goto({ start: 20 });
      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
      await grid.page.keyboard.press('Enter');

      const rects = await grid.editorAndCellRects(0, 29);

      expect(rects).not.toBeNull();
      expect(Math.abs(rects!.editor.left - rects!.cell.left)).toBeLessThanOrEqual(2);
      expect(Math.abs(rects!.editor.top - rects!.cell.top)).toBeLessThanOrEqual(2);
    });
  });

  test.describe('variants', () => {
    test('works with a hidden column inside the band', async() => {
      await grid.goto({ start: 20, hidden: 1 });
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('start')).toBeLessThanOrEqual(width - 40);

      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });

    test('works in RTL', async() => {
      await grid.goto({ start: 20, rtl: 1 });
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('start')).toBeLessThanOrEqual(width - 40);

      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });

    test('works when the window scrolls the rows', async() => {
      await grid.goto({ start: 20, win: 1 });
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('start')).toBeLessThanOrEqual(width - 40);

      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });
  });

  test.describe('the code that reads the frozen band', () => {
    test('manualColumnMove and manualRowMove use the drawn band, not the configured one', async() => {
      await grid.goto({ start: 20, top: 40 });

      expect(await grid.moveBandFlags(1, 1)).toEqual({ column: true, row: true });
      expect(await grid.moveBandFlags(10, 20)).toEqual({ column: false, row: false });
    });

    test('the editor of a cell past the drawn band is a scrollable-area editor', async() => {
      await grid.goto({ start: 20 });
      await grid.selectCell(0, 10);
      await expect.poll(() => grid.isCellUncovered(0, 10)).toBe(true);
      await grid.page.keyboard.press('Enter');

      expect(await grid.editorSection()).not.toContain('inline-start');
    });

    test('ManualColumnFreeze does not unfreeze a column that scrolls, and freezes at the drawn line', async() => {
      await grid.goto({ start: 20 });

      const { start: drawn } = await grid.drawnCounts();

      // configured 20, drawn fewer: column 10 is past the drawn band, so it is not frozen as far as the user sees
      expect(drawn).toBeLessThan(10);
      expect(await grid.unfreezeColumn(10)).toBe(false);
      expect(await grid.setting('fixedColumnsStart')).toBe(20);

      // the drawn band is the most that fits, so freezing one more column could not show: the plugin refuses
      expect(await grid.freezeColumn(25)).toBe(false);
      expect(await grid.visualColumnOf(25)).toBe(25);
      expect(await grid.setting('fixedColumnsStart')).toBe(20);

      // a column inside the drawn band can be unfrozen
      expect(await grid.unfreezeColumn(0)).toBe(true);
      expect(await grid.setting('fixedColumnsStart')).toBe(drawn - 1);

      // nothing is cut any more (the configured count is the drawn one), so a scrolling column can be frozen
      // onto the freeze line, where the user can see it
      expect(await grid.freezeColumn(25)).toBe(true);
      expect(await grid.visualColumnOf(25)).toBe(drawn - 1);
      expect(await grid.setting('fixedColumnsStart')).toBe(drawn);
    });
  });

  test.describe('ManualColumnFreeze before the grid renders again', () => {
    test('freezes two columns in a row, because each freeze counts from the configured band', async() => {
      await grid.goto({ start: 2 });

      // both columns fit next to the two that are frozen, and nothing renders between the two calls
      expect(await grid.freezeColumn(10)).toBe(true);
      expect(await grid.freezeColumn(11)).toBe(true);

      expect(await grid.setting('fixedColumnsStart')).toBe(4);
      expect(await grid.visualColumnOf(10)).toBe(2);
      expect(await grid.visualColumnOf(11)).toBe(3);
    });

    test('refuses a freeze that does not fit, even when the configured band is the most that fits', async() => {
      await grid.goto({ start: 2 });

      const { start: fit } = await grid.expectedCounts({ start: 30 });

      await grid.updateSettings({ fixedColumnsStart: fit });
      await expect.poll(() => grid.drawnCount('start')).toBe(fit);

      // one more frozen column would be cut by the next render, so it must not be moved to the freeze line
      expect(await grid.freezeColumn(25)).toBe(false);
      expect(await grid.visualColumnOf(25)).toBe(25);
      expect(await grid.setting('fixedColumnsStart')).toBe(fit);
    });
  });

  test.describe('the end band as configured', () => {
    test('ManualColumnFreeze and ManualColumnMove keep the configured end band when fewer columns are drawn', async() => {
      // 30 columns, end 10 configured and only a few of them drawn: the band is columns 20 to 29
      await grid.goto({ end: 10 });

      expect((await grid.drawnCounts()).end).toBeLessThan(10);

      expect(await grid.freezeColumn(25)).toBe(false);
      expect(await grid.visualColumnOf(25)).toBe(25);

      // a move from the scrolling columns into the configured band would shift the columns in between into it
      expect(await grid.isColumnMovePossible([5], 22)).toBe(false);
      expect(await grid.isColumnMovePossible([5], 15)).toBe(true);
    });

    test('the guideline of a column move follows the end band the grid draws', async() => {
      await grid.goto({ end: 10 });

      const { end: drawn } = await grid.drawnCounts();

      expect(drawn).toBeGreaterThan(0);
      expect(drawn).toBeLessThan(10);

      // the last drawn end column is in the end clone, so the guideline takes the shift of the clone
      expect(await grid.isInDrawnEndBandForMove(29)).toBe(true);
      expect(await grid.isInDrawnEndBandForMove(30 - drawn)).toBe(true);

      // a column of the configured band that scrolls is in the master, and gets no shift
      expect(await grid.isInDrawnEndBandForMove(30 - drawn - 1)).toBe(false);
      expect(await grid.isInDrawnEndBandForMove(22)).toBe(false);
    });
  });

  test.describe('a hidden track at the inner edge of a band', () => {
    test('does not lower the drawn count when the whole band fits', async() => {
      // column 2 is hidden: columns 0 to 2 take the room of two, so all three are drawn as frozen
      await grid.goto({ start: 3, hidden: 1 });

      expect(await grid.drawnCount('start')).toBe(3);
      expect(await grid.freezeColumn(10)).toBe(true);
    });
  });

  test.describe('a window resize that a listener blocks', () => {
    test('does not render the grid when the frozen counts would move', async() => {
      await grid.goto({ top: 20, win: 1 });
      await grid.blockRefreshDimensions();

      const rendersBefore = await grid.viewRenderCount();
      const topBefore = (await grid.drawnCounts()).top;

      await grid.resizeWindow({ width: 1280, height: 360 });

      // the resize reached the grid, and the listener blocked it
      await expect.poll(() => grid.blockedRefreshCount()).toBeGreaterThan(0);
      await grid.settleFrames();

      expect(await grid.viewRenderCount()).toBe(rendersBefore);
      expect((await grid.drawnCounts()).top).toBe(topBefore);
    });

  });

  test.describe('the resize handle on a freeze line', () => {
    test('is marked on the line that is drawn, not on the configured one', async() => {
      await grid.goto({ start: 10, resize: 1 });

      const { start: drawn } = await grid.drawnCounts();

      expect(drawn).toBeLessThan(10);

      // the header of the last drawn frozen column ends on the freeze line, which the freeze bar sits on
      expect(await grid.resizeHandleFreezeMarks(drawn - 1)).toEqual({ before: true, after: false });

      // the header of the last configured column is a scrolling one: no bar there, so no offset
      await grid.scrollToColumn(9);
      expect(await grid.resizeHandleFreezeMarks(9)).toEqual({ before: false, after: false });
    });
  });

  test.describe('the frozen end overlay', () => {
    test('is removed when no end column is drawn and comes back when the grid grows', async() => {
      await grid.goto({ end: 3 });

      expect((await grid.drawnCounts()).end).toBe(3);
      expect(await grid.renderedCount('end')).toBe(3);

      // the end band does not fit a 150 px grid: nothing is drawn as frozen, and the grid still scrolls
      await grid.resize({ width: 150 });
      await expect.poll(() => grid.drawnCount('end')).toBe(0);
      expect(await grid.renderedCount('end')).toBe(0);

      await grid.resize({ width: 500 });
      await expect.poll(() => grid.drawnCount('end')).toBe(3);
      await expect.poll(() => grid.renderedCount('end')).toBe(3);
    });
  });

  test.describe('what the frozen band holds when the grid cuts it', () => {
    test('the column menu offers Unfreeze for a frozen column, and no Freeze when nothing more fits', async() => {
      await grid.goto({ start: 20, menu: 1 });

      const frozenMenu = await grid.columnMenuItems(0);

      expect(frozenMenu).toContain('Unfreeze column');
      expect(frozenMenu).not.toContain('Freeze column');
    });

    test('the column menu offers neither item for a column that scrolls next to a band that is the most that fits', async() => {
      await grid.goto({ start: 20, menu: 1 });

      const { start: drawn } = await grid.drawnCounts();

      // a column that scrolls is not frozen as far as the user sees, and one more frozen column would not fit
      await grid.scrollToColumn(drawn + 1);

      const scrollingMenu = await grid.columnMenuItems(drawn + 1);

      expect(scrollingMenu).toContain('Insert column left');
      expect(scrollingMenu).not.toContain('Unfreeze column');
      expect(scrollingMenu).not.toContain('Freeze column');
    });

    test('the column menu offers Freeze for a scrolling column when one more frozen column fits', async() => {
      await grid.goto({ start: 2, menu: 1 });

      await grid.scrollToColumn(5);

      expect(await grid.columnMenuItems(5)).toContain('Freeze column');
    });

    test('a collapsible group inside the configured end band gets no toggle, whatever is drawn', async() => {
      // end 10 over 30 columns: the configured band holds columns 20 to 29, and fewer of them are drawn
      await grid.goto({ end: 10, nest: 1 });

      expect((await grid.drawnCounts()).end).toBeLessThan(5);

      // control: a group outside the band has its toggle
      await grid.scrollToColumn(10);
      expect(await grid.hasCollapseButton(10)).toBe(true);

      // the group over columns 24 and 25 lies in the configured band, but outside the drawn one
      await grid.scrollToColumn(24);
      expect(await grid.hasCollapseButton(24)).toBe(false);
    });

    test('PageDown into the cut bottom band keeps the selection reachable', async() => {
      await grid.goto({ bottom: 40 });

      const { bottom: drawn } = await grid.drawnCounts();

      expect(drawn).toBeLessThan(40);

      // row 20 is where the configured bottom band starts (60 rows, 40 configured): the rows from there on scroll
      await grid.selectCell(18, 0);
      await grid.page.keyboard.press('PageDown');
      await grid.page.keyboard.press('PageDown');

      const [row] = await grid.selected();

      // PageDown scrolls to the bottom band only when the selection lands in the band the grid draws
      expect(row).toBeGreaterThanOrEqual(20);
      expect(row).toBeLessThan(60 - drawn);
      await expect.poll(() => grid.isCellUncovered(row, 0)).toBe(true);
    });

    test('a custom border follows the drawn start band, not the configured one', async() => {
      await grid.goto({ start: 20, borders: 1 });
      await grid.scrollToColumn(29);

      // column 10 scrolled out of the master and is not frozen as far as the user sees: its border is not kept
      expect(await grid.customBorderSelectionCount()).toBe(0);
    });
  });

  test.describe('ManualColumnFreeze next to a frozen end band', () => {
    test('does not unfreeze a column that would slide into the end band', async() => {
      // narrow columns, so every configured column is drawn: 30 columns, start 26 and end 8 leave an end band of 4
      await grid.goto({ start: 26, end: 8, colw: 10 });

      expect(await grid.drawnCounts()).toMatchObject({ start: 26, end: 4 });

      // unfreezing a start column would hand it to the end band (5 columns), which the plugin refuses
      expect(await grid.unfreezeColumn(0)).toBe(false);
      expect(await grid.setting('fixedColumnsStart')).toBe(26);
    });
  });

  test.describe('ManualColumnFreeze with a cut start band and an end band', () => {
    test('does not unfreeze when writing the smaller start would widen the end band', async() => {
      // 30 columns, start 28 (4 drawn) and end 5: the end band is 30 - 28 = 2, and a start of 3 would make it 5
      await grid.goto({ start: 28, end: 5 });

      expect((await grid.drawnCounts()).start).toBeLessThan(28);

      expect(await grid.unfreezeColumn(0)).toBe(false);
      expect(await grid.setting('fixedColumnsStart')).toBe(28);
      expect(await grid.setting('fixedColumnsEnd')).toBe(5);
    });
  });

  test.describe('a grid that is not laid out when it is built', () => {
    test('keeps the configured counts while unmeasured, and clamps once it is drawn', async() => {
      await grid.goto({ start: 20, hide: 1 });

      // no size is known yet, so nothing collapses to 0
      expect(await grid.drawnCount('start')).toBe(20);

      await grid.showHiddenGrid();

      await expect.poll(async() => {
        const { width } = await grid.gridSize();
        const band = await grid.bandSize('start');

        return width > 0 && band > 0 && band <= width - 40;
      }).toBe(true);
      expect(await grid.drawnCount('start')).toBeGreaterThan(0);
    });
  });

  test.describe('frozen rows taller than the default height', () => {
    test('are counted at the height they are drawn at, not the default one', async() => {
      await grid.goto({ top: 40, tall: 1 });
      const { height } = await grid.gridSize();

      // the first measure cannot know the height of a row that was never drawn, so the grid measures again
      // after the draw: the band ends up inside the grid and the rest of it stays reachable
      await expect.poll(() => grid.bandSize('top')).toBeLessThanOrEqual(height - 40);

      await grid.selectCell(59, 0);
      await expect.poll(() => grid.isCellUncovered(59, 0)).toBe(true);
    });
  });

  test.describe('drawing again after the first measure', () => {
    test('tall frozen rows loaded after a measure draw once more, and then the heights are known', async() => {
      await grid.goto({ top: 40 });

      const first = await grid.viewRenderCount();

      // the grid measured default-height rows, so the first measure of the new rows is stale: the draw, and one
      // corrective draw, never a third
      await grid.loadTallRows();
      const loaded = await grid.viewRenderCount();

      expect(loaded - first).toBe(2);

      // the heights the last draw measured are reused, so the same content draws once
      await grid.render();
      expect(await grid.viewRenderCount()).toBe(loaded + 1);
    });
  });

  test.describe('the heights of frozen rows that were measured', () => {
    test('are forgotten when the rows are loaded again', async() => {
      await grid.goto({ top: 40 });

      const plain = await grid.drawnCounts();

      await grid.loadTallRows();
      expect((await grid.drawnCounts()).top).toBeLessThan(plain.top);

      // the same index now holds a short row again, so a height kept from the tall one would cut the band
      await grid.loadPlainRows();
      expect(await grid.drawnCounts()).toEqual(plain);
    });
  });

  test.describe('a grid that the window scrolls', () => {
    test('measures again when the window is resized', async() => {
      await grid.goto({ top: 40, win: 1 });

      const tall = (await grid.drawnCounts()).top;

      await grid.resizeWindow({ width: 1280, height: 360 });
      await expect.poll(async() => (await grid.drawnCounts()).top).toBeLessThan(tall);

      await grid.resizeWindow({ width: 1280, height: 720 });
      await expect.poll(async() => (await grid.drawnCounts()).top).toBe(tall);
    });
  });

  test.describe('toggling the option', () => {
    test('turning it off draws the full area, and turning it on clamps again', async() => {
      await grid.goto({ start: 20 });
      const { width } = await grid.gridSize();

      await grid.updateSettings({ limitFixedToViewport: false });
      await expect.poll(() => grid.bandSize('start')).toBeGreaterThanOrEqual(width);

      await grid.updateSettings({ limitFixedToViewport: true });
      await expect.poll(() => grid.bandSize('start')).toBeLessThanOrEqual(width - 40);
    });
  });

  test.describe('a first frozen track wider than the grid', () => {
    test('is not drawn as frozen, and the whole grid stays reachable', async() => {
      await grid.goto({ start: 2, colw: 600 });

      expect(await grid.setting('fixedColumnsStart')).toBe(2);
      expect(await grid.bandSize('start')).toBeLessThan(100);

      await grid.selectCell(0, 3);
      await expect.poll(() => grid.isCellUncovered(0, 3)).toBe(true);
    });
  });

  test.describe('with the freezeBar plugin', () => {
    test('puts the bar on the drawn count, while the plugin reports the configured one', async() => {
      await grid.goto({ start: 20, bar: 1 });

      const { start: drawn } = await grid.drawnCounts();

      expect(drawn).toBeGreaterThan(0);
      expect(drawn).toBeLessThan(20);
      expect(await grid.freezeBarCount('start')).toBe(20);
      expect(await grid.setting('fixedColumnsStart')).toBe(20);
      await expect(grid.separator('start')).toHaveAttribute('aria-valuenow', String(drawn));
    });

    test('puts the bar on the line where the drawn band ends', async() => {
      await grid.goto({ start: 20, bar: 1 });

      const { bar, band } = await grid.startBarAndBandEdge();

      expect(Math.abs(bar - band)).toBeLessThanOrEqual(4);
    });

    test('commits the drawn count when the app asks for it, and reports the configured one as the old count', async() => {
      await grid.goto({ start: 20, bar: 1 });

      const { start: drawn } = await grid.drawnCounts();

      expect(await grid.setFreezeBarCount('start', drawn)).toBe(true);
      expect(await grid.setting('fixedColumnsStart')).toBe(drawn);
      expect(await grid.freezeLog()).toEqual([{ edge: 'start', newCount: drawn, oldCount: 20, source: 'api' }]);
    });

    test('keeps the configured count when a gesture ends where it began', async() => {
      await grid.goto({ start: 20, bar: 1 });

      const { start: drawn } = await grid.drawnCounts();

      // a click that only presses and releases the bar, and End when the band already fills the viewport
      await grid.clickStartBar();
      await grid.pressOnBar('start', 'End');

      expect(await grid.setting('fixedColumnsStart')).toBe(20);
      expect((await grid.drawnCounts()).start).toBe(drawn);
      expect(await grid.freezeLog()).toEqual([]);
    });

    test('keeps the configured count when a grow step cannot fit', async() => {
      await grid.goto({ start: 20, bar: 1 });

      // the drawn band is the most that fits, so one more column cannot show, and it must not read as a shrink
      await grid.pressOnBar('start', 'ArrowRight');

      expect(await grid.setting('fixedColumnsStart')).toBe(20);
      expect(await grid.freezeLog()).toEqual([]);
    });

    test('asks for a count inside a batch after a removal without throwing', async() => {
      await grid.goto({ top: 2, bar: 1 });

      await grid.alterAndSetCountInBatch();

      expect(await grid.setting('fixedRowsTop')).toBe(5);
    });

    test('keeps a configured count the app did not touch', async() => {
      await grid.goto({ start: 20, bar: 1 });

      // asking for the count that is already configured changes nothing, so the columns still come back on resize
      expect(await grid.setFreezeBarCount('start', 20)).toBe(false);
      expect(await grid.setting('fixedColumnsStart')).toBe(20);
      expect(await grid.freezeLog()).toEqual([]);
    });
  });
});
