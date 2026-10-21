/**
 * Tells whether a change source is an undo or redo replay. UndoRedo restores data through
 * `setSourceDataAtCell()` with this source, and then repeats the visible cells in an `afterChange`
 * with the same source, so a listener on both hooks hears a replayed change twice.
 *
 * @param {string} [source] The change source.
 * @returns {boolean}
 */
export function isUndoRedoSource(source: string | undefined): boolean {
  return source === 'UndoRedo.undo' || source === 'UndoRedo.redo';
}
