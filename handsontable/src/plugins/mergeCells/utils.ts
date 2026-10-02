import type { HotInstance } from '../../core/types';
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

const TOP_ROW_OVERLAYS = ['top', 'top_inline_start_corner', 'top_inline_end_corner'];
const START_COLUMN_OVERLAYS = ['inline_start', 'top_inline_start_corner', 'bottom_inline_start_corner'];
const END_COLUMN_OVERLAYS = ['inline_end', 'top_inline_end_corner', 'bottom_inline_end_corner'];

/**
 * Checks whether the overlay renders the `fixedColumnsEnd` columns (the inline-end clone or one of its corners).
 *
 * @param {string} overlayName The Walkontable overlay name.
 * @returns {boolean}
 */
export function isEndColumnOverlay(overlayName: string): boolean {
  return END_COLUMN_OVERLAYS.includes(overlayName);
}

/**
 * Returns the first row the active overlay renders. The top overlays always start at the first row,
 * every other overlay starts where the main table starts.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {string} overlayName The Walkontable overlay name.
 * @returns {number}
 */
export function getFirstRenderedRowOfOverlay(hotInstance: HotInstance, overlayName: string): number {
  return TOP_ROW_OVERLAYS.includes(overlayName) ? 0 : hotInstance.getFirstRenderedVisibleRow();
}

/**
 * Returns the first (visual) column the active overlay renders. The inline-start overlays always start at
 * the first column and the inline-end overlays start at the first `fixedColumnsEnd` column. Every other
 * overlay starts where the main table starts.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {string} overlayName The Walkontable overlay name.
 * @returns {number}
 */
export function getFirstRenderedColumnOfOverlay(hotInstance: HotInstance, overlayName: string): number {
  if (START_COLUMN_OVERLAYS.includes(overlayName)) {
    return 0;
  }

  if (END_COLUMN_OVERLAYS.includes(overlayName)) {
    const renderableColumn = hotInstance.view?._wt?.wtOverlays?.inlineEndOverlay?.clone?.wtTable
      ?.getFirstRenderedColumn();

    if (typeof renderableColumn === 'number' && renderableColumn >= 0) {
      const { columnIndexMapper } = hotInstance;
      const visualColumn = columnIndexMapper.getVisualFromRenderableIndex(renderableColumn);

      const nearestColumn = visualColumn === null ? null : columnIndexMapper.getNearestNotHiddenIndex(visualColumn, 1);

      if (nearestColumn !== null) {
        return nearestColumn;
      }
    }
  }

  return hotInstance.getFirstRenderedVisibleColumn() as number;
}
