export const command = {
  name: 'extendCellsSelectionRight',
  callback(hot) {
    const { selection } = hot;
    const { highlight } = hot.getSelectedRangeActive();

    if (
      !selection.isSelectedByRowHeader() &&
      !selection.isSelectedByCorner() &&
      (highlight.isCell() || highlight.isHeader() && selection.isSelectedByColumnHeader())
    ) {
      selection.markSource('keyboard');
      selection.transformEnd(0, hot.getDirectionFactor());
      selection.markEndSource();
    }
  },
};
