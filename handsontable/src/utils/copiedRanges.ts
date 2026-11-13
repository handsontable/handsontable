import { arrayEach } from '../helpers/array';
import { rangeEach } from '../helpers/number';

/**
 * Returns an object with `rows` and `columns` keys: the rows and the columns of the copied ranges, each
 * listed once, in the order the CopyPaste plugin lays out the copied data (`beforeCopy` and `beforeCut`
 * receive that layout).
 *
 * @param {Array<{startRow: number, startCol: number, endRow: number, endCol: number}>} ranges The range to process.
 * @returns {{rows: number[], columns: number[]}}
 */
export function normalizeRanges(ranges: Record<string, number>[]) {
  const rows: number[] = [];
  const columns: number[] = [];
  const seenRows = new Set<number>();
  const seenColumns = new Set<number>();

  arrayEach(ranges, (range) => {
    const r = range as Record<string, number>;
    const minRow = Math.min(r.startRow, r.endRow);
    const maxRow = Math.max(r.startRow, r.endRow);

    rangeEach(minRow, maxRow, (row) => {
      if (!seenRows.has(row)) {
        seenRows.add(row);
        rows.push(row);
      }
    });

    const minColumn = Math.min(r.startCol, r.endCol);
    const maxColumn = Math.max(r.startCol, r.endCol);

    rangeEach(minColumn, maxColumn, (column) => {
      if (!seenColumns.has(column)) {
        seenColumns.add(column);
        columns.push(column);
      }
    });
  });

  return {
    rows,
    columns,
  };
}
