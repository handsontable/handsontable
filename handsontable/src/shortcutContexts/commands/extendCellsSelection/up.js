export const command = {
  name: 'extendCellsSelectionUp',
  callback({ selection }) {
    selection.transformEnd(-1, 0);
  },
};
