export const command = {
  name: 'moveCellSelectionDownByViewportHeight',
  callback(hot) {
    const { navigableHeaders } = hot.getSettings();
    const columnHeadersCount = (navigableHeaders ? hot.countColHeaders() : 0);
    const { row } = hot.getSelectedRangeLast().highlight;
    let rowsStep = hot.countVisibleRows() + columnHeadersCount;

    rowsStep = rowsStep === 0 ? 1 : rowsStep;

    // if the last row is currently selected move the focus to the first row (if autoWrap is enabled)
    if (row === hot.countRows() - 1) {
      rowsStep = 1;

    // if the next move would move the focus off the table calculate the delta to move the selection to
    // the last row
    } else if (row + rowsStep > hot.countRows()) {
      rowsStep = hot.countRows() - row - 1;
    }

    hot.selection.transformStart(rowsStep, 0);

    if (hot.getSelectedRangeLast().highlight.row < 0) {
      hot.scrollViewportTo({ row: 0 });
    }
  },
};
