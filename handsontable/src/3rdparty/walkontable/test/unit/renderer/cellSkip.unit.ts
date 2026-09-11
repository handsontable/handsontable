import { CellsRenderer } from 'walkontable/render/cells';
import { RowHeadersRenderer } from 'walkontable/render/rowHeaders';
import type { TableRenderer } from 'walkontable/render/tableRenderer';

interface Fixture {
  cells: CellsRenderer;
  tbody: HTMLElement;
  state: { rowOffset: number; columnOffset: number; skippable: boolean };
  cellRenderer: jest.Mock;
  /**
   * The (source row, source column) pairs the cell renderer was called with since the last reset.
   */
  paintedCoords(): string[];
  /**
   * Rotates the TR elements the way the rows renderer does on a scroll-driven draw.
   */
  rotateRows(delta: number): void;
}

const ROWS = 3;
const COLUMNS = 2;

/**
 * Builds a cells renderer over a TBODY with three TRs and the smallest table stub `render()` reads.
 *
 * @returns {Fixture}
 */
function createFixture(): Fixture {
  const tbody = document.createElement('tbody');

  for (let i = 0; i < ROWS; i++) {
    tbody.appendChild(document.createElement('tr'));
  }

  const state = { rowOffset: 0, columnOffset: 0, skippable: false };
  const cellRenderer = jest.fn();
  const rowHeaders = new RowHeadersRenderer();
  const cells = new CellsRenderer();
  const table = {
    rootDocument: document,
    rowsToRender: ROWS,
    columnsToRender: COLUMNS,
    rows: {
      getRenderedNode: (renderedRow: number) => tbody.children[renderedRow] ?? null,
    },
    rowHeaders,
    rowFilter: { offset: 0 },
    columnFilter: { offset: 0 },
    activeOverlayName: 'master',
    renderedRowToSource: (renderedRow: number) => state.rowOffset + renderedRow,
    renderedColumnToSource: (renderedColumn: number) => state.columnOffset + renderedColumn,
    shouldPaintCell: () => true,
    cellRenderer,
    isAriaEnabled: () => false,
    isUnchangedCellSkippable: () => state.skippable,
  } as unknown as TableRenderer;

  rowHeaders.setTable(table);
  cells.setTable(table);

  return {
    cells,
    tbody,
    state,
    cellRenderer,
    paintedCoords: () => cellRenderer.mock.calls.map(([row, column]) => `${row},${column}`),
    rotateRows(delta: number) {
      const fragment = document.createDocumentFragment();

      if (delta > 0) {
        for (let i = 0; i < delta; i++) {
          fragment.appendChild(tbody.firstElementChild as Node);
        }
        tbody.appendChild(fragment);
      } else {
        for (let i = 0; i < -delta; i++) {
          fragment.insertBefore(tbody.lastElementChild as Node, fragment.firstChild);
        }
        tbody.insertBefore(fragment, tbody.firstChild);
      }
    },
  };
}

describe('CellsRenderer unchanged-cell skip', () => {
  it('should paint every cell on a draw that may not skip', () => {
    const { cells, cellRenderer, paintedCoords } = createFixture();

    cells.render();

    expect(paintedCoords()).toEqual(['0,0', '0,1', '1,0', '1,1', '2,0', '2,1']);

    cellRenderer.mockClear();
    cells.render();

    expect(paintedCoords()).toEqual(['0,0', '0,1', '1,0', '1,1', '2,0', '2,1']);
  });

  it('should leave a cell alone on a scroll-driven draw when its element already shows that cell', () => {
    const { cells, cellRenderer, paintedCoords, state } = createFixture();

    cells.render();
    cellRenderer.mockClear();

    state.skippable = true;
    cells.render();

    expect(paintedCoords()).toEqual([]);
  });

  it('should paint only the rows that entered the band after the rows were recycled', () => {
    const { cells, cellRenderer, paintedCoords, state, tbody, rotateRows } = createFixture();

    cells.render();

    const tdOfRowOne = tbody.children[1].children[0];

    cellRenderer.mockClear();
    // The band moved down by one row: the rows renderer rotated the first TR to the bottom.
    rotateRows(1);
    state.rowOffset = 1;
    state.skippable = true;
    cells.render();

    expect(paintedCoords()).toEqual(['3,0', '3,1']);
    expect(tbody.children[0].children[0]).toBe(tdOfRowOne);
  });

  it('should paint only the rows that entered the band when the band moved up', () => {
    const { cells, cellRenderer, paintedCoords, state, rotateRows } = createFixture();

    state.rowOffset = 5;
    cells.render();
    cellRenderer.mockClear();

    rotateRows(-2);
    state.rowOffset = 3;
    state.skippable = true;
    cells.render();

    expect(paintedCoords()).toEqual(['3,0', '3,1', '4,0', '4,1']);
  });

  it('should paint every cell on a scroll-driven draw when the columns changed', () => {
    const { cells, cellRenderer, paintedCoords, state } = createFixture();

    cells.render();
    cellRenderer.mockClear();

    state.columnOffset = 1;
    state.skippable = true;
    cells.render();

    expect(paintedCoords()).toEqual(['0,1', '0,2', '1,1', '1,2', '2,1', '2,2']);
  });

  it('should paint every cell again on the next draw that may not skip', () => {
    const { cells, cellRenderer, paintedCoords, state } = createFixture();

    cells.render();
    state.skippable = true;
    cells.render();
    cellRenderer.mockClear();

    state.skippable = false;
    cells.render();

    expect(paintedCoords()).toEqual(['0,0', '0,1', '1,0', '1,1', '2,0', '2,1']);
  });
});
