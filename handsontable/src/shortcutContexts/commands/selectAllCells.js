export const command = {
  name: 'selectAllCells',
  callback(hot) {
    hot.selection.selectAll(true, true, {
      disableHeadersHighlight: true,
    });
  },
};
