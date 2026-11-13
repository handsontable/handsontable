import type { HotInstance } from '../../core/types';

/**
 * Runs an operation without recording it on the undo stack. A view-state restore re-applies a
 * sort, filters, and merges through the public APIs, which the user did not just perform, so
 * their UndoRedo actions must not land on the stack. Core's operation scope carries the weight: it
 * suppresses recording for every journaled mutator, and keeps it for a continuation the operation
 * holds (a validator's answer) that settles later. UndoRedo's `ignoreNewActions` flag is set as well,
 * as a second guard for a transaction that would open while it runs, and is left as it was found when
 * UndoRedo is off or already ignoring new actions.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {Function} operation The operation to run.
 * @returns {*} The value the operation returns.
 */
export function withoutUndoEntry<T>(hot: HotInstance, operation: () => T): T {
  const undoRedo = hot.getPlugin('undoRedo') as
    { enabled?: boolean, ignoreNewActions: boolean } | undefined;

  return hot._getOperationScope().suppress(() => {
    if (!undoRedo?.enabled || undoRedo.ignoreNewActions) {
      return operation();
    }

    undoRedo.ignoreNewActions = true;

    try {
      return operation();
    } finally {
      undoRedo.ignoreNewActions = false;
    }
  });
}
