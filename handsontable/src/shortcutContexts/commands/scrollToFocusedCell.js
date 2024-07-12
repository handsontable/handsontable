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
      const scrollCoords = {};

      if (highlight.col >= 0) {
        const offsetColumns = Math.floor(hot.countVisibleCols() / 2);

        scrollCoords.col = Math.max(highlight.col - offsetColumns, 0);
      }

      if (highlight.row >= 0) {
        const offsetRows = Math.floor(hot.countVisibleRows() / 2);

        scrollCoords.row = Math.max(highlight.row - offsetRows, 0);
      }

      hot.scrollViewportTo({
        ...scrollCoords,
        verticalSnap: 'top',
        horizontalSnap: 'start',
      });
    }
  },
};
