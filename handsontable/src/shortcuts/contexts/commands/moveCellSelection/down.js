export const command = {
  name: 'moveCellSelectionDown',
  callback({ selection }) {
    selection.markSource('keyboard');
    selection.transformStart(1, 0);
    selection.markEndSource();
  },
};
