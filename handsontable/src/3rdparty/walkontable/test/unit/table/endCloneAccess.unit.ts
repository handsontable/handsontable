// The overlay barrel goes first: the table modules and the overlays import each other, and only this entry
// point resolves that cycle.
import 'walkontable/overlay';
import CoreAbstract from 'walkontable/core/_base';
import { cellAccess } from 'walkontable/table/cellAccess';
import viewportPredicates from 'walkontable/table/rangeQuery/viewportPredicates';
import stickyColumnsEnd from 'walkontable/table/rangeQuery/stickyColumnsEnd';
import stickyColumnsStart from 'walkontable/table/rangeQuery/stickyColumnsStart';
import Settings from 'walkontable/settings';

type Self = Record<string, unknown>;

const call = <T>(mixin: object, name: string, self: Self, ...args: unknown[]): T =>
  ((mixin as Record<string, (...a: unknown[]) => T>)[name]).apply(self, args);

/**
 * Builds the real settings accessor for a 10-column, 20-row grid.
 *
 * @param {object} values Setting overrides.
 * @returns {Settings}
 */
function createSettings(values: Record<string, unknown>) {
  return new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => 20,
    totalColumns: () => 10,
    fixedColumnsStart: () => 0,
    fixedColumnsEnd: () => 0,
    fixedRowsTop: () => 0,
    fixedRowsBottom: () => 0,
    ...values,
  });
}

describe('CoreAbstract#getCell (topmost) routing with an end band', () => {
  /**
   * Builds a stub engine: each overlay's clone answers with a marker for the cell it was asked for.
   *
   * @param {object} values The setting overrides.
   * @returns {object}
   */
  function createEngine(values: Record<string, unknown>) {
    const answer = (name: string) => ({ clone: { wtTable: { getCell: () => name } } });

    return {
      wtSettings: createSettings(values),
      wtTable: { getCell: () => 'master' },
      wtOverlays: {
        topInlineStartCornerOverlay: answer('top_inline_start_corner'),
        topInlineEndCornerOverlay: answer('top_inline_end_corner'),
        topOverlay: answer('top'),
        bottomInlineStartCornerOverlay: answer('bottom_inline_start_corner'),
        bottomInlineEndCornerOverlay: answer('bottom_inline_end_corner'),
        inlineStartOverlay: answer('inline_start'),
        inlineEndOverlay: answer('inline_end'),
        bottomOverlay: answer('bottom'),
      },
    };
  }

  const cellAt = (engine: object, row: number, col: number) =>
    (CoreAbstract.prototype.getCell as unknown as (c: object, t: boolean) => unknown)
      .call(engine, { row, col }, true);

  it('should route the end columns of the middle rows to the inline-end overlay', () => {
    const engine = createEngine({ fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });

    expect(cellAt(engine, 5, 9)).toBe('inline_end');
    expect(cellAt(engine, 5, 8)).toBe('inline_end');
    expect(cellAt(engine, 5, 7)).toBe('master');
  });

  it('should route the end columns of the frozen rows to the matching end corner', () => {
    const engine = createEngine({ fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });

    expect(cellAt(engine, 0, 9)).toBe('top_inline_end_corner');
    expect(cellAt(engine, 1, 8)).toBe('top_inline_end_corner');
    expect(cellAt(engine, 18, 9)).toBe('bottom_inline_end_corner');
    expect(cellAt(engine, 19, 8)).toBe('bottom_inline_end_corner');
  });

  it('should route the scrollable columns of the frozen rows to the top and bottom overlays', () => {
    const engine = createEngine({ fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });

    expect(cellAt(engine, 0, 5)).toBe('top');
    expect(cellAt(engine, 19, 5)).toBe('bottom');
  });

  it('should give the start corners and the start overlay priority on the start side', () => {
    const engine = createEngine({ fixedColumnsStart: 2, fixedColumnsEnd: 2, fixedRowsTop: 2, fixedRowsBottom: 2 });

    expect(cellAt(engine, 0, 0)).toBe('top_inline_start_corner');
    expect(cellAt(engine, 5, 1)).toBe('inline_start');
    expect(cellAt(engine, 19, 0)).toBe('bottom_inline_start_corner');
  });

  it('should not treat a row past the grid as a bottom corner cell', () => {
    // The row < totalRows guard: a row beyond the last one is not in the bottom band.
    const engine = createEngine({ fixedColumnsEnd: 2, fixedRowsBottom: 2 });

    expect(cellAt(engine, 20, 9)).toBe('inline_end');
    expect(cellAt(engine, 25, 9)).toBe('inline_end');
  });

  it('should ignore the end columns entirely when none is frozen', () => {
    const engine = createEngine({ fixedColumnsEnd: 0, fixedRowsTop: 2 });

    expect(cellAt(engine, 5, 9)).toBe('master');
    expect(cellAt(engine, 0, 9)).toBe('top');
  });

  it('should treat the columns the start band leaves as the end band', () => {
    // 9 start columns leave one end column.
    const engine = createEngine({ fixedColumnsStart: 9, fixedColumnsEnd: 4 });

    expect(cellAt(engine, 5, 9)).toBe('inline_end');
    expect(cellAt(engine, 5, 8)).toBe('inline_start');
  });

  it('should return nothing for an unset coordinate', () => {
    const engine = createEngine({ fixedColumnsEnd: 2 });

    expect((CoreAbstract.prototype.getCell as unknown as (c: object, t: boolean) => unknown)
      .call(engine, { row: null, col: 3 }, true)).toBeUndefined();
  });
});

describe('Table#getCoords for the end clones', () => {
  /**
   * Builds a root with a clone of the given type holding a table with `rows` body rows of `cells` cells,
   * plus a stub table that resolves coordinates over it.
   *
   * @param {string} type The clone type (class `ht_clone_<type>`).
   * @param {object} shape The table shape.
   * @param {number} shape.cells How many cells a row holds.
   * @param {number} [shape.bodyRows=3] How many body rows.
   * @param {number} [shape.headRows=0] How many head rows.
   * @param {object} values The setting overrides.
   * @returns {object}
   */
  function createClone(type: string, { cells, bodyRows = 3, headRows = 0 }:
    { cells: number, bodyRows?: number, headRows?: number }, values: Record<string, unknown>) {
    const parent = document.createElement('div');
    const root = document.createElement('div');
    const clone = document.createElement('div');
    const table = document.createElement('table');
    const thead = table.createTHead();
    const tbody = table.createTBody();

    clone.className = `ht_clone_${type}`;
    parent.append(root, clone);
    clone.append(table);

    for (let r = 0; r < headRows; r++) {
      const tr = thead.insertRow();

      for (let c = 0; c < cells; c++) {
        tr.appendChild(document.createElement('th'));
      }
    }

    for (let r = 0; r < bodyRows; r++) {
      const tr = tbody.insertRow();

      for (let c = 0; c < cells; c++) {
        tr.appendChild(document.createElement('td'));
      }
    }

    const self: Self = {
      wtRootElement: root,
      THEAD: thead,
      wtSettings: createSettings(values),
      rowFilter: {
        renderedToSource: (row: number) => row + 100,
        visibleColHeadedRowToSourceRow: (row: number) => row - 50,
      },
      columnFilter: {
        offsettedTH: (col: number) => col - 1,
        visibleRowHeadedColumnToSourceColumn: (col: number) => col + 200,
      },
      wot: { createCellCoords: (row: number, col: number) => ({ row, col }) },
    };

    return { self, tbody, thead };
  }

  const coordsOf = (self: Self, element: HTMLElement) =>
    call<{ row: number, col: number }>(cellAccess, 'getCoords', self, element);

  it('should name the cells of the inline-end clone by their place at the end of the grid', () => {
    const { self, tbody } = createClone('inline_end', { cells: 3 }, { fixedColumnsEnd: 3 });
    const cell = (tbody.rows[1].cells[2]);

    // The end clone renders no row headers: its first cell is column 10 - 3 = 7. Rows are source rows.
    expect(coordsOf(self, tbody.rows[1].cells[0])).toEqual({ row: 101, col: 7 });
    expect(coordsOf(self, cell)).toEqual({ row: 101, col: 9 });
  });

  it('should cut the end clone down by the start band, like the settings do', () => {
    const { self, tbody } = createClone('inline_end', { cells: 2 }, { fixedColumnsStart: 8, fixedColumnsEnd: 5 });

    expect(coordsOf(self, tbody.rows[0].cells[0])).toEqual({ row: 100, col: 8 });
  });

  it('should count the head rows of the top end corner out of the row', () => {
    const { self, tbody } = createClone('top_inline_end_corner', { cells: 2, headRows: 2 }, { fixedColumnsEnd: 2 });

    expect(coordsOf(self, tbody.rows[1].cells[1])).toEqual({ row: 1, col: 9 });
  });

  it('should name the rows of the bottom end corner from the end of the grid', () => {
    const { self, tbody } = createClone('bottom_inline_end_corner', { cells: 2, bodyRows: 2 },
      { fixedColumnsEnd: 2, fixedRowsBottom: 2 });

    expect(coordsOf(self, tbody.rows[0].cells[0])).toEqual({ row: 18, col: 8 });
    expect(coordsOf(self, tbody.rows[1].cells[1])).toEqual({ row: 19, col: 9 });
  });

  it('should keep the row-header offset for the inline-start clone', () => {
    const { self, tbody } = createClone('inline_start', { cells: 3 }, { fixedColumnsStart: 2 });

    // offsettedTH is the start side's own rule and must not be applied to the end clones.
    expect(coordsOf(self, tbody.rows[0].cells[2])).toEqual({ row: 100, col: 1 });
  });

  it('should resolve a cell of the top clone through the column filter, whatever the end band is', () => {
    const { self, tbody } = createClone('top', { cells: 3 }, { fixedColumnsEnd: 3 });

    expect(coordsOf(self, tbody.rows[0].cells[0]).col).toBe(200);
  });
});

describe('row headers of the end clones', () => {
  /**
   * Builds a stub table over the real mixins, with row headers configured on the grid.
   *
   * @param {boolean} isEndClone Whether the table is an inline-end one (it has no row headers).
   * @param {number} firstRendered The first rendered column.
   * @returns {object}
   */
  function createTable(isEndClone: boolean, firstRendered: number) {
    const rowHeaders = [() => {}];
    const settings = createSettings({ fixedColumnsEnd: 2, rowHeaders });
    const table: Self = {
      wtSettings: settings,
      deps: { getRowHeaders: () => rowHeaders },
      getFirstRenderedColumn: () => firstRendered,
      getRowHeadersCount: () => (isEndClone ? stickyColumnsEnd : stickyColumnsStart).getRowHeadersCount.call(table),
      THEAD: document.createElement('thead'),
      TBODY: document.createElement('tbody'),
      rowFilter: { sourceToRendered: (row: number) => row, sourceRowToVisibleColHeadedRow: (row: number) => row },
      isColumnHeaderRendered: (column: number) => call(viewportPredicates, 'isColumnHeaderRendered', table, column),
    };

    return table;
  }

  it('should not render a column header (-1) on an end clone that starts at the first column', () => {
    // The row-header column (-1) is rendered only when the table has row headers. An end clone has none, even
    // though the grid does, so a coordinate in the header column is before everything it renders.
    const table = createTable(true, 0);

    expect(call(viewportPredicates, 'isColumnHeaderRendered', table, -1)).toBe(false);
    expect(call(viewportPredicates, 'isColumnBeforeRenderedColumns', table, -1)).toBe(true);
  });

  it('should render the header column (-1) on a table that has row headers', () => {
    const table = createTable(false, 0);

    expect(call(viewportPredicates, 'isColumnHeaderRendered', table, -1)).toBe(true);
    expect(call(viewportPredicates, 'isColumnBeforeRenderedColumns', table, -1)).toBe(false);
  });

  it('should find no row header on an end clone', () => {
    const table = createTable(true, 0);

    // The first cell of every row is a DATA cell here: asking a row-header question of it would find it.
    (table.TBODY as HTMLTableSectionElement).insertRow().appendChild(document.createElement('td'));

    expect(call(cellAccess, 'getRowHeader', table, 0)).toBeUndefined();
    expect(call(cellAccess, 'getRowHeaders', table, 0)).toEqual([]);
  });

  it('should find the row header of a table that has them', () => {
    const table = createTable(false, 0);
    const row = (table.TBODY as HTMLTableSectionElement).insertRow();
    const th = row.appendChild(document.createElement('th'));

    expect(call(cellAccess, 'getRowHeader', table, 0)).toBe(th);
    expect(call(cellAccess, 'getRowHeaders', table, 0)).toEqual([th]);
  });
});
