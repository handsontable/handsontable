import { test, expect, THEMES_TAG } from '../fixtures/test';
import { ColumnSortingPointerCancellationPage } from '../fixtures/pages/ColumnSortingPointerCancellationPage';

/**
 * A header sort is a click, so it completes on the release over the header that was pressed
 * (WCAG 2.5.2 Pointer Cancellation): the press alone changes nothing, and a release over another
 * header, over a body cell, or outside the grid cancels it.
 *
 * The first column holds A5 to A1, so an ascending sort of any column puts A1 first.
 */
test.describe('column sorting pointer cancellation', { tag: THEMES_TAG }, () => {
  let grid: ColumnSortingPointerCancellationPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ColumnSortingPointerCancellationPage(page, theme, bundle);
    await grid.goto();
  });

  test('a press alone does not sort', async() => {
    await grid.pressLabel('B');

    expect(await grid.sortCount()).toBe(0);
    expect(await grid.sortConfig()).toEqual([]);
  });

  test('a release over the pressed header sorts', async() => {
    await grid.pressLabel('B');
    await grid.releaseOver(grid.sortLabel('B'));

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    await expect.poll(() => grid.firstColumn()).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);
  });

  test('a release over another header does not sort', async() => {
    await grid.pressLabel('B');
    await grid.releaseOver(grid.sortLabel('C'));

    expect(await grid.sortCount()).toBe(0);
    expect(await grid.sortConfig()).toEqual([]);
    await expect(grid.cell(0, 0)).toHaveText('A5');
  });

  test('a release over a body cell does not sort', async() => {
    await grid.pressLabel('B');
    await grid.releaseOver(grid.cell(2, 1));

    expect(await grid.sortCount()).toBe(0);
    await expect(grid.cell(0, 0)).toHaveText('A5');
  });

  test('a release outside the grid does not sort', async() => {
    await grid.pressLabel('B');
    await grid.releaseOutsideTheGrid();

    expect(await grid.sortCount()).toBe(0);
    await expect(grid.cell(0, 0)).toHaveText('A5');
  });

  test('a cancelled press does not stop the next click from sorting', async() => {
    await grid.pressLabel('B');
    await grid.releaseOver(grid.cell(2, 1));
    await grid.sortLabel('C').click();

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 2, sortOrder: 'asc' }]);
    expect(await grid.sortCount()).toBe(1);
  });

  test('a plain click toggles the sort order', async() => {
    await grid.sortLabel('B').click();
    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);

    await grid.sortLabel('B').click();
    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'desc' }]);
  });

  test('Enter on a selected header sorts', async() => {
    await grid.sortFromKeyboard(1);

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  test.describe('touch', () => {
    test.use({ hasTouch: true });

    test('a tap on a header sorts', async() => {
      await grid.tapLabel('B');

      await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
    });
  });
});

test.describe('multi-column sorting pointer cancellation', { tag: THEMES_TAG }, () => {
  let grid: ColumnSortingPointerCancellationPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ColumnSortingPointerCancellationPage(page, theme, bundle);
    await grid.goto('multi');
  });

  test('a Ctrl+press released over another header adds no column to the sort', async({ page }) => {
    await grid.sortLabel('B').click();
    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);

    await page.keyboard.down('Control');
    await grid.pressLabel('C');
    await grid.releaseOver(grid.sortLabel('D'));
    await page.keyboard.up('Control');

    expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  test('a Ctrl+press released over the pressed header adds its column to the sort', async({ page }) => {
    await grid.sortLabel('B').click();
    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);

    await page.keyboard.down('Control');
    await grid.pressLabel('C');
    await grid.releaseOver(grid.sortLabel('C'));
    await page.keyboard.up('Control');

    await expect.poll(() => grid.sortConfig()).toEqual([
      { column: 1, sortOrder: 'asc' },
      { column: 2, sortOrder: 'asc' },
    ]);
  });

  test('a press released outside the grid does not sort', async() => {
    await grid.pressLabel('B');
    await grid.releaseOutsideTheGrid();

    expect(await grid.sortCount()).toBe(0);
  });
});

test.describe('nested headers sorting pointer cancellation', { tag: THEMES_TAG }, () => {
  let grid: ColumnSortingPointerCancellationPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new ColumnSortingPointerCancellationPage(page, theme, bundle);
    await grid.goto('nested');
  });

  test('a release over the group header above the pressed header does not sort', async() => {
    await grid.pressLabel('B');
    await grid.releaseOver(grid.header('Group 2'));

    expect(await grid.sortCount()).toBe(0);
  });

  test('a release over the other column of the same group does not sort', async() => {
    // Group 2 spans B and C: both sit under one group header, and still differ as sort targets.
    await grid.pressLabel('B');
    await grid.releaseOver(grid.sortLabel('C'));

    expect(await grid.sortCount()).toBe(0);
  });

  test('a release over the pressed header sorts', async() => {
    await grid.pressLabel('B');
    await grid.releaseOver(grid.sortLabel('B'));

    await expect.poll(() => grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);
  });

  test('a press on a group header does not sort', async() => {
    const point = await grid.centreOf(grid.header('Group 2'));

    await grid.page.mouse.click(point.x, point.y);

    expect(await grid.sortCount()).toBe(0);
  });
});

/**
 * The same cancellation has to hold where the header is not the plain left-to-right one in the
 * light DOM: mirrored by the layout direction, drawn by the overlay clone of the frozen columns, next
 * to those columns while the grid is scrolled sideways, or rendered inside a shadow root, where
 * `event.target` is retargeted to the host. Each case proves first that the grid really has that layout.
 */
const SURFACES = [
  {
    name: 'an RTL grid',
    options: { dir: 'rtl' as const },
    pressed: 'A',
    other: 'B',
    body: [2, 0],
    async precondition(grid: ColumnSortingPointerCancellationPage) {
      expect(await grid.isRtl()).toBe(true);
    },
  },
  {
    name: 'frozen columns',
    options: { frozen: true },
    pressed: 'A',
    other: 'B',
    body: [2, 0],
    async precondition(grid: ColumnSortingPointerCancellationPage) {
      expect(await grid.isInOverlay(grid.header('A'), 'ht_clone_top_inline_start_corner')).toBe(true);
      expect(await grid.isInOverlay(grid.cell(2, 0), 'ht_clone_inline_start')).toBe(true);
    },
  },
  {
    name: 'a scrolled grid next to frozen columns',
    options: { frozen: true, scrolled: true },
    pressed: 'C',
    other: 'D',
    body: [2, 3],
    async precondition(grid: ColumnSortingPointerCancellationPage) {
      expect(await grid.horizontalScroll()).toBeGreaterThan(0);
      expect(await grid.isInOverlay(grid.header('A'), 'ht_clone_top_inline_start_corner')).toBe(true);
      expect(await grid.isInOverlay(grid.header('C'), 'ht_clone_top')).toBe(true);
    },
  },
  {
    name: 'a grid inside a shadow root',
    options: { shadow: true },
    pressed: 'B',
    other: 'C',
    body: [2, 1],
    async precondition(grid: ColumnSortingPointerCancellationPage) {
      expect(await grid.isInShadowRoot()).toBe(true);
    },
  },
];

for (const surface of SURFACES) {
  test.describe(`column sorting pointer cancellation in ${surface.name}`, { tag: THEMES_TAG }, () => {
    let grid: ColumnSortingPointerCancellationPage;

    test.beforeEach(async({ page, theme, bundle }) => {
      grid = new ColumnSortingPointerCancellationPage(page, theme, bundle);
      await grid.goto('column', surface.options);
      await surface.precondition(grid);
    });

    test('a release over the pressed header sorts', async() => {
      await grid.pressLabel(surface.pressed);
      await grid.releaseOver(grid.sortLabel(surface.pressed));

      await expect.poll(() => grid.sortCount()).toBe(1);
    });

    test('a release over another header does not sort', async() => {
      await grid.pressLabel(surface.pressed);
      await grid.releaseOver(grid.sortLabel(surface.other));

      expect(await grid.sortCount()).toBe(0);
    });

    test('a release over a body cell does not sort', async() => {
      await grid.pressLabel(surface.pressed);
      await grid.releaseOver(grid.cell(surface.body[0], surface.body[1]));

      expect(await grid.sortCount()).toBe(0);
    });

    test('a release outside the grid does not sort', async() => {
      await grid.pressLabel(surface.pressed);
      await grid.releaseOutsideTheGrid();

      expect(await grid.sortCount()).toBe(0);
    });
  });
}
