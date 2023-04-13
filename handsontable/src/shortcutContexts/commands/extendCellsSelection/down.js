export const command = {
  name: 'extendCellsSelectionDown',
  callback(hot) {
    const { highlight } = hot.getSelectedRangeLast();

    if (highlight.isCell() || highlight.isHeader() && hot.selection.isSelectedByRowHeader()) {
      hot.selection.transformEnd(1, 0);
    }
  },
};
