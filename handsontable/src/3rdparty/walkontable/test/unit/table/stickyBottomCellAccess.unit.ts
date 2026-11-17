// The overlay barrel goes first: the table modules and the overlays import each other, and only this entry
// point resolves that cycle.
import 'walkontable/overlay';
import { cellAccess } from 'walkontable/table/cellAccess';
import stickyRowsBottom from 'walkontable/table/rangeQuery/stickyRowsBottom';
import viewportPredicates from 'walkontable/table/rangeQuery/viewportPredicates';
import Settings from 'walkontable/settings';

type Self = Record<string, unknown>;

const call = <T>(mixin: object, name: string, self: Self, ...args: unknown[]): T =>
  ((mixin as Record<string, (...a: unknown[]) => T>)[name]).apply(self, args);

describe('Table#getCell on the bottom clones between a change of the data and the next draw', () => {
  interface Shape {
    /** The live number of rows. */
    totalRows: number;
    /** The live number of frozen bottom rows. */
    fixedRowsBottom: number;
    /** The number of rows the last draw saw. */
    drawnTotal: number;
    /** The first row the last draw rendered. */
    drawnOffset: number;
    /** How many rows the last draw rendered. */
    drawnRows: number;
  }

  /**
   * Builds a stub table over the real mixins. Its filter and TBODY are what the last draw left; the settings are
   * the live ones.
   *
   * @param {string} name The overlay name.
   * @param {Shape} shape The live settings and the last draw.
   * @returns {object}
   */
  function createTable(name: string, { totalRows, fixedRowsBottom, drawnTotal, drawnOffset, drawnRows }: Shape) {
    const tbody = document.createElement('tbody');

    for (let r = 0; r < drawnRows; r++) {
      const tr = tbody.insertRow();

      tr.insertCell().textContent = `row ${drawnOffset + r}`;
    }

    const self: Self = {
      name,
      isMaster: false,
      TBODY: tbody,
      wtSettings: new Settings({
        facade: () => {},
        data: () => '',
        table: {},
        totalRows: () => totalRows,
        totalColumns: () => 1,
        fixedRowsBottom: () => fixedRowsBottom,
        onModifyGetCellCoords: () => undefined,
      }),
      rowFilter: {
        offset: drawnOffset,
        total: drawnTotal,
        sourceToRendered: (row: number) => row - drawnOffset,
      },
      columnFilter: { sourceColumnToVisibleRowHeadedColumn: (column: number) => column },
      getFirstRenderedRow: () => call(stickyRowsBottom, 'getFirstRenderedRow', self),
      getLastRenderedRow: () => call(stickyRowsBottom, 'getLastRenderedRow', self),
      getRenderedRowsCount: () => call(stickyRowsBottom, 'getRenderedRowsCount', self),
      isRowBeforeRenderedRows: (row: number) => call(viewportPredicates, 'isRowBeforeRenderedRows', self, row),
      isRowAfterRenderedRows: (row: number) => call(viewportPredicates, 'isRowAfterRenderedRows', self, row),
      isRowHeaderRendered: () => false,
      isColumnBeforeRenderedColumns: () => false,
      isColumnAfterRenderedColumns: () => false,
      getRow: (row: number) => call(cellAccess, 'getRow', self, row),
    };

    return self;
  }

  const cellAt = (self: Self, row: number, column = 0) =>
    call<HTMLElement | number>(cellAccess, 'getCell', self, { row, col: column });

  // The exit code is only "not rendered": any negative number means that to the callers.
  const expectNotRendered = (answer: HTMLElement | number) => {
    expect(typeof answer).toBe('number');
    expect(answer).toBeLessThan(0);
  };

  it('should answer "not rendered" for the new pinned row while the clone still draws the old one', () => {
    // 10 rows with one frozen bottom row were drawn; `loadData()` made it 3, so the live band is row 2.
    const table = createTable('bottom',
      { totalRows: 3, fixedRowsBottom: 1, drawnTotal: 10, drawnOffset: 9, drawnRows: 1 });

    expectNotRendered(cellAt(table, 2));
  });

  it('should answer "not rendered" for a row past the drawn band when the data grew', () => {
    const table = createTable('bottom',
      { totalRows: 20, fixedRowsBottom: 1, drawnTotal: 10, drawnOffset: 9, drawnRows: 1 });

    expectNotRendered(cellAt(table, 19));
  });

  it('should not return the cell of another row when the band moved by less than its size', () => {
    // A row was removed above two frozen rows: the live band is rows 7 and 8, the DOM holds the old 8 and 9.
    const table = createTable('bottom',
      { totalRows: 9, fixedRowsBottom: 2, drawnTotal: 10, drawnOffset: 8, drawnRows: 2 });

    expectNotRendered(cellAt(table, 7));
    expectNotRendered(cellAt(table, 8));
  });

  it('should answer "not rendered" for the added row when every row is pinned', () => {
    // 3 rows, 5 frozen bottom rows: the band starts at row 0 whatever the row count is. A 4th row has no TR yet.
    const table = createTable('bottom',
      { totalRows: 4, fixedRowsBottom: 5, drawnTotal: 3, drawnOffset: 0, drawnRows: 3 });

    expectNotRendered(cellAt(table, 3));
  });

  it('should answer "not rendered" when the rows and the pinned rows grew by the same amount', () => {
    // 10 rows with 2 pinned, then 12 rows with 4 pinned: the band starts at row 8 both times, only its end moved.
    const table = createTable('bottom',
      { totalRows: 12, fixedRowsBottom: 4, drawnTotal: 10, drawnOffset: 8, drawnRows: 2 });

    expectNotRendered(cellAt(table, 10));
  });

  it.each(['bottom', 'bottom_inline_start_corner', 'bottom_inline_end_corner'])(
    'should apply to the %s clone',
    (name) => {
      const table = createTable(name,
        { totalRows: 3, fixedRowsBottom: 1, drawnTotal: 10, drawnOffset: 9, drawnRows: 1 });

      expectNotRendered(cellAt(table, 2));
    },
  );

  it('should return the cell once the draw matches the live band', () => {
    const table = createTable('bottom',
      { totalRows: 3, fixedRowsBottom: 1, drawnTotal: 3, drawnOffset: 2, drawnRows: 1 });
    const cell = cellAt(table, 2);

    expect(cell).toBeInstanceOf(HTMLElement);
    expect((cell as HTMLElement).textContent).toBe('row 2');
  });

  it('should answer the band exit code for a row above it when the draw is current', () => {
    const table = createTable('bottom',
      { totalRows: 10, fixedRowsBottom: 1, drawnTotal: 10, drawnOffset: 9, drawnRows: 1 });

    expect(cellAt(table, 3)).toBe(-1);
  });

  it('should not throw for an empty grid with a bottom clone', () => {
    // No rows: the band is empty (first row -1) and the filter was built at offset 0.
    const table = createTable('bottom',
      { totalRows: 0, fixedRowsBottom: 1, drawnTotal: 0, drawnOffset: 0, drawnRows: 0 });

    expect(cellAt(table, 0)).toBe(-2);
  });

  it.each(['master', 'top', 'inline_start'])('should leave the %s table to its own band', (name) => {
    // Only the bottom clones read their band from the live settings. For any other table the live first row and
    // the filter can differ (the first row is 2 here, the filter was built at 0) without the DOM lagging behind.
    const table = createTable(name,
      { totalRows: 3, fixedRowsBottom: 1, drawnTotal: 10, drawnOffset: 0, drawnRows: 3 });

    table.getFirstRenderedRow = () => 0;
    table.getLastRenderedRow = () => 2;

    const cell = cellAt(table, 1);

    expect(cell).toBeInstanceOf(HTMLElement);
    expect((cell as HTMLElement).textContent).toBe('row 1');
  });
});
