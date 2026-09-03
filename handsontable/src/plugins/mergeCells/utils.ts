import type { HotInstance } from '../../core/types';
import type { CellChange } from '../../settings';
import type { MergeAreaGeometry } from '../../utils/mergeAreas';

/**
 * Builds a comparison key from a merge area's visual geometry. Two merge areas that cover exactly
 * the same cells produce the same key, which is how a re-applied merge is told apart from a newly
 * declared one.
 *
 * @param {object} mergeArea The merge area to build the key from.
 * @param {number} mergeArea.row Visual row index of the merge area's top-left corner.
 * @param {number} mergeArea.col Visual column index of the merge area's top-left corner.
 * @param {number} mergeArea.rowspan Number of rows the merge area spans.
 * @param {number} mergeArea.colspan Number of columns the merge area spans.
 * @returns {string} The comparison key.
 */
export function toMergeAreaKey({ row, col, rowspan, colspan }: MergeAreaGeometry): string {
  return `${row},${col},${rowspan},${colspan}`;
}

/**
 * Calculates the total height of the merged cell.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {*} row The merged cell's row index.
 * @param {*} rowspan The merged cell height.
 * @returns {number}
 */
export function sumCellsHeights(hotInstance: HotInstance, row: number, rowspan: number) {
  const { rowIndexMapper, stylesHandler } = hotInstance;
  let height = 0;

  for (let i = row; i < row + rowspan; i++) {
    if (!rowIndexMapper.isHidden(i)) {
      height += hotInstance.getRowHeight(i) ?? stylesHandler.getDefaultRowHeight(i);
    }
  }

  return height;
}

/**
 * Derives the visual rectangle a set of cell changes covers. Used to answer "which merged cells
 * did this data population touch?" - both the autofill and the paste paths need it, and neither
 * gets a range handed to it: the `beforeChange`/`afterChange` hooks carry a flat list of changes,
 * so the extent has to be reconstructed from the coordinates.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {Array} changes A list of `[row, prop, ...]` change entries. Entries that are not arrays
 *   (nullified by another `beforeChange` listener) are ignored.
 * @returns {object} Object with `from` and `to` properties, both containing `row` and `column` keys.
 */
export function getRangeFromChanges(hotInstance: HotInstance, changes: (CellChange | null)[]) {
  let rowMin: number | null = null;
  let rowMax: number | null = null;
  let colMin: number | null = null;
  let colMax: number | null = null;

  changes.forEach((change) => {
    if (!Array.isArray(change)) {
      return;
    }

    const [rowIndex, prop] = change;
    // A `columns[].data` accessor function reaches `prop` as the function itself, which
    // `propToCol` cannot resolve. Core normalizes the change tuple the same way at every read
    // site (`core.ts` `processChanges`, `applyChanges`); matching it keeps this helper's behavior
    // identical to the autofill path it was extracted from.
    const columnIndex = hotInstance.propToCol(prop as string | number);

    if (rowMin === null || rowIndex < rowMin) {
      rowMin = rowIndex;
    }

    if (rowMax === null || rowIndex > rowMax) {
      rowMax = rowIndex;
    }

    if (colMin === null || columnIndex < colMin) {
      colMin = columnIndex;
    }

    if (colMax === null || columnIndex > colMax) {
      colMax = columnIndex;
    }
  });

  return {
    from: {
      row: rowMin ?? 0,
      column: colMin ?? 0
    },
    to: {
      row: rowMax ?? 0,
      column: colMax ?? 0
    }
  };
}
