import type { HotInstance } from '../../types';
import { scrollWindowToCell } from '../utils';

/**
 * Returns `true` when the cell is wider or taller than the viewport.
 *
 * Mouse selection skips scrolling for the last partially visible cell so a
 * click does not jump the viewport. That skip leaves the start of an
 * oversized cell clipped. Keyboard and API selection start-snap those cells,
 * and mouse selection must match.
 *
 * @param {Core} hot Handsontable instance.
 * @param {number} row Visual row index.
 * @param {number} col Visual column index.
 * @returns {boolean}
 */
function isCellLargerThanViewport(hot: HotInstance, row: number, col: number): boolean {
  return hot.getColWidth(col) > hot.view.getViewportWidth() ||
    hot.getRowHeight(row) > hot.view.getViewportHeight();
}

/**
 * Scroll strategy for single cell selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function singleScrollStrategy(hot: HotInstance) {
  return (cellCoords: unknown) => {
    const selectionSource = hot.selection.getSelectionSource();
    const { row, col } = cellCoords as { row: number; col: number };
    const scrollWindow = () => {
      scrollWindowToCell(hot.getCell(row, col, true));
    };

    // navigating through the column headers (when `navigableHeaders` is enabled)
    // scrolls the viewport horizontally only
    if (row < 0 && col >= 0) {
      hot.scrollViewportTo({ col }, scrollWindow);

    // navigating through the row headers (when `navigableHeaders` is enabled)
    // scrolls the viewport vertically only
    } else if (col < 0 && row >= 0) {
      hot.scrollViewportTo({ row }, scrollWindow);

    // navigating through the cells
    } else {
      if (selectionSource === 'mouse' && !isCellLargerThanViewport(hot, row, col)) {
        if (
          col === hot.view.getLastPartiallyVisibleColumn() ||
          row === hot.view.getLastPartiallyVisibleRow()
        ) {
          return;
        }
      }

      hot.scrollViewportTo({ row, col }, scrollWindow);
    }
  };
}
