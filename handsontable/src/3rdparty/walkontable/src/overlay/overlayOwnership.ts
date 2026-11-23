import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_END_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_INLINE_END,
  CLONE_INLINE_START,
  CLONE_TOP,
  CLONE_TOP_INLINE_END_CORNER,
  CLONE_TOP_INLINE_START_CORNER,
} from './constants';

/**
 * The name of the master table (`baseTable.ts`). It is not a clone type, so it has no `CLONE_*` constant.
 */
export const MASTER_TABLE = 'master';

/**
 * The frozen layout a cell's owning table is resolved from: the totals of both axes and the number of
 * frozen tracks on each edge, in renderable indexes.
 */
export interface OverlayOwnershipLayout {
  totalRows: number;
  totalColumns: number;
  fixedRowsTop: number;
  fixedRowsBottom: number;
  fixedColumnsStart: number;
  fixedColumnsEnd: number;
}

/**
 * Resolves the one table that owns a cell: the topmost overlay that draws it, or the master table when no
 * overlay does. A cell can be drawn by up to four tables at once (a cell of a frozen row and a frozen column
 * is in the master, the top clone, the inline-start clone and the corner); the owner is the copy the user
 * sees and the one that takes the browser focus.
 *
 * A header is resolved like a cell: a column header has a negative row, which is before any frozen top row,
 * so it belongs to the top clone or a top corner; a row header has a negative column, so it belongs to the
 * inline-start clone or a start corner.
 *
 * @param {OverlayOwnershipLayout} layout The frozen layout.
 * @param {number} row The renderable row index, negative for a column header.
 * @param {number} column The renderable column index, negative for a row header.
 * @returns {string} The owning clone's type (a `CLONE_*` constant), or `MASTER_TABLE`.
 */
export function resolveOwningOverlay(layout: OverlayOwnershipLayout, row: number, column: number): string {
  const { totalRows, totalColumns, fixedRowsTop, fixedRowsBottom, fixedColumnsStart, fixedColumnsEnd } = layout;
  const isInTopRows = row < fixedRowsTop;
  const isInStartColumns = column < fixedColumnsStart;
  const isInEndColumns = fixedColumnsEnd > 0 && column >= totalColumns - fixedColumnsEnd;
  const isAtOrAfterBottomRows = row >= totalRows - fixedRowsBottom;
  const isInBottomRows = row < totalRows && isAtOrAfterBottomRows;

  if (isInTopRows) {
    return resolveTopOwner(isInStartColumns, isInEndColumns);
  }
  // The start corner takes a row past the last one too, as the lookup always did.
  if (isInStartColumns && isAtOrAfterBottomRows) {
    return CLONE_BOTTOM_INLINE_START_CORNER;
  }
  if (isInEndColumns && isInBottomRows) {
    return CLONE_BOTTOM_INLINE_END_CORNER;
  }
  if (isInStartColumns) {
    return CLONE_INLINE_START;
  }
  if (isInEndColumns) {
    return CLONE_INLINE_END;
  }

  return isInBottomRows ? CLONE_BOTTOM : MASTER_TABLE;
}

/**
 * Resolves the owner of a cell in the frozen top rows (or of a column header).
 *
 * @param {boolean} isInStartColumns Whether the cell is in the frozen start columns (or is a row header).
 * @param {boolean} isInEndColumns Whether the cell is in the frozen end columns.
 * @returns {string} The owning clone's type.
 */
function resolveTopOwner(isInStartColumns: boolean, isInEndColumns: boolean): string {
  if (isInStartColumns) {
    return CLONE_TOP_INLINE_START_CORNER;
  }

  return isInEndColumns ? CLONE_TOP_INLINE_END_CORNER : CLONE_TOP;
}

/**
 * The overlays a clone type is looked up in, by the name each one has on `Overlays`.
 */
export interface OverlaysByType<T> {
  topOverlay?: T;
  bottomOverlay?: T;
  inlineStartOverlay?: T;
  inlineEndOverlay?: T;
  topInlineStartCornerOverlay?: T;
  topInlineEndCornerOverlay?: T;
  bottomInlineStartCornerOverlay?: T;
  bottomInlineEndCornerOverlay?: T;
}

/**
 * Returns the overlay of the given clone type.
 *
 * @param {OverlaysByType} overlays The overlays.
 * @param {string} cloneType The clone type (a `CLONE_*` constant).
 * @returns {*} The overlay, or `undefined` for a name that is no clone type or an overlay that does not exist.
 */
export function getOverlayOfType<T>(overlays: OverlaysByType<T>, cloneType: string): T | undefined {
  switch (cloneType) {
    case CLONE_TOP_INLINE_START_CORNER: return overlays.topInlineStartCornerOverlay;
    case CLONE_TOP_INLINE_END_CORNER: return overlays.topInlineEndCornerOverlay;
    case CLONE_TOP: return overlays.topOverlay;
    case CLONE_BOTTOM_INLINE_START_CORNER: return overlays.bottomInlineStartCornerOverlay;
    case CLONE_BOTTOM_INLINE_END_CORNER: return overlays.bottomInlineEndCornerOverlay;
    case CLONE_INLINE_START: return overlays.inlineStartOverlay;
    case CLONE_INLINE_END: return overlays.inlineEndOverlay;
    case CLONE_BOTTOM: return overlays.bottomOverlay;
    default: return undefined;
  }
}
