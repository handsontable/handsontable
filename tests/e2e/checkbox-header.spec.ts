import { test, expect } from '../fixtures/test';
import { CheckboxHeaderPage } from '../fixtures/pages/CheckboxHeaderPage';

/**
 * PRO-87: the "check all" header checkbox of a checkbox column (`headerCheckbox`), and the same
 * column used as the row selection (`rowSelection.checkboxLocation: { column }`). In the fixture, row 1
 * starts checked and row 2's cell is read-only, so 5 of the 6 cells can be written.
 */
test.describe('Checkbox column header', () => {
  test('checks every editable cell from the mixed state, and unchecks them from checked', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderPage(page, theme, bundle);
    const header = grid.headerCheckbox();

    await grid.goto();
    await expect(header).toHaveAccessibleName('Check all (1 of 5 checked)');
    await expect(header).toHaveAttribute('aria-checked', 'mixed');

    await header.click();

    await expect.poll(() => grid.doneValues()).toEqual([true, true, false, true, true, true]);
    await expect(header).toBeChecked();
    await expect(grid.cellCheckbox(5)).toBeChecked();
    // The press neither selected nor sorted the column.
    expect(await grid.cellSelection()).toBeUndefined();
    expect(await grid.sortConfig()).toEqual([]);

    await header.click();

    await expect.poll(() => grid.doneValues()).toEqual([false, false, false, false, false, false]);
    await expect(header).not.toBeChecked();
  });

  test('follows the cells, and undoes a "check all" in one step', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderPage(page, theme, bundle);
    const header = grid.headerCheckbox();

    await grid.goto();
    await grid.cellCheckbox(1).click();

    await expect(header).toHaveAccessibleName('Check all (0 of 5 checked)');
    await expect(header).not.toBeChecked();

    await header.click();
    await expect.poll(() => grid.doneValues()).toEqual([true, true, false, true, true, true]);

    await grid.undo();

    await expect.poll(() => grid.doneValues()).toEqual([false, false, false, false, false, false]);
    await expect(header).toHaveAccessibleName('Check all (0 of 5 checked)');
  });

  test('centers the header checkbox vertically', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderPage(page, theme, bundle);

    await grid.goto();

    expect(Math.abs(await grid.headerVerticalOffset())).toBeLessThanOrEqual(1);
  });

  test.describe('used as the row selection', () => {
    test('selects rows through the cell checkboxes, with one checkbox per cell', async({ page, theme, bundle }) => {
      const grid = new CheckboxHeaderPage(page, theme, bundle);

      await grid.goto('bound');

      await expect(grid.cell(3, 1).locator('input[type="checkbox"]')).toHaveCount(1);
      await expect(grid.cell(1, 0)).toHaveClass(/\bhtRowSelected\b/);

      await grid.cellCheckbox(3).click();

      await expect.poll(() => grid.selectedRows()).toEqual([1, 3]);
      await expect(grid.cell(3, 0)).toHaveClass(/\bhtRowSelected\b/);
      expect(await grid.selectionSources()).toEqual(['checkbox']);
    });

    test('selects every row with the header checkbox, writing the column', async({ page, theme, bundle }) => {
      const grid = new CheckboxHeaderPage(page, theme, bundle);
      const header = grid.headerCheckbox();

      await grid.goto('bound');
      await expect(header).toHaveAccessibleName('Select all rows (1 of 5 selected)');

      await header.click();

      await expect.poll(() => grid.doneValues()).toEqual([true, true, false, true, true, true]);
      await expect.poll(() => grid.selectedRows()).toEqual([0, 1, 3, 4, 5]);
      expect(await grid.selectionSources()).toEqual(['headerCheckbox']);
    });
  });
});
