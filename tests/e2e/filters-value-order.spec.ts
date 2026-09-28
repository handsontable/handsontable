import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

/**
 * DEV-2579: `filterValueComparator` orders the "Filter by value" list.
 *
 * The list is built on a clean opening and rebuilt after a confirmed selection, and each column
 * builds its own. All three paths must show the configured order, and the order must never change
 * which rows survive the filter.
 */
test.describe('Filters — "filter by value" list order', () => {
  const FIXTURE = 'filters-value-order.html';

  test('shows the column\'s own order on the first opening', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, FIXTURE);

    await grid.goto();
    await grid.openMenu('Priority');

    expect(await grid.listedValues()).toEqual([
      { checked: true, label: 'Critical' },
      { checked: true, label: 'High' },
      { checked: true, label: 'Medium' },
      { checked: true, label: 'Low' },
      { checked: true, label: '(Blank cells)' },
    ]);
  });

  test('keeps the order and the selection after a confirmed change', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, FIXTURE);

    await grid.goto();
    await grid.openMenu('Priority');
    await grid.uncheckValue('Low');
    await grid.confirmMenu();

    expect(await grid.columnValues(0)).toEqual(['High', 'Critical', 'Medium', '', 'High']);

    await grid.openMenu('Priority');

    expect(await grid.listedValues()).toEqual([
      { checked: true, label: 'Critical' },
      { checked: true, label: 'High' },
      { checked: true, label: 'Medium' },
      { checked: false, label: 'Low' },
      { checked: true, label: '(Blank cells)' },
    ]);
  });

  test('applies the grid-level order to a column without its own', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, FIXTURE);

    await grid.goto();
    await grid.openMenu('Size');

    expect((await grid.listedValues()).map(item => item.label)).toEqual(['XS', 'S', 'M', 'L', 'XL']);
  });

  test('orders a dependent column\'s narrowed list the same way', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, FIXTURE);

    await grid.goto();
    await grid.openMenu('Priority');
    await grid.uncheckValue('Low');
    await grid.confirmMenu();
    await grid.openMenu('Size');

    // "M" survives through the second "High" row; only the unticked "Low" row's size is gone
    expect((await grid.listedValues()).map(item => item.label)).toEqual(['XS', 'S', 'M', 'L', 'XL']);
  });

  test('applies the grid-level order to a numeric column too, keeping every value', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, FIXTURE);

    await grid.goto();
    await grid.openMenu('Amount');

    // The grid-level comparator knows no number, so it ranks them all equal and the stable sort
    // keeps the deduplicated insertion order - which is what proves the grid value reached a
    // column that inherits it. The built-in order would be 5, 7, 20, 100, 1000.
    expect((await grid.listedValues()).map(item => item.label)).toEqual(['100', '5', '1000', '20', '7']);
  });

  test('a comparator that ranks everything equal still lists every value', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, FIXTURE);

    await grid.goto();
    await grid.updateSettings('{ columns: [{ filterValueComparator: () => 0 }, {}, { type: "numeric" }] }');
    await grid.openMenu('Priority');

    expect((await grid.listedValues()).map(item => item.label).sort())
      .toEqual(['(Blank cells)', 'Critical', 'High', 'Low', 'Medium']);
  });
});
