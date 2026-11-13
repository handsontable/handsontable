import {
  getCellCoordsFromMousePosition,
  getTableViewportBounds,
  isPointerOutsideBounds,
} from '../../../src/utils/pointerToCoords';
import Settings from '../../../src/settings';

/**
 * `getCellCoordsFromMousePosition` over merged cells. A slave of a merge resolves to the element of the
 * merge's anchor, so a lookup that walks a merged column (or row) adds the band's whole size once per
 * slave. The lookup measures against a column (or row) no merge spans instead. A stub engine, no DOM layout.
 *
 * Four columns of 40px and ten rows of 20px, LTR, scrollable only, the table at the origin.
 */

const COLUMN_WIDTH = 40;
const ROW_HEIGHT = 20;
const TOTAL_COLUMNS = 4;
const TOTAL_ROWS = 10;

interface Merge {
  row: number;
  col: number;
  rowspan?: number;
  colspan?: number;
}

/**
 * Builds the dependencies for the function under test.
 *
 * @param {Merge[]} merges Merged areas, as the cell renders them: one element per area.
 * @param {object} [options] The scenario.
 * @param {number} [options.fixedRowsTop=0] Frozen top rows.
 * @param {number} [options.fixedRowsBottom=0] Frozen bottom rows.
 * @param {number} [options.fixedColumnsStart=0] Frozen start columns.
 * @param {number} [options.fixedColumnsEnd=0] Frozen end columns.
 * @param {number} [options.firstRow] First partially visible row (defaults to the first row below the frozen ones).
 * @param {number} [options.firstColumn=0] First partially visible column.
 * @param {string[]} [options.notRendered] Cells (`row,col`) the engine does not render, e.g. the part of a merge that
 * crosses into the frozen end columns, which the end overlay does not draw.
 * @returns {object}
 */
function createScenario(merges: Merge[], {
  fixedRowsTop = 0,
  fixedRowsBottom = 0,
  fixedColumnsStart = 0,
  fixedColumnsEnd = 0,
  firstRow = fixedRowsTop,
  firstColumn = fixedColumnsStart,
  notRendered = [] as string[],
} = {}) {
  const cellOf = new Map<string, HTMLTableCellElement>();
  const boxOf = new Map<HTMLElement, { left: number, top: number, width: number, height: number }>();

  for (let row = 0; row < TOTAL_ROWS; row++) {
    for (let col = 0; col < TOTAL_COLUMNS; col++) {
      const merge = merges.find(({ row: r, col: c, rowspan = 1, colspan = 1 }) =>
        row >= r && row < r + rowspan && col >= c && col < c + colspan);
      const anchorRow = merge?.row ?? row;
      const anchorCol = merge?.col ?? col;
      const key = `${anchorRow},${anchorCol}`;

      if (!cellOf.has(key)) {
        const td = document.createElement('td');
        const { rowspan = 1, colspan = 1 } = merge ?? {};

        td.rowSpan = rowspan;
        td.colSpan = colspan;
        cellOf.set(key, td);
        boxOf.set(td, {
          left: anchorCol * COLUMN_WIDTH,
          top: anchorRow * ROW_HEIGHT,
          width: colspan * COLUMN_WIDTH,
          height: rowspan * ROW_HEIGHT,
        });
      }

      cellOf.set(`${row},${col}`, cellOf.get(key)!);
    }
  }

  const wtSettings = new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => TOTAL_ROWS,
    totalColumns: () => TOTAL_COLUMNS,
    rtlMode: false,
    fixedColumnsStart: () => fixedColumnsStart,
    fixedColumnsEnd: () => fixedColumnsEnd,
    fixedRowsTop: () => fixedRowsTop,
    fixedRowsBottom: () => fixedRowsBottom,
    columnHeaders: [],
    rowHeaders: [],
  });
  const geometryReader = {
    offsetWidth: (element: HTMLElement) => boxOf.get(element)!.width,
    offsetHeight: (element: HTMLElement) => boxOf.get(element)!.height,
    getBoundingClientRect: (element: HTMLElement) => {
      const box = boxOf.get(element);

      return box ?
        { left: box.left, top: box.top, right: box.left + box.width, bottom: box.top + box.height } :
        { left: 0, top: 0, right: TOTAL_COLUMNS * COLUMN_WIDTH, bottom: TOTAL_ROWS * ROW_HEIGHT };
    },
  };
  const wot = {
    wtScroll: {
      getFirstPartiallyVisibleRow: () => firstRow,
      getLastPartiallyVisibleRow: () => TOTAL_ROWS - fixedRowsBottom - 1,
      getFirstPartiallyVisibleColumn: () => firstColumn,
      getLastPartiallyVisibleColumn: () => TOTAL_COLUMNS - fixedColumnsEnd - 1,
    },
    wtViewport: {
      isHorizontallyScrollableByWindow: () => false,
      isVerticallyScrollableByWindow: () => false,
      getViewportWidth: () => TOTAL_COLUMNS * COLUMN_WIDTH,
      getViewportHeight: () => TOTAL_ROWS * ROW_HEIGHT,
      getColumnHeaderHeight: () => 0,
      getRowHeaderWidth: () => 0,
    },
    getCell: ({ row, col }: { row: number, col: number }) =>
      (notRendered.includes(`${row},${col}`) ? null : cellOf.get(`${row},${col}`)),
    createCellCoords: (row: number, col: number) => ({ row, col }),
    domBindings: { geometryReader },
  };
  const deps = {
    wtSettings,
    geometryReader,
    wtTable: { wtRootElement: document.createElement('div') },
    rootWindow: { innerWidth: 1000, innerHeight: 1000 },
    facadeGetter: () => wot,
  };

  return deps as unknown as Parameters<typeof getCellCoordsFromMousePosition>[0];
}

const coordsAt = (deps: ReturnType<typeof createScenario>, x: number, y: number) => {
  const { row, col } = getCellCoordsFromMousePosition(deps, x, y);

  return { row, col };
};

describe('getCellCoordsFromMousePosition over merged cells', () => {
  describe('a vertical merge in the first column (rows 2-7)', () => {
    const merges = [{ row: 2, col: 0, rowspan: 6 }];

    it.each([
      [5, 0], [45, 2], [100, 5], [155, 7], [170, 8], [195, 9],
    ])('should map y = %i to row %i for a pointer past the right edge', (y, row) => {
      expect(coordsAt(createScenario(merges), 500, y).row).toBe(row);
    });

    it('should map a pointer past the right edge to the last column', () => {
      expect(coordsAt(createScenario(merges), 500, 170)).toEqual({ row: 8, col: 3 });
    });

    it('should resolve the row without a merge too', () => {
      expect(coordsAt(createScenario([]), 500, 170).row).toBe(8);
    });
  });

  describe('a vertical merge inside the frozen top rows (rows 0-2)', () => {
    it.each([
      [5, 0], [30, 1], [50, 2],
    ])('should map y = %i to row %i for a pointer past the right edge', (y, row) => {
      const deps = createScenario([{ row: 0, col: 0, rowspan: 3 }], { fixedRowsTop: 3 });

      expect(coordsAt(deps, 500, y).row).toBe(row);
    });
  });

  describe('a horizontal merge inside the frozen start columns (columns 0-1)', () => {
    it.each([
      [30, 0], [60, 1],
    ])('should map x = %i to column %i for a pointer past the bottom edge', (x, col) => {
      const deps = createScenario([{ row: 0, col: 0, colspan: 2 }], { fixedColumnsStart: 2 });

      expect(coordsAt(deps, x, 500).col).toBe(col);
    });
  });

  describe('a horizontal merge inside the frozen end columns (columns 2-3)', () => {
    it.each([
      [90, 2], [130, 3],
    ])('should map x = %i to column %i for a pointer past the bottom edge', (x, col) => {
      const deps = createScenario([{ row: 0, col: 2, colspan: 2 }], { fixedColumnsEnd: 2 });

      expect(coordsAt(deps, x, 500).col).toBe(col);
    });
  });

  describe('a merge that crosses from the scrolling columns into the frozen end columns', () => {
    // Row 0 merges the end columns (2-3). Row 1 merges columns 1-2, so its cell in the end band, column 2, is not
    // rendered by the end overlay, while its column 3 cell is a plain one.
    const merges = [{ row: 0, col: 2, colspan: 2 }, { row: 1, col: 1, colspan: 2 }];

    it('should not measure the end band against a row that does not render its first cell', () => {
      const deps = createScenario(merges, { fixedColumnsEnd: 2, notRendered: ['1,2'] });

      expect(coordsAt(deps, 130, 500).col).toBe(3);
    });

    it('should not measure the frozen start band against a row that does not render its first cell', () => {
      const deps = createScenario([{ row: 0, col: 0, colspan: 2 }], { fixedColumnsStart: 2, notRendered: ['1,0'] });

      expect(coordsAt(deps, 60, 500).col).toBe(1);
    });
  });

  describe('a vertical merge inside the frozen bottom rows (rows 8-9)', () => {
    it.each([
      [170, 8], [190, 9],
    ])('should map y = %i to row %i for a pointer past the right edge', (y, row) => {
      const deps = createScenario([{ row: 8, col: 0, rowspan: 2 }], { fixedRowsBottom: 2 });

      expect(coordsAt(deps, 500, y).row).toBe(row);
    });
  });

  describe('a horizontal merge in the first row (columns 0-2)', () => {
    const merges = [{ row: 0, col: 0, colspan: 3 }];

    it.each([
      [5, 0], [45, 1], [100, 2], [130, 3], [155, 3],
    ])('should map x = %i to column %i for a pointer past the bottom edge', (x, col) => {
      expect(coordsAt(createScenario(merges), x, 500).col).toBe(col);
    });
  });

  describe('a walk that starts on a slave of a merge crossing every row or column', () => {
    it('should count the merge once when the first visible column is a slave', () => {
      // Every row merges columns 0-1, and the first visible column is 1: the walk starts on a slave of every block.
      const merges = Array.from({ length: TOTAL_ROWS }, (unused, row) => ({ row, col: 0, colspan: 2 }));

      expect(coordsAt(createScenario(merges, { firstColumn: 1 }), 100, 500).col).toBe(2);
    });

    it('should count the merge once when the first visible row is a slave', () => {
      // Every column merges rows 0-1, and the first visible row is 1: the walk starts on a slave of every block.
      const merges = Array.from({ length: TOTAL_COLUMNS }, (unused, col) => ({ row: 0, col, rowspan: 2 }));

      expect(coordsAt(createScenario(merges, { firstRow: 1 }), 500, 50).row).toBe(2);
    });
  });

  describe('merges in both directions', () => {
    it('should resolve the row and the column together', () => {
      const merges = [{ row: 2, col: 0, rowspan: 6 }, { row: 0, col: 1, colspan: 2 }];

      expect(coordsAt(createScenario(merges), 130, 170)).toEqual({ row: 8, col: 3 });
    });
  });
});

describe('isPointerOutsideBounds', () => {
  const bounds = { left: 0, top: 0, right: 160, bottom: 200 };

  it.each([
    [100, 100, false], [0, 0, false], [160, 200, false],
    [-1, 100, true], [100, -1, true], [161, 100, true], [100, 201, true],
  ])('should tell for a pointer at (%i, %i) whether it is outside: %s', (x, y, outside) => {
    expect(isPointerOutsideBounds(bounds, x, y)).toBe(outside);
  });
});

describe('getTableViewportBounds', () => {
  it('should return the client rectangle of the table', () => {
    expect(getTableViewportBounds(createScenario([]))).toEqual({
      left: 0, top: 0, right: TOTAL_COLUMNS * COLUMN_WIDTH, bottom: TOTAL_ROWS * ROW_HEIGHT,
    });
  });

  it('should give the lookup the same result with and without the bounds', () => {
    const deps = createScenario([{ row: 2, col: 0, rowspan: 6 }]);
    const bounds = getTableViewportBounds(deps);

    expect(getCellCoordsFromMousePosition(deps, 500, 170, bounds))
      .toEqual(getCellCoordsFromMousePosition(deps, 500, 170));
  });
});
