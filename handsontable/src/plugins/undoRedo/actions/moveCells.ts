import type { HookCallback } from '../../../core/hooks/bucket';
import type { HotInstance } from '../../../core/types';
import type CellCoords from '../../../3rdparty/walkontable/src/cell/coords';
import type CellRange from '../../../3rdparty/walkontable/src/cell/range';
import { BaseAction } from './_base';

/**
 * The meta keys that `moveCellRange` moves alongside cell data.
 */
const MOVABLE_META_KEYS: ReadonlyArray<string> = ['className'];

/**
 * A snapshot of the values and movable meta for a rectangular cell region.
 */
interface RegionSnapshot {
  /**
   * Top row of the region (visual).
   */
  fromRow: number;
  /**
   * Left column of the region (visual).
   */
  fromCol: number;
  /**
   * Bottom row of the region (visual).
   */
  toRow: number;
  /**
   * Right column of the region (visual).
   */
  toCol: number;
  /**
   * Source-format cell values (formula strings for formula cells).
   */
  data: unknown[][];
  /**
   * Flat list of per-cell movable meta, row-major order.
   */
  meta: Array<Record<string, unknown>>;
}

/**
 * Captures the source-format values and movable meta for a rectangular region.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {number} fromRow Top row of the region (visual).
 * @param {number} fromCol Left column of the region (visual).
 * @param {number} toRow Bottom row of the region (visual).
 * @param {number} toCol Right column of the region (visual).
 * @returns {RegionSnapshot}
 */
function snapshotRegion(
  hot: HotInstance,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
): RegionSnapshot {
  const data = hot.getSourceDataArray(fromRow, fromCol, toRow, toCol);
  const meta: Array<Record<string, unknown>> = [];

  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      const cellMeta = hot.getCellMeta(r, c);
      const snapshot: Record<string, unknown> = {};

      for (const key of MOVABLE_META_KEYS) {
        if (Object.prototype.hasOwnProperty.call(cellMeta, key)) {
          snapshot[key] = cellMeta[key];
        }
      }

      meta.push(snapshot);
    }
  }

  return {
    fromRow,
    fromCol,
    toRow,
    toCol,
    data,
    meta,
  };
}

/**
 * Restores a previously snapshotted region — writes both the cell values and movable meta.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {RegionSnapshot} snapshot The snapshot to restore.
 */
function restoreRegion(hot: HotInstance, snapshot: RegionSnapshot): void {
  const { fromRow, fromCol, toRow, toCol, data, meta } = snapshot;

  // Restore values through populateFromArray which triggers the normal data-write path
  // and lets the Formulas plugin re-register formula strings in HyperFormula.
  hot.populateFromArray(fromRow, fromCol, data, toRow, toCol, 'UndoRedo.undo');

  // Restore movable meta.
  let idx = 0;

  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      const cellSnapshot = meta[idx];

      for (const key of MOVABLE_META_KEYS) {
        if (Object.prototype.hasOwnProperty.call(cellSnapshot, key)) {
          hot.setCellMeta(r, c, key, cellSnapshot[key] as string);
        } else {
          hot.removeCellMeta(r, c, key);
        }
      }

      idx += 1;
    }
  }
}

/**
 * Minimal interface for the UndoRedo plugin used by action classes.
 */
interface UndoRedoPluginLike {
  // eslint-disable-next-line no-use-before-define
  done(wrappedAction: () => MoveCellsAction | null, source?: string): void;
}

/**
 * Action that tracks move-cells (drag-to-move selection) changes.
 *
 * A single undo step covers the whole move: it restores both the source region (overwritten
 * with `null` on move) and the target region (overwritten with the moved data).
 *
 * @class MoveCellsAction
 * @private
 */
export class MoveCellsAction extends BaseAction {
  /**
   * Source-region snapshot captured before the move.
   */
  sourceSnapshot;

  /**
   * Target-region snapshot captured before the move (the overwritten data).
   */
  targetSnapshot;

  /**
   * `true` when the operation was a copy (source is kept intact).
   */
  isCopy;

  /**
   * Initializes the action with snapshots of the source and target regions before the move.
   */
  constructor({
    sourceSnapshot,
    targetSnapshot,
    isCopy,
  }: {
    sourceSnapshot: RegionSnapshot;
    targetSnapshot: RegionSnapshot;
    isCopy: boolean;
  }) {
    super('move_cells');
    this.sourceSnapshot = sourceSnapshot;
    this.targetSnapshot = targetSnapshot;
    this.isCopy = isCopy;
  }

  /**
   * Registers the `beforeMoveCells` hook listener that snapshots both the source and
   * target regions before mutation, and then pushes a new `MoveCellsAction` into the
   * undo stack via the `afterMoveCells` hook.
   *
   * Note: `afterMoveCells` only fires when the move was NOT vetoed. When `beforeMoveCells`
   * returns `false` (or any guard in `moveCellRange` rejects the move), `afterMoveCells` is
   * never called, so `pendingSnapshot` is simply overwritten on the next move attempt — a
   * stale snapshot cannot enqueue a spurious undo action.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown): void {
    const plugin = undoRedoPlugin as UndoRedoPluginLike;

    type PendingSnapshot = { sourceSnapshot: RegionSnapshot; targetSnapshot: RegionSnapshot; isCopy: boolean };
    let pendingSnapshot: PendingSnapshot | null = null;

    hot.addHook('beforeMoveCells', (sourceRange: unknown, targetTopLeft: unknown, isCopy: unknown) => {
      if (sourceRange === false) {
        pendingSnapshot = null;

        return false;
      }

      // `sourceRange` and `targetTopLeft` carry the raw CellRange / CellCoords objects.
      const src = sourceRange as CellRange;
      const target = targetTopLeft as CellCoords;
      const topStart = src.getTopStartCorner();
      const bottomEnd = src.getBottomEndCorner();

      const fromRow = topStart.row!;
      const fromCol = topStart.col!;
      const toRow = bottomEnd.row!;
      const toCol = bottomEnd.col!;

      const height = toRow - fromRow + 1;
      const width = toCol - fromCol + 1;
      const targetBottom = target.row! + height - 1;
      const targetRight = target.col! + width - 1;

      // Capture both regions before any data mutation.
      const sourceSnapshot = snapshotRegion(hot, fromRow, fromCol, toRow, toCol);
      const targetSnapshot = snapshotRegion(hot, target.row!, target.col!, targetBottom, targetRight);

      pendingSnapshot = {
        sourceSnapshot,
        targetSnapshot,
        isCopy: isCopy as boolean,
      };
    });

    // afterMoveCells only fires when the move was NOT vetoed (see JSDoc on startRegisteringEvents),
    // so the snapshot here is always valid and corresponds to the move that just completed.
    hot.addHook('afterMoveCells', () => {
      if (pendingSnapshot === null) {
        return;
      }

      const snapshot = pendingSnapshot;

      pendingSnapshot = null;

      plugin.done(() => new MoveCellsAction(snapshot));
    });
  }

  /**
   * Restores the grid to the state before the move.
   *
   * For a move (not copy): restores both the source region (which was cleared) and the
   * target region (which was overwritten).
   *
   * For a copy: the source was not modified, so only the target region is restored.
   *
   * After restoring data, selects the source region to reflect the pre-move state.
   *
   * @param {HotInstance} hot The Handsontable instance.
   * @param {HookCallback} undoneCallback The callback to be called after the action is undone.
   */
  undo(hot: HotInstance, undoneCallback: HookCallback): void {
    hot.batch(() => {
      // Restore the target region to what it held before the move.
      restoreRegion(hot, this.targetSnapshot);

      if (!this.isCopy) {
        // Restore the source region which was cleared during the move.
        restoreRegion(hot, this.sourceSnapshot);
      }
    });

    hot.render();
    hot.deselectCell();

    const { fromRow, fromCol, toRow, toCol } = this.sourceSnapshot;

    hot.selectCells([[fromRow, fromCol, toRow, toCol]], false, false);

    // Call undoneCallback after the batch and selection are settled. This mirrors
    // the pattern in dataChange.ts and avoids the latent fragility of firing the
    // callback inside an afterChange hook (which would break if afterChange becomes async).
    // The undoneCallback resets ignoreNewActions in the UndoRedo plugin — calling it here
    // ensures that reset happens after all data mutations are complete.
    undoneCallback();
  }

  /**
   * Re-applies the move after it has been undone.
   *
   * After the move re-runs, selects the target region to reflect the post-move state.
   *
   * @param {HotInstance} hot The Handsontable instance.
   * @param {(wasRedone?: boolean) => void} redoneCallback The callback that settles the redo state.
   */
  redo(hot: HotInstance, redoneCallback: (wasRedone?: boolean) => void): void {
    const { fromRow, fromCol, toRow, toCol } = this.sourceSnapshot;
    const { fromRow: targetRow, fromCol: targetCol } = this.targetSnapshot;
    const height = toRow - fromRow + 1;
    const width = toCol - fromCol + 1;

    const sourceRange = hot._createCellRange(
      hot._createCellCoords(fromRow, fromCol),
      hot._createCellCoords(fromRow, fromCol),
      hot._createCellCoords(toRow, toCol),
    );
    const targetTopLeft = hot._createCellCoords(targetRow, targetCol);

    const onAfterMoveCells = () => {
      hot.render();

      // Restore selection to the target range so the user sees where the data ended up.
      const targetEndRow = targetRow + height - 1;
      const targetEndCol = targetCol + width - 1;

      hot.selectCells([[targetRow, targetCol, targetEndRow, targetEndCol]], false, false);

      redoneCallback();
    };

    hot.addHookOnce('afterMoveCells', onAfterMoveCells);

    if (!hot.getPlugin('moveCells').moveCellRange(sourceRange, targetTopLeft, this.isCopy)) {
      hot.removeHook('afterMoveCells', onAfterMoveCells);
      redoneCallback(false);
    }
  }
}
