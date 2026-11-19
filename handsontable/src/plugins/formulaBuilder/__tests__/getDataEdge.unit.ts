import type { HotInstance } from '../../../core/types';
import { HandsontableAdapter } from '../handsontableAdapter';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';

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
