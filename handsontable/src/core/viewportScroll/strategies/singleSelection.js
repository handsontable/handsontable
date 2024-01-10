/**
 * Scroll strategy for single cell selection.
 *
 * @param {Core} hot Handsontable instance.
 * @returns {function(): function(CellCoords): { row: number, col: number } | void }
 */
export function singleSelectionStrategy(hot) {
  return (cellCoords) => {
    const selectionSource = hot.selection.getSelectionSource();
    const { row, col } = cellCoords;
    let scrollCoords;

    // navigating through the column headers (when `navigableHeaders` is enabled)
    // scrolls the viewport horizontally only
    if (row < 0 && col >= 0) {
      scrollCoords = { col };

    // navigating through the row headers (when `navigableHeaders` is enabled)
    // scrolls the viewport vertically only
    } else if (col < 0 && row >= 0) {
      scrollCoords = { row };

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

      scrollCoords = { row, col };
    }

    return scrollCoords;
  };
}
