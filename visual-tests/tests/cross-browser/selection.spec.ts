import { visualTest, expect, CLASSIC, CROSS_BROWSERS } from '../../src/test-runner';
import { helpers } from '../../src/helpers';
import { selectCell, selectColumnHeaderByIndex, selectRowHeaderByIndex } from '../../src/page-helpers';

// The routes whose overlays a selection crosses differently: frozen and hidden columns, merged cells,
// a nested header over rows frozen to the bottom, and nested rows with hidden rows and a hidden column.
const urls = [
  '/cell-types-demo',
  '/merged-cells-demo',
  '/nested-headers-demo',
  '/nested-rows-demo',
];

// The headers each range highlights: the third to the sixth RENDERED column (hidden columns are
// skipped) and row. The nested-rows demo repeats a child row header's label `row % 10` times, by its
// position in its group of ten, so those are matched by their start. `sortedBy` is the header the
// clicks also sort by: on a route with column sorting, a click on a header's label sorts by that
// column, so the Shift+click leaves the grid sorted by the range's last column, ascending, and both
// captures show the rows in that order. The nested-rows demo does not sort.
const highlightedHeaders: Record<string, {
  columns: string[],
  rows: Array<string | RegExp>,
  sortedBy: string | null,
}> = {
  '/cell-types-demo': {
    columns: ['Cost', 'In Stock', 'Category', 'Item Quality'],
    rows: ['3', '4', '5', '6'],
    sortedBy: 'Item Quality',
  },
  '/merged-cells-demo': {
    columns: ['Name', 'Sell date', 'Order ID', 'In stock'],
    rows: ['3', '4', '5', '6'],
    sortedBy: 'In stock',
  },
  '/nested-headers-demo': {
    columns: ['Pricing', 'Rating', 'Data Type', 'Industry'],
    rows: ['3', '4', '5', '6'],
    sortedBy: 'Industry',
  },
  '/nested-rows-demo': {
    columns: ['Business Scale', 'User Type', 'No of Users', 'Deployment'],
    rows: [/^Row 3 /, /^Row 7 /, /^Row 8 /, /^Row 9 /],
    sortedBy: null,
  },
};

urls.forEach((url) => {
  /**
   * Checks that a column range and a row range, each selected with a header click and a Shift+click,
   * render their borders, fill and header highlights in Chromium, Firefox and WebKit on this demo
   * route. Two captures per route in `urls`, in each browser: the column range and the row range,
   * each after asserting which headers it highlights and, on the three routes that sort, which column
   * the header clicks sorted by. Which range a click selects, and where the focus lands, is asserted
   * on all six theme and bundle legs by `tests/e2e/header-range-selection.spec.ts`; that a click on a
   * header's label sorts is asserted by the Jasmine column-sorting suites and by
   * `tests/e2e/column-move-sorting.spec.ts`. These captures keep the pixels the three engines can
   * disagree on, at overlay edges, merged cells, nested headers and nested rows. Owned by DEV-3257.
   */
  visualTest(`Test selection for: ${url}`, {
    themes: [CLASSIC],
    browsers: CROSS_BROWSERS,
    wrappers: [],
  }, async({ goto, tablePage }) => {
    await goto(url);

    const { columns, rows, sortedBy } = highlightedHeaders[url];
    const table = tablePage.locator(helpers.selectors.mainTable);
    const sortedHeaders = table.locator('.ht_clone_top thead tr:last-child th[aria-sort="ascending"]');

    await table.waitFor();

    await selectColumnHeaderByIndex(2);
    await selectColumnHeaderByIndex(5, ['Shift']);
    await expect(table.locator('.ht_clone_top thead tr:last-child th.ht__active_highlight'))
      .toHaveText(columns);
    await expect(sortedHeaders).toHaveText(sortedBy === null ? [] : [sortedBy]);
    await tablePage.screenshot({ path: helpers.screenshotPath() });

    await selectRowHeaderByIndex(2);
    await selectRowHeaderByIndex(5, ['Shift']);
    await expect(table.locator('.ht_clone_inline_start tbody th.ht__active_highlight'))
      .toHaveText(rows);
    await expect(sortedHeaders).toHaveText(sortedBy === null ? [] : [sortedBy]);
    await tablePage.screenshot({ path: helpers.screenshotPath() });
  });
});

/**
 * Checks that a selected cell renders its border and its header highlights in Chromium, Firefox and
 * WebKit on the right-to-left demo, under its two-row nested header. One capture in each browser,
 * after asserting the cell took the focus. This route's column-range and row-range captures were the
 * WebKit flakes of this spec; the ranges they showed are asserted by
 * `tests/e2e/header-range-selection.spec.ts` on the same right-to-left, nested-header shape. Owned by
 * DEV-3257.
 */
visualTest('Test selection for: /arabic-rtl-demo', {
  themes: [CLASSIC],
  browsers: CROSS_BROWSERS,
  wrappers: [],
}, async({ goto, tablePage }) => {
  await goto('/arabic-rtl-demo');

  const table = tablePage.locator(helpers.selectors.mainTable);

  await table.waitFor();

  const cell = await selectCell(2, 2, table);

  await cell.click();
  await expect(cell).toHaveClass(/(^|\s)current(\s|$)/);
  await tablePage.screenshot({ path: helpers.screenshotPath() });
});
