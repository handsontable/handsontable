import type { HotInstance } from '../../core/types';
import type { CellChange } from '../../settings';

/**
 * The change sets an editor save made, per grid. A set is the array core lists in `_getWaitingChangeSets()`
 * while its validators run, so membership is by identity. Weak on both levels: a set core has written or
 * dropped, or a destroyed grid, leaves nothing behind.
 */
const editorSaveChangeSets = new WeakMap<HotInstance, WeakSet<CellChange[]>>();

/**
 * Runs an editor save and marks every change set it made that waits for its validators as an editor save's
 * set. The mark is taken at the save, so it does not depend on which editor instance is active later.
 *
 * @param {HotInstance} hot The grid.
 * @param {Function} save Saves the editor value.
 * @returns {Array[]} The change sets the save made that wait for their validators.
 */
export function markEditorSaveChangeSets(hot: HotInstance, save: () => void): CellChange[][] {
  const waitingBefore = new Set(hot._getWaitingChangeSets().map(({ changes }) => changes));

  save();

  if (hot.isDestroyed) {
    return [];
  }

  const madeBySave = hot._getWaitingChangeSets()
    .map(({ changes }) => changes)
    .filter(changes => !waitingBefore.has(changes));

  madeBySave.forEach((changes) => {

    let sets = editorSaveChangeSets.get(hot);

    if (!sets) {
      sets = new WeakSet();
      editorSaveChangeSets.set(hot, sets);
    }

    sets.add(changes);
  });

  return madeBySave;
}

/**
 * Returns the change sets made by an editor save that still wait for their validators: core has neither
 * written nor dropped them yet.
 *
 * @param {HotInstance} hot The grid.
 * @returns {Array[]}
 */
export function getWaitingEditorSaveChangeSets(hot: HotInstance): CellChange[][] {
  const sets = editorSaveChangeSets.get(hot);

  if (!sets) {
    return [];
  }

  return hot._getWaitingChangeSets()
    .map(({ changes }) => changes)
    .filter(changes => sets.has(changes));
}
