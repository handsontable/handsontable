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

test.describe('Filters — the parent-child tree of a filtered nested grid', () => {
  test('keeps the parent chain of a matching nominee', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, 'filters-nested-rows.html');

    await grid.goto();
    await grid.openMenu('Artist');
    await grid.applyCondition('Is equal to', 'Alabama Shakes');
    await grid.confirmMenu();

    // Each match keeps every ancestor: its release group and category under "Best Rock
    // Performance", and its category for "Best Rock Song".
    await expect.poll(() => grid.visibleRowCount()).toBe(5);
    expect(await grid.columnValues(0)).toEqual([
      'Best Rock Performance', 'Major label releases', '', 'Best Rock Song', '',
    ]);
    expect(await grid.columnValues(1)).toEqual(['', '', 'Alabama Shakes', '', 'Alabama Shakes']);
  });

  test('keeps every nominee of a kept category', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, 'filters-nested-rows.html');

    await grid.goto();
    await grid.openMenu('Category');
    await grid.clearAllValues();
    // The list is virtualized, so narrow it to bring the value into the rendered rows.
    await grid.searchValues('Best Rock Song');
    await expect(grid.valueLabels).toHaveText(['Best Rock Song']);
    await grid.checkValue('Best Rock Song');
    await grid.confirmMenu();

    // The nominees have no category, so the list's "(Blank cells)" is unchecked; they stay
    // because their category matches.
    await expect.poll(() => grid.visibleRowCount()).toBe(6);
    expect(await grid.columnValues(0)).toEqual(['Best Rock Song', '', '', '', '', '']);
    expect(await grid.columnValues(1)).toEqual([
      '', 'Alabama Shakes', 'Elle King', 'James Bay', 'Highly Suspect', 'Florence & The Machine',
    ]);
  });

  test('unchecks one artist while blank cells stay checked', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, 'filters-nested-rows.html');

    await grid.goto();
    await expect.poll(() => grid.visibleRowCount()).toBe(26);
    await grid.openMenu('Artist');
    await grid.uncheckValue('Alabama Shakes');
    await grid.confirmMenu();

    // Every parent has an empty artist, so "(Blank cells)" keeps the parents. It must not bring
    // back their unchecked children: only the two "Alabama Shakes" rows go.
    await expect.poll(() => grid.visibleRowCount()).toBe(24);

    const artists = await grid.columnData(1);

    expect(artists).not.toContain('Alabama Shakes');
    expect(artists).toContain('Elle King');
    expect(await grid.columnData(0)).toContain('Best Rock Song');
  });

  test('collapses and expands a filtered tree', async({ page, theme, bundle }) => {
    const grid = new FiltersValueListPage(page, theme, bundle, 'filters-nested-rows.html');

    await grid.goto();
    await grid.openMenu('Artist');
    await grid.applyCondition('Is equal to', 'Alabama Shakes');
    await grid.confirmMenu();
    await expect.poll(() => grid.visibleRowCount()).toBe(5);

    await grid.collapseNestedParent(0);

    expect(await grid.columnValues(0)).toEqual(['Best Rock Performance', 'Best Rock Song', '']);

    await grid.expandNestedParent(0);

    expect(await grid.columnValues(0)).toEqual([
      'Best Rock Performance', 'Major label releases', '', 'Best Rock Song', '',
    ]);
    expect(await grid.columnValues(1)).toEqual(['', '', 'Alabama Shakes', '', 'Alabama Shakes']);
  });
});
