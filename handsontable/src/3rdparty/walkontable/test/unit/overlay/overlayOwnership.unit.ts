import { MASTER_TABLE, resolveOwningOverlay } from 'walkontable/overlay/overlayOwnership';
import type { OverlayOwnershipLayout } from 'walkontable/overlay/overlayOwnership';

/**
 * Builds a layout of a 10 by 8 grid with the given frozen counts.
 *
 * @param {Partial<OverlayOwnershipLayout>} fixed The frozen counts.
 * @returns {OverlayOwnershipLayout}
 */
function layout(fixed: Partial<OverlayOwnershipLayout> = {}): OverlayOwnershipLayout {
  return {
    totalRows: 10,
    totalColumns: 8,
    fixedRowsTop: 0,
    fixedRowsBottom: 0,
    fixedColumnsStart: 0,
    fixedColumnsEnd: 0,
    ...fixed,
  };
}

/**
 * The lookup `getCell(coords, topmost)` made before the rule was extracted, kept as the reference the
 * extracted rule is compared with over every combination.
 *
 * @param {OverlayOwnershipLayout} grid The frozen layout.
 * @param {number} row The row.
 * @param {number} col The column.
 * @returns {string}
 */
function referenceOwner(grid: OverlayOwnershipLayout, row: number, col: number): string {
  const { totalRows, totalColumns, fixedRowsTop, fixedRowsBottom, fixedColumnsStart, fixedColumnsEnd } = grid;
  const isInEndColumns = fixedColumnsEnd > 0 && col >= totalColumns - fixedColumnsEnd;

  if (row < fixedRowsTop && col < fixedColumnsStart) {
    return 'top_inline_start_corner';
  } else if (row < fixedRowsTop && isInEndColumns) {
    return 'top_inline_end_corner';
  } else if (row < fixedRowsTop) {
    return 'top';
  } else if (col < fixedColumnsStart && row >= totalRows - fixedRowsBottom) {
    return 'bottom_inline_start_corner';
  } else if (isInEndColumns && row < totalRows && row >= totalRows - fixedRowsBottom) {
    return 'bottom_inline_end_corner';
  } else if (col < fixedColumnsStart) {
    return 'inline_start';
  } else if (isInEndColumns) {
    return 'inline_end';
  } else if (row < totalRows && row >= totalRows - fixedRowsBottom) {
    return 'bottom';
  }

  return 'master';
}

describe('resolveOwningOverlay', () => {
  const frozen = layout({ fixedRowsTop: 2, fixedRowsBottom: 2, fixedColumnsStart: 2, fixedColumnsEnd: 2 });

  it.each([
    // [description, row, column, owner]
    ['a cell no pane covers', 4, 4, MASTER_TABLE],
    ['a frozen top row', 1, 4, 'top'],
    ['a frozen bottom row', 8, 4, 'bottom'],
    ['a frozen start column', 4, 1, 'inline_start'],
    ['a frozen end column', 4, 6, 'inline_end'],
    ['the top start corner', 0, 0, 'top_inline_start_corner'],
    ['the top end corner', 1, 7, 'top_inline_end_corner'],
    ['the bottom start corner', 9, 1, 'bottom_inline_start_corner'],
    ['the bottom end corner', 8, 6, 'bottom_inline_end_corner'],
    ['the last scrollable row', 7, 4, MASTER_TABLE],
    ['the first scrollable column', 4, 2, MASTER_TABLE],
    ['the last scrollable column', 4, 5, MASTER_TABLE],
  ])('gives %s to its overlay', (_, row, column, owner) => {
    expect(resolveOwningOverlay(frozen, row, column)).toBe(owner);
  });

  it.each([
    ['a column header', -1, 4, 'top'],
    ['a column header of a frozen start column', -1, 0, 'top_inline_start_corner'],
    ['a column header of a frozen end column', -1, 7, 'top_inline_end_corner'],
    ['a row header', 4, -1, 'inline_start'],
    ['a row header of a frozen top row', 0, -1, 'top_inline_start_corner'],
    ['a row header of a frozen bottom row', 9, -1, 'bottom_inline_start_corner'],
    ['the corner cell', -1, -1, 'top_inline_start_corner'],
  ])('gives %s to the overlay that draws it', (_, row, column, owner) => {
    expect(resolveOwningOverlay(frozen, row, column)).toBe(owner);
  });

  it('gives the headers of a grid with no frozen track to the header overlays', () => {
    const plain = layout();

    expect(resolveOwningOverlay(plain, -1, 3)).toBe('top');
    expect(resolveOwningOverlay(plain, 3, -1)).toBe('inline_start');
    expect(resolveOwningOverlay(plain, -1, -1)).toBe('top_inline_start_corner');
    expect(resolveOwningOverlay(plain, 3, 3)).toBe(MASTER_TABLE);
  });

  it('gives no cell to the end overlays while no end column is frozen', () => {
    const plain = layout({ totalColumns: 0 });

    expect(resolveOwningOverlay(plain, 3, 0)).toBe(MASTER_TABLE);
  });

  it('resolves every cell and header as the lookup did before the rule was extracted', () => {
    const counts = [0, 1, 3];
    let compared = 0;

    counts.forEach((fixedRowsTop) => {
      counts.forEach((fixedRowsBottom) => {
        counts.forEach((fixedColumnsStart) => {
          counts.forEach((fixedColumnsEnd) => {
            [0, 1, 6].forEach((totalRows) => {
              const grid = layout({
                totalRows, totalColumns: 6, fixedRowsTop, fixedRowsBottom, fixedColumnsStart, fixedColumnsEnd,
              });

              for (let row = -2; row <= totalRows + 1; row++) {
                for (let column = -2; column <= 7; column++) {
                  expect([row, column, resolveOwningOverlay(grid, row, column)])
                    .toEqual([row, column, referenceOwner(grid, row, column)]);
                  compared += 1;
                }
              }
            });
          });
        });
      });
    });

    expect(compared).toBeGreaterThan(10000);
  });
});
