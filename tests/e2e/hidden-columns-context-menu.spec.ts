import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { OrdersGridPage } from '../fixtures/pages/OrdersGridPage';

/**
 * Two columns hidden one at a time from their headers' context menu come back together from the
 * context menu of a header range that spans both, in their original places.
 *
 * The Jasmine HiddenColumns context-menu suite runs both commands through `executeCommand()`, showing
 * two hidden columns from a range that spans them included, and `show-hidden-middle-column.spec.ts`
 * restores one column from a neighboring header. The real right-click and menu click, one column at a
 * time and then both back from a range, ran only in the cross-browser visual suite
 * (`columns-hide.spec.ts` on the demo's shared grid), which counted the header cells and photographed
 * the rest until DEV-3257. The same steps are asserted here by which columns are hidden, which
 * headers the grid draws, and what the commands leave selected.
 */
test.describe('hiding and showing columns from the header context menu', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: OrdersGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new OrdersGridPage(page, theme, bundle, 'off');
    await grid.goto();
  });

  test('hides two columns one by one and shows both from a range that spans them', async() => {
    const all = ['Company name', 'Name', 'Sell date', 'In stock', 'Qty', 'Progress', 'Country'];

    expect(await grid.drawnHeaders()).toEqual(all);

    await grid.headerContextMenu(1, 'Hide column');

    expect(await grid.hiddenColumns()).toEqual([1]);
    expect(await grid.drawnHeaders()).toEqual(['Company name', 'Sell date', 'In stock', 'Qty', 'Progress', 'Country']);

    await grid.headerContextMenu(3, 'Hide column');

    expect(await grid.hiddenColumns()).toEqual([1, 3]);
    expect(await grid.drawnHeaders()).toEqual(['Company name', 'Sell date', 'Qty', 'Progress', 'Country']);

    // "Company name" to "Progress" spans both hidden columns; the grid's headers are navigable, so
    // the range starts on the header row. The clicks land on the header labels, as they did on the
    // demo's grid, so they also sort by the column clicked last; the order of the rows does not
    // change which columns a command hides or shows.
    await grid.header(0).click();
    await grid.header(5).click({ modifiers: ['Shift'] });

    expect(await grid.selected()).toEqual([[-1, 0, 59, 5]]);
    expect(await grid.sortConfig()).toEqual([{ column: 5, sortOrder: 'asc' }]);

    await grid.headerContextMenu(5, 'Show columns');

    expect(await grid.hiddenColumns()).toEqual([]);
    expect(await grid.drawnHeaders()).toEqual(all);

    // The command selects from the visible column before the first column it showed to the one
    // after the last, which is the selection the retired capture showed.
    expect(await grid.selected()).toEqual([[-1, 0, 59, 4]]);
  });
});
