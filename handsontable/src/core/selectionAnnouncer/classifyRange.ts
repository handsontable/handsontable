/**
 * The shape of a selected range, as the selection announcement names it.
 */
export type SelectedRangeKind = 'cell' | 'range' | 'columns' | 'rows' | 'all';

/**
 * The visual edges of a selected range, clamped to the cells (headers excluded).
 */
export interface RangeEdges {
  top: number;
  start: number;
  bottom: number;
  end: number;
}

/**
 * The number of visual rows and columns of the grid.
 */
export interface GridSize {
  rowCount: number;
  columnCount: number;
}

/**
 * Tells what a selected range covers: one cell, a block of cells, whole columns, whole rows, or every cell.
 * A range counts as whole columns when it spans every row, and as whole rows when it spans every column,
 * whether a header click, a shortcut or a drag selected it. An axis with no items counts as spanned, so a
 * header range on a grid with no rows reads as columns. A grid with no rows and no columns has no cell to name,
 * so its range reads as one cell, which is not announced.
 *
 * @param {RangeEdges} edges The visual edges of the range.
 * @param {GridSize} gridSize The number of visual rows and columns of the grid.
 * @param {boolean} isMultiple `true` when the range covers more than one cell (a merged cell counts as one).
 * @returns {SelectedRangeKind}
 */
export function classifyRange(edges: RangeEdges, gridSize: GridSize, isMultiple: boolean): SelectedRangeKind {
  if (!isMultiple) {
    return 'cell';
  }

  const { rowCount, columnCount } = gridSize;

  if (rowCount === 0 && columnCount === 0) {
    return 'cell';
  }

  const spansEveryRow = rowCount === 0 || (edges.top === 0 && edges.bottom === rowCount - 1);
  const spansEveryColumn = columnCount === 0 || (edges.start === 0 && edges.end === columnCount - 1);

  if (spansEveryRow && spansEveryColumn) {
    return 'all';
  }

  if (spansEveryRow) {
    return 'columns';
  }

  if (spansEveryColumn) {
    return 'rows';
  }

  return 'range';
}
