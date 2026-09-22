import type { HotInstance } from '../../../core/types';
import type { SettleCallback } from '../utils';
import { BaseAction } from './_base';
import { RemoveRowAction } from './removeRow';
import { NESTED_ROWS_DETACH_SOURCE } from './nestedRowsDetachSource';

interface NestedRow {
  __children?: NestedRow[];
  [key: string]: unknown;
}

interface NestedRowsDataManager {
  getData: () => NestedRow[] | null;
  getDataObject: (row: number) => NestedRow | null | undefined;
  getRowIndex: (row: NestedRow) => number | null;
  getRowIndexByTreePath: (path: number[] | null) => number | null;
  getRowParent: (row: NestedRow) => NestedRow | null;
  getRowTreePath: (row: number) => number[] | null;
  detachFromParent: (row: NestedRow, forceRender?: boolean, source?: string) => void;
}

/**
 * Returns the active NestedRows data manager when nested rows can process an undo action.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {object|null} The data manager, or `null` when NestedRows is unavailable.
 */
function getNestedRowsDataManager(hot: HotInstance): NestedRowsDataManager | null {
  const nestedRows = hot.getPlugin('nestedRows');

  return nestedRows.enabled && nestedRows.dataManager ? nestedRows.dataManager : null;
}

/**
 * Finds the tree path the detached root will occupy after the move completes.
 *
 * @param {object} dataManager The NestedRows data manager.
 * @param {object} row The child being detached.
 * @returns {Array<number>|null} The detached row's destination path.
 */
function getDetachedRowPath(dataManager: NestedRowsDataManager, row: NestedRow): number[] | null {
  const parent = dataManager.getRowParent(row);

  if (parent === null) {
    return null;
  }

  const grandparent = dataManager.getRowParent(parent);

  if (grandparent === null) {
    const roots = dataManager.getData();

    return roots === null ? null : [roots.length];
  }

  const grandparentPhysicalRow = dataManager.getRowIndex(grandparent);

  if (grandparentPhysicalRow === null) {
    return null;
  }

  const grandparentPath = dataManager.getRowTreePath(grandparentPhysicalRow);

  if (grandparentPath === null) {
    return null;
  }

  return [...grandparentPath, grandparent.__children?.length ?? 0];
}

/**
 * Counts the HyperFormula history entries that one detach creates.
 *
 * Formulas records one removal, one insertion, and one `setCellContents` call per rewritten cell.
 * The count travels with the action so Formula's history can advance as one grid action.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} amount Number of rows in the detached subtree.
 * @returns {number} Number of Formula undo or redo steps.
 */
function getFormulasUndoRedoSteps(hot: HotInstance, amount: number): number {
  return 2 + (amount * hot.countSourceCols());
}

/**
 * Removes the detached subtree without settling the enclosing action until its original snapshot is restored.
 *
 * NestedRows expands removal of the root into all of its descendants. Passing the physical subtree length to
 * `alter()` would instead select unrelated visible rows when some descendants are trimmed or collapsed.
 *
 * A detached root can itself be trimmed by NestedRows or another trimming map. Clear its flags long enough to resolve
 * its visual coordinate, and restore them if a remove hook vetoes the removal.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {number} physicalRow Physical row of the detached subtree.
 * @returns {boolean} `true` when the removal fired its completion hook.
 */
function removeDetachedRows(hot: HotInstance, physicalRow: number): boolean {
  const trimmedMaps = Array.from(hot.rowIndexMapper.trimmingMapsCollection.collection.values())
    .filter(map => map.getValueAtIndex(physicalRow) === true);
  let wasRemoved = false;
  const onAfterRemoveRow = () => {
    wasRemoved = true;
  };

  hot.addHookOnce('afterRemoveRow', onAfterRemoveRow);

  try {
    hot.batchExecution(() => {
      trimmedMaps.forEach((map) => {
        map.setValueAtIndex(physicalRow, false);
      });
    }, true);

    const visualRow = hot.toVisualRow(physicalRow);

    if (typeof visualRow !== 'number' || !Number.isInteger(visualRow)) {
      return false;
    }

    hot.alter('remove_row', visualRow, 1, 'UndoRedo.undo');
  } finally {
    if (!wasRemoved) {
      hot.removeHook('afterRemoveRow', onAfterRemoveRow);
      hot.batchExecution(() => {
        trimmedMaps.forEach((map) => {
          map.setValueAtIndex(physicalRow, true);
        });
      }, true);
    }
  }

  return wasRemoved;
}

/**
 * Action that tracks moving a NestedRows child out of its parent.
 *
 * @class NestedRowsDetachAction
 * @private
 */
export class NestedRowsDetachAction extends BaseAction {
  /**
   * Tree path of the child before it was detached.
   */
  rowPath;
  /**
   * Tree path the child occupies while detached.
   */
  detachedRowPath;
  /**
   * Number of physical rows in the moved subtree.
   */
  amount;
  /**
   * Snapshot of the removal leg, including nested-row state, metadata, and merged-cell anchors.
   */
  removeAction;
  /**
   * Number of HyperFormula history entries created by this action.
   */
  formulasUndoRedoSteps;

  /**
   * Initializes a NestedRows detach action with both tree positions and the existing removal snapshot.
   */
  constructor({
    rowPath,
    detachedRowPath,
    amount,
    removeAction,
    formulasUndoRedoSteps,
  }: {
    rowPath: number[];
    detachedRowPath: number[];
    amount: number;
    removeAction: RemoveRowAction;
    formulasUndoRedoSteps: number;
  }) {
    super('nested_rows_detach');
    this.rowPath = rowPath;
    this.detachedRowPath = detachedRowPath;
    this.amount = amount;
    this.removeAction = removeAction;
    this.formulasUndoRedoSteps = formulasUndoRedoSteps;
  }

  /**
   * Captures a NestedRows detach from its remove-row hook.
   *
   * @param {Core} hot The Handsontable instance.
   * @param {number} index Physical row index of the removed child.
   * @param {number} amount Number of rows in the moved subtree.
   * @param {unknown} logicRows Physical rows that the detach removes.
   * @returns {NestedRowsDetachAction|null} The action, or `null` when the tree cannot be captured.
   */
  static create(
    hot: HotInstance, index: number, amount: number, logicRows: unknown
  ): NestedRowsDetachAction | null {
    const removeAction = RemoveRowAction.create(hot, index, amount, logicRows, NESTED_ROWS_DETACH_SOURCE);
    const dataManager = getNestedRowsDataManager(hot);

    if (removeAction === null || dataManager === null) {
      return null;
    }

    const row = dataManager.getDataObject(removeAction.index);
    const rowPath = dataManager.getRowTreePath(removeAction.index);

    if (!row || rowPath === null) {
      return null;
    }

    const detachedRowPath = getDetachedRowPath(dataManager, row);

    if (detachedRowPath === null) {
      return null;
    }

    return new NestedRowsDetachAction({
      rowPath,
      detachedRowPath,
      amount,
      removeAction,
      formulasUndoRedoSteps: getFormulasUndoRedoSteps(hot, amount),
    });
  }

  /**
   * Registers the `beforeRemoveRow` listener that turns NestedRows' remove/create pair into one action.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    type UndoRedoPlugin = {
      done: (wrappedAction: () => NestedRowsDetachAction | null, source: string) => void;
    };
    const plugin = undoRedoPlugin as UndoRedoPlugin;

    hot.addHook('beforeRemoveRow', (index: number, amount: number, logicRows: unknown, source: string) => {
      if (source !== NESTED_ROWS_DETACH_SOURCE) {
        return;
      }

      plugin.done(() => NestedRowsDetachAction.create(hot, index, amount, logicRows), source);
    });
  }

  /**
   * Reports whether the detached subtree and the original removal snapshot can both be restored.
   *
   * @param {Core} hot The Handsontable instance.
   * @returns {boolean} `true` when undo can proceed.
   */
  canUndo(hot: HotInstance): boolean {
    const dataManager = getNestedRowsDataManager(hot);

    if (dataManager === null) {
      return false;
    }

    const detachedPhysicalRow = dataManager.getRowIndexByTreePath(this.detachedRowPath);

    return typeof detachedPhysicalRow === 'number' &&
      Number.isInteger(detachedPhysicalRow) &&
      hot.rowIndexMapper.getIndexesSequence().includes(detachedPhysicalRow) &&
      this.removeAction.canUndo(hot);
  }

  /**
   * Removes the detached subtree, then reuses RemoveRowAction's snapshot to restore the original tree slot.
   *
   * @param {Core} hot The Handsontable instance.
   * @param {Function} undoneCallback The callback to call once undo finishes.
   */
  undo(hot: HotInstance, undoneCallback: SettleCallback) {
    const dataManager = getNestedRowsDataManager(hot);
    const detachedPhysicalRow = dataManager?.getRowIndexByTreePath(this.detachedRowPath) ?? null;

    if (typeof detachedPhysicalRow !== 'number' || !Number.isInteger(detachedPhysicalRow) ||
        !removeDetachedRows(hot, detachedPhysicalRow)) {
      undoneCallback({ wasUndone: false });

      return;
    }

    this.removeAction.undo(hot, undoneCallback);
  }

  /**
   * Reports whether the child is back in its original parent slot and can be detached again.
   *
   * @param {Core} hot The Handsontable instance.
   * @returns {boolean} `true` when redo can proceed.
   */
  canRedo(hot: HotInstance): boolean {
    const dataManager = getNestedRowsDataManager(hot);

    if (dataManager === null) {
      return false;
    }

    const physicalRow = dataManager.getRowIndexByTreePath(this.rowPath);
    const row = physicalRow === null ? null : dataManager.getDataObject(physicalRow);

    return row !== null && row !== undefined && dataManager.getRowParent(row) !== null;
  }

  /**
   * Replays the original detach through the NestedRows data manager.
   *
   * @param {Core} hot The Handsontable instance.
   * @param {Function} redoneCallback The callback to call once redo finishes.
   */
  redo(hot: HotInstance, redoneCallback: SettleCallback) {
    const dataManager = getNestedRowsDataManager(hot);
    const physicalRow = dataManager?.getRowIndexByTreePath(this.rowPath) ?? null;
    const row = physicalRow === null ? null : dataManager?.getDataObject(physicalRow);

    if (!row || dataManager === null || dataManager.getRowParent(row) === null) {
      redoneCallback({ wasRedone: false });

      return;
    }

    let hasRendered = false;
    const onAfterViewRender = () => {
      hasRendered = true;
      redoneCallback();
    };

    hot.addHookOnce('afterViewRender', onAfterViewRender);

    try {
      dataManager.detachFromParent(row, true, 'UndoRedo.redo');
    } catch (error) {
      if (!hasRendered) {
        hot.removeHook('afterViewRender', onAfterViewRender);
      }

      throw error;
    }
  }
}
