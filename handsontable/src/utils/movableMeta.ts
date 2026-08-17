import type { HotInstance } from '../core/types';
import { hasOwnProperty } from '../helpers/object';

/**
 * The cell-meta keys that travel with a cell moved by the `moveCells` feature. Shared between the
 * MoveCells plugin (which moves the meta) and the UndoRedo `MoveCellsAction` (which must restore
 * exactly this set — a key added in one place but missed in the other would silently stop being
 * undone). It lives outside both plugins so that neither imports the other — registering just one
 * of them through the tree-shakeable `base.ts` entry must not pull the other in.
 */
export const MOVABLE_META_KEYS: ReadonlyArray<string> = ['className'];

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
