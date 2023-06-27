export const command = {
  name: 'scrollToFocusedCell',
  callback(hot) {
    const { highlight } = hot.getSelectedRangeLast();
    const firstVisibleRow = hot.view.getFirstFullyVisibleRow() - 1;
    const firstVisibleColumn = hot.view.getFirstFullyVisibleColumn() - 1;
    const lastVisibleRow = hot.view.getLastFullyVisibleRow() + 1;
    const lastVisibleColumn = hot.view.getLastFullyVisibleColumn() + 1;

    const visibleCoordsFrom = hot._createCellCoords(firstVisibleRow, firstVisibleColumn);
    const visibleCoordsTo = hot._createCellCoords(lastVisibleRow, lastVisibleColumn);
    const visibleRange = hot._createCellRange(visibleCoordsFrom, visibleCoordsFrom, visibleCoordsTo);

    if (!visibleRange.includes(highlight) && (highlight.row >= 0 || highlight.col >= 0)) {
      const offsetRows = Math.floor(hot.countVisibleRows() / 2);
      const offsetColumns = Math.floor(hot.countVisibleCols() / 2);
      const scrollX = Math.max(highlight.row - offsetRows, 0);
      const scrollY = Math.max(highlight.col - offsetColumns, 0);
      const scrollCoords = [scrollX, scrollY];

      // for row header focus do not change the scroll Y position, leave as it is
      if (highlight.col < 0) {
        scrollCoords[1] = null;

      // for column header focus do not change the scroll X position, leave as it is
      } else if (highlight.row < 0) {
        scrollCoords[0] = null;
      }

      hot.scrollViewportTo(...scrollCoords);
    }
  },
};
