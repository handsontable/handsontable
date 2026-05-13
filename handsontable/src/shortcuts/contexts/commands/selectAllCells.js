export const command = {
  name: 'selectAllCells',
  callback({ selection }) {
    selection.markSource('keyboard');
    selection.selectAll(true, true, {
      disableHeadersHighlight: true,
    });
    selection.markEndSource();
  },
};
