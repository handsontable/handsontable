import { getCellCoordsFromMousePosition } from '../../../src/utils/pointerToCoords';
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
 * @returns {object}
 */
function createScenario(merges: Merge[], { fixedRowsTop = 0 } = {}) {
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
    fixedColumnsStart: () => 0,
    fixedColumnsEnd: () => 0,
    fixedRowsTop: () => fixedRowsTop,
    fixedRowsBottom: () => 0,
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
      getFirstPartiallyVisibleRow: () => fixedRowsTop,
      getLastPartiallyVisibleRow: () => TOTAL_ROWS - 1,
      getFirstPartiallyVisibleColumn: () => 0,
      getLastPartiallyVisibleColumn: () => TOTAL_COLUMNS - 1,
    },
    wtViewport: {
      isHorizontallyScrollableByWindow: () => false,
      isVerticallyScrollableByWindow: () => false,
      getViewportWidth: () => TOTAL_COLUMNS * COLUMN_WIDTH,
      getViewportHeight: () => TOTAL_ROWS * ROW_HEIGHT,
      getColumnHeaderHeight: () => 0,
      getRowHeaderWidth: () => 0,
    },
    getCell: ({ row, col }: { row: number, col: number }) => cellOf.get(`${row},${col}`),
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
  const { row, col } = getCellCoordsFromMousePosition(deps, x, y).coords;

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

  describe('a horizontal merge in the first row (columns 0-2)', () => {
    const merges = [{ row: 0, col: 0, colspan: 3 }];

    it.each([
      [5, 0], [45, 1], [100, 2], [130, 3], [155, 3],
    ])('should map x = %i to column %i for a pointer past the bottom edge', (x, col) => {
      expect(coordsAt(createScenario(merges), x, 500).col).toBe(col);
    });
  });

  describe('merges in both directions', () => {
    it('should resolve the row and the column together', () => {
      const merges = [{ row: 2, col: 0, rowspan: 6 }, { row: 0, col: 1, colspan: 2 }];

      expect(coordsAt(createScenario(merges), 130, 170)).toEqual({ row: 8, col: 3 });
    });
  });
});
