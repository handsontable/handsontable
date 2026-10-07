import { test, expect } from '../fixtures/test';
import { FreezeBarPage } from '../fixtures/pages/FreezeBarPage';

/**
 * The freezeBar plugin: a bar on the freeze line that changes the frozen rows and columns by dragging or with
 * the keyboard. The grid starts with 2 frozen columns and 2 frozen top rows.
 */
test.describe('freezeBar', () => {
  let grid: FreezeBarPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new FreezeBarPage(page, theme, bundle);
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test.describe('dragging', () => {
    test('the column bar freezes more columns without reordering them', async() => {
      await grid.goto();
      const order = await grid.columnOrder();

      await grid.drag('start', 4);

      expect(await grid.count('start')).toBe(4);
      expect(await grid.columnOrder()).toEqual(order);
      expect(await grid.log()).toEqual([{ edge: 'start', newCount: 4, oldCount: 2, source: 'drag' }]);
    });

    test('the row bar freezes more rows', async() => {
      await grid.goto();
      await grid.drag('top', 3);

      expect(await grid.count('top')).toBe(3);
    });

    test('dragging the bar back freezes fewer columns', async() => {
      await grid.goto();
      await grid.drag('start', 1);

      expect(await grid.count('start')).toBe(1);
    });

    test('the handle of an empty edge starts the freezing', async() => {
      await grid.goto({ cols: 0, rows: 0 });
      await expect(grid.bar('start')).toBeVisible();
      await grid.drag('start', 3);

      expect(await grid.count('start')).toBe(3);
    });

    test('the bottom bar freezes the last rows', async() => {
      await grid.goto({ bottom: 1 });
      await grid.drag('bottom', 3);

      expect(await grid.count('bottom')).toBe(3);
      expect(await grid.log()).toEqual([{ edge: 'bottom', newCount: 3, oldCount: 1, source: 'drag' }]);
    });

    test('the end bar freezes the last columns', async() => {
      await grid.goto({ end: 1 });
      await grid.drag('end', 3);

      expect(await grid.count('end')).toBe(3);
    });

    test('the handle of an empty end edge starts the freezing', async() => {
      await grid.goto();
      await expect(grid.bar('end')).toBeVisible();
      await grid.drag('end', 2);

      expect(await grid.count('end')).toBe(2);
    });

    test('the end bar follows the right to left layout', async() => {
      await grid.goto({ rtl: 1, end: 1 });
      await grid.drag('end', 3);

      expect(await grid.count('end')).toBe(3);
    });

    test('a drag stores nothing until the pointer is released', async() => {
      await grid.goto();
      await grid.dragTo('start', 5);

      expect(await grid.count('start')).toBe(2);
      await expect(grid.page.locator('.ht-freeze-bar-guide')).toBeVisible();

      await grid.release();

      expect(await grid.count('start')).toBe(5);
      await expect(grid.page.locator('.ht-freeze-bar-guide')).toHaveCount(0);
    });

    test('Escape cancels the drag and stores nothing', async() => {
      await grid.goto();
      await grid.dragTo('start', 5);
      await grid.page.keyboard.press('Escape');
      await grid.release();

      expect(await grid.count('start')).toBe(2);
      expect(await grid.log()).toEqual([]);
      await expect(grid.page.locator('.ht-freeze-bar-guide')).toHaveCount(0);
    });

    test('a count too large for the viewport is clamped', async() => {
      await grid.goto();
      await grid.dragByPixels('start', 5000);

      const count = await grid.count('start');

      expect(count).toBeGreaterThan(2);
      expect(count).toBeLessThan(14);
    });
  });

  test.describe('hooks', () => {
    test('returning false from beforeFreezeChange leaves the grid unchanged and fires no afterFreezeChange', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        window.hot.addHook('beforeFreezeChange', () => false);
      });
      await grid.drag('start', 4);

      expect(await grid.count('start')).toBe(2);
      expect(await grid.log()).toEqual([]);
      await expect(grid.page.locator('.ht-freeze-bar-guide')).toHaveCount(0);
    });
  });

  test.describe('keyboard', () => {
    test('exposes a separator that reports the count', async() => {
      await grid.goto();

      const bar = grid.bar('start');

      await expect(bar).toHaveAttribute('role', 'separator');
      await expect(bar).toHaveAttribute('aria-orientation', 'vertical');
      await expect(bar).toHaveAttribute('aria-valuenow', '2');
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(grid.bar('top')).toHaveAttribute('aria-orientation', 'horizontal');
    });

    test('the arrow keys change the count by one and Home sets 0', async() => {
      await grid.goto();
      await grid.bar('start').focus();
      await grid.page.keyboard.press('ArrowRight');

      expect(await grid.count('start')).toBe(3);
      await expect(grid.bar('start')).toHaveAttribute('aria-valuenow', '3');

      await grid.bar('start').focus();
      await grid.page.keyboard.press('ArrowLeft');
      await grid.page.keyboard.press('ArrowLeft');

      expect(await grid.count('start')).toBe(1);

      await grid.page.keyboard.press('Home');

      expect(await grid.count('start')).toBe(0);
      expect((await grid.log()).map(entry => entry.source)).toEqual(['keyboard', 'keyboard', 'keyboard', 'keyboard']);
    });
  });

  test.describe('layout direction', () => {
    test('the column bar follows the right to left layout', async() => {
      await grid.goto({ rtl: 1 });
      await grid.drag('start', 4);

      expect(await grid.count('start')).toBe(4);
    });
  });

  test.describe('configuration', () => {
    test('a grid configured with the legacy fixedColumnsLeft option changes the count without throwing', async() => {
      await grid.goto({ legacy: 1 });
      await grid.drag('start', 3);

      expect(await grid.count('start')).toBe(3);
    });

    test('a wrapper that re-sends the original option does not revert the change', async() => {
      await grid.goto();
      await grid.drag('start', 4);
      await grid.page.evaluate(() => {
        window.hot.updateSettings({ fixedColumnsStart: 2 });
      });

      expect(await grid.count('start')).toBe(4);
    });

    test('with hidden tracks the stored count matches the visual indexes', async() => {
      await grid.goto({ hidden: 1 });
      await grid.drag('start', 4);

      expect(await grid.count('start')).toBe(4);
    });

    test('one undo reverts the whole drag', async() => {
      await grid.goto({ undo: 1 });
      await grid.drag('start', 4);
      await grid.page.evaluate(() => {
        window.hot.getPlugin('undoRedo').undo();
      });

      expect(await grid.count('start')).toBe(2);
    });
  });

  test.describe('window scroll', () => {
    test('the row bar stays on the freeze line while the page scrolls, and still drags', async() => {
      await grid.goto({ win: 1 });
      await grid.page.evaluate(() => window.scrollTo(0, 400));
      await expect.poll(() => grid.page.evaluate(() => window.scrollY)).toBeGreaterThan(300);

      const lineBottom = async() => grid.page.evaluate(() => {
        const clone = document.querySelector('.ht_clone_top') as HTMLElement;

        return Math.round(clone.getBoundingClientRect().bottom);
      });
      const bar = (await grid.bar('top').boundingBox())!;

      expect(Math.round(bar.y + bar.height)).toBe(await lineBottom());

      await grid.drag('top', 4);

      expect(await grid.count('top')).toBe(4);
    });
  });

  test.describe('pagination', () => {
    test('the row bars are not shown and the column bars keep working', async() => {
      await grid.goto({ rows: 0, pagination: 1 });

      await expect(grid.bar('top')).toHaveCount(0);
      await expect(grid.bar('bottom')).toHaveCount(0);
      await expect(grid.bar('start')).toBeVisible();

      await grid.drag('start', 3);

      expect(await grid.count('start')).toBe(3);
      expect(await grid.page.evaluate(() => window.hot.getPlugin('pagination').enabled)).toBe(true);
    });

    test('the API does not freeze rows next to Pagination', async() => {
      await grid.goto({ rows: 0, pagination: 1 });

      expect(await grid.page.evaluate(() => window.hot.getPlugin('freezeBar').setFreezeCount('top', 2))).toBe(false);
      expect(await grid.count('top')).toBe(0);
    });
  });

  test.describe('teardown', () => {
    test('updateSettings({ freezeBar: false }) removes every bar', async() => {
      await grid.goto();
      await expect(grid.bar('start')).toBeVisible();
      await grid.page.evaluate(() => {
        window.hot.updateSettings({ freezeBar: false });
      });

      await expect(grid.allBars).toHaveCount(0);
    });

    test('destroy() removes every bar', async() => {
      await grid.goto();
      await grid.page.evaluate(() => {
        window.hot.destroy();
      });

      await expect(grid.allBars).toHaveCount(0);
    });

    test('a grid without the option has no bar at all', async() => {
      await grid.goto({ bar: 0 });

      await expect(grid.allBars).toHaveCount(0);
    });
  });
});
