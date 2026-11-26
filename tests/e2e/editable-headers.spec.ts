import { test, expect, THEMES_TAG } from '../fixtures/test';
import { EditableHeadersPage } from '../fixtures/pages/EditableHeadersPage';

/**
 * The EditableHeaders plugin: renaming column and row headers through an input laid over the header.
 * The fixture's column headers are Name, Price and Stock; row headers are 1 to 5.
 */
test.describe('Editable headers', { tag: THEMES_TAG }, () => {
  test('renames a column header on double-click, saves on Enter and announces it', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(1).dblclick();

    const input = grid.headerInput();

    await expect(input).toBeFocused();
    await expect(input).toHaveValue('Price');

    // The input lies over the header it renames.
    const inputBox = await input.boundingBox();
    const headerBox = await grid.columnHeader(1).boundingBox();

    expect(Math.abs((inputBox?.x ?? 0) - (headerBox?.x ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((inputBox?.y ?? 0) - (headerBox?.y ?? 0))).toBeLessThanOrEqual(1);

    // The whole name is selected, so typing replaces it.
    await page.keyboard.type('Cost');
    await page.keyboard.press('Enter');

    await expect(input).toBeHidden();
    await expect(grid.columnHeader(1)).toHaveText('Cost');
    expect(await grid.colHeaders()).toEqual(['Name', 'Cost', 'Stock']);
    expect(await grid.headerChanges())
      .toEqual([{ axis: 'column', visualIndex: 1, newValue: 'Cost', oldValue: 'Price' }]);
    await expect(grid.politeAnnouncer()).toHaveText('Header renamed to Cost');
    // The keyboard is back on the grid, on the renamed header.
    expect(await grid.focusedCell()).toEqual({ row: -1, col: 1 });
  });

  test('cancels on Escape and keeps the name', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(0).dblclick();
    await page.keyboard.type('Changed');
    await page.keyboard.press('Escape');

    await expect(grid.headerInput()).toBeHidden();
    await expect(grid.columnHeader(0)).toHaveText('Name');
    expect(await grid.headerChanges()).toEqual([]);
  });

  test('opens with F2 and Enter on a header focused with the keyboard', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.cell(0, 2).click();
    await page.keyboard.press('ArrowUp');
    expect(await grid.focusedCell()).toEqual({ row: -1, col: 2 });

    await page.keyboard.press('F2');
    await expect(grid.headerInput()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(grid.headerInput()).toBeHidden();

    await page.keyboard.press('Enter');
    await expect(grid.headerInput()).toBeFocused();
    await page.keyboard.type('Qty');
    await page.keyboard.press('Enter');

    await expect(grid.columnHeader(2)).toHaveText('Qty');
  });

  test('leaves the column data alone while the user types and deletes in the input', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(0).click();
    await grid.columnHeader(0).dblclick();
    await page.keyboard.press('End');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Delete');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');

    await expect(grid.columnHeader(0)).toHaveText('Nam');
    expect(await grid.columnData(0)).toEqual(['A0', 'A1', 'A2', 'A3', 'A4']);
  });

  test('saves when the focus moves out of the input', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(1).dblclick();
    await page.keyboard.type('Amount');
    await grid.outsideInput().click();

    await expect(grid.headerInput()).toBeHidden();
    await expect(grid.columnHeader(1)).toHaveText('Amount');
    await expect(grid.outsideInput()).toBeFocused();
  });

  test('renames a row header', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.rowHeader(4).dblclick();
    await expect(grid.headerInput()).toHaveValue('5');
    await page.keyboard.type('Total');
    await page.keyboard.press('Enter');

    await expect(grid.rowHeader(4)).toHaveText('Total');
    expect(await grid.rowHeaderValue(4)).toBe('Total');
  });

  test('undoes a rename in one step', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(1).dblclick();
    await page.keyboard.type('Cost');
    await page.keyboard.press('Enter');
    await expect(grid.columnHeader(1)).toHaveText('Cost');

    await page.keyboard.press('ControlOrMeta+z');

    await expect(grid.columnHeader(1)).toHaveText('Price');
  });

  test('renames from the column menu', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.openColumnMenu(2);
    await grid.menuItem('Rename header').click();

    await expect(grid.headerInput()).toBeFocused();
    await page.keyboard.type('Qty');
    await page.keyboard.press('Enter');

    await expect(grid.columnHeader(2)).toHaveText('Qty');
  });

  test('renames a frozen column header over its corner copy', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto('frozen');
    await grid.columnHeader(0, { frozen: true }).dblclick();

    const inputBox = await grid.headerInput().boundingBox();
    const headerBox = await grid.columnHeader(0, { frozen: true }).boundingBox();

    expect(Math.abs((inputBox?.x ?? 0) - (headerBox?.x ?? 0))).toBeLessThanOrEqual(1);

    await page.keyboard.type('Item');
    await page.keyboard.press('Enter');

    await expect(grid.columnHeader(0, { frozen: true })).toHaveText('Item');
  });

  test('keeps the typed name out of the cells when headers are not navigable', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto('default');
    await grid.columnHeader(1).dblclick();
    await expect(grid.headerInput()).toBeFocused();
    await page.keyboard.type('Cost');

    // Typing must stay in the input: no cell editor opens on the highlighted cell.
    await expect(grid.headerInput()).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(grid.columnHeader(1)).toHaveText('Cost');
    expect(await grid.columnData(1)).toEqual(['B0', 'B1', 'B2', 'B3', 'B4']);
  });

  test('draws a typed name as text', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(1).dblclick();
    await page.keyboard.type('<b>Cost</b>');
    await page.keyboard.press('Enter');

    await expect(grid.columnHeader(1)).toHaveText('<b>Cost</b>');
    await expect(grid.columnHeader(1).locator('b')).toHaveCount(0);
  });

  test('keeps the input over its header while the grid scrolls', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto('wide');
    await grid.columnHeader(1).dblclick();
    await expect(grid.headerInput()).toBeFocused();
    await grid.scrollGridBy(60);

    await expect.poll(async() => {
      const [inputBox, headerBox] = await Promise.all([grid.headerInput().boundingBox(), grid.columnHeader(1).boundingBox()]);

      return Math.round((inputBox?.x ?? 0) - (headerBox?.x ?? 0));
    }).toBe(0);
    await expect(grid.headerInput()).toBeFocused();
  });

  test('drops a half-typed name when the grid scrolls its header out of view', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto('wide');
    await grid.columnHeader(1).dblclick();
    await page.keyboard.type('Half');
    await grid.scrollGridBy(1500);

    await expect(grid.headerInput()).toBeHidden();
    await grid.scrollGridBy(-1500);
    await expect(grid.columnHeader(1)).toHaveText('B');
  });

  test('widens an auto-sized column to fit a longer name', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();

    const before = (await grid.columnHeader(0).boundingBox())?.width ?? 0;

    await grid.columnHeader(0).dblclick();
    await page.keyboard.type('Name of the product shown in the order');
    await page.keyboard.press('Enter');

    await expect(grid.columnHeader(0)).toHaveText('Name of the product shown in the order');
    await expect.poll(async() => (await grid.columnHeader(0).boundingBox())?.width ?? 0).toBeGreaterThan(before + 100);
  });

  test('saves with Tab and moves to the next header', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.cell(0, 0).click();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('F2');
    await page.keyboard.type('Item');
    await page.keyboard.press('Tab');

    await expect(grid.headerInput()).toBeHidden();
    await expect(grid.columnHeader(0)).toHaveText('Item');
    expect(await grid.focusedCell()).toEqual({ row: -1, col: 1 });
  });

  test('renames a row header with F2 on the focused row header', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.cell(2, 0).click();
    await page.keyboard.press('ArrowLeft');
    expect(await grid.focusedCell()).toEqual({ row: 2, col: -1 });

    await page.keyboard.press('F2');
    await expect(grid.headerInput()).toHaveValue('3');
    await page.keyboard.type('Middle');
    await page.keyboard.press('Enter');

    await expect(grid.rowHeader(2)).toHaveText('Middle');
  });

  test('renames from the context menu of a column header', async({ page, theme, bundle }) => {
    const grid = new EditableHeadersPage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(2).click({ button: 'right' });
    await grid.menuItem('Rename header').click();

    await expect(grid.headerInput()).toBeFocused();
    await page.keyboard.type('Qty');
    await page.keyboard.press('Enter');

    await expect(grid.columnHeader(2)).toHaveText('Qty');
  });

  test.describe('with column sorting', () => {
    test('keeps sorting on double-click and Enter, and opens with F2 and the menu', async({ page, theme, bundle }) => {
      const grid = new EditableHeadersPage(page, theme, bundle);

      await grid.goto('sorting');
      await grid.cell(0, 1).click();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Enter');

      await expect(grid.headerInput()).toBeHidden();
      expect(await grid.sortConfig()).toEqual([{ column: 1, sortOrder: 'asc' }]);

      await page.keyboard.press('F2');
      await expect(grid.headerInput()).toBeFocused();
      await page.keyboard.press('Escape');

      await grid.columnHeader(0).dblclick();
      await expect(grid.headerInput()).toBeHidden();

      await grid.openColumnMenu(2);
      await grid.menuItem('Rename header').click();
      await expect(grid.headerInput()).toBeFocused();
    });
  });
});
