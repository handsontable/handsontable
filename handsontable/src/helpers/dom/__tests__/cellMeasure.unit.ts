import {
  findColumnAtX,
  findColumnReferenceRow,
  findRowAtY,
  findRowReferenceColumn,
  type CellMeasurer,
} from 'handsontable/helpers/dom/cellMeasure';

/**
 * The pointer-to-cell lookups shared by the core and Walkontable. A grid is described by its merges:
 * every slave of a merge resolves to the element of the anchor, and only the anchor reports the span.
 * Cells are 40px wide and 20px high; a merge is as large as the cells it covers.
 */

interface Merge {
  row: number;
  col: number;
  rowspan?: number;
  colspan?: number;
}

/**
 * Builds a measurer over a grid with the given merges.
 *
 * @param {Merge[]} [merges] The merged areas.
 * @param {object} [options] The scenario.
 * @param {number[]} [options.hiddenColumns] Columns that render no cell.
 * @param {number[]} [options.hiddenRows] Rows that render no cell.
 * @returns {CellMeasurer}
 */
function createMeasurer(merges: Merge[] = [], { hiddenColumns = [] as number[], hiddenRows = [] as number[] } = {}) {
  const elements = new Map<string, HTMLElement>();
  const sizes = new Map<HTMLElement, { width: number, height: number }>();
  const anchorOf = (row: number, col: number) => merges.find(({ row: r, col: c, rowspan = 1, colspan = 1 }) =>
    row >= r && row < r + rowspan && col >= c && col < c + colspan);

  return {
    getCell: (row, col) => {
      if (hiddenColumns.includes(col) || hiddenRows.includes(row)) {
        return null;
      }

      const merge = anchorOf(row, col);
      const key = merge ? `${merge.row},${merge.col}` : `${row},${col}`;

      if (!elements.has(key)) {
        const element = document.createElement('td');

        elements.set(key, element);
        sizes.set(element, { width: (merge?.colspan ?? 1) * 40, height: (merge?.rowspan ?? 1) * 20 });
      }

      return elements.get(key)!;
    },
    getHeight: cell => sizes.get(cell)!.height,
    getWidth: cell => sizes.get(cell)!.width,
    getRowspan: (row, col) => merges.find(merge => merge.row === row && merge.col === col)?.rowspan,
    getColspan: (row, col) => merges.find(merge => merge.row === row && merge.col === col)?.colspan,
  } as CellMeasurer;
}

describe('findRowAtY', () => {
  it('should walk the rows by their heights', () => {
    expect(findRowAtY(createMeasurer(), 0, 0, 9, 45)).toBe(2);
  });

  it('should return null past the range', () => {
    expect(findRowAtY(createMeasurer(), 0, 0, 4, 100)).toBeNull();
  });

  it('should skip the rows an anchor spans', () => {
    const measurer = createMeasurer([{ row: 1, col: 0, rowspan: 3 }]);

    expect(findRowAtY(measurer, 0, 0, 9, 70)).toBe(1);
    expect(findRowAtY(measurer, 0, 0, 9, 85)).toBe(4);
  });

  it('should skip the rows that render no cell', () => {
    expect(findRowAtY(createMeasurer([], { hiddenRows: [0, 1] }), 0, 0, 9, 5)).toBe(2);
  });
});

describe('findColumnAtX', () => {
  it('should walk the columns by their widths', () => {
    expect(findColumnAtX(createMeasurer(), 0, 0, 9, 85)).toBe(2);
  });

  it('should skip the columns an anchor spans', () => {
    const measurer = createMeasurer([{ row: 0, col: 1, colspan: 3 }]);

    expect(findColumnAtX(measurer, 0, 0, 9, 100)).toBe(1);
    expect(findColumnAtX(measurer, 0, 0, 9, 170)).toBe(4);
  });
});

describe('findRowReferenceColumn', () => {
  it('should return the first column when no merge spans rows', () => {
    expect(findRowReferenceColumn(createMeasurer(), 0, 3, 0, 9)).toBe(0);
  });

  it('should skip a column whose anchor spans rows', () => {
    expect(findRowReferenceColumn(createMeasurer([{ row: 2, col: 0, rowspan: 3 }]), 0, 3, 0, 9)).toBe(1);
  });

  it('should skip a column that holds only slaves of a merge in the scanned rows', () => {
    // The anchor (row 2) is above the scanned rows 3-9, so only the shared element betrays the merge.
    expect(findRowReferenceColumn(createMeasurer([{ row: 2, col: 0, rowspan: 4 }]), 0, 3, 3, 9)).toBe(1);
  });

  it('should keep a column crossed by a horizontal merge only', () => {
    expect(findRowReferenceColumn(createMeasurer([{ row: 2, col: 0, colspan: 3 }]), 0, 3, 0, 9)).toBe(0);
  });

  it('should skip a column that renders no cell', () => {
    expect(findRowReferenceColumn(createMeasurer([{ row: 2, col: 0, rowspan: 3 }], { hiddenColumns: [1] }), 0, 3, 0, 9))
      .toBe(2);
  });

  it('should fall back to the first column when every column is merged', () => {
    const merges = [0, 1].map(col => ({ row: 2, col, rowspan: 3 }));

    expect(findRowReferenceColumn(createMeasurer(merges), 0, 1, 0, 9)).toBe(0);
  });
});

describe('findColumnReferenceRow', () => {
  it('should return the first row when no merge spans columns', () => {
    expect(findColumnReferenceRow(createMeasurer(), 0, 3, 0, 9)).toBe(0);
  });

  it('should skip a row whose anchor spans columns', () => {
    expect(findColumnReferenceRow(createMeasurer([{ row: 0, col: 2, colspan: 3 }]), 0, 3, 0, 9)).toBe(1);
  });

  it('should skip a row that holds only slaves of a merge in the scanned columns', () => {
    expect(findColumnReferenceRow(createMeasurer([{ row: 0, col: 2, colspan: 4 }]), 0, 3, 3, 9)).toBe(1);
  });

  it('should keep a row crossed by a vertical merge only', () => {
    expect(findColumnReferenceRow(createMeasurer([{ row: 0, col: 2, rowspan: 3 }]), 0, 3, 0, 9)).toBe(0);
  });

  it('should skip a row that renders no cell', () => {
    expect(findColumnReferenceRow(createMeasurer([{ row: 0, col: 2, colspan: 3 }], { hiddenRows: [1] }), 0, 3, 0, 9))
      .toBe(2);
  });
});
