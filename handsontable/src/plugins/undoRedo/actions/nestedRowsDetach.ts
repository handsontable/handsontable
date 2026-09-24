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
  countChildren: (row: NestedRow) => number;
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
 * Resolves the subtree root stored at a tree path, if it still matches the captured subtree.
 *
 * Undo and redo run in stack order, so the tree normally has the shape the action captured. The size check guards
 * against a tree changed outside UndoRedo: without it, the path could resolve to another row, and undo would remove
 * or restore the wrong subtree.
 *
 * @param {object} dataManager The NestedRows data manager.
 * @param {Array<number>} path The tree path of the subtree root.
 * @param {number} amount The number of rows the subtree had when the action was captured.
 * @returns {object|null} The physical row and data object of the root, or `null` when the path no longer matches.
 */
function resolveSubtree(
  dataManager: NestedRowsDataManager, path: number[], amount: number
): { physicalRow: number, row: NestedRow } | null {
  const physicalRow = dataManager.getRowIndexByTreePath(path);

  if (typeof physicalRow !== 'number' || !Number.isInteger(physicalRow)) {
    return null;
  }

  const row = dataManager.getDataObject(physicalRow);

  // `amount` comes from the same count when NestedRows emits the detach's `beforeRemoveRow`.
  if (!row || dataManager.countChildren(row) + 1 !== amount) {
    return null;
  }

  return { physicalRow, row };
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
   * Registers the listeners that turn NestedRows' remove/create pair into one action.
   *
   * The action is captured on `beforeRemoveRow`, before the tree changes, with a predicted destination path.
   * `afterDetachChild` then replaces that prediction with the path the row actually landed on, so a listener that
   * reshapes the tree during the detach cannot leave the action pointing at another row. The prediction stays
   * as the fallback when the detach throws before `afterDetachChild` fires.
   */
  static startRegisteringEvents(hot: HotInstance, undoRedoPlugin: unknown) {
    type UndoRedoPlugin = {
      done: (wrappedAction: () => NestedRowsDetachAction | null, source: string) => void;
    };
    const plugin = undoRedoPlugin as UndoRedoPlugin;
    let pendingAction: NestedRowsDetachAction | null = null;

    hot.addHook('beforeRemoveRow', (index: number, amount: number, logicRows: unknown, source: string) => {
      if (source !== NESTED_ROWS_DETACH_SOURCE) {
        return;
      }

      pendingAction = null;
      plugin.done(() => {
        pendingAction = NestedRowsDetachAction.create(hot, index, amount, logicRows);

        return pendingAction;
      }, source);
    });

    hot.addHook('afterDetachChild', (_parent: unknown, _element: unknown, finalElementRowIndex: unknown,
                                     source?: string) => {
      const action = pendingAction;

      // A detach that moves nothing fires `afterDetachChild` without `beforeRemoveRow`, so the pending action
      // is cleared on every call. Otherwise a later no-op detach could rewrite a stale action.
      pendingAction = null;

      if (action === null || source !== NESTED_ROWS_DETACH_SOURCE || typeof finalElementRowIndex !== 'number') {
        return;
      }

      const detachedRowPath = getNestedRowsDataManager(hot)?.getRowTreePath(finalElementRowIndex) ?? null;

      if (detachedRowPath !== null) {
        action.detachedRowPath = detachedRowPath;
      }
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

    const subtree = resolveSubtree(dataManager, this.detachedRowPath, this.amount);

    return subtree !== null &&
      hot.rowIndexMapper.getIndexesSequence().includes(subtree.physicalRow) &&
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
    const subtree = dataManager === null ? null : resolveSubtree(dataManager, this.detachedRowPath, this.amount);

    if (subtree === null || !removeDetachedRows(hot, subtree.physicalRow)) {
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

    const subtree = resolveSubtree(dataManager, this.rowPath, this.amount);

    return subtree !== null && dataManager.getRowParent(subtree.row) !== null;
  }

  /**
   * Replays the original detach through the NestedRows data manager.
   *
   * @param {Core} hot The Handsontable instance.
   * @param {Function} redoneCallback The callback to call once redo finishes.
   */
  redo(hot: HotInstance, redoneCallback: SettleCallback) {
    const dataManager = getNestedRowsDataManager(hot);
    const subtree = dataManager === null ? null : resolveSubtree(dataManager, this.rowPath, this.amount);

    if (dataManager === null || subtree === null || dataManager.getRowParent(subtree.row) === null) {
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
      dataManager.detachFromParent(subtree.row, true, 'UndoRedo.redo');
    } catch (error) {
      if (!hasRendered) {
        hot.removeHook('afterViewRender', onAfterViewRender);
      }

      throw error;
    }
  }
}
