import { test, expect } from '../fixtures/test';
import { DropdownWidthPage } from '../fixtures/pages/DropdownWidthPage';

/**
 * #13180: with trimDropdown:false the dropdown list rendered narrower than the
 * edited column when the option labels were short (list column width came from
 * autoColumnSize content measurement only, floored at defaultColumnWidth).
 * The list — including its rows, not just the outer container — must be at
 * least as wide as the edited cell, while long options must still widen it.
 */
test.describe('dropdown list width', () => {
  let grid: DropdownWidthPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new DropdownWidthPage(page, theme, bundle);
    await grid.goto();
  });

  test('trimDropdown:false — short options: list rows are at least as wide as the edited cell', async () => {
    await grid.openDropdownAt(0, 1);

    const cellBox = await grid.cell(0, 1).boundingBox();
    const listBox = await grid.dropdownList().boundingBox();
    const rowBox = await grid.firstListRowCell().boundingBox();

    if (!cellBox || !listBox || !rowBox) {
      throw new Error('cell, list, or list row is not rendered');
    }

    // The list table and the actual option rows (click/highlight targets)
    // must both span at least the cell width; small tolerance for the 2px
    // border compensation that differs between the classic and CSS-var themes.
    expect(listBox.width).toBeGreaterThanOrEqual(cellBox.width - 3);
    expect(rowBox.width).toBeGreaterThanOrEqual(cellBox.width - 5);
  });

  test('trimDropdown:false — long options: list still grows wider than the edited cell', async () => {
    await grid.openDropdownAt(0, 2);

    const cellBox = await grid.cell(0, 2).boundingBox();
    const listBox = await grid.dropdownList().boundingBox();

    if (!cellBox || !listBox) {
      throw new Error('cell or list is not rendered');
    }

    expect(listBox.width).toBeGreaterThan(cellBox.width + 20);
  });

  test('trimDropdown default — list keeps matching the edited cell width', async () => {
    await grid.openDropdownAt(0, 3);

    const cellBox = await grid.cell(0, 3).boundingBox();
    const listBox = await grid.dropdownList().boundingBox();

    if (!cellBox || !listBox) {
      throw new Error('cell or list is not rendered');
    }

    expect(Math.abs(listBox.width - cellBox.width)).toBeLessThanOrEqual(3);
  });
});
