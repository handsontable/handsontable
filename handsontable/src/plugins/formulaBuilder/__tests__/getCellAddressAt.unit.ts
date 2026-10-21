import { getCellCoordsFromMousePosition } from '../../../helpers/dom/cellCoords';
import { HandsontableAdapter } from '../handsontableAdapter';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';
import type { HotStubShape } from './helpers/stubs';

// The pointer-to-cell resolution is a collaborator of the adapter (the shared helper the
// selection and DragToScroll use too), not the unit under test.
jest.mock('../../../helpers/dom/cellCoords', () => ({
  getCellCoordsFromMousePosition: jest.fn(),
}));

const resolveCoords = getCellCoordsFromMousePosition as jest.Mock;

/**
 * Builds an adapter over a stub grid.
 *
 * @param {object} [options] Per-test overrides.
 * @param {Partial<HotStubShape>} [options.hot] Handsontable stub overrides.
 * @param {object} [options.mapping] Index-mapping overrides.
 * @returns {{ adapter: HandsontableAdapter, hot: object }}
 */
function makeAdapter(options: {
  hot?: Partial<HotStubShape>;
  mapping?: Parameters<typeof makeAdapterOptions>[2];
} = {}) {
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);

  const hot = makeHotStub(options.hot);
  const adapter = new HandsontableAdapter(
    makeAdapterOptions(hot, overlayHost, options.mapping),
    makePluginStub(),
  );

  return { adapter, hot };
}

describe('HandsontableAdapter.getCellAddressAt', () => {
  afterEach(() => {
    resolveCoords.mockReset();
    document.body.replaceChildren();
  });

  it('resolves the pointer through getCellCoordsFromMousePosition and returns the HF address', () => {
    const { adapter, hot } = makeAdapter();

    resolveCoords.mockReturnValue({ row: 1, col: 2 });

    expect(adapter.getCellAddressAt(10, 20)).toEqual({ sheet: '', row: 1, col: 2 });
    expect(resolveCoords).toHaveBeenCalledWith(hot, 10, 20);

    adapter.destroy();
  });

  it('returns the nearest cell for a pointer held past the viewport edge', () => {
    const { adapter } = makeAdapter();

    // The helper clamps an out-of-viewport pointer to the nearest rendered cell.
    resolveCoords.mockReturnValue({ row: 49, col: 0 });

    expect(adapter.getCellAddressAt(-500, 99999)).toEqual({ sheet: '', row: 49, col: 0 });

    adapter.destroy();
  });

  it('translates the visual cell into HyperFormula space through the index mapping', () => {
    const { adapter } = makeAdapter({
      mapping: { visualToHfRow: row => row + 10, visualToHfCol: col => col + 3 },
    });

    resolveCoords.mockReturnValue({ row: 1, col: 2 });

    expect(adapter.getCellAddressAt(0, 0)).toEqual({ sheet: '', row: 11, col: 5 });

    adapter.destroy();
  });

  it('returns null without resolving the pointer when the grid has no view', () => {
    const { adapter } = makeAdapter({ hot: { view: undefined } as unknown as Partial<HotStubShape> });

    resolveCoords.mockReturnValue({ row: 1, col: 2 });

    expect(adapter.getCellAddressAt(10, 10)).toBeNull();
    expect(resolveCoords).not.toHaveBeenCalled();
  });

  it('returns null when the pointer resolves to no cell', () => {
    const { adapter } = makeAdapter();

    resolveCoords.mockReturnValue(null);

    expect(adapter.getCellAddressAt(10, 10)).toBeNull();

    adapter.destroy();
  });

  it.each([
    ['a column header', { row: -1, col: 2 }],
    ['a row header', { row: 1, col: -1 }],
    ['the corner', { row: -1, col: -1 }],
    ['an unset row', { row: null, col: 2 }],
    ['an unset column', { row: 1, col: null }],
  ])('returns null when the pointer resolves to %s', (_label, coords) => {
    const { adapter } = makeAdapter();

    resolveCoords.mockReturnValue(coords);

    expect(adapter.getCellAddressAt(10, 10)).toBeNull();

    adapter.destroy();
  });

  it('accepts the cell at visual row 0 and column 0 (not a header)', () => {
    const { adapter } = makeAdapter();

    resolveCoords.mockReturnValue({ row: 0, col: 0 });

    expect(adapter.getCellAddressAt(1, 1)).toEqual({ sheet: '', row: 0, col: 0 });

    adapter.destroy();
  });

  it.each([
    ['row', { visualToHfRow: () => -1 }],
    ['column', { visualToHfCol: () => -1 }],
  ])('returns null when the visual %s cannot be mapped to HyperFormula space', (_axis, mapping) => {
    const { adapter } = makeAdapter({ mapping });

    resolveCoords.mockReturnValue({ row: 1, col: 2 });

    expect(adapter.getCellAddressAt(10, 10)).toBeNull();

    adapter.destroy();
  });
});

describe('HandsontableAdapter.getGridSize', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  /**
   * Builds an adapter over a grid with the given physical index counts and engine dimensions.
   *
   * @param {number} rows The row index count.
   * @param {number} cols The column index count.
   * @param {{ rows: number, cols: number } | null} sheetDimensions The engine sheet dimensions.
   * @returns {HandsontableAdapter}
   */
  function makeSizedAdapter(
    rows: number,
    cols: number,
    sheetDimensions: { rows: number; cols: number } | null,
  ) {
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    // countRows/countCols report the visual (untrimmed) counts, which getGridSize must ignore.
    const hot = makeHotStub({
      countRows: () => 1,
      countCols: () => 1,
      rowIndexMapper: { getRenderableFromVisualIndex: index => index, getNumberOfIndexes: () => rows },
      columnIndexMapper: { getRenderableFromVisualIndex: index => index, getNumberOfIndexes: () => cols },
    });

    return new HandsontableAdapter(
      makeAdapterOptions(hot, overlayHost, {}, { getSheetDimensions: () => sheetDimensions }),
      makePluginStub(),
    );
  }

  it('reports the index count when the engine occupies less than the grid', () => {
    // A 100-row grid whose data stops at row 3 still navigates all 100 rows.
    const adapter = makeSizedAdapter(100, 8, { rows: 3, cols: 2 });

    expect(adapter.getGridSize()).toEqual({ rows: 100, cols: 8 });

    adapter.destroy();
  });

  it('widens the size to the engine dimensions when the sheet holds more than the grid', () => {
    const adapter = makeSizedAdapter(5, 4, { rows: 10, cols: 6 });

    expect(adapter.getGridSize()).toEqual({ rows: 10, cols: 6 });

    adapter.destroy();
  });

  it('takes the larger value per axis independently', () => {
    const adapter = makeSizedAdapter(5, 40, { rows: 10, cols: 6 });

    expect(adapter.getGridSize()).toEqual({ rows: 10, cols: 40 });

    adapter.destroy();
  });

  it('reports the index counts when the engine dimensions are unavailable', () => {
    const adapter = makeSizedAdapter(8, 4, null);

    expect(adapter.getGridSize()).toEqual({ rows: 8, cols: 4 });

    adapter.destroy();
  });
});
