/* eslint-disable */
(function() {
  const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

  window.spreadsheetColumnLabel = function(index) {
    let dividend = index + 1;
    let columnLabel = '';
    let modulo;

    while (dividend > 0) {
      modulo = (dividend - 1) % COLUMN_LABEL_BASE_LENGTH;
      columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
      dividend = parseInt((dividend - modulo) / COLUMN_LABEL_BASE_LENGTH, 10);
    }

    return columnLabel;
  }

  window.createSpreadsheetData = function(rows = 100, columns = 4) {
    const _rows = [];
    let i;
    let j;

    for (i = 0; i < rows; i++) {
      const row = [];

      for (j = 0; j < columns; j++) {
        row.push(spreadsheetColumnLabel(j) + (i + 1));
      }
      _rows.push(row);
    }

    return _rows;
  }
}());
