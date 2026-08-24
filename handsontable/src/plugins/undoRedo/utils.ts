import type { HotInstance } from '../../core/types';
import { rangeEach } from '../../helpers/number';

/**
 * Gets all cell metas from the provided range.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} fromRow The starting row index.
 * @param {number} toRow The ending row index.
 * @param {number} fromColumn The starting column index.
 * @param {number} toColumn The ending column index.
 * @returns {Array} Returns an array of cell metas.
 */
export function getCellMetas(hot: HotInstance, fromRow: number, toRow: number, fromColumn: number, toColumn: number) {
  const cellMetas: unknown[] = [];

  rangeEach(fromColumn, toColumn, (columnIndex) => {
    rangeEach(fromRow, toRow, (rowIndex) => {
      const cellMeta = hot.getCellMeta(rowIndex, columnIndex);

      cellMetas.push([cellMeta.visualRow, cellMeta.visualCol, cellMeta]);
    });
  });

  return cellMetas;
}

interface MergedCell {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

/**
 * Collects merged cells that overlap the removed visual range along the given axis.
 * The mergeCells plugin's own `shiftCollections` logic mutates surviving merges
 * asymmetrically (a partial removal at the start cannot be reversed on `afterCreateRow`
 * / `afterCreateCol`), so on undo we must restore every overlapping merge from its
 * pre-removal state.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {'row'|'col'} axis The axis being removed — `'row'` or `'col'`.
 * @param {number} start First visual row/column being removed.
 * @param {number} amount Number of rows/columns being removed.
 * @returns {Array} Array of `{ row, col, rowspan, colspan }` objects.
 */
export function collectAffectedMergedCells(hot: HotInstance, axis: 'row' | 'col', start: number, amount: number) {
  const mergeCellsPlugin = hot.getPlugin('mergeCells');

  if (!mergeCellsPlugin?.enabled) {
    return [];
  }

  const spanProp = axis === 'row' ? 'rowspan' : 'colspan';
  const lastVisualIndex = start + amount - 1;
  const affected: MergedCell[] = [];

  mergeCellsPlugin.mergedCellsCollection?.mergedCells.forEach((mergedCell: MergedCell) => {
    const mergeStart = mergedCell[axis];
    const mergeEnd = mergeStart + mergedCell[spanProp] - 1;

    if (mergeStart <= lastVisualIndex && mergeEnd >= start) {
      const { row, col, rowspan, colspan } = mergedCell;

      affected.push({ row, col, rowspan, colspan });
    }
  });

  return affected;
}

/**
 * Re-applies merged cells affected by row/column removal. Any leftover partial merge in
 * the captured area is unmerged first so the original range can be re-merged.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {Array} mergedCells Array of `{ row, col, rowspan, colspan }` objects.
 */
export function restoreMergedCells(hot: HotInstance, mergedCells: MergedCell[]) {
  if (!mergedCells || mergedCells.length === 0) {
    return;
  }

  const mergeCellsPlugin = hot.getPlugin('mergeCells');

  if (!mergeCellsPlugin?.enabled) {
    return;
  }

  mergedCells.forEach(({ row, col, rowspan, colspan }: MergedCell) => {
    const endRow = row + rowspan - 1;
    const endCol = col + colspan - 1;
    const start = hot._createCellCoords(row, col);
    const end = hot._createCellCoords(endRow, endCol);
    const range = hot._createCellRange(start, start, end);

    mergeCellsPlugin.unmergeRange(range, true);
    mergeCellsPlugin.merge(row, col, endRow, endCol);
  });
}
