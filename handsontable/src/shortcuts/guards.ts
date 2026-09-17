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
 * `navigableHeaders` is on.
 *
 * While an overlay covers the body, only moves between HEADERS count. The overlay covers the cells,
 * not the headers above it, and those stay on screen and reachable - the empty-data-state visual tests
 * Tab from the corner to a column header and open its filter menu, and blocking that left the filter
 * unapplied and the overlay showing the wrong message. Moves among the covered cells stay blocked:
 * the grid's tab-navigation pair claims `Tab` with `preventDefault()` while the selection is in range,
 * so allowing them walked an invisible selection through the cells under the loading overlay instead
 * of letting the user leave.
 *
 * @param {Core} hot The Handsontable instance.
 * @returns {boolean}
 */
export function canNavigateGrid(hot: HotInstance): boolean {
  const { navigableHeaders } = hot.getSettings();

  if (isGridBodyCovered(hot)) {
    return navigableHeaders === true && hot.getSelectedRangeActive()?.highlight.isHeader() === true;
  }

  return navigableHeaders === true || hasRenderedCells(hot);
}

type KeyboardShortcutCommands = Record<string, (...args: unknown[]) => boolean | void>;

/**
 * Wraps the grid's keyboard commands so none of them can land the selection on a covered cell.
 *
 * `canNavigateGrid()` is an ENTRY check and only knows where the selection is, not where a key would
 * take it. Under a covering overlay it deliberately lets a move start from a header, because moving
 * along the headers still on screen is useful - `ArrowRight` between column headers is the path the
 * empty-data-state visual tests drive. Nothing re-checked where the move LANDED.
 *
 * Measured on DEV-2917: with `navigableHeaders` on and the overlay up over a drawn grid, `ArrowDown`
 * from column header `[-1, 2]` moved the selection to `[0, 2]` - a cell the user cannot see. It also
 * stranded them there, because the entry check then failed for a non-header highlight, so no arrow
 * could bring the selection back.
 *
 * `Tab` answers the same question in its own `after()` by deselecting, which is right for a key that
 * means "leave". An arrow means "move", so a move that would leave the headers is put back instead.
 *
 * Only the keystroke is gated, like every other guard here - `selectCell()` through the API still
 * reaches a covered cell.
 *
 * @param {Core} hot The Handsontable instance.
 * @param {object} commands The commands pool to wrap.
 * @returns {object}
 */
export function keepCoveredCellsUnselectable(
  hot: HotInstance,
  commands: KeyboardShortcutCommands,
): KeyboardShortcutCommands {
  const guarded: KeyboardShortcutCommands = {};

  Object.keys(commands).forEach((name) => {
    const run = commands[name];

    guarded[name] = (...args: unknown[]) => {
      const highlight = isGridBodyCovered(hot) ? hot.getSelectedRangeActive()?.highlight : undefined;

      if (highlight?.isHeader() !== true) {
        return run(...args);
      }

      // Read before the command runs - the move mutates the very coords object read here.
      const { row, col } = highlight;
      const result = run(...args);

      if (
        typeof row === 'number' && typeof col === 'number' &&
        hot.getSelectedRangeActive()?.highlight.isHeader() === false
      ) {
        hot.selectCell(row, col);
      }

      return result;
    };
  });

  return guarded;
}
