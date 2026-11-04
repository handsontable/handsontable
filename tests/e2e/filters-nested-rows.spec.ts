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

    await expect.poll(() => grid.allListedValues()).toEqual([
      { checked: true, label: '(Blank cells)' },
      { checked: true, label: 'Best Metal Performance' },
      { checked: true, label: 'Best Rock Album' },
      { checked: true, label: 'Best Rock Performance' },
      { checked: true, label: 'Best Rock Song' },
      { checked: true, label: 'Independent releases' },
      { checked: true, label: 'Major label releases' },
    ]);
  });

  test('lists the categories of a collapsed parent\'s children', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, 'filters-nested-rows.html');

    await grid.goto();
    // Row 0 is "Best Rock Performance", the only parent of "Major label releases" and
    // "Independent releases". The collapse trims both children, and every row under them.
    await grid.collapseNestedParent(0);
    await expect(grid.cell(1, 0)).toHaveText('Best Metal Performance');

    await grid.openMenu('Category');

    await expect.poll(() => grid.allListedValues()).toEqual([
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
