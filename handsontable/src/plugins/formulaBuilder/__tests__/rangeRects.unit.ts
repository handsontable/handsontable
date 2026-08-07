import type { CellRange } from '@hfe/core';
import type { HotInstance } from '../../../core/types';
import { HandsontableAdapter } from '../handsontableAdapter';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';

/**
 * Builds a cell range in HyperFormula coordinates.
 *
 * @param {number} startRow The start row index.
 * @param {number} startCol The start column index.
 * @param {number} endRow The end row index.
 * @param {number} endCol The end column index.
 * @returns {CellRange}
 */
function range(startRow: number, startCol: number, endRow: number, endCol: number): CellRange {
  return {
    start: { sheet: '', row: startRow, col: startCol },
    end: { sheet: '', row: endRow, col: endCol },
  };
}

/**
 * Renders the range through the adapter's highlight layer and returns the drawn
 * rect elements (the layer draws one element per computed range rect).
 *
 * @param {HandsontableAdapter} adapter The adapter under test.
 * @param {HTMLElement} overlayHost The overlay host the layer renders into.
 * @param {CellRange} cellRange The range to render.
 * @returns {Element[]}
 */
function renderRects(
  adapter: HandsontableAdapter,
  overlayHost: HTMLElement,
  cellRange: CellRange,
): Element[] {
  adapter.setHighlights([{ range: cellRange, color: 'red' }]);

  return [...overlayHost.querySelectorAll('.hfe-highlight__item')];
}

/**
 * Builds an adapter over a stub grid with the given frozen-pane settings.
 *
 * @param {{ fixedRowsTop: number, fixedColumnsStart: number }} opts Frozen-pane settings.
 * @returns {{ adapter: HandsontableAdapter, overlayHost: HTMLElement, getCell: jest.Mock }}
 */
function makeAdapter(opts: { fixedRowsTop: number; fixedColumnsStart: number }) {
  const getCell = jest.fn(() => document.createElement('td'));
  const hot = makeHotStub({
    getCell,
    getSettings: () => opts,
    getFirstRenderedVisibleRow: () => 5,
    getLastRenderedVisibleRow: () => 20,
    getFirstRenderedVisibleColumn: () => 5,
    getLastRenderedVisibleColumn: () => 20,
  });
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);
  const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

  return { adapter, overlayHost, getCell };
}

describe('HandsontableAdapter range rects with frozen panes', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('resolves a frozen-corner ref even when scrolled past it', () => {
    const { adapter, overlayHost, getCell } = makeAdapter({
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
    });

    const rects = renderRects(adapter, overlayHost, range(0, 0, 0, 0));

    expect(rects).toHaveLength(1);
    expect(getCell).toHaveBeenCalledWith(0, 0, true);
  });

  it('splits a range straddling both frozen boundaries into four rects', () => {
    const { adapter, overlayHost } = makeAdapter({ fixedRowsTop: 2, fixedColumnsStart: 2 });

    const rects = renderRects(adapter, overlayHost, range(0, 0, 10, 10));

    expect(rects).toHaveLength(4);
  });

  it('returns a single rect when nothing is frozen', () => {
    const { adapter, overlayHost } = makeAdapter({ fixedRowsTop: 0, fixedColumnsStart: 0 });

    const rects = renderRects(adapter, overlayHost, range(6, 6, 8, 8));

    expect(rects).toHaveLength(1);
  });

  it('resolves the visible cell via the topmost overlay', () => {
    const { adapter, overlayHost, getCell } = makeAdapter({
      fixedRowsTop: 2,
      fixedColumnsStart: 2,
    });

    renderRects(adapter, overlayHost, range(6, 6, 8, 8));

    expect(getCell).toHaveBeenCalledWith(6, 6, true);
    expect(getCell).toHaveBeenCalledWith(8, 8, true);
  });
});

describe('HandsontableAdapter.getDataEdge empty grid', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('returns from unchanged for all directions when countRows/countCols return 0', () => {
    const hot = makeHotStub({
      getCell: jest.fn(),
      getFirstRenderedVisibleRow: () => 0,
      getLastRenderedVisibleRow: () => 0,
      getFirstRenderedVisibleColumn: () => 0,
      getLastRenderedVisibleColumn: () => 0,
      countRows: () => 0,
      countCols: () => 0,
    });
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());
    const from = { sheet: '', row: 0, col: 0 };

    for (const direction of ['up', 'down', 'left', 'right'] as const) {
      expect(adapter.getDataEdge(from, direction)).toEqual(from);
    }
  });
});

describe('HandsontableAdapter.getDataEdge data walk', () => {
  /**
   * Builds a 10x10 stub grid whose data cells are defined by the given predicate.
   *
   * @param {Function} hasData Predicate deciding whether a cell holds data.
   * @returns {HotInstance}
   */
  function makeHot(hasData: (row: number, col: number) => boolean): HotInstance {
    return makeHotStub({
      getCell: jest.fn(),
      getFirstRenderedVisibleRow: () => 0,
      getLastRenderedVisibleRow: () => 9,
      getFirstRenderedVisibleColumn: () => 0,
      getLastRenderedVisibleColumn: () => 9,
      countRows: () => 10,
      countCols: () => 10,
      getDataAtCell: (row: number, col: number) => (hasData(row, col) ? 'x' : ''),
    });
  }

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('walks to the last contiguous data cell in the direction', () => {
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);
    const adapter = new HandsontableAdapter(
      makeAdapterOptions(
        makeHot((row, col) => row === 0 && col <= 3),
        overlayHost,
      ),
      makePluginStub(),
    );

    expect(adapter.getDataEdge({ sheet: '', row: 0, col: 0 }, 'right')).toEqual({
      sheet: '',
      row: 0,
      col: 3,
    });
  });

  it('steps a single cell when there is no adjacent data', () => {
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);
    const adapter = new HandsontableAdapter(
      makeAdapterOptions(
        makeHot((row, col) => row === 0 && col === 0),
        overlayHost,
      ),
      makePluginStub(),
    );

    expect(adapter.getDataEdge({ sheet: '', row: 0, col: 0 }, 'right')).toEqual({
      sheet: '',
      row: 0,
      col: 1,
    });
  });

  it('walks the data in visual space and returns HF indices under a column move', () => {
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);
    const hot = makeHot((row, col) => row === 0 && col <= 3);
    const adapter = new HandsontableAdapter(
      makeAdapterOptions(hot, overlayHost, {
        hfToVisualCol: hfCol => hfCol - 1,
        visualToHfCol: visualCol => visualCol + 1,
      }),
      makePluginStub(),
    );

    expect(adapter.getDataEdge({ sheet: '', row: 0, col: 1 }, 'right')).toEqual({
      sheet: '',
      row: 0,
      col: 4,
    });
  });
});
