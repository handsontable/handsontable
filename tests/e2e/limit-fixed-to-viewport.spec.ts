import { test, expect } from '../fixtures/test';
import { LimitFixedToViewportPage } from '../fixtures/pages/LimitFixedToViewportPage';

/**
 * The `limitFixedToViewport` option: a frozen area bigger than the grid is drawn at the size that fits and leaves a
 * scrollable strip, instead of covering the whole grid. The fixture is a 500 x 300 grid of 100px columns.
 */
test.describe('limitFixedToViewport', () => {
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
      expect((await grid.drawnCounts()).start).toBeGreaterThan(0);
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('start')).toBeLessThanOrEqual(width - 40);
      expect(await grid.setting('fixedColumnsStart')).toBe(20);

      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });

    test('frozen end columns leave a strip, and the first scrollable column is reachable', async() => {
      await grid.goto({ end: 20 });

      expect(await grid.drawnCounts()).toEqual(await grid.expectedCounts({ end: 20 }));
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
      expect((await grid.drawnCounts()).top).toBeGreaterThan(0);
      const { height } = await grid.gridSize();

      expect(await grid.bandSize('top')).toBeLessThanOrEqual(height - 40);
      expect(await grid.setting('fixedRowsTop')).toBe(40);

      await grid.selectCell(59, 0);
      await expect.poll(() => grid.isCellUncovered(59, 0)).toBe(true);
    });

    test('frozen bottom rows leave a strip, and the first scrollable row is reachable', async() => {
      await grid.goto({ bottom: 40 });

      expect(await grid.drawnCounts()).toEqual(await grid.expectedCounts({ bottom: 40 }));
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

      // a column inside the drawn band can be unfrozen
      expect(await grid.unfreezeColumn(0)).toBe(true);
      expect(await grid.setting('fixedColumnsStart')).toBe(drawn - 1);

      // freezing a scrolling column puts it on the drawn freeze line, where the user can see it
      await grid.freezeColumn(25);
      expect(await grid.visualColumnOf(25)).toBe(drawn - 1);
      expect(await grid.setting('fixedColumnsStart')).toBe(drawn);
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

  test.describe('the option turned off', () => {
    test('keeps drawing the frozen area in full', async() => {
      await grid.goto({ start: 20, limit: 0 });
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('start')).toBeGreaterThanOrEqual(width);
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
      await expect(grid.barValue('start')).toHaveAttribute('aria-valuenow', String(drawn));
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

    test('keeps a configured count the app did not touch', async() => {
      await grid.goto({ start: 20, bar: 1 });

      // asking for the count that is already configured changes nothing, so the columns still come back on resize
      expect(await grid.setFreezeBarCount('start', 20)).toBe(false);
      expect(await grid.setting('fixedColumnsStart')).toBe(20);
      expect(await grid.freezeLog()).toEqual([]);
    });
  });
});
