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
    /**
     * The live number of rows.
     */
    totalRows: number;
    /**
     * The live number of frozen bottom rows.
     */
    fixedRowsBottom: number;
    /**
     * The number of rows the last draw saw.
     */
    drawnTotal: number;
    /**
     * The first row the last draw rendered.
     */
    drawnOffset: number;
    /**
     * How many rows the last draw rendered.
     */
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

    const thead = document.createElement('thead');

    thead.insertRow().appendChild(document.createElement('th')).textContent = 'header';

    const self: Self = {
      name,
      isMaster: false,
      THEAD: thead,
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
        // One column header row: `-1` is the first (and only) row of the THEAD.
        sourceRowToVisibleColHeadedRow: (row: number) => row - drawnOffset + 1,
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

  it('should answer "before the drawn rows" for the new pinned row while the clone still draws the old one', () => {
    // 10 rows with one frozen bottom row were drawn; `loadData()` made it 3, so the live band is row 2.
    const table = createTable('bottom',
      { totalRows: 3, fixedRowsBottom: 1, drawnTotal: 10, drawnOffset: 9, drawnRows: 1 });

    expect(cellAt(table, 2)).toBe(-1);
  });

  it('should answer "after the drawn rows" for a row past the drawn band when the data grew', () => {
    const table = createTable('bottom',
      { totalRows: 20, fixedRowsBottom: 1, drawnTotal: 10, drawnOffset: 9, drawnRows: 1 });

    expect(cellAt(table, 19)).toBe(-2);
  });

  it('should answer "not rendered" when the band moved and the number of rows did not', () => {
    // `updateSettings({ fixedRowsBottom: 3 })` on 10 rows drawn with one frozen row: the live band is rows 7 to 9,
    // the filter was built at row 9, and only the first row of the band tells the clone is behind.
    const table = createTable('bottom',
      { totalRows: 10, fixedRowsBottom: 3, drawnTotal: 10, drawnOffset: 9, drawnRows: 1 });

    expect(cellAt(table, 8)).toBe(-1);
  });

  it('should not throw for the first pinned row when the band moved by less than its size', () => {
    // A row was removed above two frozen rows: the live band is rows 7 and 8, the DOM holds the old 8 and 9.
    // Row 7 is before the rows the clone holds, and without the guard the lookup throws.
    const table = createTable('bottom',
      { totalRows: 9, fixedRowsBottom: 2, drawnTotal: 10, drawnOffset: 8, drawnRows: 2 });

    expectNotRendered(cellAt(table, 7));
  });

  it('should not return the cell of another row when the band moved by less than its size', () => {
    // The same removal, for row 8: the clone holds the old row 8 at that place, and without the guard the lookup
    // returns it instead of the row that is now pinned there.
    const table = createTable('bottom',
      { totalRows: 9, fixedRowsBottom: 2, drawnTotal: 10, drawnOffset: 8, drawnRows: 2 });

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

  describe('top clones', () => {
    /**
     * Builds a stub of a top clone with `fixedRowsTop: 5`: its live band is the first `min(totalRows, 5)` rows,
     * while its TBODY holds the `drawnRows` rows of the last draw.
     *
     * @param {string} name The overlay name.
     * @param {number} totalRows The live number of rows.
     * @param {number} drawnRows The number of rows the last draw rendered.
     * @returns {object}
     */
    function createTopTable(name: string, totalRows: number, drawnRows: number) {
      const table = createTable(name,
        { totalRows, fixedRowsBottom: 0, drawnTotal: drawnRows, drawnOffset: 0, drawnRows });

      table.getFirstRenderedRow = () => 0;
      table.getLastRenderedRow = () => Math.min(totalRows, 5) - 1;

      return table;
    }

    it.each(['top', 'top_inline_start_corner', 'top_inline_end_corner'])(
      'should answer "not rendered" for a frozen row the %s clone has not drawn after the data grew',
      (name) => {
        // 3 rows were drawn, 8 are loaded: the 5 frozen rows name rows 3 and 4, which have no TR yet.
        const table = createTopTable(name, 8, 3);

        expect(cellAt(table, 4)).toBe(-2);
        expect(cellAt(table, 3)).toBe(-2);
      },
    );

    it('should return the cell of a frozen row the clone has drawn', () => {
      const cell = cellAt(createTopTable('top', 8, 3), 2);

      expect(cell).toBeInstanceOf(HTMLElement);
      expect((cell as HTMLElement).textContent).toBe('row 2');
    });

    it.each(['top', 'top_inline_start_corner', 'top_inline_end_corner'])(
      'should answer "not rendered" for the %s clone that was never drawn',
      (name) => {
        // No frozen top rows and no column headers at first: the clone has no filter and no TBODY rows.
        const table = createTopTable(name, 8, 0);

        table.rowFilter = null;

        expect(cellAt(table, 4)).toBe(-2);
      },
    );

    it('should answer "not rendered" for a top clone that has no TBODY', () => {
      const table = createTopTable('top', 8, 3);

      table.TBODY = null;

      expect(cellAt(table, 1)).toBe(-2);
    });

    it('should leave a header row to the regular lookup on a top clone that was never drawn', () => {
      // A negative row names a header row. The clone has no header to show before its first draw, and the answer
      // is the one for a header that is not rendered, not the "after the drawn rows" code of a body row.
      const table = createTopTable('top', 8, 0);

      table.rowFilter = null;

      expect(cellAt(table, -1)).toBe(-1);
    });

    it('should keep returning the drawn frozen rows after the data shrank', () => {
      // The clone still holds the rows it drew, and they are the rows it should hold.
      const cell = cellAt(createTopTable('top', 2, 3), 1);

      expect(cell).toBeInstanceOf(HTMLElement);
      expect((cell as HTMLElement).textContent).toBe('row 1');
    });
  });

  it.each(['bottom', 'bottom_inline_start_corner', 'bottom_inline_end_corner'])(
    'should answer "not rendered" for the %s clone that was never drawn',
    (name) => {
      // `updateSettings({ data, fixedRowsBottom })` on a grid built without frozen rows: the clone has no filter.
      const table = createTable(name,
        { totalRows: 3, fixedRowsBottom: 1, drawnTotal: 0, drawnOffset: 0, drawnRows: 0 });

      table.rowFilter = null;

      expectNotRendered(cellAt(table, 2));
    },
  );

  it('should answer "not rendered" for a bottom clone that holds no rows although its band names one', () => {
    // A one-row grid whose frozen row was released and is frozen again before a render: the first row of the
    // band (0) and the filter's offset (0) agree, and only the empty TBODY tells the clone is behind.
    const table = createTable('bottom',
      { totalRows: 1, fixedRowsBottom: 1, drawnTotal: 1, drawnOffset: 0, drawnRows: 0 });

    expectNotRendered(cellAt(table, 0));
  });

  it('should answer "not rendered" for a bottom clone that has no TBODY', () => {
    const table = createTable('bottom',
      { totalRows: 3, fixedRowsBottom: 1, drawnTotal: 3, drawnOffset: 2, drawnRows: 1 });

    table.TBODY = null;

    expectNotRendered(cellAt(table, 2));
  });

  it('should leave a header row to the regular lookup on a stale bottom clone', () => {
    // Every row is pinned and a 4th row was added: the clone is behind by count. A negative row names a header
    // row, which the body band says nothing about, so it resolves to the header cell as it always did.
    const table = createTable('bottom',
      { totalRows: 4, fixedRowsBottom: 5, drawnTotal: 3, drawnOffset: 0, drawnRows: 3 });

    table.isRowHeaderRendered = () => true;

    const cell = cellAt(table, -1);

    expect(cell).toBeInstanceOf(HTMLElement);
    expect((cell as HTMLElement).textContent).toBe('header');
  });

  it.each(['master', 'inline_start'])('should not apply the bottom guard to the %s table', (name) => {
    // Only the bottom clones read their band from the live settings. For any other table the live first row (2
    // here) and the filter (built at 0) can differ without the DOM lagging behind: the cell is returned.
    const table = createTable(name,
      { totalRows: 3, fixedRowsBottom: 1, drawnTotal: 3, drawnOffset: 0, drawnRows: 3 });
    const cell = cellAt(table, 2);

    expect(cell).toBeInstanceOf(HTMLElement);
    expect((cell as HTMLElement).textContent).toBe('row 2');
  });

  it.each(['master', 'inline_start'])('should keep the loud throw of the %s table for a row it has no TR for', (name) => {
    // The guards answer for the frozen clones only. A table that is not one of them keeps throwing when the band
    // names a row its DOM does not hold, which is the signal for a real desync.
    const table = createTable(name,
      { totalRows: 3, fixedRowsBottom: 1, drawnTotal: 3, drawnOffset: 0, drawnRows: 3 });

    table.getFirstRenderedRow = () => 0;
    table.getLastRenderedRow = () => 3;

    expect(() => cellAt(table, 3)).toThrow('TR was expected to be rendered but is not');
  });
});
