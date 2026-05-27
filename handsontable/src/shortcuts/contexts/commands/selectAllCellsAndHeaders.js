export const command = {
  name: 'selectAllCellsAndHeaders',
  callback({ selection }) {
    selection.markSource('keyboard');
    selection.selectAll(true, true, {
      disableHeadersHighlight: false,
    });
    selection.markEndSource();
  },
};
