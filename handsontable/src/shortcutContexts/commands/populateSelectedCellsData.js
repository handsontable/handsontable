export const command = {
  name: 'populateSelectedCellsData',
  callback(hot) {
    const selectedRange = hot.getSelectedRange();
    const {
      row: highlightRow,
      col: highlightColumn,
    } = selectedRange[selectedRange.length - 1].highlight.normalize();
    const valueToPopulate = hot.getDataAtCell(highlightRow, highlightColumn);
    const cellValues = new Map();

    for (let i = 0; i < selectedRange.length; i++) {
      selectedRange[i].forAll((row, column) => {
        if (row >= 0 && column >= 0 && (row !== highlightRow || column !== highlightColumn)) {
          const { readOnly } = hot.getCellMeta(row, column);

          if (!readOnly) {
            cellValues.set(`${row}x${column}`, [row, column, valueToPopulate]);
          }
        }
      });
    }

    hot.setDataAtCell(Array.from(cellValues.values()));
  },
};
