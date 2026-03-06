/**
 * Generates spreadsheet-like column names: A, B, C, ..., Z, AA, AB, etc.
 */
export function spreadsheetColumnLabel(index: number): string {
  let dividend = index + 1;
  let columnLabel = '';
  let modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt(((dividend - modulo) / 26).toFixed(0), 10);
  }

  return columnLabel;
}

/**
 * Creates 2D array of Excel-like values "A1", "A2", ...
 */
export function createSpreadsheetData(rows: number = 100, columns: number = 4): string[][] {
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
