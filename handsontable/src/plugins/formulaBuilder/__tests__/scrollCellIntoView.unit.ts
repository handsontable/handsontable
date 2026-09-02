import { HandsontableAdapter } from '../handsontableAdapter';
import type { VisualHfIndexMapping } from '../types';
import type { HotStubShape } from './helpers/stubs';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';

interface ViewportWindow {
  firstRow?: number;
  lastRow?: number;
  firstCol?: number;
  lastCol?: number;
}

/**
 * Builds an adapter over a stub grid with a configurable fully-visible viewport,
 * per-test Handsontable overrides, and per-test index-mapping overrides.
 *
 * @param {ViewportWindow} viewport Fully-visible viewport bounds.
 * @param {Partial<HotStubShape>} hotOverrides Handsontable stub member overrides.
 * @param {Partial<VisualHfIndexMapping>} mappingOverrides Index-mapping overrides.
 * @returns {{ adapter: HandsontableAdapter, scrollViewportTo: Function }}
 */
function makeAdapter(
  viewport: ViewportWindow = {},
  hotOverrides: Partial<HotStubShape> = {},
  mappingOverrides: Partial<VisualHfIndexMapping> = {},
) {
  const { firstRow = 10, lastRow = 20, firstCol = 2, lastCol = 8 } = viewport;
  const scrollViewportTo = jest.fn(() => true);
  const hot = makeHotStub({
    getCell: () => document.createElement('td'),
    scrollViewportTo,
    getFirstFullyVisibleRow: () => firstRow,
    getLastFullyVisibleRow: () => lastRow,
    getFirstFullyVisibleColumn: () => firstCol,
    getLastFullyVisibleColumn: () => lastCol,
    ...hotOverrides,
  });
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);

  const adapter = new HandsontableAdapter(
    makeAdapterOptions(hot, overlayHost, mappingOverrides),
    makePluginStub(),
  );

  return { adapter, scrollViewportTo };
}

describe('HandsontableAdapter.scrollCellIntoView', () => {
  it('snaps to the bottom when the cell is below the viewport', () => {
    const { adapter, scrollViewportTo } = makeAdapter();

    adapter.scrollCellIntoView({ sheet: '', row: 40, col: 3 });

    expect(scrollViewportTo).toHaveBeenCalledWith({ row: 40, verticalSnap: 'bottom' });
  });

  it('snaps to the top when the cell is above the viewport', () => {
    const { adapter, scrollViewportTo } = makeAdapter();

    adapter.scrollCellIntoView({ sheet: '', row: 4, col: 3 });

    expect(scrollViewportTo).toHaveBeenCalledWith({ row: 4, verticalSnap: 'top' });
  });

  it('snaps horizontally when the cell is outside the viewport columns', () => {
    const { adapter, scrollViewportTo } = makeAdapter();

    adapter.scrollCellIntoView({ sheet: '', row: 15, col: 12 });

    expect(scrollViewportTo).toHaveBeenCalledWith({ col: 12, horizontalSnap: 'end' });
  });

  it('scrolls both axes when the cell is outside on both', () => {
    const { adapter, scrollViewportTo } = makeAdapter();

    adapter.scrollCellIntoView({ sheet: '', row: 40, col: 0 });

    expect(scrollViewportTo).toHaveBeenCalledWith({
      row: 40,
      verticalSnap: 'bottom',
      col: 0,
      horizontalSnap: 'start',
    });
  });

  it('does not scroll when the cell is fully visible', () => {
    const { adapter, scrollViewportTo } = makeAdapter();

    adapter.scrollCellIntoView({ sheet: '', row: 15, col: 5 });

    expect(scrollViewportTo).not.toHaveBeenCalled();
  });

  it('maps HF indices to visual indices before deciding', () => {
    const { adapter, scrollViewportTo } = makeAdapter(
      {},
      {},
      {
        hfToVisualRow: (hfRow: number) => hfRow + 30,
        hfToVisualCol: (hfCol: number) => hfCol,
      },
    );

    adapter.scrollCellIntoView({ sheet: '', row: 10, col: 5 });

    expect(scrollViewportTo).toHaveBeenCalledWith({ row: 40, verticalSnap: 'bottom' });
  });

  it('skips scrolling when the cell maps to a hidden index', () => {
    const { adapter, scrollViewportTo } = makeAdapter(
      {},
      {},
      {
        hfToVisualRow: () => -1,
        hfToVisualCol: (hfCol: number) => hfCol,
      },
    );

    adapter.scrollCellIntoView({ sheet: '', row: 10, col: 5 });

    expect(scrollViewportTo).not.toHaveBeenCalled();
  });

  it('falls back to a plain scroll when the viewport reports no fully-visible row (-1)', () => {
    const { adapter, scrollViewportTo } = makeAdapter({
      firstRow: -1,
      lastRow: -1,
      firstCol: -1,
      lastCol: -1,
    });

    adapter.scrollCellIntoView({ sheet: '', row: 5, col: 3 });

    expect(scrollViewportTo).toHaveBeenCalledWith({ row: 5, col: 3 });
  });

  it('does not throw when the host reports no fully-visible bounds', () => {
    const hot = makeHotStub({ getCell: () => null });
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    expect(() => adapter.scrollCellIntoView({ sheet: '', row: 1, col: 1 })).not.toThrow();
  });
});

describe('HandsontableAdapter.getActiveCell', () => {
  /**
   * Builds an adapter whose plugin tracks the given formula cell.
   *
   * @param {{ row: number, col: number } | null} tracked The tracked formula cell.
   * @param {Partial<VisualHfIndexMapping>} mappingOverrides Index-mapping overrides.
   * @returns {HandsontableAdapter}
   */
  function makeGetActiveCellAdapter(
    tracked: { row: number; col: number } | null,
    mappingOverrides: Partial<VisualHfIndexMapping> = {},
  ) {
    const hot = makeHotStub({ getCell: () => null });
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const plugin = { ...makePluginStub(), getActiveFormulaCell: () => tracked };

    return new HandsontableAdapter(makeAdapterOptions(hot, overlayHost, mappingOverrides), plugin);
  }

  it('maps the tracked visual cell to HF indices under a row/column move', () => {
    const adapter = makeGetActiveCellAdapter(
      { row: 5, col: 3 },
      {
        visualToHfRow: (visualRow: number) => visualRow + 100,
        visualToHfCol: (visualCol: number) => visualCol + 200,
      },
    );

    expect(adapter.getActiveCell()).toEqual({ sheet: '', row: 105, col: 203 });
  });

  it('returns the raw indices under the identity mapping', () => {
    const adapter = makeGetActiveCellAdapter({ row: 5, col: 3 });

    expect(adapter.getActiveCell()).toEqual({ sheet: '', row: 5, col: 3 });
  });

  it('returns null when no formula cell is tracked', () => {
    const adapter = makeGetActiveCellAdapter(null);

    expect(adapter.getActiveCell()).toBeNull();
  });
});

describe('HandsontableAdapter.setActiveCell', () => {
  /**
   * Builds an adapter whose plugin spies on `selectFormulaCell`.
   *
   * @param {Partial<VisualHfIndexMapping>} mappingOverrides Index-mapping overrides.
   * @returns {{ adapter: HandsontableAdapter, plugin: object }}
   */
  function makeSetActiveCellAdapter(mappingOverrides: Partial<VisualHfIndexMapping> = {}) {
    const hot = makeHotStub({ getCell: () => null });
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const plugin = { ...makePluginStub(), selectFormulaCell: jest.fn() };
    const adapter = new HandsontableAdapter(
      makeAdapterOptions(hot, overlayHost, mappingOverrides),
      plugin,
    );

    return { adapter, plugin };
  }

  it('delegates to the plugin\'s selectFormulaCell without starting an edit', () => {
    const { adapter, plugin } = makeSetActiveCellAdapter();

    adapter.setActiveCell({ sheet: '', row: 2, col: 3 });

    expect(plugin.selectFormulaCell).toHaveBeenCalledWith(2, 3);
  });

  it('maps HF indices to visual indices under a row/column move', () => {
    const { adapter, plugin } = makeSetActiveCellAdapter({
      hfToVisualRow: (hfRow: number) => hfRow + 10,
      hfToVisualCol: (hfCol: number) => hfCol + 20,
    });

    adapter.setActiveCell({ sheet: '', row: 2, col: 3 });

    expect(plugin.selectFormulaCell).toHaveBeenCalledWith(12, 23);
  });

  it('ignores addresses hidden by the host mapping', () => {
    const { adapter, plugin } = makeSetActiveCellAdapter({ hfToVisualRow: () => -1 });

    adapter.setActiveCell({ sheet: '', row: 2, col: 3 });

    expect(plugin.selectFormulaCell).not.toHaveBeenCalled();
  });
});

type BarSelection = {
  active: { row: number; col: number };
  range: { startRow: number; startCol: number; endRow: number; endCol: number };
} | null;

describe('HandsontableAdapter.onSelectionChange', () => {
  /**
   * Builds an adapter whose plugin exposes a capturable bar-selection emitter.
   *
   * @param {Partial<VisualHfIndexMapping>} mappingOverrides Index-mapping overrides.
   * @returns {{ adapter: HandsontableAdapter, emit: Function }}
   */
  function makeSelectionChangeAdapter(mappingOverrides: Partial<VisualHfIndexMapping> = {}) {
    const hot = makeHotStub({ getCell: () => null });
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    let emit: ((selection: BarSelection) => void) | undefined;
    const plugin = {
      ...makePluginStub(),
      onFormulaCellSelection: (callback: (selection: BarSelection) => void) => {
        emit = callback;

        return () => undefined;
      },
    };
    const adapter = new HandsontableAdapter(
      makeAdapterOptions(hot, overlayHost, mappingOverrides),
      plugin,
    );

    return { adapter, emit: (selection: BarSelection) => emit?.(selection) };
  }

  it('emits null through', () => {
    const { adapter, emit } = makeSelectionChangeAdapter();
    const received: unknown[] = [];

    adapter.onSelectionChange(selection => received.push(selection));
    emit(null);

    expect(received).toEqual([null]);
  });

  it('maps active + range to HF indices under a row/column move', () => {
    const { adapter, emit } = makeSelectionChangeAdapter({
      visualToHfRow: (visualRow: number) => visualRow + 100,
      visualToHfCol: (visualCol: number) => visualCol + 200,
    });
    const received: unknown[] = [];

    adapter.onSelectionChange(selection => received.push(selection));
    emit({
      active: { row: 4, col: 2 },
      range: { startRow: 1, startCol: 2, endRow: 4, endCol: 3 },
    });

    expect(received).toEqual([
      {
        active: { sheet: '', row: 104, col: 202 },
        range: {
          start: { sheet: '', row: 101, col: 202 },
          end: { sheet: '', row: 104, col: 203 },
        },
      },
    ]);
  });

  it('re-normalizes the range when the HF mapping inverts corner order', () => {
    const { adapter, emit } = makeSelectionChangeAdapter({
      visualToHfRow: (visualRow: number) => 9 - visualRow,
      visualToHfCol: (visualCol: number) => visualCol + 200,
    });
    const received: unknown[] = [];

    adapter.onSelectionChange(selection => received.push(selection));
    emit({
      active: { row: 4, col: 2 },
      range: { startRow: 1, startCol: 2, endRow: 4, endCol: 3 },
    });

    expect(received).toEqual([
      {
        active: { sheet: '', row: 5, col: 202 },
        range: {
          start: { sheet: '', row: 5, col: 202 },
          end: { sheet: '', row: 8, col: 203 },
        },
      },
    ]);
  });
});

describe('HandsontableAdapter.setSelection', () => {
  /**
   * Builds an adapter whose plugin spies on `selectFormulaCells`.
   *
   * @param {Partial<VisualHfIndexMapping>} mappingOverrides Index-mapping overrides.
   * @returns {{ adapter: HandsontableAdapter, plugin: object }}
   */
  function makeSetSelectionAdapter(mappingOverrides: Partial<VisualHfIndexMapping> = {}) {
    const hot = makeHotStub({ getCell: () => null });
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const plugin = { ...makePluginStub(), selectFormulaCells: jest.fn() };
    const adapter = new HandsontableAdapter(
      makeAdapterOptions(hot, overlayHost, mappingOverrides),
      plugin,
    );

    return { adapter, plugin };
  }

  it('delegates to the plugin\'s selectFormulaCells', () => {
    const { adapter, plugin } = makeSetSelectionAdapter();

    adapter.setSelection({
      start: { sheet: '', row: 1, col: 2 },
      end: { sheet: '', row: 4, col: 3 },
    });

    expect(plugin.selectFormulaCells).toHaveBeenCalledWith(1, 2, 4, 3);
  });

  it('maps HF indices to visual indices under a row/column move', () => {
    const { adapter, plugin } = makeSetSelectionAdapter({
      hfToVisualRow: (hfRow: number) => hfRow + 10,
      hfToVisualCol: (hfCol: number) => hfCol + 20,
    });

    adapter.setSelection({
      start: { sheet: '', row: 1, col: 2 },
      end: { sheet: '', row: 4, col: 3 },
    });

    expect(plugin.selectFormulaCells).toHaveBeenCalledWith(11, 22, 14, 23);
  });

  it('ignores ranges hidden by the host mapping', () => {
    const { adapter, plugin } = makeSetSelectionAdapter({ hfToVisualRow: () => -1 });

    adapter.setSelection({
      start: { sheet: '', row: 1, col: 2 },
      end: { sheet: '', row: 4, col: 3 },
    });

    expect(plugin.selectFormulaCells).not.toHaveBeenCalled();
  });
});

describe('HandsontableAdapter.stepCell', () => {
  it('steps in visual space and returns HF indices under a sort', () => {
    const visualToPhysical = [0, 1, 7, 2, 3, 4, 5, 6];
    const physicalToVisual: number[] = [];

    visualToPhysical.forEach((physical, visual) => {
      physicalToVisual[physical] = visual;
    });

    const { adapter } = makeAdapter(
      {},
      {
        countRows: () => 8,
        countCols: () => 6,
      },
      {
        hfToVisualRow: (hfRow: number) => physicalToVisual[hfRow] ?? hfRow,
        hfToVisualCol: (hfCol: number) => hfCol,
        visualToHfRow: (visualRow: number) => visualToPhysical[visualRow] ?? visualRow,
        visualToHfCol: (visualCol: number) => visualCol,
      },
    );

    expect(adapter.stepCell({ sheet: '', row: 1, col: 5 }, 'down')).toEqual({
      sheet: '',
      row: 7,
      col: 5,
    });
  });

  it('clamps at the visual grid edge', () => {
    const { adapter } = makeAdapter({}, { countRows: () => 3, countCols: () => 3 });

    expect(adapter.stepCell({ sheet: '', row: 2, col: 0 }, 'down')).toEqual({
      sheet: '',
      row: 2,
      col: 0,
    });
  });
});
