import { CellsRenderer } from 'walkontable/render/cells';
import { RowsRenderer } from 'walkontable/render/rows';
import { RowHeadersRenderer } from 'walkontable/render/rowHeaders';
import type { TableRenderer } from 'walkontable/render/tableRenderer';

interface Fixture {
  tbody: HTMLElement;
  state: {
    rowOffset: number;
    columnOffset: number;
    rowsToRender: number;
    columnsToRender: number;
    scrollDriven: boolean;
    stationary: boolean;
  };
  shouldPaintCell: jest.Mock;
  /**
   * Runs one draw: the real rows renderer (which rotates the TRs when recycling is allowed), then
   * the cells renderer.
   */
  draw(): void;
  /**
   * The band identities the cells renderer handed to `shouldPaintCell`, one per cell, deduplicated.
   */
  bands(): string[];
}

/**
 * Builds a cells renderer over a TBODY driven by a real `RowsRenderer`, with a table stub whose
 * draw flags the test controls.
 *
 * @returns {Fixture}
 */
function createFixture(): Fixture {
  const tbody = document.createElement('tbody');
  const state = {
    rowOffset: 0,
    columnOffset: 0,
    rowsToRender: 3,
    columnsToRender: 2,
    scrollDriven: false,
    stationary: false,
  };
  const shouldPaintCell = jest.fn(() => true);
  const rows = new RowsRenderer(tbody);
  const rowHeaders = new RowHeadersRenderer();
  const cells = new CellsRenderer();
  const table = {
    rootDocument: document,
    get rowsToRender() {
      return state.rowsToRender;
    },
    get columnsToRender() {
      return state.columnsToRender;
    },
    rows,
    rowHeaders,
    get rowFilter() {
      return { offset: state.rowOffset };
    },
    get columnFilter() {
      return { offset: state.columnOffset };
    },
    activeOverlayName: 'master',
    renderedRowToSource: (renderedRow: number) => state.rowOffset + renderedRow,
    renderedColumnToSource: (renderedColumn: number) => state.columnOffset + renderedColumn,
    shouldPaintCell,
    cellRenderer: jest.fn(),
    isAriaEnabled: () => false,
    hasStationaryBands: () => state.stationary,
    isRowRecyclingAllowed: () => state.scrollDriven && state.stationary,
  } as unknown as TableRenderer;

  rows.setTable(table);
  rowHeaders.setTable(table);
  cells.setTable(table);

  return {
    tbody,
    state,
    shouldPaintCell,
    draw() {
      rows.render();
      cells.render();
    },
    bands: () => Array.from(new Set(shouldPaintCell.mock.calls.map((call: unknown[]) => call[3] as string))),
  };
}

describe('CellsRenderer band identity', () => {
  it('should carry the offsets and sizes when stationary bands are not allowed', () => {
    const { draw, bands, state } = createFixture();

    state.rowOffset = 4;
    state.columnOffset = 1;
    draw();

    expect(bands()).toEqual(['master,4,3,1,2']);
  });

  it('should change with the offsets when stationary bands are not allowed', () => {
    const { draw, bands, state, shouldPaintCell } = createFixture();

    draw();
    shouldPaintCell.mockClear();

    state.rowOffset = 1;
    draw();

    expect(bands()).toEqual(['master,1,3,0,2']);
  });

  it('should be the overlay name alone when stationary bands are allowed', () => {
    const { draw, bands, state } = createFixture();

    state.stationary = true;
    state.rowOffset = 4;
    state.columnOffset = 1;
    draw();

    expect(bands()).toEqual(['master']);
  });

  it('should stay the same across a scroll when stationary bands are allowed', () => {
    const { draw, bands, state, shouldPaintCell } = createFixture();

    state.stationary = true;
    draw();
    shouldPaintCell.mockClear();

    state.scrollDriven = true;
    state.rowOffset = 1;
    state.rowsToRender = 4;
    draw();

    expect(bands()).toEqual(['master']);
  });

  it('should hand a carried-over element to the host with its own source coordinates after a scroll', () => {
    const { draw, state, shouldPaintCell, tbody } = createFixture();

    state.stationary = true;
    draw();

    const tdOfRowOne = tbody.children[1].children[0];

    shouldPaintCell.mockClear();
    state.scrollDriven = true;
    state.rowOffset = 1;
    draw();

    // The TR that held row 1 is now the first row of the band, still carrying its own TD, and the
    // host is asked about that element with the coordinates it already shows.
    expect(tbody.children[0].children[0]).toBe(tdOfRowOne);
    expect(shouldPaintCell.mock.calls[0]).toEqual([1, 0, tdOfRowOne, 'master']);
  });

  it('should ask the host about every cell of the band whatever the draw flags', () => {
    const { draw, state, shouldPaintCell } = createFixture();

    draw();
    expect(shouldPaintCell).toHaveBeenCalledTimes(6);

    shouldPaintCell.mockClear();
    state.stationary = true;
    state.scrollDriven = true;
    state.rowOffset = 1;
    draw();

    expect(shouldPaintCell).toHaveBeenCalledTimes(6);
  });
});
