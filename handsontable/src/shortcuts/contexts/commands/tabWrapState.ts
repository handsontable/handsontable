import type { HotInstance } from '../../../core/types';

interface WrapState {
  wrapped: boolean;
  flipped: boolean;
}

export interface TabWrapState {
  /**
   * Starts tracking a `Tab` or `Shift+Tab` press.
   */
  start(): void;
  /**
   * Tells whether the press moved the selection off the end of the grid, which releases `Tab`.
   */
  leavesGrid(): boolean;
  /**
   * Tells whether the press wrapped from the last cell to the first one, or back.
   */
  isFlippedOffGrid(): boolean;
  /**
   * Clears the tracked wraps.
   */
  reset(): void;
}

/**
 * Tracks how a `Tab` or `Shift+Tab` press wrapped the selection. A press past the last column wraps a row,
 * and a press past the last row wraps a column, which is the only edge a `tabMoves` that moves down or up
 * (`{ row: 1, col: 0 }`) ever reaches.
 *
 * The two axes release `Tab` by different rules. A row wrap keeps the rule Handsontable has always applied:
 * without `autoWrapRow` it leaves the grid even when the selection still moved (a diagonal `tabMoves`, or a
 * column a `beforeRowWrap` listener added). A column wrap leaves only when the selection is stuck at the
 * edge: without `autoWrapCol` the press must leave the selection where it was, so a diagonal `tabMoves`
 * keeps its step along the last row, and with `autoWrapCol` the wrap must go from the last cell to the
 * first (or back) without adding a row. Changing the row rule to match would change how released grids
 * handle `Tab`.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {TabWrapState} The wrap state of the current press.
 */
export function createTabWrapState(hot: HotInstance): TabWrapState {
  const rowWrap: WrapState = { wrapped: false, flipped: false };
  const columnWrap: WrapState = { wrapped: false, flipped: false };
  let rowCountAtStart = 0;
  let highlightAtStart: { row: number; col: number } | null = null;

  hot.addHook('beforeRowWrap', (interruptedByAutoInsertMode: unknown, newCoords: unknown, isFlipped: boolean) => {
    rowWrap.wrapped = true;
    rowWrap.flipped = isFlipped;
  });
  hot.addHook('beforeColumnWrap', (interruptedByAutoInsertMode: unknown, newCoords: unknown, isFlipped: boolean) => {
    columnWrap.wrapped = true;
    columnWrap.flipped = isFlipped;
  });

  const reset = () => {
    rowWrap.wrapped = false;
    rowWrap.flipped = false;
    columnWrap.wrapped = false;
    columnWrap.flipped = false;
  };
  const readHighlight = () => {
    const highlight = hot.getSelectedRangeActive()?.highlight;

    return highlight ? { row: highlight.row ?? 0, col: highlight.col ?? 0 } : null;
  };
  const isSelectionUnmoved = () => {
    const highlight = readHighlight();

    return highlight !== null && highlightAtStart !== null &&
      highlight.row === highlightAtStart.row && highlight.col === highlightAtStart.col;
  };
  const isColumnFlipCounted = () => columnWrap.wrapped && columnWrap.flipped && hot.countRows() === rowCountAtStart;

  return {
    start() {
      reset();
      rowCountAtStart = hot.countRows();
      highlightAtStart = readHighlight();
    },
    leavesGrid() {
      const { autoWrapRow, autoWrapCol } = hot.getSettings();
      const leavesByRow = rowWrap.wrapped && (!autoWrapRow || rowWrap.flipped);
      const leavesByColumn = autoWrapCol
        ? isColumnFlipCounted()
        : columnWrap.wrapped && isSelectionUnmoved();

      return leavesByRow || leavesByColumn;
    },
    isFlippedOffGrid() {
      const { autoWrapRow, autoWrapCol } = hot.getSettings();

      return !!autoWrapRow && rowWrap.wrapped && rowWrap.flipped ||
        !!autoWrapCol && isColumnFlipCounted();
    },
    reset,
  };
}
