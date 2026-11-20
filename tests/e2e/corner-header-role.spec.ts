import { test, expect } from '../fixtures/test';
import { CornerHeaderRolePage } from '../fixtures/pages/CornerHeaderRolePage';

/**
 * The corner header above the row headers is a plain grid cell. It carries no name of its own, so a
 * control rendered into it (the RowSelection "select all" checkbox) is what names it.
 */
test.describe('corner header role and name', () => {
  let grid: CornerHeaderRolePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CornerHeaderRolePage(page, theme, bundle);
    await grid.goto();
  });

  test('is an unnamed grid cell on a grid with row and column headers', async() => {
    const corner = grid.cornerCells();

    await expect(corner).toHaveCount(1);
    await expect(corner).toHaveAttribute('role', 'gridcell');
    await expect(corner).not.toHaveAttribute('aria-label');
    await expect(corner).toHaveAccessibleName('');

    expect(await grid.cornerAttributesInEveryOverlay(1)).toEqual([
      { overlay: 'ht_master', role: 'gridcell', ariaLabel: null },
      { overlay: 'ht_clone_top', role: 'gridcell', ariaLabel: null },
      { overlay: 'ht_clone_inline_start', role: 'gridcell', ariaLabel: null },
      { overlay: 'ht_clone_top_inline_start_corner', role: 'gridcell', ariaLabel: null },
    ]);
  });

  test('takes its name from the RowSelection "select all" checkbox it holds', async() => {
    await grid.rebuild({ rowSelection: true });

    const corners = grid.cornerCells();
    const checkbox = grid.selectAllCheckbox();

    await expect(corners).toHaveCount(2);
    await expect(checkbox).toHaveAccessibleName('Select all rows (0 of 5 selected)');

    for (const corner of await corners.all()) {
      await expect(corner).toHaveAttribute('role', 'gridcell');
      await expect(corner).not.toHaveAttribute('aria-label');
    }

    await expect(grid.cornerCellWithSelectAll()).toHaveCount(1);
    await expect(grid.cornerCellWithSelectAll()).toHaveAccessibleName('Select all rows (0 of 5 selected)');
  });

  test('carries no role and no name with ariaTags turned off', async() => {
    await grid.rebuild({ ariaTags: false });

    const corner = grid.cornerCells();

    await expect(corner).toHaveCount(1);
    await expect(corner).not.toHaveAttribute('role');
    await expect(corner).not.toHaveAttribute('aria-label');

    expect(await grid.cornerAttributesInEveryOverlay(1)).toEqual([
      { overlay: 'ht_master', role: null, ariaLabel: null },
      { overlay: 'ht_clone_top', role: null, ariaLabel: null },
      { overlay: 'ht_clone_inline_start', role: null, ariaLabel: null },
      { overlay: 'ht_clone_top_inline_start_corner', role: null, ariaLabel: null },
    ]);
  });

  test('stays an unnamed grid cell after row selection is turned on and off', async() => {
    await grid.updateSettings({ rowSelection: true });
    await expect(grid.cornerCells()).toHaveCount(2);
    await expect(grid.selectAllCheckbox()).toBeVisible();

    await grid.updateSettings({ rowSelection: false });

    const corner = grid.cornerCells();

    await expect(corner).toHaveCount(1);
    await expect(grid.selectAllCheckbox()).toHaveCount(0);
    await expect(corner).toHaveAttribute('role', 'gridcell');
    await expect(corner).not.toHaveAttribute('aria-label');
    await expect(corner).toHaveAccessibleName('');

    expect(await grid.cornerAttributesInEveryOverlay(1)).toEqual([
      { overlay: 'ht_master', role: 'gridcell', ariaLabel: null },
      { overlay: 'ht_clone_top', role: 'gridcell', ariaLabel: null },
      { overlay: 'ht_clone_inline_start', role: 'gridcell', ariaLabel: null },
      { overlay: 'ht_clone_top_inline_start_corner', role: 'gridcell', ariaLabel: null },
    ]);
  });
});
