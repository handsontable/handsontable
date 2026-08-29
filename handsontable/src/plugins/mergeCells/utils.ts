import type { HotInstance } from '../../core/types';

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
export function toMergeAreaKey(
  { row, col, rowspan, colspan }: { row: number, col: number, rowspan: number, colspan: number }
): string {
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
