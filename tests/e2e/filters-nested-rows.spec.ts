import { test, expect } from '../fixtures/test';
import { FiltersValueListPage } from '../fixtures/pages/FiltersValueListPage';

/**
 * Regression coverage for DEV-512: with `nestedRows` and `filters` on, the "filter by value" list
 * of a nested grid has to offer the values of every row of the tree, not only some of them.
 */
test.describe('Filters — "filter by value" list with nested rows', () => {
  test('lists every category of the expanded tree', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, 'filters-nested-rows.html');

    await grid.goto();
    await grid.openMenu('Category');

    expect(await grid.allListedValues()).toEqual([
      { checked: true, label: '(Blank cells)' },
      { checked: true, label: 'Best Metal Performance' },
      { checked: true, label: 'Best Rock Album' },
      { checked: true, label: 'Best Rock Performance' },
      { checked: true, label: 'Best Rock Song' },
      { checked: true, label: 'Independent releases' },
      { checked: true, label: 'Major label releases' },
    ]);
  });
});
