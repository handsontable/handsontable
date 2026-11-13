import { test, expect, THEMES_TAG } from '../fixtures/test';
import { BottomSlotSizingPage } from '../fixtures/pages/BottomSlotSizingPage';

/**
 * A paginated grid whose height is free (unset or `'auto'`) used to collapse to its column headers
 * when a filter removed every row, so the pager sat directly under the headers. Pagination now
 * reserves body space in that state, as `emptyDataState` does, and defers to that plugin when it is on.
 *
 * Every number is read from DOM rects: the gap is the pager's top minus the header row's bottom.
 */
const RESERVED_BODY_PX = 150;
const PLACEHOLDER = '.ht-pagination-placeholder, .ht-empty-data-state-placeholder';

// A shrink-to-fit host with no CSS height: the grid's own height decides how tall the root is. The
// `auto-height` variant fixes the grid's CSS box at 400px, so the pager sits at the bottom of it and
// the gap never collapses there.
const FREE_HOST = 'inline-block-host';

test.describe('pagination with every row filtered out', { tag: THEMES_TAG }, () => {
  let grid: BottomSlotSizingPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new BottomSlotSizingPage(page, theme, bundle);
  });

  /**
   * Filters out every row through the Filters plugin.
   */
  async function filterEverything() {
    await grid.page.evaluate(() => {
      const filters = window.hot.getPlugin('filters');

      filters.addCondition(0, 'eq', ['no row has this value']);
      filters.filter();
    });
    await expect.poll(() => grid.page.evaluate(() => window.hot.countRows())).toBe(0);
  }

  /**
   * Clears the filter and waits for the rows to come back.
   */
  async function clearFilter() {
    await grid.page.evaluate(() => {
      const filters = window.hot.getPlugin('filters');

      filters.clearConditions();
      filters.filter();
    });
    await expect.poll(() => grid.page.evaluate(() => window.hot.countRows())).toBeGreaterThan(0);
  }

  /**
   * The distance between the bottom of the column header row and the top of the pager.
   */
  async function gapUnderHeaders() {
    return grid.page.evaluate(() => {
      const headers = document.querySelector('.ht_clone_top')!.getBoundingClientRect();
      const pager = document.querySelector('.ht-slot-bottom .ht-pagination')!.getBoundingClientRect();

      return pager.top - headers.bottom;
    });
  }

  test('keeps a gap between the headers and the pager with `height: "auto"`', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.rebuild({ filters: true, height: 'auto' });
    await filterEverything();

    await expect.poll(gapUnderHeaders).toBeGreaterThanOrEqual(RESERVED_BODY_PX);
    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(1);
  });

  test('keeps the gap when the height option is left out', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.rebuild({ filters: true });
    await filterEverything();

    await expect.poll(gapUnderHeaders).toBeGreaterThanOrEqual(RESERVED_BODY_PX);
  });

  test('takes the space back when the filter is cleared', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.rebuild({ filters: true, height: 'auto' });

    const heightWithRows = (await grid.geometry()).root.height;

    await filterEverything();
    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(1);
    await clearFilter();

    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(0);
    await expect.poll(async() => (await grid.geometry()).root.height).toBe(heightWithRows);
  });

  test('reserves the space once when `emptyDataState` is on', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.rebuild({ filters: true, height: 'auto', emptyDataState: true });
    await filterEverything();

    await expect(grid.page.locator(PLACEHOLDER)).toHaveCount(1);
    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(0);
    await expect.poll(gapUnderHeaders).toBeGreaterThanOrEqual(RESERVED_BODY_PX);
    await expect.poll(gapUnderHeaders).toBeLessThan(RESERVED_BODY_PX + 5);
  });

  test('adds nothing to a grid with a fixed `height`', async () => {
    await grid.goto('explicit-height', 'pagination');
    await grid.rebuild({ filters: true });

    const heightWithRows = (await grid.geometry()).root.height;

    await filterEverything();

    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(0);
    expect((await grid.geometry()).root.height).toBe(heightWithRows);
  });

  test('adds nothing inside a sized scroll parent with no `height` option', async () => {
    await grid.goto('scrollable-ancestor', 'pagination');
    await grid.rebuild({ filters: true });
    await filterEverything();

    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(0);
  });

  test('keeps the gap when `maxRows: 0` draws nothing although the index mapper still has rows', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.page.evaluate(() => {
      window.initSlotGrid(undefined, undefined, { height: 'auto', maxRows: 0 });
    });
    await expect(grid.page.locator('.ht-slot-bottom .ht-pagination')).toBeVisible();

    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(1);
    await expect.poll(gapUnderHeaders).toBeGreaterThanOrEqual(RESERVED_BODY_PX);
  });

  test('adds nothing when the pager sits in a custom `uiContainer`', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.page.evaluate(() => {
      const host = document.createElement('div');

      document.body.appendChild(host);
      window.initSlotGrid(undefined, undefined, {
        filters: true,
        height: 'auto',
        pagination: { pageSize: 25, uiContainer: host },
      });
    });
    await expect(grid.cell(1, 1)).toBeVisible();
    await filterEverything();

    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(0);
  });

  test('adds nothing while every section of the pager is hidden', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.rebuild({
      filters: true,
      height: 'auto',
      pagination: { pageSize: 25, showPageSize: false, showCounter: false, showNavigation: false },
    });
    await filterEverything();

    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(0);
  });

  test('follows the pager at once when its sections are hidden and shown through the plugin methods', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.rebuild({ filters: true, height: 'auto' });
    await filterEverything();
    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(1);

    // Both counts are read in the same task as the calls: the slot observer renders a frame later and
    // would put the space right on its own, which is not what is asserted here.
    const counts = await grid.page.evaluate(() => {
      const pagination = window.hot.getPlugin('pagination');
      const count = () => document.querySelectorAll('.ht-pagination-placeholder').length;

      pagination.hidePageSizeSection();
      pagination.hidePageCounterSection();
      pagination.hidePageNavigationSection();

      const whileHidden = count();

      pagination.showPageNavigationSection();

      return { whileHidden, afterShow: count() };
    });

    expect(counts).toEqual({ whileHidden: 0, afterShow: 1 });
    await expect.poll(gapUnderHeaders).toBeGreaterThanOrEqual(RESERVED_BODY_PX);
  });

  test('keeps the gap for a grid that starts with no rows', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.page.evaluate(() => {
      window.initSlotGrid(undefined, undefined, {
        data: [],
        columns: [{ data: 0 }, { data: 1 }],
        height: 'auto',
      });
    });
    await expect(grid.page.locator('.ht-slot-bottom .ht-pagination')).toBeVisible();

    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(1);
    await expect.poll(gapUnderHeaders).toBeGreaterThanOrEqual(RESERVED_BODY_PX);
  });

  test('hands the space to `emptyDataState` when it is turned on, and takes it back when it is turned off', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.rebuild({ filters: true, height: 'auto' });
    await filterEverything();
    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(1);

    await grid.page.evaluate(() => window.hot.updateSettings({ emptyDataState: true }));

    await expect(grid.page.locator('.ht-empty-data-state-placeholder')).toHaveCount(1);
    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(0);

    await grid.page.evaluate(() => window.hot.updateSettings({ emptyDataState: false }));

    await expect(grid.page.locator('.ht-empty-data-state-placeholder')).toHaveCount(0);
    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(1);
  });

  test('removes the space with the plugin', async () => {
    await grid.goto(FREE_HOST, 'pagination');
    await grid.rebuild({ filters: true, height: 'auto' });
    await filterEverything();
    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(1);
    await grid.page.evaluate(() => window.hot.updateSettings({ pagination: false }));

    await expect(grid.page.locator('.ht-pagination-placeholder')).toHaveCount(0);
  });
});
