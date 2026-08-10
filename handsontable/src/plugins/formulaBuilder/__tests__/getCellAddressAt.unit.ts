import { HandsontableAdapter } from '../handsontableAdapter';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';

/**
 * Builds an adapter over a stub grid whose every cell maps to visual (1, 2).
 *
 * @returns {{ adapter: HandsontableAdapter, overlayHost: HTMLElement }}
 */
function makeAdapter() {
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);

  const hot = makeHotStub({ getCoords: () => ({ row: 1, col: 2 }) });
  const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

  return { adapter, overlayHost };
}

type ElementFromPointDocument = Document & {
  elementFromPoint: (x: number, y: number) => Element | null;
};

describe('HandsontableAdapter.getCellAddressAt', () => {
  afterEach(() => {
    delete (document as Partial<ElementFromPointDocument>).elementFromPoint;
    document.body.replaceChildren();
  });

  it('returns the address for a td inside the overlay host', () => {
    const { adapter, overlayHost } = makeAdapter();
    const cell = document.createElement('td');

    overlayHost.appendChild(cell);
    (document as ElementFromPointDocument).elementFromPoint = jest.fn(() => cell);

    expect(adapter.getCellAddressAt(10, 10)).toEqual({ sheet: '', row: 1, col: 2 });
  });

  it('ignores a td that belongs to another table on the page', () => {
    const { adapter } = makeAdapter();
    const foreign = document.createElement('td');

    document.body.appendChild(foreign);
    (document as ElementFromPointDocument).elementFromPoint = jest.fn(() => foreign);

    expect(adapter.getCellAddressAt(10, 10)).toBeNull();
  });

  it('returns null when the visual coordinates cannot be mapped to HyperFormula space', () => {
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const hot = makeHotStub({ getCoords: () => ({ row: 1, col: 2 }) });
    const options = makeAdapterOptions(hot, overlayHost, { visualToHfRow: () => -1 });
    const adapter = new HandsontableAdapter(options, makePluginStub());
    const cell = document.createElement('td');

    overlayHost.appendChild(cell);
    (document as ElementFromPointDocument).elementFromPoint = jest.fn(() => cell);

    expect(adapter.getCellAddressAt(10, 10)).toBeNull();
  });
});

describe('HandsontableAdapter.getGridSize', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reports the engine sheet dimensions when available', () => {
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const hot = makeHotStub({ countRows: () => 8, countCols: () => 4 });
    const options = {
      ...makeAdapterOptions(hot, overlayHost),
      getSheetDimensions: () => ({ rows: 10, cols: 6 }),
    };
    const adapter = new HandsontableAdapter(options, makePluginStub());

    expect(adapter.getGridSize()).toEqual({ rows: 10, cols: 6 });
  });

  it('falls back to the visual counts when the engine dimensions are unavailable', () => {
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const hot = makeHotStub({ countRows: () => 8, countCols: () => 4 });
    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    expect(adapter.getGridSize()).toEqual({ rows: 8, cols: 4 });
  });
});
