export const command = {
  name: 'extendCellsSelectionUp',
  callback(hot) {
    const { selection } = hot;
    const { highlight } = hot.getSelectedRangeLast();

    if (
      !selection.isSelectedByColumnHeader() &&
      !selection.isSelectedByCorner() &&
      (highlight.isCell() || highlight.isHeader() && selection.isSelectedByRowHeader())
    ) {
      selection.markSource('keyboard');
      selection.transformEnd(-1, 0);
      selection.markEndSource();
    }
  },
};
