export const command = {
  name: 'moveCellSelectionUp',
  callback({ selection }) {
    selection.transformStart(-1, 0);
  },
};
