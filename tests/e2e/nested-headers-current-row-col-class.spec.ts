import { test, expect } from '../fixtures/test';
import { NestedHeadersCurrentRowColClassPage } from '../fixtures/pages/NestedHeadersCurrentRowColClassPage';

const { FALSE, HEADER, SINGLE, FLAT, CURRENT_ROW_CLASS, CURRENT_COL_CLASS, HEADER_HIGHLIGHT_CLASS } =
  NestedHeadersCurrentRowColClassPage;

/**
 * DEV-3012 (dev-handsontable#274). `currentRowClassName`/`currentColClassName` only ever painted the
 * LEAF header level - `Selection#createHeaderExtentCoords` pinned the header-axis coordinate at `-1`
 * regardless of how many header levels the grid renders, so a NestedHeaders group cell (or a second
 * row-header column) never got the class, only the innermost header did.
 *
 * Every grid shares one 2-level column-header group ("Group" spans columns 0-1) and a second
 * row-header column. Each test selects the body cell at the group's SECOND column (col 1, "B") - not
 * its origin (col 0, "A") - because selecting the origin would pass even without the NestedHeaders
 * redirect fix: the redirect that maps a `hiddenHeader` placeholder onto the group's own visible cell
 * is a no-op when the selected column is already the group's root.
 *
 * The default header-selection highlight (`ht__highlight`, `currentHeaderClassName`) shares the same
 * coordinate helper but is deliberately NOT widened by this fix - it stays leaf-only, as it always
 * has. `false grid keeps the classes on body AND header cells...` pins that scoping decision so a
 * future well-meaning "fix" does not silently widen it and break the 16 pre-existing NestedHeaders
 * selection specs that assert the leaf-only behavior on purpose.
 */
test.describe('NestedHeaders vs currentRow/ColClassName (DEV-3012)', () => {
  let grid: NestedHeadersCurrentRowColClassPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new NestedHeadersCurrentRowColClassPage(page, theme, bundle);
    await grid.goto();
  });

  test('disableVisualSelection: false - currentCol reaches the group header, currentRow reaches every row-header column', async () => {
    await grid.selectCell(FALSE, 1, 1);

    // Leaf ("B") + group ("Group") column-header cells, matched by text so hiddenHeader collapsing
    // cannot make the count pass for the wrong reason.
    await expect(grid.topCloneHeaderCells(FALSE, CURRENT_COL_CLASS)).toHaveCount(2);
    await expect(grid.topCloneHeaderCells(FALSE, CURRENT_COL_CLASS).filter({ hasText: 'Group' })).toHaveCount(1);
    await expect(grid.topCloneHeaderCells(FALSE, CURRENT_COL_CLASS).filter({ hasText: 'B' })).toHaveCount(1);

    // Default row-header column ("2") + the custom one ("#1").
    await expect(grid.inlineStartCloneHeaderCells(FALSE, CURRENT_ROW_CLASS)).toHaveCount(2);

    // The default header-selection highlight is a SEPARATE, unfixed behavior - it stays leaf-only.
    await expect(grid.topCloneHeaderCells(FALSE, HEADER_HIGHLIGHT_CLASS)).toHaveCount(1);
  });

  test("disableVisualSelection: 'header' - the row/column highlight still reaches every level", async () => {
    await grid.selectCell(HEADER, 1, 1);

    await expect(grid.topCloneHeaderCells(HEADER, CURRENT_COL_CLASS)).toHaveCount(2);
    await expect(grid.inlineStartCloneHeaderCells(HEADER, CURRENT_ROW_CLASS)).toHaveCount(2);

    // 'header' disables the header-selection highlight entirely (DEV-228), independent of this fix.
    await expect(grid.topCloneHeaderCells(HEADER, HEADER_HIGHLIGHT_CLASS)).toHaveCount(0);
  });

  test("selectionMode: 'single' - both ends of the header extent are still added", async () => {
    await grid.selectCell(SINGLE, 1, 1);

    await expect(grid.topCloneHeaderCells(SINGLE, CURRENT_COL_CLASS)).toHaveCount(2);
    await expect(grid.inlineStartCloneHeaderCells(SINGLE, CURRENT_ROW_CLASS)).toHaveCount(2);
  });

  test('a multi-cell range (from !== to on the data axis) still reaches every header level', async () => {
    // Rows 1-2, column 1 ("B") - a real range selection, not a single cell. `#applyRowColumnHighlights`
    // is unconditional since DEV-3012 (previously gated behind `selectionMode !== 'single'`); this is
    // the only test here that exercises it with `from !== to` on the data axis.
    await grid.selectCells(FALSE, 1, 1, 2, 1);

    // The column-header extent depends only on the header-level COUNT (a single column is selected),
    // so those assertions match the single-cell case exactly.
    await expect(grid.topCloneHeaderCells(FALSE, CURRENT_COL_CLASS)).toHaveCount(2);
    await expect(grid.topCloneHeaderCells(FALSE, CURRENT_COL_CLASS).filter({ hasText: 'Group' })).toHaveCount(1);
    await expect(grid.topCloneHeaderCells(FALSE, CURRENT_COL_CLASS).filter({ hasText: 'B' })).toHaveCount(1);
    // The row-header highlight spans every SELECTED row too: 2 rows x 2 row-header columns (levels).
    await expect(grid.inlineStartCloneHeaderCells(FALSE, CURRENT_ROW_CLASS)).toHaveCount(4);

    // Both selected body rows carry the class, proving `from !== to` was actually forwarded rather
    // than collapsed onto a single row.
    await expect(grid.grid(FALSE).getByTestId('cell-1-1')).toHaveClass(new RegExp(`\\b${CURRENT_ROW_CLASS}\\b`));
    await expect(grid.grid(FALSE).getByTestId('cell-2-1')).toHaveClass(new RegExp(`\\b${CURRENT_ROW_CLASS}\\b`));
  });

  test('a flat single-level grid is unaffected (regression control)', async () => {
    await grid.selectCell(FLAT, 1, 1);

    await expect(grid.topCloneHeaderCells(FLAT, CURRENT_COL_CLASS)).toHaveCount(1);
    await expect(grid.inlineStartCloneHeaderCells(FLAT, CURRENT_ROW_CLASS)).toHaveCount(1);
  });
});
