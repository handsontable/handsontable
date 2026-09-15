import type { HotInstance } from '../core/types';
import { isRootInstance } from '../utils/rootInstance';

/**
 * Whether the grid currently draws any cell.
 *
 * `countRenderedCols()` is a faithful proxy: with every column hidden it reports 0 even when frozen
 * columns are configured, because the frozen clone has nothing to clone. Both counts report -1 before
 * the first draw, so every predicate built on this fails closed.
 *
 * This is the raw drawing question. It is exported so the few commands that branch on it stay on one
 * definition - reach for `canAccessCellContent()` instead whenever a keystroke acts on cell content.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean}
 */
export function hasRenderedCells(hot: HotInstance): boolean {
  return hot.countRenderedRows() > 0 && hot.countRenderedCols() > 0;
}

/**
 * Whether a focus scope is currently covering the grid body.
 *
 * Asked of EVERY enabled scope, not only the active one: an overlay is on screen whether or not it
 * holds the keyboard, and that is what puts the cells out of reach. `runOnlyIf()` is the live half -
 * `coversGridBody` only declares that the scope covers the body WHEN it is showing.
 *
 * Only the root instance has a `FocusScopeManager` - `Core#getFocusScopeManager()` throws on any
 * other - and a nested grid (the `handsontable`, `autocomplete` and `dropdown` cell types) is never
 * covered by one of its own.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean}
 */
function isGridBodyCovered(hot: HotInstance): boolean {
  if (!isRootInstance(hot)) {
    return false;
  }

  return hot.getFocusScopeManager().isGridBodyCovered();
}

/**
 * Whether a keyboard shortcut may act on the CONTENT of the selected cells.
 *
 * Every shortcut that reads or writes cell content must require this, and that is what makes it safe
 * for a focus scope to inherit the grid's shortcuts (`fallbackShortcutsContextName`).
 *
 * Both halves were measured on DEV-2917. With every column hidden the grid draws nothing, and `Delete`
 * silently blanked all 40 cells. And while a DataProvider fetch is in flight the `emptyDataState`
 * overlay covers a FULLY RENDERED grid - the cells are drawn, merely unreachable - so the drawing
 * check alone returned `true` and `Delete` wiped the data under the overlay.
 *
 * Shortcuts that only MOVE the selection take `canNavigateGrid()` instead: navigating headers that are
 * still on screen is useful, and moving a selection destroys nothing.
 *
 * The `Core` methods behind these shortcuts keep guarding on the DATA counts, so `emptySelectedCells()`
 * called through the API still clears hidden columns. Only the keystroke is gated.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean}
 */
export function canAccessCellContent(hot: HotInstance): boolean {
  return hasRenderedCells(hot) && !isGridBodyCovered(hot);
}

/**
 * Whether the grid has somewhere for the selection to move: a drawn cell, or a header when
 * `navigableHeaders` is on, and nothing covering the body.
 *
 * Weaker than `canAccessCellContent()` on the header half and identical on the covering half. The
 * covering half is what lets the user leave: the grid's tab-navigation pair claims `Tab` by calling
 * `preventDefault()` whenever the selection is still in range, so without it an overlay that inherits
 * these shortcuts swallowed `Tab` and trapped the user inside itself.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean}
 */
export function canNavigateGrid(hot: HotInstance): boolean {
  if (isGridBodyCovered(hot)) {
    return false;
  }

  return hot.getSettings().navigableHeaders === true || hasRenderedCells(hot);
}
