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

const BOTTOM_ROW_OVERLAYS = ['bottom', 'bottom_inline_start_corner', 'bottom_inline_end_corner'];

/**
 * Returns the visual index of the first row rendered by the bottom overlay (`fixedRowsBottom`) that is being
 * drawn right now, or `null` when another overlay is being drawn or the bottom overlay renders no row. The
 * bottom overlays are the bottom clone and its two corners.
 *
 * The bottom overlay renders only the frozen bottom rows, so a merged block that starts above them never has
 * its origin there. The overlay draws the part of the block it holds, starting from this row.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @returns {number|null}
 */
export function getFirstRowOfActiveBottomOverlay(hotInstance: HotInstance): number | null {
  const overlayName = hotInstance.view.getActiveOverlayName();

  if (!BOTTOM_ROW_OVERLAYS.includes(overlayName)) {
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

/**
 * Returns the last (visual) column the active overlay renders. The inline-end overlays render the columns
 * up to the last `fixedColumnsEnd` column, whatever the main table renders. Every other overlay ends where
 * the main table ends.
 *
 * Reading the main table for the end overlays is wrong when the main table is scrolled to the start (and
 * virtualized): its last rendered column then sits before the end band, so a merge that reaches into the band
 * would get an extent that ends before it starts.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {string} overlayName The Walkontable overlay name.
 * @returns {number}
 */
export function getLastRenderedColumnOfOverlay(hotInstance: HotInstance, overlayName: string): number {
  if (END_COLUMN_OVERLAYS.includes(overlayName)) {
    const renderableColumn = hotInstance.view?._wt?.wtOverlays?.inlineEndOverlay?.clone?.wtTable
      ?.getLastRenderedColumn();

    if (typeof renderableColumn === 'number' && renderableColumn >= 0) {
      const { columnIndexMapper } = hotInstance;
      const visualColumn = columnIndexMapper.getVisualFromRenderableIndex(renderableColumn);

      if (visualColumn !== null) {
        return visualColumn;
      }
    }
  }

  return hotInstance.getLastRenderedVisibleColumn() as number;
}

/**
 * Returns the renderable columns of the frozen band the overlay renders, as `[first, last]`, or `null` for an
 * overlay that does not render a frozen column band. The inline-start overlays render the `fixedColumnsStart`
 * columns, the inline-end overlays the columns from the first `fixedColumnsEnd` column to the last one.
 *
 * @param {Core} hotInstance The Handsontable instance.
 * @param {string} overlayName The Walkontable overlay name.
 * @returns {Array<number>|null}
 */
export function getFrozenColumnBandOfOverlay(
  hotInstance: HotInstance,
  overlayName: string
): [number, number] | null {
  if (START_COLUMN_OVERLAYS.includes(overlayName)) {
    return [0, hotInstance.view.countNotHiddenFixedColumnsStart() - 1];
  }

  if (END_COLUMN_OVERLAYS.includes(overlayName)) {
    const firstColumn = hotInstance.columnIndexMapper
      .getRenderableFromVisualIndex(getFirstRenderedColumnOfOverlay(hotInstance, overlayName));

    return firstColumn === null ? null : [firstColumn, Infinity];
  }

  return null;
}

/**
 * Sums the widths of the columns of a merged block that lie outside a column band, separately for the
 * columns before the band and after it.
 *
 * @param {number} blockStart The first renderable column of the block.
 * @param {number} blockEnd The last renderable column of the block.
 * @param {Array<number>} band The first and the last renderable column of the band.
 * @param {Function} getWidth Returns the width of a renderable column.
 * @returns {{ before: number, after: number }}
 */
export function sumBlockWidthsOutsideBand(
  blockStart: number,
  blockEnd: number,
  [bandStart, bandEnd]: [number, number],
  getWidth: (renderableColumn: number) => number,
): { before: number, after: number } {
  let before = 0;
  let after = 0;

  for (let column = blockStart; column <= Math.min(blockEnd, bandStart - 1); column++) {
    before += getWidth(column);
  }

  for (let column = Math.max(blockStart, bandEnd + 1); column <= blockEnd; column++) {
    after += getWidth(column);
  }

  return { before, after };
}
