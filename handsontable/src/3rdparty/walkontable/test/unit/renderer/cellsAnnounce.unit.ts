import { CellsRenderer } from 'walkontable/render/cells';
import { RowsRenderer } from 'walkontable/render/rows';
import { RowHeadersRenderer } from 'walkontable/render/rowHeaders';
import type { TableRenderer } from 'walkontable/render/tableRenderer';

interface Fixture {
  tbody: HTMLElement;
  state: {
    ariaEnabled: boolean;
    rowsToRender: number;
    rowHeadersCount: number;
    columnHeadersCount: number;
    texts: Map<string, string>;
  };
  draw(): void;
  /**
   * Starts counting the removals of a `role` on the cells, which is what a rebuild of the accessibility object is.
   */
  watchRoles(): () => HTMLElement[];
}

/**
 * Builds a cells renderer over a TBODY driven by a real `RowsRenderer`, with a table stub that has the ARIA
 * attributes on and a renderer that shows the text the test sets per cell.
 *
 * @returns {Fixture}
 */
function createFixture(): Fixture {
  const tbody = document.createElement('tbody');
  const state = {
    ariaEnabled: true,
    rowsToRender: 3,
    rowHeadersCount: 0,
    columnHeadersCount: 0,
    texts: new Map<string, string>(),
  };
  const rows = new RowsRenderer(tbody);
  const rowHeaders = new RowHeadersRenderer();
  const cells = new CellsRenderer();
  const table = {
    rootDocument: document,
    get rowsToRender() {
      return state.rowsToRender;
    },
    columnsToRender: 2,
    rows,
    rowHeaders,
    rowFilter: { offset: 0 },
    columnFilter: { offset: 0 },
    activeOverlayName: 'master',
    renderedRowToSource: (renderedRow: number) => renderedRow,
    renderedColumnToSource: (renderedColumn: number) => renderedColumn,
    shouldPaintCell: () => true,
    cellRenderer: (row: number, column: number, TD: HTMLElement) => {
      TD.textContent = state.texts.get(`${row},${column}`) ?? `${row},${column}`;
    },
    isAriaEnabled: () => state.ariaEnabled,
    hasColumnHeaders: () => state.columnHeadersCount > 0,
    getAriaColumnHeaderIdPrefix: () => '',
    get columnHeadersCount() {
      return state.columnHeadersCount;
    },
    rowUtils: {
      deps: {
        getRowHeaders: () => new Array(state.rowHeadersCount),
        getColumnHeaders: () => new Array(state.columnHeadersCount),
      },
    },
    paintFromRow: 0,
    hasStableCellIdentity: () => false,
    isRowRecyclingAllowed: () => false,
  } as unknown as TableRenderer;

  rows.setTable(table);
  rowHeaders.setTable(table);
  cells.setTable(table);

  return {
    tbody,
    state,
    draw() {
      rows.render();
      cells.render();
    },
    watchRoles() {
      const removed: HTMLElement[] = [];
      const observer = new MutationObserver(() => {});

      observer.observe(tbody, { attributes: true, attributeFilter: ['role'], attributeOldValue: true, subtree: true });

      return () => {
        observer.takeRecords().forEach((record) => {
          if (record.oldValue !== null && (record.target as HTMLElement).nodeName === 'TD') {
            removed.push(record.target as HTMLElement);
          }
        });
        observer.disconnect();

        return removed;
      };
    },
  };
}

describe('CellsRenderer announcing a change of the header counts', () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  it('should rebuild every cell once when a column header row appears', () => {
    const { tbody, draw, state, watchRoles } = createFixture();

    document.body.append(tbody);
    draw();

    const take = watchRoles();

    state.columnHeadersCount = 1;
    draw();

    expect(take()).toHaveLength(6);

    const again = watchRoles();

    draw();

    expect(again()).toEqual([]);
  });

  it('should rebuild every cell once when the number of column header rows changes but not whether there are any', () => {
    const { tbody, draw, state, watchRoles } = createFixture();

    state.columnHeadersCount = 1;
    document.body.append(tbody);
    draw();

    const take = watchRoles();

    state.columnHeadersCount = 2;
    draw();

    expect(take()).toHaveLength(6);
  });

  it('should rebuild every cell once when a row header column appears', () => {
    const { tbody, draw, state, watchRoles } = createFixture();

    document.body.append(tbody);
    draw();

    const take = watchRoles();

    state.rowHeadersCount = 1;
    draw();

    expect(take()).toHaveLength(6);
  });

  it('should rebuild nothing on the first draw', () => {
    const { tbody, draw, watchRoles } = createFixture();

    document.body.append(tbody);

    const take = watchRoles();

    draw();

    expect(take()).toEqual([]);
  });

  it('should not rebuild a grid that writes no ARIA attributes when its headers change', () => {
    const { tbody, draw, state, watchRoles } = createFixture();

    state.ariaEnabled = false;
    document.body.append(tbody);
    draw();

    const take = watchRoles();

    state.columnHeadersCount = 1;
    draw();

    expect(take()).toEqual([]);
  });
});

describe('RowsRenderer announcing a change of the column header count', () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  /**
   * Counts the rows whose `role` is removed, which is what a rebuild of the accessibility object is. A row's
   * `role` is also written with the same value on every draw, which does not count.
   *
   * @returns {() => number} Reads the count.
   */
  function watchRowRoleRemovals(): () => number {
    let removals = 0;
    const nativeRemove = Element.prototype.removeAttribute;

    jest.spyOn(Element.prototype, 'removeAttribute').mockImplementation(function(this: Element, name: string) {
      if (name === 'role' && this.nodeName === 'TR') {
        removals += 1;
      }

      nativeRemove.call(this, name);
    });

    return () => removals;
  }

  it('should rebuild every row once when a column header row appears', () => {
    const { tbody, draw, state } = createFixture();

    document.body.append(tbody);
    draw();

    const removals = watchRowRoleRemovals();

    state.columnHeadersCount = 1;
    draw();

    expect(removals()).toBe(3);

    draw();

    expect(removals()).toBe(3);
  });

  it('should rebuild nothing on the first draw', () => {
    const { tbody, draw } = createFixture();

    document.body.append(tbody);

    const removals = watchRowRoleRemovals();

    draw();

    expect(removals()).toBe(0);
  });

  it('should not rebuild a grid that writes no ARIA attributes', () => {
    const { tbody, draw, state } = createFixture();

    state.ariaEnabled = false;
    document.body.append(tbody);
    draw();

    const removals = watchRowRoleRemovals();

    state.columnHeadersCount = 1;
    draw();

    expect(removals()).toBe(0);
  });
});

describe('a header count change that waits for the draw that shows rows', () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  it('should rebuild the cells and the rows once the rows come back after a draw with none', () => {
    const { tbody, draw, state, watchRoles } = createFixture();

    document.body.append(tbody);
    draw();

    state.rowsToRender = 0;
    state.columnHeadersCount = 1;
    draw();

    const take = watchRoles();
    let rowRemovals = 0;
    const nativeRemove = Element.prototype.removeAttribute;

    jest.spyOn(Element.prototype, 'removeAttribute').mockImplementation(function(this: Element, name: string) {
      if (name === 'role' && this.nodeName === 'TR') {
        rowRemovals += 1;
      }

      nativeRemove.call(this, name);
    });

    state.rowsToRender = 3;
    draw();

    expect(take()).toHaveLength(6);
    expect(rowRemovals).toBe(3);
  });
});
