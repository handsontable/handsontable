import { test, expect } from '../fixtures/test';
import { OrdersGridPage } from '../fixtures/pages/OrdersGridPage';

/**
 * A value list narrowed by its search box, then "Select all", keeps only the values the search
 * listed; a date range on a second column then narrows the rows further, and both columns show the
 * active-filter indicator.
 *
 * "Select all" after a search is the step that can go wrong without anything looking broken: under
 * the default `searchMode: 'show'` it ticks the listed values only, and if it ticked every value
 * the filter would keep all 60 rows and the menu would close as usual. The cross-browser visual
 * suite drove exactly this gesture on the demo's shared grid (`columns-filter.spec.ts`, Country:
 * India, then Sell date between two dates) and checked only the row counts; until DEV-3257 the
 * rows themselves were a screenshot. The orders fixture's data gives the demo's counts, 60 to 6 to
 * 3, so the same three steps are asserted here by the rows they leave.
 */
test.describe('a searched value list and a date condition', () => {
  let grid: OrdersGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new OrdersGridPage(page, theme, bundle, 'off');
    await grid.goto();
  });

  test('keeps the searched values, then the rows inside the date range', async({ page }) => {
    expect(await grid.columnData(0)).toHaveLength(60);

    // "Clear", search "India", "Select all", OK: the one value the search lists is the one kept.
    await grid.keepSearchedValues('Country', 'India', ['India']);

    expect(await grid.columnData(6)).toEqual(Array(6).fill('India'));
    expect(await grid.columnData(0)).toEqual(['Zeta 60', 'Kilo 50', 'Mira 40', 'Zeta 30', 'Kilo 20', 'Mira 10']);

    // The second column's range keeps the India rows sold in the first half of 2020.
    await grid.filterBetween('Sell date', '2020-01-01', '2020-06-30');

    expect(await grid.columnData(0)).toEqual(['Zeta 60', 'Kilo 20', 'Mira 10']);
    expect(await grid.columnData(2)).toEqual(['2020-01-01', '2020-05-14', '2020-03-24']);

    // Both filtered columns carry the indicator the visual capture shows; no other column does.
    await expect(page.locator('.ht_clone_top th.htFiltersActive .colHeader'))
      .toHaveText(['Sell date', 'Country']);
  });
});
