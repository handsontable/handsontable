export const command = {
  name: 'moveCellSelectionInlineEnd',
  callback(hot, event) {
    const settings = hot.getSettings();
    const tabMoves = typeof settings.tabMoves === 'function'
      ? settings.tabMoves(event)
      : settings.tabMoves;

    hot.selection.transformStart(-tabMoves.row, -tabMoves.col);
  },
};
