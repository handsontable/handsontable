import { CellsRenderer } from 'walkontable/render/cells';
import { RowsRenderer } from 'walkontable/render/rows';
import { RowHeadersRenderer } from 'walkontable/render/rowHeaders';
import type { TableRenderer } from 'walkontable/render/tableRenderer';
import { rememberAnnouncedCell } from '../../../../../helpers/a11y';

interface Fixture {
  tbody: HTMLElement;
  state: {
    ariaEnabled: boolean;
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
    rowHeadersCount: 0,
    columnHeadersCount: 0,
    texts: new Map<string, string>(),
  };
  const rows = new RowsRenderer(tbody);
  const rowHeaders = new RowHeadersRenderer();
  const cells = new CellsRenderer();
  const table = {
    rootDocument: document,
    rowsToRender: 3,
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

/**
 * Gives the browser focus to a cell, the way the focus manager does: the cell is focused and its state recorded.
 *
 * @param {HTMLElement} TD The cell.
 */
function focusCell(TD: HTMLElement): void {
  TD.tabIndex = -1;
  TD.focus();
  rememberAnnouncedCell(TD);
}

describe('CellsRenderer announcing a change of the focused cell', () => {
  beforeEach(() => {
    jest.spyOn(document, 'hasFocus').mockReturnValue(true);
  });

  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  it('should rebuild the role of the focused cell that shows something else after a draw', () => {
    const { tbody, draw, state, watchRoles } = createFixture();

    document.body.append(tbody);
    draw();

    const focused = tbody.rows[1].cells[0];

    focusCell(focused);
    state.texts.set('1,0', 'changed');

    const take = watchRoles();

    draw();

    expect(take()).toEqual([focused]);
  });

  it('should not rebuild the focused cell when a draw leaves it as it was', () => {
    const { tbody, draw, watchRoles } = createFixture();

    document.body.append(tbody);
    draw();
    focusCell(tbody.rows[1].cells[0]);

    const take = watchRoles();

    draw();

    expect(take()).toEqual([]);
  });

  it('should not rebuild a cell that changed while another one holds the focus', () => {
    const { tbody, draw, state, watchRoles } = createFixture();

    document.body.append(tbody);
    draw();
    focusCell(tbody.rows[1].cells[0]);
    state.texts.set('2,1', 'changed elsewhere');

    const take = watchRoles();

    draw();

    expect(take()).toEqual([]);
  });

  it('should not rebuild anything for a grid that writes no ARIA attributes', () => {
    const { tbody, draw, state, watchRoles } = createFixture();

    state.ariaEnabled = false;
    document.body.append(tbody);
    draw();
    focusCell(tbody.rows[1].cells[0]);
    state.texts.set('1,0', 'changed');

    const take = watchRoles();

    draw();

    expect(take()).toEqual([]);
  });
});

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
