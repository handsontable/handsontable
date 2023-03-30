export const command = {
  name: 'extendCellsSelectionDown',
  callback({ selection }) {
    selection.transformEnd(1, 0);
  },
};
