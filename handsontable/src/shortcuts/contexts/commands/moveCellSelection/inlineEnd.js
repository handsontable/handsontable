export const command = {
  name: 'moveCellSelectionInlineEnd',
  callback(hot, event) {
    const { selection } = hot;
    const settings = hot.getSettings();
    const selectedRanges = hot.getSelectedRange();
    const selectedRange = hot.getSelectedRangeActive();
    const tabMoves = typeof settings.tabMoves === 'function'
      ? settings.tabMoves(event)
      : settings.tabMoves;

    selection.markSource('keyboard');

    if (
      (
        selectedRanges.some(range => selection.isMultiple(range)) ||
        selectedRanges.length > 1
      ) &&
      !selectedRange.isHeader() &&
      hot.countRenderedCols() > 0 &&
      hot.countRenderedRows() > 0
    ) {
      selection.transformFocus(-tabMoves.row, -tabMoves.col);
    } else {
      selection.transformStart(-tabMoves.row, -tabMoves.col);
    }

    selection.markEndSource();
  },
};
