import type { HotInstance } from '../types';

/**
 * Runs an operation without recording it on the undo stack. A view-state restore re-applies a
 * sort, filters, and merges through the public APIs, which the user did not just perform, so
 * their UndoRedo actions must not land on the stack. Runs the operation as is when UndoRedo is
 * off or already ignoring new actions, and leaves that flag as it found it.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {Function} operation The operation to run.
 * @returns {*} The value the operation returns.
 */
export function withoutUndoEntry<T>(hot: HotInstance, operation: () => T): T {
  const undoRedo = hot.getPlugin('undoRedo') as
    { enabled?: boolean, ignoreNewActions: boolean } | undefined;

  if (!undoRedo?.enabled || undoRedo.ignoreNewActions) {
    return operation();
  }

  undoRedo.ignoreNewActions = true;

  try {
    return operation();
  } finally {
    undoRedo.ignoreNewActions = false;
  }
}
