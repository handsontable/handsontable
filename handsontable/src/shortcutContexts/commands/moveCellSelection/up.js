export const command = {
  name: 'moveCellSelectionUp',
  callback({ selection }) {
    selection.markSource('keyboard');
    selection.transformStart(-1, 0);
    selection.markEndSource();
  },
};
