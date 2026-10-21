import type { HotInstance } from '../core/types';

/**
 * Runs an operation with rendering and index-cache recalculation suspended, resuming both in a
 * `finally`. Unlike `Core#batch()` it is not an operation of its own, so it records no undo step:
 * it is meant for internal restores (a sheet's view state, an undo snapshot), which run host code
 * through plugin hooks that a listener can throw from. Left un-resumed, the grid would silently
 * skip every later render.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {Function} operations The operations to run.
 * @returns {*} The value the operations return.
 */
export function safeBatch<T>(hot: HotInstance, operations: () => T): T {
  hot.suspendRender();
  hot.suspendExecution();

  try {
    return operations();
  } finally {
    try {
      hot.resumeExecution();
    } finally {
      hot.resumeRender();
    }
  }
}
