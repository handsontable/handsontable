export const command = {
  name: 'moveCellSelectionDown',
  callback({ selection }) {
    selection.transformStart(1, 0);
  },
};
