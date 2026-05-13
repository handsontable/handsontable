export const command = {
  name: 'extendCellsSelectionDown',
  callback(hot) {
    const { selection } = hot;
    const { highlight } = hot.getSelectedRangeActive();

    if (
      !selection.isSelectedByColumnHeader() &&
      !selection.isSelectedByCorner() &&
      (highlight.isCell() || highlight.isHeader() && selection.isSelectedByRowHeader())
    ) {
      selection.markSource('keyboard');
      selection.transformEnd(1, 0);
      selection.markEndSource();
    }
  },
};
