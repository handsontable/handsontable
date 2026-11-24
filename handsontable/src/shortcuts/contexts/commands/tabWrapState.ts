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
 * Tracks how a `Tab` or `Shift+Tab` press wrapped the selection. A press wraps a row when `tabMoves` moves
 * across columns, and a column when `tabMoves` moves down or up only, so both wraps decide whether the
 * press leaves the grid.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @returns {TabWrapState} The wrap state of the current press.
 */
export function createTabWrapState(hot: HotInstance): TabWrapState {
  const rowWrap: WrapState = { wrapped: false, flipped: false };
  const columnWrap: WrapState = { wrapped: false, flipped: false };
  let rowCountAtStart = 0;

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
  const isColumnWrapCounted = () => columnWrap.wrapped && hot.countRows() === rowCountAtStart;

  return {
    start() {
      reset();
      rowCountAtStart = hot.countRows();
    },
    leavesGrid() {
      const { autoWrapRow, autoWrapCol } = hot.getSettings();
      const leavesByRow = rowWrap.wrapped && (!autoWrapRow || rowWrap.flipped);
      const leavesByColumn = isColumnWrapCounted() && (!autoWrapCol || columnWrap.flipped);

      return leavesByRow || leavesByColumn;
    },
    isFlippedOffGrid() {
      const { autoWrapRow, autoWrapCol } = hot.getSettings();

      return !!autoWrapRow && rowWrap.wrapped && rowWrap.flipped ||
        !!autoWrapCol && isColumnWrapCounted() && columnWrap.flipped;
    },
    reset,
  };
}
