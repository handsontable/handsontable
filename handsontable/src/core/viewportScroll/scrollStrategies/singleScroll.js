import { scrollWindowToCell } from '../utils';

/**
 * Scroll strategy for single cell selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): void}
 */
export function singleScrollStrategy(hot) {
  return (cellCoords) => {
    const selectionSource = hot.selection.getSelectionSource();
    const { row, col } = cellCoords;
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
      if (selectionSource === 'mouse') {
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
