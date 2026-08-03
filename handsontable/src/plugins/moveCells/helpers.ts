import type { HotInstance } from '../../core/types';
import { hasOwnProperty } from '../../helpers/object';

/**
 * The cell-meta keys that travel with a moved cell. Exported because the UndoRedo `MoveCellsAction`
 * must restore exactly this set — a key added here but missed there would silently stop being undone.
 */
export const MOVABLE_META_KEYS: ReadonlyArray<string> = ['className'];

interface ClampMoveTargetOptions {
  pointerRow: number;
  pointerCol: number;
  grabRowOffset: number;
  grabColOffset: number;
  rangeHeight: number;
  rangeWidth: number;
  totalRows: number;
  totalCols: number;
}

/**
 * Computes the clamped top-left target cell for a move.
 *
 * @param {ClampMoveTargetOptions} options The pointer, grab offset, range dimensions, and grid extents.
 * @returns {{ row: number, col: number }} The clamped top-left target coordinates.
 */
export function clampMoveTarget({
  pointerRow, pointerCol, grabRowOffset, grabColOffset,
  rangeHeight, rangeWidth, totalRows, totalCols,
}: ClampMoveTargetOptions): { row: number, col: number } {
  const rawRow = pointerRow - grabRowOffset;
  const rawCol = pointerCol - grabColOffset;
  const maxRow = Math.max(0, totalRows - rangeHeight);
  const maxCol = Math.max(0, totalCols - rangeWidth);

  return {
    row: Math.min(Math.max(0, rawRow), maxRow),
    col: Math.min(Math.max(0, rawCol), maxCol),
  };
}

/**
 * A sparse record of one cell's own movable meta: the cell's visual coordinates plus only the
 * movable keys the cell carries as its own properties.
 */
export interface MovableMetaEntry {
  /**
   * The visual row index of the cell.
   */
  row: number;
  /**
   * The visual column index of the cell.
   */
  col: number;
  /**
   * The cell's own movable meta keys and their values.
   */
  meta: Record<string, unknown>;
}

/**
 * Collects the cells of a visual region that carry their own movable meta keys. The result is
 * sparse — cells without any own movable key produce no entry — so a move allocates
 * proportionally to the number of styled cells, not to the range area.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} fromRow The visual top row of the region.
 * @param {number} fromCol The visual start column of the region.
 * @param {number} toRow The visual bottom row of the region.
 * @param {number} toCol The visual end column of the region.
 * @returns {MovableMetaEntry[]}
 */
export function collectMovableMeta(
  hot: HotInstance,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
): MovableMetaEntry[] {
  const entries: MovableMetaEntry[] = [];

  for (let row = fromRow; row <= toRow; row++) {
    for (let col = fromCol; col <= toCol; col++) {
      // Transient: only the movable keys are copied out below and the meta object is discarded, so
      // materializing one per visited cell would retain memory the viewport cannot evict.
      const cellMeta = hot.getCellMetaTransient<Record<string, unknown>>(row, col);
      let meta: Record<string, unknown> | null = null;

      for (const key of MOVABLE_META_KEYS) {
        if (hasOwnProperty(cellMeta, key)) {
          meta = meta ?? {};
          meta[key] = cellMeta[key];
        }
      }

      if (meta !== null) {
        entries.push({ row, col, meta });
      }
    }
  }

  return entries;
}
