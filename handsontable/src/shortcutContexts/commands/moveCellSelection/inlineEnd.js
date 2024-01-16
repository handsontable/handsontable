export const command = {
  name: 'moveCellSelectionInlineEnd',
  callback(hot, event) {
    const settings = hot.getSettings();
    const tabMoves = typeof settings.tabMoves === 'function'
      ? settings.tabMoves(event)
      : settings.tabMoves;

    if (hot.selection.isMultiple()) {
      hot.selection.transformFocus(-tabMoves.row, -tabMoves.col);
    } else {
      hot.selection.transformStart(-tabMoves.row, -tabMoves.col);
    }
  },
};
