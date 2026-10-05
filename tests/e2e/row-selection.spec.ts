import { test, expect } from '../fixtures/test';
import { RowSelectionPage } from '../fixtures/pages/RowSelectionPage';

/**
 * The RowSelection plugin (PRO-87). In the fixture, the row at index 3 is "archived" and
 * `isRowSelectable` rejects it, so 7 of the 8 rows can be selected.
 */
test.describe('Row selection checkboxes', () => {
  test('selects a row on a checkbox press, marks the row, and leaves the cell selection alone',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto();
      await grid.rowCheckbox(1).click();

      await expect.poll(() => grid.selectedRows()).toEqual([1]);
      await expect(grid.rowCheckbox(1)).toBeChecked();
      await expect(grid.cell(1, 0)).toHaveClass(/\bhtRowSelected\b/);
      await expect(grid.cell(0, 0)).not.toHaveClass(/\bhtRowSelected\b/);
      expect(await grid.cellSelection()).toBeUndefined();
      expect(await grid.eventSources()).toEqual(['checkbox']);

      // The press kept the browser focus off the checkbox, so the keyboard stays with the grid.
      expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('INPUT');

      await grid.rowCheckbox(1).click();

      await expect.poll(() => grid.selectedRows()).toEqual([]);
      await expect(grid.rowCheckbox(1)).not.toBeChecked();
    });

  test('shows the mixed state, selects every selectable row from it, and clears them from checked',
    async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);
      const header = grid.headerCheckbox();

      await grid.goto();
      await expect(header).not.toBeChecked();
      await expect(header).toHaveAccessibleName('Select all rows (0 of 7 selected)');

      await grid.rowCheckbox(0).click();

      await expect.poll(() => grid.isIndeterminate(header)).toBe(true);
      await expect(header).toHaveAttribute('aria-checked', 'mixed');

      await header.click();

      await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
      await expect(header).toBeChecked();
      await expect(header).toHaveAccessibleName('Select all rows (7 of 7 selected)');
      expect(await grid.isIndeterminate(header)).toBe(false);

      await header.click();

      await expect.poll(() => grid.selectedRows()).toEqual([]);
      await expect(header).not.toBeChecked();
    });

  test('centers the "select all" checkbox vertically in its header cell', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    // The corner's label is hidden, so its container used to shrink to the checkbox and sit at the
    // top of the cell, 4px above center on the main theme.
    expect(Math.abs(await grid.verticalOffsetInHeader(grid.headerCheckbox()))).toBeLessThanOrEqual(1);

    await grid.switchLocation('firstColumn');

    expect(Math.abs(await grid.verticalOffsetInHeader(grid.headerCheckbox('firstColumn')))).toBeLessThanOrEqual(1);
  });

  test('disables the checkbox of a row that cannot be selected', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();

    await expect(grid.rowCheckbox(3)).toBeDisabled();
    await grid.rowCheckbox(3).click({ force: true });

    expect(await grid.selectedRows()).toEqual([]);
  });

  test('selects a range with Shift and skips the rows that cannot be selected', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.rowCheckbox(1).click();
    await grid.rowCheckbox(5).click({ modifiers: ['Shift'] });

    await expect.poll(() => grid.selectedRows()).toEqual([1, 2, 4, 5]);
  });

  test('toggles the focused row and the whole scope with Space', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    // The plugin's column is the row header column next to the data, so its coordinate is -1.
    await grid.focusCell(2, -1);
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([2]);

    await grid.focusCell(-1, -1);
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
    expect(await grid.eventSources()).toEqual(['keyboard', 'keyboard']);
  });

  test('toggles the focused row with Space on any data cell, without opening the editor', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.focusCell(2, 0);
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([2]);
    expect(await grid.isEditorOpened()).toBe(false);
    expect(await grid.dataAt(2, 0)).toBe('Item 2');
    await expect(grid.announcer()).toHaveText('Row 3 selected');

    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([]);
    await expect(grid.announcer()).toHaveText('Row 3 deselected');
  });

  test('toggles every row of a selected range with Space, skipping the rows that cannot be selected', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.selectRange(1, 0, 4, 1);
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([1, 2, 4]);
    await expect(grid.announcer()).toHaveText('3 of 7 rows selected');

    // Every selectable row of the range is selected now, so Space deselects them.
    await page.keyboard.press('Space');

    await expect.poll(() => grid.selectedRows()).toEqual([]);
  });

  test('selects only the filtered rows with the "filtered" scope', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ scope: 'filtered' });
    await grid.filterStatus('even');

    await expect.poll(() => grid.countRows()).toBe(4);
    await expect(grid.headerCheckbox()).toHaveAccessibleName('Select all rows (0 of 4 selected)');

    await grid.headerCheckbox().click();

    await expect.poll(() => grid.selectedPhysicalRows()).toEqual([0, 2, 4, 6]);
  });

  test('selects the rows the filters removed with the default "all" scope', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto();
    await grid.filterStatus('even');
    await grid.headerCheckbox().click();

    await expect.poll(() => grid.selectedPhysicalRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
  });

  test('keeps its own row header column when the row numbers are off', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);

    await grid.goto({ rowHeaders: false });

    // The checkbox column is the only row header column, so it holds no row numbers.
    await expect(page.locator('.ht_clone_inline_start tbody .rowHeader')).toHaveCount(0);

    await grid.rowCheckbox(4).click();
    await expect.poll(() => grid.selectedRows()).toEqual([4]);

    await grid.focusCell(2, -1);
    await page.keyboard.press('Space');
    await expect.poll(() => grid.selectedRows()).toEqual([2, 4]);

    await grid.headerCheckbox().click();
    await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
  });

  test.describe('with the checkboxes in the first column', () => {
    test('renders the checkboxes next to the values and keeps the column label', async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto({ location: 'firstColumn' });

      await expect(grid.cell(2, 0)).toContainText('Item 2');
      await expect(page.locator('.ht_clone_top').getByText('Name', { exact: true })).toBeVisible();

      await grid.rowCheckbox(2, 'firstColumn').click();

      await expect.poll(() => grid.selectedRows()).toEqual([2]);
      // The press on the checkbox did not select the cell it sits in.
      expect(await grid.cellSelection()).toBeUndefined();

      await grid.headerCheckbox('firstColumn').click();

      await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 2, 4, 5, 6, 7]);
      await expect(grid.rowCheckbox(6, 'firstColumn')).toBeChecked();
    });

    test('keeps the first column label after switching from the row header location', async({ page, theme, bundle }) => {
      const grid = new RowSelectionPage(page, theme, bundle);

      await grid.goto();
      await grid.switchLocation('firstColumn');

      // The header cell that was the plugin's corner is reused for the first column, and core
      // leaves `cornerHeader` on its label. A corner rule keyed on that class hid the label.
      await expect(page.locator('.ht_clone_top').getByText('Name', { exact: true })).toBeVisible();
      await expect(grid.headerCheckbox('firstColumn')).toBeVisible();
    });
  });
});

test.describe('Row selection on a server-backed grid', () => {
  test('keeps the selection across pages and selects rows the server never sent', async({ page, theme, bundle }) => {
    const grid = new RowSelectionPage(page, theme, bundle);
    const header = grid.headerCheckbox();

    await grid.gotoServerBacked();
    await expect(header).toHaveAccessibleName('Select all rows (0 of 12 selected)');

    await grid.rowCheckbox(1).click();
    await grid.nextPage('Item 6');

    await expect(grid.rowCheckbox(0)).not.toBeChecked();
    // The header counts the whole result set, not the page in view.
    await expect(header).toHaveAccessibleName('Select all rows (1 of 12 selected)');
    expect(await grid.isIndeterminate(header)).toBe(true);

    await grid.previousPage('Item 1');
    await expect(grid.rowCheckbox(1)).toBeChecked();

    // From the mixed state, "select all" covers every row matching the query, loaded or not.
    await header.click();
    await expect(header).toHaveAccessibleName('Select all rows (12 of 12 selected)');
    expect(await grid.serverSelection()).toEqual({ selectAll: true, toggledRowIds: [] });

    await grid.nextPage('Item 6');
    await grid.nextPage('Item 11');

    await expect(grid.rowCheckbox(0)).toBeChecked();
    await expect(grid.rowCheckbox(1)).toBeChecked();

    await grid.rowCheckbox(1).click();

    await expect.poll(() => grid.serverSelection()).toEqual({ selectAll: true, toggledRowIds: [12] });
    await expect(header).toHaveAccessibleName('Select all rows (11 of 12 selected)');
  });
});
