export const command = {
  name: 'moveCellSelectionInlineStart',
  callback(hot, event) {
    const settings = hot.getSettings();
    const selectedRange = hot.getSelectedRangeLast();
    const tabMoves = typeof settings.tabMoves === 'function'
      ? settings.tabMoves(event)
      : settings.tabMoves;

    if (
      hot.selection.isMultiple() &&
      !selectedRange.isHeader() &&
      hot.countRenderedCols() > 0 &&
      hot.countRenderedRows() > 0
    ) {
      hot.selection.transformFocus(tabMoves.row, tabMoves.col);
    } else {
      hot.selection.transformStart(tabMoves.row, tabMoves.col);
    }
  },
};
