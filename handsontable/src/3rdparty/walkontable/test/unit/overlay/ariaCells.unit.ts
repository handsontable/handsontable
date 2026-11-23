import {
  getLeadingSegment,
  getRowBand,
  hasAriaTreeId,
  isGridRowOfTable,
  isHiddenByAriaTree,
  readAriaTreeLayout,
  reconcileAriaCells,
} from 'walkontable/overlay/ariaCells';
import type { AriaCellsTable, AriaTreeLayout } from 'walkontable/overlay/ariaCells';

const GUID = 'ht_1';

/**
 * Builds a layout of a 6 by 5 grid with one row header column and the given frozen counts.
 *
 * @param {Partial<AriaTreeLayout>} overrides The values that differ.
 * @returns {AriaTreeLayout}
 */
function layout(overrides: Partial<AriaTreeLayout> = {}): AriaTreeLayout {
  return {
    totalRows: 6,
    totalColumns: 5,
    fixedRowsTop: 0,
    fixedRowsBottom: 0,
    fixedColumnsStart: 0,
    fixedColumnsEnd: 0,
    rowHeadersCount: 1,
    ...overrides,
  };
}

/**
 * Builds a table as an overlay draws it: a body of the given rows and columns, each row starting with
 * `rowHeaders` header cells, and an optional head row over the same columns.
 *
 * @param {string} name The table's name.
 * @param {object} shape The rows and columns the table draws.
 * @param {number[]} shape.rows The grid rows.
 * @param {number[]} shape.columns The grid columns.
 * @param {number} [shape.rowHeaders] The number of row header cells per row.
 * @param {boolean} [shape.head] Whether the table draws a head row.
 * @returns {AriaCellsTable}
 */
function table(
  name: string,
  { rows, columns, rowHeaders = 0, head = false }: {
    rows: number[], columns: number[], rowHeaders?: number, head?: boolean,
  },
): AriaCellsTable {
  const THEAD = document.createElement('thead');
  const TBODY = document.createElement('tbody');
  const buildRow = (label: string, cellTag: string) => {
    const tr = document.createElement('tr');

    for (let index = 0; index < rowHeaders; index++) {
      tr.appendChild(document.createElement('th')).textContent = `${label}:h${index}`;
    }
    columns.forEach((column) => {
      tr.appendChild(document.createElement(cellTag)).textContent = `${label}:${column}`;
    });

    return tr;
  };

  if (head) {
    THEAD.appendChild(buildRow('head', 'th'));
  }
  rows.forEach(row => TBODY.appendChild(buildRow(String(row), 'td')));

  return {
    name,
    THEAD,
    TBODY,
    rowFilter: { renderedToSource: (index: number) => rows[index] },
    columnFilter: { renderedToSource: (index: number) => columns[index] },
  };
}

/**
 * The texts of the cells of a section that carry no `aria-hidden`, row by row.
 *
 * @param {HTMLElement | null} section The section.
 * @returns {string[][]}
 */
function exposed(section: HTMLElement | null): string[][] {
  return Array.from(section?.children ?? [], row => Array.from(row.children)
    .filter(cell => cell.getAttribute('aria-hidden') !== 'true')
    .map(cell => cell.textContent ?? ''));
}

/**
 * The texts of the cells a row lists in `aria-owns`, in the listed order.
 *
 * @param {Element} row The row.
 * @param {AriaCellsTable[]} tables The tables the ids are looked up in.
 * @returns {string[]}
 */
function owned(row: Element, tables: AriaCellsTable[]): string[] {
  const ids = (row.getAttribute('aria-owns') ?? '').split(' ').filter(Boolean);
  const cells = tables.flatMap(item => [
    ...Array.from(item.THEAD?.querySelectorAll('th, td') ?? []),
    ...Array.from(item.TBODY?.querySelectorAll('th, td') ?? []),
  ]);

  return ids.map(id => cells.find(cell => cell.id === id)?.textContent ?? `missing ${id}`);
}

describe('the rules of the grid\'s single accessibility tree', () => {
  it('puts a row in the band of its frozen edge, and a column header in the top band', () => {
    const grid = layout({ fixedRowsTop: 2, fixedRowsBottom: 1 });

    expect([-1, 0, 1, 2, 4, 5].map(row => getRowBand(grid, row)))
      .toEqual(['top', 'top', 'top', 'middle', 'middle', 'bottom']);
    expect(getRowBand(layout(), 0)).toBe('middle');
    expect(getRowBand(layout(), -1)).toBe('top');
  });

  it.each([
    ['row headers', { rowHeadersCount: 1 }, 'start'],
    ['frozen start columns and no row headers', { rowHeadersCount: 0, fixedColumnsStart: 1 }, 'start'],
    ['neither', { rowHeadersCount: 0 }, 'main'],
    ['frozen end columns beside other columns', { rowHeadersCount: 0, fixedColumnsEnd: 2 }, 'main'],
    ['every column frozen at the end', { rowHeadersCount: 0, fixedColumnsEnd: 5 }, 'end'],
  ])('leads each row with the %s', (_, overrides, segment) => {
    expect(getLeadingSegment(layout(overrides))).toBe(segment);
  });

  it('makes a grid row a row of one table only: the leading table of the row\'s band', () => {
    const grid = layout({ fixedRowsTop: 1, fixedRowsBottom: 1, fixedColumnsStart: 1, fixedColumnsEnd: 1 });
    const tables = [
      'master', 'top', 'bottom', 'inline_start', 'inline_end', 'top_inline_start_corner',
      'top_inline_end_corner', 'bottom_inline_start_corner', 'bottom_inline_end_corner',
    ];
    const rowTables = (row: number) => tables.filter(name => isGridRowOfTable(name, grid, row));

    expect(rowTables(-1)).toEqual(['top_inline_start_corner']);
    expect(rowTables(0)).toEqual(['top_inline_start_corner']);
    expect(rowTables(3)).toEqual(['inline_start']);
    expect(rowTables(5)).toEqual(['bottom_inline_start_corner']);
  });

  it('makes the master the table of the rows of a grid with no row header and no frozen start column', () => {
    const grid = layout({ rowHeadersCount: 0, fixedRowsTop: 1 });

    expect(isGridRowOfTable('master', grid, 3)).toBe(true);
    // The master draws a copy of the frozen top row under the top clone: that row is the top clone's.
    expect(isGridRowOfTable('master', grid, 0)).toBe(false);
    expect(isGridRowOfTable('top', grid, 0)).toBe(true);
    expect(isGridRowOfTable('top', grid, -1)).toBe(true);
  });

  it('reads no layout for a grid without accessibility attributes or without an instance id', () => {
    const settings = (values: Record<string, unknown>) => ({
      getSetting: (key: string) => ({
        ariaTags: true,
        guid: GUID,
        totalRows: 6,
        totalColumns: 5,
        fixedRowsTop: 1,
        fixedRowsBottom: 0,
        fixedColumnsStart: 2,
        fixedColumnsEnd: 0,
        rowHeaders: [() => {}],
        ...values,
      } as Record<string, unknown>)[key],
    });

    expect(readAriaTreeLayout(settings({ ariaTags: false }))).toBeNull();
    expect(readAriaTreeLayout(settings({ guid: undefined }))).toBeNull();
    expect(readAriaTreeLayout(settings({}))).toEqual(layout({ fixedRowsTop: 1, fixedColumnsStart: 2 }));
  });
});

describe('reconcileAriaCells', () => {
  it('joins the row headers and the cells of a grid with headers into one row each', () => {
    const grid = layout();
    const tables = [
      table('master', { rows: [0, 1], columns: [0, 1, 2], rowHeaders: 1, head: true }),
      table('top', { rows: [], columns: [0, 1, 2], rowHeaders: 1, head: true }),
      table('inline_start', { rows: [0, 1], columns: [], rowHeaders: 1, head: true }),
      table('top_inline_start_corner', { rows: [], columns: [], rowHeaders: 1, head: true }),
    ];
    const [master, top, start, corner] = tables;

    reconcileAriaCells(tables, grid, 1, GUID);

    // The corner cell is drawn by the top clone and by the corner: the corner owns it.
    expect(exposed(top.THEAD)).toEqual([['head:0', 'head:1', 'head:2']]);
    expect(exposed(corner.THEAD)).toEqual([['head:h0']]);
    expect(owned(corner.THEAD!.children[0], tables)).toEqual(['head:0', 'head:1', 'head:2']);
    // The row headers lead the rows and take the master's cells.
    expect(exposed(start.TBODY)).toEqual([['0:h0'], ['1:h0']]);
    expect(owned(start.TBODY!.children[0], tables)).toEqual(['0:0', '0:1', '0:2']);
    expect(owned(start.TBODY!.children[1], tables)).toEqual(['1:0', '1:1', '1:2']);
    // The rows that do not stand for a grid row take nothing.
    expect(master.TBODY!.children[0].hasAttribute('aria-owns')).toBe(false);
    expect(top.THEAD!.children[0].hasAttribute('aria-owns')).toBe(false);
  });

  it('leaves the sections the stylesheet hides alone: the master\'s head and its row headers', () => {
    const tables = [
      table('master', { rows: [0], columns: [0, 1], rowHeaders: 1, head: true }),
      table('inline_start', { rows: [0], columns: [], rowHeaders: 1, head: true }),
    ];

    reconcileAriaCells(tables, layout(), 1, GUID);

    expect(tables[0].THEAD!.querySelectorAll('[aria-hidden]').length).toBe(0);
    expect(tables[0].TBODY!.querySelector('th')!.hasAttribute('aria-hidden')).toBe(false);
    expect(tables[1].THEAD!.querySelectorAll('[aria-hidden]').length).toBe(0);
  });

  it('exposes each cell once and joins a row over three tables, with every edge frozen', () => {
    const grid = layout({ fixedRowsTop: 1, fixedRowsBottom: 1, fixedColumnsStart: 1, fixedColumnsEnd: 1 });
    const all = [0, 1, 2, 3, 4];
    const tables = [
      table('master', { rows: [0, 1, 2, 3, 4, 5], columns: all, rowHeaders: 1, head: true }),
      table('top', { rows: [0], columns: all, rowHeaders: 1, head: true }),
      table('bottom', { rows: [5], columns: all, rowHeaders: 1 }),
      table('inline_start', { rows: [0, 1, 2, 3, 4, 5], columns: [0], rowHeaders: 1, head: true }),
      table('inline_end', { rows: [0, 1, 2, 3, 4, 5], columns: [4], head: true }),
      table('top_inline_start_corner', { rows: [0], columns: [0], rowHeaders: 1, head: true }),
      table('top_inline_end_corner', { rows: [0], columns: [4], head: true }),
      table('bottom_inline_start_corner', { rows: [5], columns: [0], rowHeaders: 1 }),
      table('bottom_inline_end_corner', { rows: [5], columns: [4] }),
    ];
    const byName = new Map(tables.map(item => [item.name, item]));
    const fullRow = (tableName: string, section: 'THEAD' | 'TBODY', index: number) => {
      const row = byName.get(tableName)![section]!.children[index];

      return [
        ...Array.from(row.children).filter(cell => !cell.hasAttribute('aria-hidden')).map(cell => cell.textContent),
        ...owned(row, tables),
      ];
    };

    reconcileAriaCells(tables, grid, 1, GUID);

    const cells = (row: string) => [`${row}:h0`, `${row}:0`, `${row}:1`, `${row}:2`, `${row}:3`, `${row}:4`];

    expect(fullRow('top_inline_start_corner', 'THEAD', 0)).toEqual(cells('head'));
    expect(fullRow('top_inline_start_corner', 'TBODY', 0)).toEqual(cells('0'));
    expect(fullRow('inline_start', 'TBODY', 2)).toEqual(cells('2'));
    expect(fullRow('bottom_inline_start_corner', 'TBODY', 0)).toEqual(cells('5'));

    // Every data cell of the grid is exposed by exactly one table: 6 rows of 5 cells, none twice.
    const dataCells = tables.flatMap(item => exposed(item.TBODY).flat()).filter(text => !text.endsWith(':h0'));

    expect(dataCells.length).toBe(30);
    expect(new Set(dataCells).size).toBe(30);
  });

  it('leads the rows with the master when the grid has no row header and no frozen start column', () => {
    const grid = layout({ rowHeadersCount: 0, fixedColumnsEnd: 1 });
    const tables = [
      table('master', { rows: [0, 1], columns: [0, 1, 2, 3, 4] }),
      table('inline_end', { rows: [0, 1], columns: [4] }),
    ];

    reconcileAriaCells(tables, grid, 0, GUID);

    expect(exposed(tables[0].TBODY)).toEqual([['0:0', '0:1', '0:2', '0:3'], ['1:0', '1:1', '1:2', '1:3']]);
    expect(owned(tables[0].TBODY!.children[0], tables)).toEqual(['0:4']);
    expect(tables[1].TBODY!.children[0].hasAttribute('aria-owns')).toBe(false);
  });

  it('follows a changed layout: a hidden copy is exposed again and the lists are rebuilt', () => {
    const tables = [
      table('master', { rows: [0], columns: [0, 1, 2], rowHeaders: 1 }),
      table('inline_start', { rows: [0], columns: [0], rowHeaders: 1 }),
    ];
    const [master, start] = tables;

    reconcileAriaCells(tables, layout({ fixedColumnsStart: 1 }), 0, GUID);

    expect(exposed(master.TBODY)).toEqual([['0:h0', '0:1', '0:2']]);
    expect(isHiddenByAriaTree(master.TBODY!.querySelector('td')!)).toBe(true);
    expect(owned(start.TBODY!.children[0], tables)).toEqual(['0:1', '0:2']);

    // The column is no longer frozen: the start clone draws the row header only.
    start.TBODY!.querySelector('td')!.remove();
    start.columnFilter = { renderedToSource: () => 0 };
    reconcileAriaCells(tables, layout(), 0, GUID);

    expect(isHiddenByAriaTree(master.TBODY!.querySelector('td')!)).toBe(false);
    expect(master.TBODY!.querySelector('td')!.hasAttribute('aria-hidden')).toBe(false);
    expect(owned(start.TBODY!.children[0], tables)).toEqual(['0:0', '0:1', '0:2']);
  });

  it('writes nothing on a second run over an unchanged grid', () => {
    const tables = [
      table('master', { rows: [0, 1], columns: [0, 1, 2], rowHeaders: 1 }),
      table('inline_start', { rows: [0, 1], columns: [0], rowHeaders: 1 }),
    ];
    const grid = layout({ fixedColumnsStart: 1 });

    reconcileAriaCells(tables, grid, 0, GUID);

    const setAttribute = jest.spyOn(Element.prototype, 'setAttribute');
    const removeAttribute = jest.spyOn(Element.prototype, 'removeAttribute');

    reconcileAriaCells(tables, grid, 0, GUID);

    expect(setAttribute).not.toHaveBeenCalled();
    expect(removeAttribute).not.toHaveBeenCalled();
    setAttribute.mockRestore();
    removeAttribute.mockRestore();
  });

  it('keeps an id a renderer gave a cell, and an aria-hidden it wrote itself', () => {
    const tables = [
      table('master', { rows: [0], columns: [0, 1], rowHeaders: 1 }),
      table('inline_start', { rows: [0], columns: [], rowHeaders: 1 }),
    ];
    const [first, second] = Array.from(tables[0].TBODY!.querySelectorAll('td'));

    first.id = 'my-cell';
    second.setAttribute('aria-hidden', 'true');
    reconcileAriaCells(tables, layout(), 0, GUID);

    expect(first.id).toBe('my-cell');
    expect(hasAriaTreeId(first)).toBe(false);
    expect(hasAriaTreeId(second)).toBe(true);
    expect(tables[1].TBODY!.children[0].getAttribute('aria-owns')).toBe(`my-cell ${second.id}`);
    // Not the pass's own: it neither claims the attribute nor removes it.
    expect(isHiddenByAriaTree(second)).toBe(false);
    expect(second.getAttribute('aria-hidden')).toBe('true');
  });

  it('judges a cell of a merged block by the block\'s first cell, and lists no cell the block covers', () => {
    // Columns 1 and 2 of row 0 are one block; column 0 is frozen. A second block starts in the frozen column.
    const grid = layout({ fixedColumnsStart: 1 });
    const tables = [
      table('master', { rows: [0, 1], columns: [0, 1, 2, 3], rowHeaders: 1 }),
      table('inline_start', { rows: [0, 1], columns: [0], rowHeaders: 1 }),
    ];
    const [master, start] = tables;
    const masterCells = (row: number) => Array.from(master.TBODY!.children[row].querySelectorAll('td'));

    masterCells(0)[1].colSpan = 2;
    masterCells(0)[2].style.display = 'none';
    // Row 1: the block starts at the frozen column 0 and reaches column 1, which the master draws as a slice.
    masterCells(1)[1].style.display = '';

    const origins = new Map([['0:1', [0, 1]], ['0:2', [0, 1]], ['1:0', [1, 0]], ['1:1', [1, 0]]]);

    const getOrigin = (row: number, column: number) => (origins.get(`${row}:${column}`) as [number, number]) ?? null;

    reconcileAriaCells(tables, grid, 0, GUID, getOrigin);

    expect(owned(start.TBODY!.children[0], tables)).toEqual(['0:1', '0:3']);
    // The master's slice of the block that starts in the frozen column is a copy of the start clone's cell.
    expect(isHiddenByAriaTree(masterCells(1)[1])).toBe(true);
    expect(owned(start.TBODY!.children[1], tables)).toEqual(['1:2', '1:3']);
  });

  it('skips a table that was never drawn', () => {
    const drawn = table('master', { rows: [0], columns: [0], rowHeaders: 0 });
    const never: AriaCellsTable = { name: 'top', THEAD: null, TBODY: null, rowFilter: null, columnFilter: null };

    expect(() => reconcileAriaCells([drawn, never], layout({ rowHeadersCount: 0 }), 0, GUID)).not.toThrow();
    expect(exposed(drawn.TBODY)).toEqual([['0:0']]);
  });
});
