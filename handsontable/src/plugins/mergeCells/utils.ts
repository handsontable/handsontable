import type { HotInstance } from '../../core/types';
import type { Overlay } from '../../3rdparty/walkontable/src/overlay/regions/_base';
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
 * Returns the visual index of the first row rendered by the bottom overlay (`fixedRowsBottom`) that is being
 * drawn right now, or `null` when another overlay is being drawn or the bottom overlay renders no row.
 *
 * The bottom overlay renders only the frozen bottom rows, so a merged block that starts above them never has
 * its origin there. The overlay draws the part of the block it holds, starting from this row.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {number|null}
 */
export function getFirstRowOfActiveBottomOverlay(hotInstance: HotInstance): number | null {
  const overlayName = hotInstance.view.getActiveOverlayName();

  if (overlayName !== 'bottom' && overlayName !== 'bottom_inline_start_corner') {
    return null;
  }

  const overlay = hotInstance.view.getOverlayByName(overlayName) as unknown as Overlay | null;
  const firstRenderableRow = overlay?.clone?.wtTable.getFirstRenderedRow();

  if (firstRenderableRow === undefined || firstRenderableRow < 0) {
    return null;
  }

  return hotInstance.rowIndexMapper.getVisualFromRenderableIndex(firstRenderableRow);
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
