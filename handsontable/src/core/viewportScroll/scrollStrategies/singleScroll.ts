import { Core, ScrollStrategy } from '../types';
import { CellCoords } from '../../../core/types';

/**
 * Scroll strategy for single cell selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): { row: number, col: number } | void }
 */
export function singleScrollStrategy(hot: Core): ScrollStrategy {
  return (cellCoords: CellCoords): { row: number; col: number } | void => {
    const selectionSource = hot.selection.getSelectionSource();
    const { row, col } = cellCoords;

    // navigating through the column headers (when `navigableHeaders` is enabled)
    // scrolls the viewport horizontally only
    if (row < 0 && col >= 0) {
      hot.scrollViewportTo({ col });

    // navigating through the row headers (when `navigableHeaders` is enabled)
    // scrolls the viewport vertically only
    } else if (col < 0 && row >= 0) {
      hot.scrollViewportTo({ row });

    // navigating through the cells
    } else {
      if (selectionSource === 'mouse') {
        if (
          col === hot.view.getLastPartiallyVisibleColumn() ||
          row === hot.view.getLastPartiallyVisibleRow()
        ) {
          return;
        }
      }

      hot.scrollViewportTo({ row, col });
    }
  };
}
