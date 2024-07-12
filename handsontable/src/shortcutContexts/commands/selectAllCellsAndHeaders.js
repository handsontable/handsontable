export const command = {
  name: 'selectAllCellsAndHeaders',
  callback(hot) {
    hot.selection.selectAll(true, true, {
      disableHeadersHighlight: false,
    });
  },
};
