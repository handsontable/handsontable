import { test, expect } from '../fixtures/test';
import { PluginUiTeardownPage, textRows } from '../fixtures/pages/PluginUiTeardownPage';

/**
 * A sheet the user has not visited opens with nothing selected. Arriving from a sheet with no rows,
 * where EmptyDataState showed its overlay, the switch hid the overlay the way a `loadData()` on an
 * empty grid does, and that hide selects the first cell when it kept no selection.
 */
test.describe('SheetsBar switch away from a sheet that shows EmptyDataState', () => {
  let grid: PluginUiTeardownPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PluginUiTeardownPage(page, theme, bundle);
    await grid.goto();
    await grid.build({
      emptyDataState: true,
      sheetsBar: {
        sheets: [
          { name: 'A', data: textRows(5, 'a') },
          { name: 'E', data: [] },
          { name: 'C', data: textRows(5, 'c') },
        ],
      },
    });
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test('opens a sheet not visited yet with nothing selected', async() => {
    await grid.selectCell(3, 2);

    expect(await grid.setActiveSheet('E')).toBe(true);
    expect(await grid.isEmptyDataStateVisible()).toBe(true);
    expect(await grid.setActiveSheet('C')).toBe(true);

    expect(await grid.isEmptyDataStateVisible()).toBe(false);
    expect(await grid.selected()).toBeNull();
  });

  test('brings back the selection of a visited sheet', async() => {
    await grid.selectCell(3, 2);

    expect(await grid.setActiveSheet('E')).toBe(true);
    expect(await grid.setActiveSheet('A')).toBe(true);

    expect(await grid.selected()).toEqual([[3, 2, 3, 2]]);
  });

  test('still selects the first cell when data is loaded into the empty sheet', async() => {
    expect(await grid.setActiveSheet('E')).toBe(true);

    await grid.loadData(textRows(2, 'n'));

    expect(await grid.selected()).toEqual([[0, 0, 0, 0]]);
  });
});
