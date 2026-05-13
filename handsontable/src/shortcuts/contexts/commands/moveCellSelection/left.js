export const command = {
  name: 'moveCellSelectionLeft',
  callback(hot) {
    const { selection } = hot;

    selection.markSource('keyboard');
    selection.transformStart(0, -1 * hot.getDirectionFactor());
    selection.markEndSource();
  },
};
