import { test, expect } from '../fixtures/test';
import { GhostTableCellClassPage } from '../fixtures/pages/GhostTableCellClassPage';

/**
 * DEV-2126. A per-cell CSS class that changes the cell's geometry must reach the hidden GhostTable
 * both auto-size plugins measure. When it does not, AutoRowSize records the default height while
 * the master renders the row at its real height — the row-header overlay then sits shorter than the
 * data cells and every row below it drifts — and AutoColumnSize sizes the column for unstyled
 * content.
 */
test.describe('per-cell className and the auto-size plugins', () => {
  let grid: GhostTableCellClassPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new GhostTableCellClassPage(page, theme, bundle);
    await grid.goto();
  });

  test('records the classed cell in the measured row height', async () => {
    const tall = await grid.rowHeightSetting(GhostTableCellClassPage.TALL_ROW);
    const normal = await grid.rowHeightSetting(GhostTableCellClassPage.NORMAL_ROW);

    // The class swaps the theme's own vertical padding for 40px a side, so the row gains 60px+.
    // Asserted as a floor, not an equality: the exact total depends on the theme's own padding and
    // border widths (horizon pads the most and gains the least). When the measurement misses the
    // class the two are equal.
    expect(tall).toBeGreaterThan(normal + 50);
  });

  test('keeps the row header the same height as the data cells', async () => {
    const masterHeight = await grid.rowHeight(grid.master, GhostTableCellClassPage.TALL_ROW);
    const overlayHeight = await grid.rowHeight(
      grid.inlineStartOverlay, GhostTableCellClassPage.TALL_ROW
    );

    expect(overlayHeight).toBeCloseTo(masterHeight, 0);
  });

  test('keeps the rows below the tall one aligned between the two tables', async () => {
    const masterOffset = await grid.rowOffsetWithinTable(
      grid.master, GhostTableCellClassPage.ROW_BELOW_TALL
    );
    const overlayOffset = await grid.rowOffsetWithinTable(
      grid.inlineStartOverlay, GhostTableCellClassPage.ROW_BELOW_TALL
    );

    expect(overlayOffset).toBeCloseTo(masterOffset, 0);
  });

  test('includes the classed cell in the auto column width', async () => {
    const wide = await grid.columnWidth(GhostTableCellClassPage.WIDE_COLUMN);
    const reference = await grid.columnWidth(GhostTableCellClassPage.REFERENCE_COLUMN);

    // Same-length content in both columns; the class swaps the theme's own horizontal padding for
    // 40px a side, which puts the classed column ~48px wider on the main theme. The reference
    // column sits at the 50px minimum. When the measurement misses the class, both are equal.
    expect(wide).toBeGreaterThan(reference + 40);
  });
});
