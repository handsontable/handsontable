export const command = {
  name: 'moveCellSelectionUpByViewportHight',
  callback(hot) {
    const { selection } = hot;
    const { navigableHeaders } = hot.getSettings();
    const columnHeadersCount = (navigableHeaders ? hot.countColHeaders() : 0);
    const { row } = hot.getSelectedRangeActive().highlight;
    let rowsStep = hot.countVisibleRows() + columnHeadersCount;

    rowsStep = rowsStep === 0 ? -1 : -rowsStep;

    // if the first row is currently selected move the focus to the last row (if autoWrap is enabled)
    if (row === -columnHeadersCount) {
      rowsStep = -1;

    // if the next move would move the focus off the table calculate the delta to move the selection to
    // the first row
    } else if (row + rowsStep < columnHeadersCount) {
      rowsStep = -(row + columnHeadersCount);
    }

    selection.markSource('keyboard');
    selection.transformStart(rowsStep, 0);
    selection.markEndSource();

    if (hot.getSelectedRangeActive().highlight.row < 0) {
      hot.scrollViewportTo({ row: 0 });
    }
  },
};
