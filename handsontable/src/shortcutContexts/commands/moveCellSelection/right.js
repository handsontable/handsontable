export const command = {
  name: 'moveCellSelectionRight',
  callback(hot) {
    const { selection } = hot;

    selection.markSource('keyboard');
    selection.transformStart(0, hot.getDirectionFactor());
    selection.markEndSource();
  },
};
