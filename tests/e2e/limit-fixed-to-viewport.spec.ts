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
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('start')).toBeLessThan(width - 40);
      expect(await grid.setting('fixedColumnsStart')).toBe(20);

      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });

    test('frozen end columns leave a strip, and the first scrollable column is reachable', async() => {
      await grid.goto({ end: 20 });
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('end')).toBeLessThan(width - 40);
      expect(await grid.setting('fixedColumnsEnd')).toBe(20);

      await grid.selectCell(0, 5);
      await expect.poll(() => grid.isCellUncovered(0, 5)).toBe(true);
    });

    test('frozen top rows leave a strip, and the last row is reachable', async() => {
      await grid.goto({ top: 40 });
      const { height } = await grid.gridSize();

      expect(await grid.bandSize('top')).toBeLessThan(height - 40);
      expect(await grid.setting('fixedRowsTop')).toBe(40);

      await grid.selectCell(59, 0);
      await expect.poll(() => grid.isCellUncovered(59, 0)).toBe(true);
    });

    test('frozen bottom rows leave a strip, and the first scrollable row is reachable', async() => {
      await grid.goto({ bottom: 40 });
      const { height } = await grid.gridSize();

      expect(await grid.bandSize('bottom')).toBeLessThan(height - 40);
      expect(await grid.setting('fixedRowsBottom')).toBe(40);

      await grid.selectCell(5, 0);
      await expect.poll(() => grid.isCellUncovered(5, 0)).toBe(true);
    });

    test('the start band has priority over the end band', async() => {
      await grid.goto({ start: 20, end: 20 });
      const { width } = await grid.gridSize();
      const used = (await grid.bandSize('start')) + (await grid.bandSize('end'));

      expect(used).toBeLessThan(width - 40);
      expect(await grid.bandSize('start')).toBeGreaterThan(0);
    });
  });

  test.describe('the frozen area that fits', () => {
    test('is drawn in full', async() => {
      await grid.goto({ start: 2, top: 2 });

      // 2 columns of 100px, and 2 rows, plus the row header
      expect(await grid.bandSize('start')).toBeGreaterThanOrEqual(200);
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

      expect(await grid.bandSize('start')).toBeLessThan(width - 40);

      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });

    test('works in RTL', async() => {
      await grid.goto({ start: 20, rtl: 1 });
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('start')).toBeLessThan(width - 40);

      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });

    test('works when the window scrolls the rows', async() => {
      await grid.goto({ start: 20, win: 1 });
      const { width } = await grid.gridSize();

      expect(await grid.bandSize('start')).toBeLessThan(width - 40);

      await grid.selectCell(0, 29);
      await expect.poll(() => grid.isCellUncovered(0, 29)).toBe(true);
    });
  });

  test.describe('toggling the option', () => {
    test('turning it off draws the full area, and turning it on clamps again', async() => {
      await grid.goto({ start: 20 });
      const { width } = await grid.gridSize();

      await grid.updateSettings({ limitFixedToViewport: false });
      await expect.poll(() => grid.bandSize('start')).toBeGreaterThanOrEqual(width);

      await grid.updateSettings({ limitFixedToViewport: true });
      await expect.poll(() => grid.bandSize('start')).toBeLessThan(width - 40);
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
    test('reports the drawn count, not the configured one', async() => {
      await grid.goto({ start: 20, bar: 1 });

      const drawn = await grid.page.evaluate(() => window.hot.getPlugin('freezeBar').getFreezeCount('start'));

      expect(drawn).toBeGreaterThan(0);
      expect(drawn).toBeLessThan(20);
      expect(await grid.setting('fixedColumnsStart')).toBe(20);
      await expect(grid.page.locator('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)'))
        .toHaveAttribute('aria-valuenow', String(drawn));
    });

    test('puts the bar on the line where the drawn band ends', async() => {
      await grid.goto({ start: 20, bar: 1 });

      const { bar, band } = await grid.page.evaluate(() => {
        const root = window.hot.rootElement;
        const barRect = root.querySelector('.ht-freeze-bar--start:not(.ht-freeze-bar--segment)')!
          .getBoundingClientRect();
        const bandRect = root.querySelector('.ht_clone_inline_start')!.getBoundingClientRect();

        return { bar: barRect.left + barRect.width / 2, band: bandRect.right };
      });

      expect(Math.abs(bar - band)).toBeLessThanOrEqual(4);
    });

    test('changes the count from the drawn one', async() => {
      await grid.goto({ start: 20, bar: 1 });

      const drawn = await grid.page.evaluate(() => window.hot.getPlugin('freezeBar').getFreezeCount('start'));
      const sameAsDrawn = await grid.page.evaluate(count => window.hot.getPlugin('freezeBar').setFreezeCount('start', count), drawn);
      const fewer = await grid.page.evaluate(count => window.hot.getPlugin('freezeBar').setFreezeCount('start', count), drawn - 1);

      // asking for what is already drawn changes nothing, whatever was configured
      expect(sameAsDrawn).toBe(false);
      expect(fewer).toBe(true);
      expect(await grid.setting('fixedColumnsStart')).toBe(drawn - 1);
    });
  });
});
