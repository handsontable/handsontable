import { test, expect } from '../fixtures/test';
import { HeaderPluginMarkupPage } from '../fixtures/pages/HeaderPluginMarkupPage';

const NESTED = [['G1', { label: 'G2', colspan: 3 }], ['a', 'b', 'c', 'd']];

/**
 * Rows of four text cells.
 *
 * @returns {string[][]}
 */
function data(): string[][] {
  return Array.from({ length: 5 }, (_, row) => ['A', 'B', 'C', 'D'].map(column => `${column}${row + 1}`));
}

/**
 * Walkontable reuses the column header cells between renders. When `nestedHeaders` adds a header
 * row, the cells of the previous bottom row become the top row, so whatever DropdownMenu and the
 * sorting plugins drew there stays unless they clear it. They have to clear every header level: the
 * rows other than the bottom one while they are on, and all of them once they are off.
 */
test.describe('Plugin markup on every column header row', () => {
  let grid: HeaderPluginMarkupPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new HeaderPluginMarkupPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('removes the DropdownMenu buttons from every row when an update turns it off and adds a header row', async() => {
    await grid.build({ data: data(), dropdownMenu: true });
    await expect(grid.menuButtons(grid.shownHeaders())).toHaveCount(4);

    await grid.updateSettings({ dropdownMenu: false, nestedHeaders: NESTED });

    await expect(grid.headerLabel('G2')).toBeVisible();
    await expect(grid.menuButtons()).toHaveCount(0);
  });

  test('keeps the DropdownMenu buttons on the bottom row only when a header row is added', async() => {
    await grid.build({ data: data(), dropdownMenu: true });
    await expect(grid.menuButtons(grid.shownHeaders())).toHaveCount(4);

    await grid.updateSettings({ nestedHeaders: NESTED });

    await expect(grid.headerLabel('G2')).toBeVisible();
    await expect(grid.menuButtons(grid.headerRow('top'))).toHaveCount(0);
    await expect(grid.menuButtons(grid.headerRow('bottom'))).toHaveCount(4);
  });

  test('removes the ColumnSorting markup from every row when an update turns it off, on later renders too', async() => {
    await grid.build({ data: data(), columnSorting: { initialConfig: { column: 1, sortOrder: 'asc' } } });
    await expect(grid.sortIndicators(grid.shownHeaders())).toHaveCount(1);

    await grid.updateSettings({ columnSorting: false, nestedHeaders: NESTED });

    await expect(grid.headerLabel('G2')).toBeVisible();
    await expect(grid.headerLabel('G2')).not.toHaveClass(/columnSorting/);
    await expect(grid.sortableLabels()).toHaveCount(0);
    await expect(grid.sortedLabels()).toHaveCount(0);
    await expect(grid.sortIndicators()).toHaveCount(0);
    await expect(grid.indicatorContainers()).toHaveCount(0);

    await grid.updateSettings({ nestedHeaders: false });

    await expect(grid.headerLabel('A')).toBeVisible();
    await expect(grid.sortableLabels()).toHaveCount(0);
  });

  test('styles only the bottom row as sortable when a header row is added to a sorted grid', async() => {
    await grid.build({ data: data(), columnSorting: true });
    await expect(grid.sortableLabels(grid.shownHeaders())).toHaveCount(4);

    await grid.updateSettings({ nestedHeaders: NESTED });

    await expect(grid.headerLabel('G2')).toBeVisible();
    await expect(grid.headerLabel('G2')).not.toHaveClass(/columnSorting/);
    await expect(grid.sortableLabels(grid.headerRow('top'))).toHaveCount(0);
    await expect(grid.sortableLabels(grid.headerRow('bottom'))).toHaveCount(4);
  });

  test('removes the MultiColumnSorting markup from every row when an update turns it off and adds a header row', async() => {
    await grid.build({ data: data(), multiColumnSorting: { initialConfig: [{ column: 0, sortOrder: 'asc' }] } });
    await expect(grid.sortIndicators(grid.shownHeaders())).toHaveCount(1);

    await grid.updateSettings({ multiColumnSorting: false, nestedHeaders: NESTED });

    await expect(grid.headerLabel('G2')).toBeVisible();
    await expect(grid.headerLabel('G1')).not.toHaveClass(/columnSorting/);
    await expect(grid.sortableLabels()).toHaveCount(0);
    await expect(grid.sortIndicators()).toHaveCount(0);
  });

  test('leaves the MultiColumnSorting markup in place while a ColumnSorting turned off before it stays off', async() => {
    await grid.build({ data: data(), columnSorting: true });
    await grid.updateSettings({ columnSorting: false });
    await expect(grid.sortableLabels()).toHaveCount(0);

    await grid.updateSettings({
      multiColumnSorting: {
        initialConfig: [{ column: 0, sortOrder: 'asc' }, { column: 2, sortOrder: 'desc' }],
      },
    });

    await expect(grid.sortableLabels()).toHaveCount(8);
    await expect(grid.sortedLabels()).toHaveCount(4);
    await expect(grid.sortIndicators()).toHaveCount(4);

    await grid.updateSettings({ multiColumnSorting: false });

    await expect(grid.sortableLabels()).toHaveCount(0);
    await expect(grid.sortIndicators()).toHaveCount(0);
  });

  test('removes the MultiColumnSorting arrows and order badges when one update switches to ColumnSorting', async() => {
    await grid.build({
      data: data(),
      multiColumnSorting: { initialConfig: [{ column: 0, sortOrder: 'asc' }, { column: 2, sortOrder: 'desc' }] },
    });
    await expect(grid.sortIndicators(grid.shownHeaders())).toHaveCount(2);
    await expect(grid.orderBadges()).not.toHaveCount(0);

    await grid.updateSettings({ multiColumnSorting: false, columnSorting: true });

    await expect(grid.sortableLabels(grid.shownHeaders())).toHaveCount(4);
    await expect(grid.sortedLabels()).toHaveCount(0);
    await expect(grid.sortIndicators()).toHaveCount(0);
    await expect(grid.orderBadges()).toHaveCount(0);
  });

  test('removes the ColumnSorting arrow when one update switches to MultiColumnSorting', async() => {
    await grid.build({ data: data(), columnSorting: { initialConfig: { column: 1, sortOrder: 'asc' } } });
    await expect(grid.sortIndicators(grid.shownHeaders())).toHaveCount(1);

    await grid.updateSettings({ columnSorting: false, multiColumnSorting: true });

    await expect(grid.sortableLabels(grid.shownHeaders())).toHaveCount(4);
    await expect(grid.sortedLabels()).toHaveCount(0);
    await expect(grid.sortIndicators()).toHaveCount(0);
  });
});
