import type { HotInstance } from '../core/types';
import { hasOwnProperty } from '../helpers/object';
import { stripRendererClassNames } from '../helpers/rendererClassNames';

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
 * @param {boolean} [forClearing=false] When `true`, the entries tell which cells carry an own movable key,
 * whatever its value holds. The caller removes those keys and never writes the values. A destination
 * cell whose `className` holds only the class names a renderer appended is still cleared that way.
 * @returns {MovableMetaEntry[]}
 */
export function collectMovableMeta(
  hot: HotInstance,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  forClearing = false,
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
          // A moved `className` leaves the class names a renderer appended behind: the destination
          // is drawn by its own renderer, and a copy would hand them over as the user's own.
          const value = key === 'className' && !forClearing ?
            stripRendererClassNames(cellMeta, cellMeta[key]) :
            cellMeta[key];

          // A value that held only renderer class names has nothing of the user's to move. An empty
          // value the user set is still moved.
          if (value === '' && cellMeta[key] !== '') {
            continue; // eslint-disable-line no-continue
          }

          meta = meta ?? {};
          meta[key] = value;
        }
      }

      if (meta !== null) {
        entries.push({ row, col, meta });
      }
    }
  }

  return entries;
}
