export const command = {
  name: 'selectAll',
  callback(hot) {
    hot.selection.selectAll(true, true, {
      disableHeadersHighlight: true,
    });
  },
};
