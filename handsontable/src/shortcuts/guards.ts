import type { HotInstance } from '../core/types';

/**
 * Whether a keyboard shortcut may act on the CONTENT of the selected cells.
 *
 * Every shortcut that reads or writes cell content must require this, and that is what makes it safe
 * for a focus scope to inherit the grid's shortcuts (`fallbackShortcutsContextName`). Without it the
 * keystroke acts on data the grid is not drawing - every column hidden, or the `emptyDataState` overlay
 * covering the body - and `Delete` silently blanked the whole dataset (DEV-2917, measured at 40 cells).
 *
 * It lives here rather than in `contexts/grid.ts` because `mergeCells` and `checkboxRenderer` register
 * destructive shortcuts into that same grid context from their own files and need the same answer.
 *
 * **What it proves is "the grid draws no cell", not "the user cannot see the cells."** `countRenderedCols()`
 * is a faithful proxy for the first: with every column hidden it reports 0 even when frozen columns are
 * configured, because the frozen clone has nothing to clone, and both counts report -1 before the first
 * draw, so this fails closed. A surface that covers drawn cells is a different question, and today it is
 * answered elsewhere - `loading` shows through `dialog`, whose modal focus scope activates and takes the
 * shortcut context with it, so grid shortcuts never run underneath it. Do not read this helper as a
 * general "is the grid visible" check.
 *
 * Shortcuts that only MOVE the selection deliberately do not take it: navigating the headers that are
 * still on screen is useful, and moving a selection destroys nothing.
 *
 * The `Core` methods behind these shortcuts keep guarding on the DATA counts, so `emptySelectedCells()`
 * called through the API still clears hidden columns. Only the keystroke is gated.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean}
 */
export function canAccessCellContent(hot: HotInstance): boolean {
  return hot.countRenderedRows() > 0 && hot.countRenderedCols() > 0;
}
