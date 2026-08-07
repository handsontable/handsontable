import { HandsontableAdapter } from '../handsontableAdapter';
import type { VisualHfIndexMapping } from '../types';
import type { HotStubShape } from './helpers/stubs';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';

const ROW_OFFSET = 100;
const COL_OFFSET = 200;

type ElementFromPointDocument = Document & {
  elementFromPoint: (x: number, y: number) => Element | null;
};

/**
 * Builds an index mapping that offsets rows by 100 and columns by 200, with
 * every translation function wrapped in a spy.
 *
 * @returns {object} The mapping with jest.fn members.
 */
function makeOffsetMapping() {
  return {
    visualToHfRow: jest.fn((visualRow: number) => visualRow + ROW_OFFSET),
    visualToHfCol: jest.fn((visualCol: number) => visualCol + COL_OFFSET),
    hfToVisualRow: jest.fn((hfRow: number) => hfRow - ROW_OFFSET),
    hfToVisualCol: jest.fn((hfCol: number) => hfCol - COL_OFFSET),
  };
}

/**
 * Builds an adapter over a 7x9 stub grid with the offset mapping injected.
 *
 * @param {object} hotOverrides Per-test Handsontable stub overrides.
 * @param {object} mappingOverrides Per-test mapping overrides.
 * @returns {object} The adapter, overlay host, stubs, and spies.
 */
function makeMappedAdapter(
  hotOverrides: Partial<HotStubShape> = {},
  mappingOverrides: Partial<VisualHfIndexMapping> = {},
) {
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);

  const mapping = { ...makeOffsetMapping(), ...mappingOverrides };
  const hot = makeHotStub({ countRows: () => 7, countCols: () => 9, ...hotOverrides });
  const plugin = {
    ...makePluginStub(),
    selectFormulaCell: jest.fn(),
    selectFormulaCells: jest.fn(),
  };
  const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost, mapping), plugin);

  return { adapter, overlayHost, hot, mapping, plugin };
}

/**
 * Builds an adapter over a grid stub with the given hidden visual rows/columns,
 * using identity visual/HF index mapping (HF and visual assertions are equivalent
 * in these tests, since only the renderable axis is exercised).
 *
 * @param {object} options Grid size and hidden visual row/column indexes.
 * @returns {HandsontableAdapter} The adapter, wired to a stub grid with hidden indexes.
 */
function buildAdapterWithHidden({
  hiddenRows = [],
  hiddenCols = [],
  size,
}: {
  hiddenRows?: number[];
  hiddenCols?: number[];
  size: { rows: number; cols: number };
}): HandsontableAdapter {
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);

  const hot = makeHotStub({
    countRows: () => size.rows,
    countCols: () => size.cols,
    rowIndexMapper: {
      getRenderableFromVisualIndex: (visualIndex: number) => (hiddenRows.includes(visualIndex) ? null : visualIndex),
    },
    columnIndexMapper: {
      getRenderableFromVisualIndex: (visualIndex: number) => (hiddenCols.includes(visualIndex) ? null : visualIndex),
    },
  });
  const plugin = makePluginStub();

  return new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), plugin);
}

afterEach(() => {
  delete (document as Partial<ElementFromPointDocument>).elementFromPoint;
  document.body.replaceChildren();
});

describe('HandsontableAdapter index mapping', () => {
  it('translates the cell under the pointer into HF space through the injected mapping', () => {
    const { adapter, overlayHost, mapping } = makeMappedAdapter({
      getCoords: () => ({ row: 3, col: 4 }),
    });
    const cell = document.createElement('td');

    overlayHost.appendChild(cell);
    (document as ElementFromPointDocument).elementFromPoint = jest.fn(() => cell);

    expect(adapter.getCellAddressAt(10, 10)).toEqual({
      sheet: '',
      row: 3 + ROW_OFFSET,
      col: 4 + COL_OFFSET,
    });
    expect(mapping.visualToHfRow).toHaveBeenCalledWith(3);
    expect(mapping.visualToHfCol).toHaveBeenCalledWith(4);
  });

  it('steps a cell in visual space and maps the result back to HF space', () => {
    const { adapter, mapping } = makeMappedAdapter();

    expect(adapter.stepCell({ sheet: '', row: 103, col: 204 }, 'down')).toEqual({
      sheet: '',
      row: 104,
      col: 204,
    });
    expect(mapping.hfToVisualRow).toHaveBeenCalledWith(103);
    expect(mapping.hfToVisualCol).toHaveBeenCalledWith(204);
    expect(mapping.visualToHfRow).toHaveBeenCalledWith(4);
  });

  it('clamps a step at the visual grid edge', () => {
    const { adapter } = makeMappedAdapter();

    expect(adapter.stepCell({ sheet: '', row: 106, col: 204 }, 'down')).toEqual({
      sheet: '',
      row: 106,
      col: 204,
    });
  });

  it('returns the step start unchanged when the mapping cannot resolve it', () => {
    const { adapter } = makeMappedAdapter({}, { hfToVisualRow: () => -1 });
    const from = { sheet: '', row: 103, col: 204 };

    expect(adapter.stepCell(from, 'down')).toEqual(from);
  });

  it('probes cell data in visual space and returns the data edge in HF space', () => {
    const getDataAtCell = jest.fn((row: number) => (row <= 2 ? 'x' : null));
    const { adapter } = makeMappedAdapter({ getDataAtCell });

    expect(adapter.getDataEdge({ sheet: '', row: 100, col: 200 }, 'down')).toEqual({
      sheet: '',
      row: 102,
      col: 200,
    });
    expect(getDataAtCell).toHaveBeenCalledWith(1, 0);
    expect(getDataAtCell).not.toHaveBeenCalledWith(101, 200);
  });

  it('returns the data-edge start unchanged when the mapping cannot resolve it', () => {
    const { adapter } = makeMappedAdapter({}, { hfToVisualCol: () => -1 });
    const from = { sheet: '', row: 100, col: 200 };

    expect(adapter.getDataEdge(from, 'down')).toEqual(from);
  });

  it('scrolls to the visual coordinates of an HF address', () => {
    const scrollViewportTo = jest.fn(() => true);
    const { adapter } = makeMappedAdapter({
      scrollViewportTo,
      getFirstFullyVisibleRow: () => 0,
      getLastFullyVisibleRow: () => 4,
      getFirstFullyVisibleColumn: () => 0,
      getLastFullyVisibleColumn: () => 4,
    });

    adapter.scrollCellIntoView({ sheet: '', row: 106, col: 206 });

    expect(scrollViewportTo).toHaveBeenCalledWith({
      row: 6,
      verticalSnap: 'bottom',
      col: 6,
      horizontalSnap: 'end',
    });
  });

  it('does not scroll for an address the mapping cannot resolve', () => {
    const scrollViewportTo = jest.fn(() => true);
    const { adapter } = makeMappedAdapter({ scrollViewportTo }, { hfToVisualRow: () => -1 });

    adapter.scrollCellIntoView({ sheet: '', row: 106, col: 206 });

    expect(scrollViewportTo).not.toHaveBeenCalled();
  });

  it('maps HF coordinates to visual before delegating selection to the plugin', () => {
    const { adapter, plugin } = makeMappedAdapter();

    adapter.setActiveCell({ sheet: '', row: 105, col: 207 });

    expect(plugin.selectFormulaCell).toHaveBeenCalledWith(5, 7);

    adapter.setSelection({
      start: { sheet: '', row: 101, col: 202 },
      end: { sheet: '', row: 103, col: 204 },
    });

    expect(plugin.selectFormulaCells).toHaveBeenCalledWith(1, 2, 3, 4);
  });
});

describe('HandsontableAdapter host delegation', () => {
  it('reads the grid size from the host instance', () => {
    const { adapter } = makeMappedAdapter();

    expect(adapter.getGridSize()).toEqual({ rows: 7, cols: 9 });
  });

  it('resolves the master scroll holder through hot.view and falls back to null', () => {
    const holder = document.createElement('div');
    const getOverlayByName = jest.fn((overlayName: string) =>
      (overlayName === 'top' ? { holder, clone: null } : null),
    );
    const { adapter } = makeMappedAdapter({ view: { getOverlayByName } });

    expect(adapter.getScrollHolder()).toBe(holder);
    expect(getOverlayByName).toHaveBeenCalledWith('top');

    const { adapter: holderless } = makeMappedAdapter();

    expect(holderless.getScrollHolder()).toBeNull();
  });
});

describe('stepCell over hidden columns', () => {
  it('skips a hidden column when stepping right', () => {
    // grid 6 cols, visual col 2 hidden (renderable mapping returns null for it)
    const adapter = buildAdapterWithHidden({ hiddenCols: [2], size: { rows: 10, cols: 6 } });

    const stepped = adapter.stepCell({ sheet: '', row: 7, col: 1 }, 'right');

    expect(stepped.col).toBe(3); // lands past hidden col 2
  });

  it('skips a hidden column when stepping left', () => {
    const adapter = buildAdapterWithHidden({ hiddenCols: [2], size: { rows: 10, cols: 6 } });

    const stepped = adapter.stepCell({ sheet: '', row: 7, col: 3 }, 'left');

    expect(stepped.col).toBe(1);
  });

  it('stays put when everything toward the edge is hidden', () => {
    const adapter = buildAdapterWithHidden({ hiddenCols: [4, 5], size: { rows: 10, cols: 6 } });

    const stepped = adapter.stepCell({ sheet: '', row: 7, col: 3 }, 'right');

    expect(stepped.col).toBe(3); // unchanged
  });
});
