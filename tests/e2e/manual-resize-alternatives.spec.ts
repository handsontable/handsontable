import { test, expect, THEMES_TAG } from '../fixtures/test';
import { ManualResizeUndoPage } from '../fixtures/pages/ManualResizeUndoPage';

/**
 * Resizing a column or a row without dragging. The keyboard path is a resize mode (`Ctrl`/`Cmd`+`Alt`+`R`, the arrow
 * keys, `Enter`, `Escape`) and the single-pointer path is "click the handle, then click where the edge goes".
 */
test.describe('manual resize without a drag', { tag: THEMES_TAG }, () => {
  let grid: ManualResizeUndoPage;

  const politeText = () => grid.page.locator('[role="status"][aria-live="polite"]');
  const colWidth = (col: number) => grid.page.evaluate(i => (window as any).grid.getColWidth(i), col);
  // the rendered height of the row, read from its row header in the same evaluation that finds it
  const rowHeight = (row: number) => grid.page.evaluate(
    i => Math.round(
      document.querySelectorAll('[data-testid="grid"] .ht_clone_inline_start tbody tr')[i].getBoundingClientRect().height
    ),
    row,
  );
  const dataCell = (row: number, col: number) => grid.grid.locator('.ht_master tbody tr').nth(row).locator('td').nth(col);

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ManualResizeUndoPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('keyboard', () => {
    test('arrow keys change the width of the column of the selected cell, and Enter stores it in one undo step', async () => {
      const start = await colWidth(2);

      await dataCell(1, 2).click();
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');

      await expect(politeText()).toContainText('Resizing the column');

      await grid.page.keyboard.press('ArrowRight');
      await grid.page.keyboard.press('ArrowRight');
      await grid.page.keyboard.press('ArrowRight');

      await expect(politeText()).toHaveText(`Width: ${start + 30} pixels`);
      // nothing is stored before Enter
      expect(await colWidth(2)).toBe(start);

      await grid.page.keyboard.press('Enter');

      expect(await colWidth(2)).toBe(start + 30);

      await grid.page.keyboard.press('ControlOrMeta+z');

      expect(await colWidth(2)).toBe(start);
    });

    test('Shift with an arrow key changes the width by one pixel, and the opposite arrow shrinks it', async () => {
      const start = await colWidth(3);

      await dataCell(0, 3).click();
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');
      await grid.page.keyboard.press('Shift+ArrowRight');
      await grid.page.keyboard.press('Shift+ArrowRight');
      await grid.page.keyboard.press('ArrowRight');
      await grid.page.keyboard.press('Shift+ArrowLeft');
      await grid.page.keyboard.press('Enter');

      expect(await colWidth(3)).toBe(start + 11);
    });

    test('Escape leaves the width as it was and announces the cancel', async () => {
      const start = await colWidth(1);

      await dataCell(0, 1).click();
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');
      await grid.page.keyboard.press('ArrowRight');
      await grid.page.keyboard.press('Escape');

      await expect(politeText()).toHaveText('Canceled.');
      expect(await colWidth(1)).toBe(start);
      // the arrow keys move the selection again
      await grid.page.keyboard.press('ArrowRight');
      expect(await grid.page.evaluate(() => (window as any).grid.getSelectedLast())).toEqual([0, 2, 0, 2]);
    });

    test('the width stops at the minimum', async () => {
      await dataCell(0, 1).click();
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');

      for (let i = 0; i < 40; i++) {
        await grid.page.keyboard.press('ArrowLeft');
      }

      await grid.page.keyboard.press('Enter');

      const width = await colWidth(1);

      expect(width).toBeGreaterThan(0);
      expect(width).toBeLessThan(40);
    });

    test('beforeColumnResize returning false keeps the width, and the hooks run once per stored width', async () => {
      const start = await colWidth(2);

      await grid.page.evaluate(() => {
        const hot = (window as any).grid;

        (window as any).resizeLog = [];
        hot.addHook('beforeColumnResize', (size: number, col: number, isDoubleClick: boolean) => {
          (window as any).resizeLog.push(['before', size, col, isDoubleClick]);

          return size > 200 ? false : size;
        });
        hot.addHook('afterColumnResize', (size: number, col: number, isDoubleClick: boolean) => {
          (window as any).resizeLog.push(['after', size, col, isDoubleClick]);
        });
      });

      await dataCell(0, 2).click();
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');
      await grid.page.keyboard.press('ArrowRight');
      await grid.page.keyboard.press('Enter');

      expect(await grid.page.evaluate(() => (window as any).resizeLog)).toEqual([
        ['before', start + 10, 2, false],
        ['after', start + 10, 2, false],
      ]);

      await grid.page.keyboard.press('ControlOrMeta+Alt+r');

      for (let i = 0; i < 20; i++) {
        await grid.page.keyboard.press('ArrowRight');
      }

      await grid.page.keyboard.press('Enter');

      expect(await colWidth(2)).toBe(start + 10);
    });

    test('a selected column header resizes every selected column', async () => {
      const start = await colWidth(1);

      await grid.columnHeader(1).click();
      await grid.columnHeader(2).click({ modifiers: ['Shift'] });
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');
      await grid.page.keyboard.press('ArrowRight');
      await grid.page.keyboard.press('Enter');

      expect(await colWidth(1)).toBe(start + 10);
      expect(await colWidth(2)).toBe(start + 10);
    });

    test('the row of a selected row header grows with the arrow keys', async () => {
      const start = await rowHeight(2);

      await grid.rowHeader(2).click();
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');

      await expect(politeText()).toContainText('Resizing the row');

      await grid.page.keyboard.press('ArrowDown');
      await grid.page.keyboard.press('ArrowDown');

      await expect(politeText()).toHaveText(`Height: ${start + 20} pixels`);

      await grid.page.keyboard.press('Enter');

      expect(await rowHeight(2)).toBe(start + 20);

      await grid.page.keyboard.press('ControlOrMeta+z');

      expect(await rowHeight(2)).toBe(start);
    });

    test('a key the resize does not use ends it and stores nothing', async () => {
      const start = await colWidth(1);
      const startHeight = await rowHeight(1);

      await dataCell(1, 1).click();
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');
      await grid.page.keyboard.press('ArrowRight');
      await grid.page.keyboard.press('ArrowDown');

      // the column resize owns the horizontal arrows only, so the vertical one moved the selection
      expect(await grid.page.evaluate(() => (window as any).grid.getSelectedLast())).toEqual([2, 1, 2, 1]);
      expect(await colWidth(1)).toBe(start);
      expect(await rowHeight(1)).toBe(startHeight);
    });
  });

  test.describe('ending a waiting resize', () => {
    test('a key the grid uses, like Delete, ends the keyboard resize before it acts', async () => {
      const start = await colWidth(2);

      await dataCell(1, 2).click();
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');
      await grid.page.keyboard.press('ArrowRight');
      await grid.page.keyboard.press('Delete');
      await grid.page.keyboard.press('ArrowRight');

      // the second arrow key moved the selection, so the mode was over, and nothing was stored
      expect(await grid.page.evaluate(() => (window as any).grid.getSelectedLast())).toEqual([1, 3, 1, 3]);
      expect(await colWidth(2)).toBe(start);
      await expect(grid.page.locator('.manualColumnResizerGuide.active')).toHaveCount(0);
    });

    test('loading new data ends a waiting pick, so the next click resizes nothing', async () => {
      const start = await colWidth(2);

      await grid.hoverColumnHeader(2);
      await grid.columnHandle.click();
      await expect(grid.columnHandle).toHaveClass(/ht-resize-handle--armed/);

      await grid.page.evaluate(() => {
        const hot = (window as any).grid;

        hot.loadData(hot.getData().map((row: unknown[]) => row.slice()));
      });
      await dataCell(4, 0).click();

      expect(await colWidth(2)).toBe(start);
    });

    test('a settings update keeps a waiting pick, which is what a wrapper re-render sends', async () => {
      await grid.hoverColumnHeader(2);
      const header = await grid.columnHeader(2).boundingBox();

      await grid.columnHandle.click();
      await expect(grid.columnHandle).toHaveClass(/ht-resize-handle--armed/);
      await grid.page.evaluate(() => (window as any).grid.updateSettings({ manualColumnResize: true }));

      const row = await dataCell(4, 0).boundingBox();

      await grid.page.mouse.click(header!.x + 140, row!.y + 5);

      expect(Math.abs((await colWidth(2)) - 140)).toBeLessThanOrEqual(2);
    });

    test('a press on the handle ends a keyboard resize', async () => {
      const start = await colWidth(2);

      await dataCell(1, 2).click();
      await grid.page.keyboard.press('ControlOrMeta+Alt+r');
      await grid.page.keyboard.press('ArrowRight');
      await grid.hoverColumnHeader(2);
      await grid.columnHandle.click();
      await grid.page.keyboard.press('Escape');

      expect(await colWidth(2)).toBe(start);
    });
  });

  test.describe('click, then click', () => {
    test('a click on the column handle, then a click on the grid, sets the width to that point', async () => {
      const start = await colWidth(2);
      const header = await grid.columnHeader(2).boundingBox();

      await grid.hoverColumnHeader(2);
      await grid.columnHandle.click();

      await expect(grid.columnHandle).toHaveClass(/ht-resize-handle--armed/);
      await expect(politeText()).toHaveText('Click or tap the target to finish. Press Escape to cancel.');

      const row = await dataCell(4, 0).boundingBox();

      // the width is the distance from the start of the header to the click
      await grid.page.mouse.click(header!.x + 150, row!.y + 5);

      expect(await colWidth(2)).toBeGreaterThan(start + 40);
      expect(Math.abs((await colWidth(2)) - 150)).toBeLessThanOrEqual(2);
      await expect(grid.columnHandle).not.toHaveClass(/ht-resize-handle--armed/);

      await grid.page.keyboard.press('ControlOrMeta+z');

      expect(await colWidth(2)).toBe(start);
    });

    test('a click on the row handle, then a click on the grid, sets the height to that point', async () => {
      const start = await rowHeight(2);
      const header = await grid.rowHeader(2).boundingBox();

      await grid.hoverRowHeader(2);
      await grid.rowHandle.click();

      await expect(grid.rowHandle).toHaveClass(/ht-resize-handle--armed/);

      const cell = await dataCell(4, 3).boundingBox();

      await grid.page.mouse.click(cell!.x + 20, header!.y + 90);

      expect(Math.abs((await rowHeight(2)) - 90)).toBeLessThanOrEqual(2);
      expect(await rowHeight(2)).toBeGreaterThan(start);
    });

    test('the pick does not select the cell it lands on', async () => {
      await dataCell(0, 0).click();
      await grid.hoverColumnHeader(2);
      await grid.columnHandle.click();

      const cell = await dataCell(5, 5).boundingBox();

      await grid.page.mouse.click(cell!.x + 5, cell!.y + 5);

      expect(await grid.page.evaluate(() => (window as any).grid.getSelectedLast())).toEqual([0, 0, 0, 0]);
    });

    test('Escape ends the pick and changes nothing', async () => {
      const start = await colWidth(2);

      await grid.hoverColumnHeader(2);
      await grid.columnHandle.click();
      await expect(grid.columnHandle).toHaveClass(/ht-resize-handle--armed/);

      await grid.page.keyboard.press('Escape');

      await expect(grid.columnHandle).not.toHaveClass(/ht-resize-handle--armed/);
      await expect(politeText()).toHaveText('Canceled.');

      const cell = await dataCell(5, 5).boundingBox();

      await grid.page.mouse.click(cell!.x + 5, cell!.y + 5);

      expect(await colWidth(2)).toBe(start);
    });

    test('a second press on the handle ends the pick', async () => {
      await grid.hoverColumnHeader(2);
      await grid.columnHandle.click();
      await expect(grid.columnHandle).toHaveClass(/ht-resize-handle--armed/);

      await grid.columnHandle.click();

      await expect(grid.columnHandle).not.toHaveClass(/ht-resize-handle--armed/);
    });

    test('a double-click on the handle still fits the column and arms no pick', async () => {
      await grid.page.evaluate(() => {
        const hot = (window as any).grid;

        hot.setDataAtCell(0, 2, 'a much longer value than the others');
        hot.getPlugin('manualColumnResize').setManualSize(2, 60);
      });
      const start = await colWidth(2);

      expect(start).toBe(60);

      await grid.hoverColumnHeader(2);
      await grid.columnHandle.dblclick();

      await expect.poll(() => colWidth(2)).toBeGreaterThan(start);
      await expect(grid.columnHandle).not.toHaveClass(/ht-resize-handle--armed/);
    });

    test('a drag of the handle still resizes and arms no pick', async () => {
      const start = await colWidth(2);

      await grid.dragColumnHandle(2, 40);

      expect(await colWidth(2)).toBe(start + 40);
      await expect(grid.columnHandle).not.toHaveClass(/ht-resize-handle--armed/);
    });
  });
});
