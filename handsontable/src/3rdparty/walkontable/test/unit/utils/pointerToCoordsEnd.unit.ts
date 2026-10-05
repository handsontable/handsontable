import { getCellCoordsFromMousePosition } from '../../../src/utils/pointerToCoords';
import Settings from '../../../src/settings';

/**
 * `getCellCoordsFromMousePosition` with a frozen end band: the start band is asked first, then the end
 * band, then the scrollable columns. A stub engine, no DOM layout.
 *
 * Seven columns of 40px, LTR: start 0-1 (x 0-80), scrollable 2-4 (x 80-200), end 5-6 (x 200-280). In
 * RTL the same columns run from the right edge (x 280) to the left: start at the right, end at the left.
 */

const COLUMN_WIDTH = 40;
const ROW_HEIGHT = 20;
const TOTAL_COLUMNS = 7;

/**
 * Builds the dependencies for the function under test.
 *
 * @param {object} options The scenario.
 * @param {boolean} [options.isRtl=false] Whether the grid is right-to-left.
 * @param {number} [options.start=2] Frozen start columns.
 * @param {number} [options.end=2] Frozen end columns.
 * @param {number[]} [options.notRendered=[]] Columns whose cell is not in the DOM.
 * @returns {object}
 */
function createScenario({ isRtl = false, start = 2, end = 2, notRendered = [] as number[] } = {}) {
  const cells = new Map<number, HTMLElement>();
  const columnOf = new Map<HTMLElement, number>();

  for (let column = 0; column < TOTAL_COLUMNS; column++) {
    const td = document.createElement('td');

    cells.set(column, td);
    columnOf.set(td, column);
  }

  const wtSettings = new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => 3,
    totalColumns: () => TOTAL_COLUMNS,
    rtlMode: isRtl,
    fixedColumnsStart: () => start,
    fixedColumnsEnd: () => end,
    columnHeaders: [],
    rowHeaders: [],
  });
  const rectOf = (element: HTMLElement) => {
    const column = columnOf.get(element)!;
    const left = isRtl ? (TOTAL_COLUMNS - 1 - column) * COLUMN_WIDTH : column * COLUMN_WIDTH;

    return { left, right: left + COLUMN_WIDTH, top: 0, bottom: ROW_HEIGHT };
  };
  const geometryReader = {
    offsetWidth: () => COLUMN_WIDTH,
    offsetHeight: () => ROW_HEIGHT,
    getBoundingClientRect: (element: HTMLElement) => (columnOf.has(element) ?
      rectOf(element) : { left: 0, top: 0, right: 280, bottom: 60 }),
  };
  const wot = {
    wtScroll: {
      getFirstPartiallyVisibleRow: () => 0,
      getLastPartiallyVisibleRow: () => 2,
      getFirstPartiallyVisibleColumn: () => start,
      getLastPartiallyVisibleColumn: () => TOTAL_COLUMNS - end - 1,
    },
    wtViewport: {
      isHorizontallyScrollableByWindow: () => false,
      isVerticallyScrollableByWindow: () => false,
      getViewportWidth: () => TOTAL_COLUMNS * COLUMN_WIDTH,
      getViewportHeight: () => 60,
      getColumnHeaderHeight: () => 0,
      getRowHeaderWidth: () => 0,
    },
    getCell: ({ col }: { col: number }) => (notRendered.includes(col) ? undefined : cells.get(col)),
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

const columnAt = (deps: ReturnType<typeof createScenario>, x: number) =>
  getCellCoordsFromMousePosition(deps, x, 10).coords.col;

describe('getCellCoordsFromMousePosition with fixedColumnsEnd', () => {
  describe('in LTR', () => {
    it.each([
      [10, 0], [79, 1], // start band
      [80, 2], [199, 4], // scrollable columns
      [200, 5], [239, 5], [240, 6], [279, 6], // end band
    ])('should map x = %i to column %i', (x, column) => {
      expect(columnAt(createScenario(), x)).toBe(column);
    });

    it('should map a pointer past the table to the last end column', () => {
      expect(columnAt(createScenario(), 5000)).toBe(6);
    });

    it('should ask the start band before the end band', () => {
      // Pointer inside the start band: the end band is never consulted for it.
      expect(columnAt(createScenario({ start: 3, end: 3 }), 30)).toBe(0);
    });

    it('should fall back to the scrollable columns when the end cells are not rendered', () => {
      const deps = createScenario({ notRendered: [5, 6] });

      // Without the end cells the end band cannot claim the pointer; the scroll band clamps to its last column.
      expect(columnAt(deps, 250)).toBe(4);
    });

    it('should clamp to the last scrollable column when no end column is frozen', () => {
      // Scrollable columns 2-6 here (end 0): the pointer past the table maps to the last column, 6.
      expect(columnAt(createScenario({ end: 0 }), 5000)).toBe(TOTAL_COLUMNS - 1);
      expect(columnAt(createScenario({ end: 0 }), 100)).toBe(2);
    });
  });

  describe('in RTL, where the end band is on the left', () => {
    it.each([
      [270, 0], [201, 1], // start band, on the right
      [200, 2], [81, 4], // scrollable columns
      [79, 5], [41, 5], [39, 6], [0, 6], // end band, on the left (its first column is the rightmost of it)
    ])('should map x = %i to column %i', (x, column) => {
      expect(columnAt(createScenario({ isRtl: true }), x)).toBe(column);
    });

    it('should map a pointer past the table (further left) to the last end column', () => {
      expect(columnAt(createScenario({ isRtl: true }), -400)).toBe(6);
    });
  });
});
