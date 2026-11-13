import { test, expect } from '../fixtures/test';
import { PluginUiTeardownPage, textRows } from '../fixtures/pages/PluginUiTeardownPage';

/**
 * Walkontable reuses the header cells between renders and resets only their class, ARIA and style
 * attributes, so what a plugin drew into a header stays there unless the plugin takes it out or draws
 * it again. A sheet switch turns plugins on and off through the same `updateSettings()` a plain grid
 * uses, so each case runs on both: RowSelection left its checkboxes in the row headers once it was
 * off and showed the row numbers of an earlier render in its own column, DropdownMenu headers lost
 * `aria-haspopup` on any header render, and Pagination left its marker class on the root wrapper.
 */
test.describe('Plugin UI after the plugin is turned off or its headers render again', () => {
  let grid: PluginUiTeardownPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new PluginUiTeardownPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(() => {
    expect(grid.pageErrors).toEqual([]);
  });

  test.describe('RowSelection', () => {
    test('removes its checkboxes from the row headers when an update turns it off', async() => {
      await grid.build({ data: textRows(5) });
      await grid.updateSettings({ rowSelection: true });
      await grid.selectRows([0, 1]);

      await expect(grid.checkedCheckboxes()).not.toHaveCount(0);

      await grid.updateSettings({ rowSelection: false });

      await expect(grid.checkboxes()).toHaveCount(0);
      expect(await grid.rowHeaders(3)).toEqual([
        { labels: ['1'], checkbox: false },
        { labels: ['2'], checkbox: false },
        { labels: ['3'], checkbox: false },
      ]);
    });

    test('removes its checkboxes from the row headers when the next sheet does not turn it on', async() => {
      await grid.build({
        sheetsBar: {
          sheets: [
            { name: 'Plain', data: textRows(5, 'p') },
            { name: 'Selectable', data: textRows(5, 's'), settings: { rowSelection: true } },
            { name: 'Other', data: textRows(5, 'o') },
          ],
        },
      });

      expect(await grid.setActiveSheet('Selectable')).toBe(true);
      await expect(grid.firstCell()).toHaveText('sA0');
      await grid.selectRows([0, 1]);

      await expect(grid.checkedCheckboxes()).not.toHaveCount(0);

      expect(await grid.setActiveSheet('Other')).toBe(true);
      await expect(grid.firstCell()).toHaveText('oA0');

      await expect(grid.checkboxes()).toHaveCount(0);
      expect(await grid.rowHeaders(3)).toEqual([
        { labels: ['1'], checkbox: false },
        { labels: ['2'], checkbox: false },
        { labels: ['3'], checkbox: false },
      ]);
    });

    test('shows no stale row numbers in its column when it is turned on as hidden rows are shown again', async() => {
      await grid.build({ data: textRows(8), hiddenRows: { rows: [0, 1, 2] } });
      await grid.updateSettings({ hiddenRows: false, rowSelection: true });

      await expect(grid.firstCell()).toHaveText('A0');
      expect(await grid.rowHeaders(4)).toEqual([
        { labels: ['1'], checkbox: true },
        { labels: ['2'], checkbox: true },
        { labels: ['3'], checkbox: true },
        { labels: ['4'], checkbox: true },
      ]);
    });

    test('shows no stale row numbers in its column on a sheet opened after one with hidden rows', async() => {
      await grid.build({
        sheetsBar: {
          sheets: [
            { name: 'Hidden', data: textRows(8, 'h'), settings: { hiddenRows: { rows: [0, 1, 2] } } },
            { name: 'Selectable', data: textRows(8, 's'), settings: { rowSelection: true } },
          ],
        },
      });

      await expect(grid.firstCell()).toHaveText('hA3');

      expect(await grid.setActiveSheet('Selectable')).toBe(true);
      await expect(grid.firstCell()).toHaveText('sA0');

      expect(await grid.rowHeaders(4)).toEqual([
        { labels: ['1'], checkbox: true },
        { labels: ['2'], checkbox: true },
        { labels: ['3'], checkbox: true },
        { labels: ['4'], checkbox: true },
      ]);
    });
  });

  test.describe('DropdownMenu', () => {
    test('keeps aria-haspopup on every header with a menu button after the headers render again', async() => {
      await grid.build({ data: textRows(8), dropdownMenu: true });

      expect(await grid.dropdownHeaderPopups()).toEqual(['menu', 'menu', 'menu']);

      await grid.render();

      expect(await grid.dropdownHeaderPopups()).toEqual(['menu', 'menu', 'menu']);

      await grid.updateSettings({});

      expect(await grid.dropdownHeaderPopups()).toEqual(['menu', 'menu', 'menu']);

      await grid.loadData(textRows(8, 'n'));
      await expect(grid.firstCell()).toHaveText('nA0');

      expect(await grid.dropdownHeaderPopups()).toEqual(['menu', 'menu', 'menu']);
    });

    test('keeps aria-haspopup on every header with a menu button after a sheet switch', async() => {
      await grid.build({
        dropdownMenu: true,
        sheetsBar: {
          sheets: [
            { name: 'First', data: textRows(8, 'f') },
            { name: 'Second', data: textRows(8, 's') },
          ],
        },
      });

      expect(await grid.dropdownHeaderPopups()).toEqual(['menu', 'menu', 'menu']);

      expect(await grid.setActiveSheet('Second')).toBe(true);
      await expect(grid.firstCell()).toHaveText('sA0');

      expect(await grid.dropdownHeaderPopups()).toEqual(['menu', 'menu', 'menu']);
    });

    test('adds no aria-haspopup when ariaTags is off', async() => {
      await grid.build({ data: textRows(8), dropdownMenu: true, ariaTags: false });
      await grid.render();

      expect(await grid.dropdownHeaderPopups()).toEqual([null, null, null]);
    });
  });

  test.describe('Pagination', () => {
    test('takes its marker class off the root wrapper when an update turns it off', async() => {
      await grid.build({ data: textRows(30), pagination: { pageSize: 5 } });

      await expect(grid.paginationBar()).toBeVisible();
      await expect(grid.rootWrapper()).toHaveClass(/\bhtPagination\b/);

      await grid.updateSettings({ pagination: false });

      await expect(grid.paginationBar()).toHaveCount(0);
      await expect(grid.rootWrapper()).not.toHaveClass(/\bhtPagination\b/);
    });

    test('takes its marker class off the root wrapper on a sheet without pagination, and puts it back on return', async() => {
      await grid.build({
        sheetsBar: {
          sheets: [
            { name: 'Paged', data: textRows(30, 'p'), settings: { pagination: { pageSize: 5 } } },
            { name: 'Plain', data: textRows(5, 'q') },
          ],
        },
      });

      await expect(grid.paginationBar()).toBeVisible();
      await expect(grid.rootWrapper()).toHaveClass(/\bhtPagination\b/);

      expect(await grid.setActiveSheet('Plain')).toBe(true);
      await expect(grid.firstCell()).toHaveText('qA0');

      await expect(grid.paginationBar()).toHaveCount(0);
      await expect(grid.rootWrapper()).not.toHaveClass(/\bhtPagination\b/);

      expect(await grid.setActiveSheet('Paged')).toBe(true);
      await expect(grid.firstCell()).toHaveText('pA0');

      await expect(grid.paginationBar()).toBeVisible();
      await expect(grid.rootWrapper()).toHaveClass(/\bhtPagination\b/);
    });
  });
});
