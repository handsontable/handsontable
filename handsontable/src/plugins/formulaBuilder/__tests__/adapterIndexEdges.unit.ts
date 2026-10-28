import type { CellRange } from 'hyperformula-ui';
import { HandsontableAdapter } from '../handsontableAdapter';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';
import type { CustomSelectionStub, HotStubShape } from './helpers/stubs';
import type { VisualHfIndexMapping } from '../internalTypes';

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
 * Builds an adapter over a stub grid.
 *
 * @param {Partial<HotStubShape>} [hotOverrides] Handsontable stub overrides.
 * @param {Partial<VisualHfIndexMapping>} [mapping] Index-mapping overrides.
 * @param {object} [plugin] Plugin stub overrides.
 * @returns {{ adapter: HandsontableAdapter, hot: object }}
 */
function makeAdapter(
  hotOverrides: Partial<HotStubShape> = {},
  mapping: Partial<VisualHfIndexMapping> = {},
  plugin: Record<string, unknown> = {},
) {
  const hot = makeHotStub(hotOverrides);
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);

  const adapter = new HandsontableAdapter(
    makeAdapterOptions(hot, overlayHost, mapping),
    { ...makePluginStub(), ...plugin } as ReturnType<typeof makePluginStub>,
  );

  return { adapter, hot };
}

/**
 * Returns the visual ranges of the custom selections on the stub grid, as `[fromRow, fromCol, toRow, toCol]`.
 *
 * @param {object} hot The stub grid.
 * @returns {number[][]}
 */
function selectedRanges(hot: ReturnType<typeof makeHotStub>): number[][] {
  return (hot as unknown as {
    selection: { highlight: { customSelections: CustomSelectionStub[] } };
  }).selection.highlight.customSelections.map((selection) => {
    type Coords = { row: number; col: number };
    const { from, to } = selection.visualCellRange as { from: Coords; to: Coords };

    return [from.row, from.col, to.row, to.col];
  });
}

/**
 * Returns the fill flags of the custom selections on the stub grid (from their generated class names).
 *
 * @param {object} hot The stub grid.
 * @returns {boolean[]}
 */
function fillFlags(hot: ReturnType<typeof makeHotStub>): boolean[] {
  return (hot as unknown as {
    selection: { highlight: { customSelections: CustomSelectionStub[] } };
  }).selection.highlight.customSelections.map(selection =>
    String((selection.settings as { className?: string }).className).includes('-fill-'));
}

describe('HandsontableAdapter highlight ranges', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('highlights a reversed range (`=SUM(B5:A1)`) like the normalized one', () => {
    const { adapter, hot } = makeAdapter({ countRows: () => 10, countCols: () => 10 });

    adapter.setHighlights([{ range: range(4, 1, 0, 0), color: 'red' }]);

    expect(selectedRanges(hot)).toEqual([[0, 0, 4, 1]]);

    adapter.destroy();
  });

  it('highlights the whole visual column for a whole-column reference on a sorted grid', () => {
    const rows = 3000;
    // A descending sort: HyperFormula row `i` is shown on visual row `rows - 1 - i`.
    const { adapter, hot } = makeAdapter({
      countRows: () => rows,
      countCols: () => 5,
      rowIndexMapper: { getRenderableFromVisualIndex: index => index, getNumberOfIndexes: () => rows },
    }, {
      hfToVisualRow: hfRow => (hfRow < rows ? rows - 1 - hfRow : -1),
    });

    adapter.setHighlights([{ range: range(0, 0, 1048575, 0), color: 'red', whole: 'column' }]);

    expect(selectedRanges(hot)).toEqual([[0, 0, rows - 1, 0]]);

    adapter.destroy();
  });

  it('falls back to an unfilled bounding box when a range splits into too many runs', () => {
    const rows = 400;
    // Each HyperFormula row lands two visual rows from its neighbor, so `A1:A200` makes 200 runs.
    const { adapter, hot } = makeAdapter({
      countRows: () => rows,
      countCols: () => 5,
      rowIndexMapper: { getRenderableFromVisualIndex: index => index, getNumberOfIndexes: () => rows },
    }, {
      hfToVisualRow: hfRow => hfRow * 2,
    });

    adapter.setHighlights([{ range: range(0, 0, 199, 0), color: 'red', fill: true }]);

    expect(selectedRanges(hot)).toEqual([[0, 0, 398, 0]]);
    expect(fillFlags(hot)).toEqual([false]);

    adapter.destroy();
  });

  it('keeps one filled selection per run under the cap', () => {
    const { adapter, hot } = makeAdapter({ countRows: () => 10, countCols: () => 5 }, {
      hfToVisualRow: hfRow => [0, 5, 1, 6][hfRow] ?? hfRow,
    });

    adapter.setHighlights([{ range: range(0, 0, 3, 0), color: 'red', fill: true }]);

    expect(selectedRanges(hot)).toEqual([[0, 0, 1, 0], [5, 0, 6, 0]]);
    expect(fillFlags(hot)).toEqual([true, true]);

    adapter.destroy();
  });
});

describe('HandsontableAdapter.getDataEdge with hidden cells', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('stops on the last shown data cell instead of a hidden one', () => {
    const hiddenRow = 9;
    const { adapter } = makeAdapter({
      countRows: () => 20,
      countCols: () => 3,
      getDataAtCell: row => (row <= 9 ? 'x' : ''),
      rowIndexMapper: {
        getRenderableFromVisualIndex: index => (index === hiddenRow ? null : index),
        getNumberOfIndexes: () => 20,
      },
    });

    expect(adapter.getDataEdge({ sheet: '', row: 0, col: 0 }, 'down')).toEqual({ sheet: '', row: 8, col: 0 });
  });
});

describe('HandsontableAdapter address-box navigation on trimmed indexes', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  /**
   * HyperFormula row 2 is trimmed (a filter): rows 0, 1, 3, 4 show as visual 0, 1, 2, 3.
   *
   * @param {number} hfRow The HyperFormula row.
   * @returns {number}
   */
  const trimmedRowTwo = (hfRow: number) => [0, 1, -1, 2, 3][hfRow] ?? -1;

  it('selects the next shown row for an address on a trimmed row', () => {
    const selectFormulaCell = jest.fn();
    const { adapter } = makeAdapter({
      rowIndexMapper: { getRenderableFromVisualIndex: index => index, getNumberOfIndexes: () => 5 },
    }, { hfToVisualRow: trimmedRowTwo }, { selectFormulaCell });

    adapter.setActiveCell({ sheet: '', row: 2, col: 0 });

    expect(selectFormulaCell).toHaveBeenCalledWith(2, 0);
  });

  it('moves a range corner on a trimmed row inward', () => {
    const selectFormulaCells = jest.fn();
    const { adapter } = makeAdapter({
      rowIndexMapper: { getRenderableFromVisualIndex: index => index, getNumberOfIndexes: () => 5 },
    }, { hfToVisualRow: trimmedRowTwo }, { selectFormulaCells });

    adapter.setSelection(range(2, 0, 4, 0));

    expect(selectFormulaCells).toHaveBeenCalledWith(2, 0, 3, 0);
  });

  it('selects nothing for a range that covers only trimmed rows', () => {
    const selectFormulaCells = jest.fn();
    const { adapter } = makeAdapter({
      rowIndexMapper: { getRenderableFromVisualIndex: index => index, getNumberOfIndexes: () => 5 },
    }, { hfToVisualRow: trimmedRowTwo }, { selectFormulaCells });

    // `false`, not `undefined`: the address box reads it as "unavailable" and announces it.
    expect(adapter.setSelection(range(2, 0, 2, 0))).toBe(false);
    expect(selectFormulaCells).not.toHaveBeenCalled();
  });

  it('reports an address past the last index as unavailable', () => {
    const selectFormulaCell = jest.fn();
    const { adapter } = makeAdapter({
      rowIndexMapper: { getRenderableFromVisualIndex: index => index, getNumberOfIndexes: () => 5 },
    }, { hfToVisualRow: trimmedRowTwo }, { selectFormulaCell });

    expect(adapter.setActiveCell({ sheet: '', row: 9, col: 0 })).toBe(false);
    expect(selectFormulaCell).not.toHaveBeenCalled();
  });

  it('reports nothing for an address it selects', () => {
    const { adapter } = makeAdapter({
      rowIndexMapper: { getRenderableFromVisualIndex: index => index, getNumberOfIndexes: () => 5 },
    }, { hfToVisualRow: trimmedRowTwo }, { selectFormulaCell: jest.fn() });

    expect(adapter.setActiveCell({ sheet: '', row: 2, col: 0 })).not.toBe(false);
  });
});

describe('HandsontableAdapter header tints', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('tints every rendered copy of a column header, on the bottom header level only', () => {
    const hooks: Record<string, ((...args: unknown[]) => void)[]> = {};
    const { adapter } = makeAdapter({
      countRows: () => 5,
      countCols: () => 5,
      addHook: (name: string, callback: (...args: unknown[]) => void) => {
        (hooks[name] ??= []).push(callback);
      },
    } as Partial<HotStubShape>);
    const header = (level: number) => {
      const th = document.createElement('th');

      document.body.appendChild(th);
      hooks.afterGetColHeader.forEach(listener => listener(1, th, level));

      return th;
    };
    const groupHeader = header(0);
    const masterHeader = header(1);
    const cloneHeader = header(1);

    adapter.setHighlights([{ range: range(0, 1, 1048575, 1), color: 'red', whole: 'column' }]);

    expect(masterHeader.style.backgroundColor).not.toBe('');
    expect(cloneHeader.style.backgroundColor).not.toBe('');
    expect(groupHeader.style.backgroundColor).toBe('');

    adapter.destroy();
  });

  it('follows the header levels down when the grid renders fewer of them', () => {
    const hooks: Record<string, ((...args: unknown[]) => void)[]> = {};
    let levels = 3;
    const { adapter } = makeAdapter({
      countRows: () => 5,
      countCols: () => 5,
      view: { getColumnHeadersCount: () => levels, render: () => {} },
      addHook: (name: string, callback: (...args: unknown[]) => void) => {
        (hooks[name] ??= []).push(callback);
      },
    } as unknown as Partial<HotStubShape>);
    const header = (level: number) => {
      const th = document.createElement('th');

      document.body.appendChild(th);
      hooks.afterGetColHeader.forEach(listener => listener(1, th, level));

      return th;
    };

    adapter.setHighlights([{ range: range(0, 1, 1048575, 1), color: 'red', whole: 'column' }]);

    const finishDraw = () => hooks.afterViewRender.forEach(listener => listener());
    const groupHeader = header(1);
    const nestedHeader = header(2);

    finishDraw();

    expect(nestedHeader.style.backgroundColor).not.toBe('');
    expect(groupHeader.style.backgroundColor).toBe('');

    // `updateSettings({ nestedHeaders: false })`: the next draw renders level 0 only.
    levels = 1;
    nestedHeader.remove();

    const plainHeader = header(0);

    finishDraw();

    expect(plainHeader.style.backgroundColor).not.toBe('');

    adapter.destroy();
  });
});

describe('HandsontableAdapter arrow directions in a right-to-left grid', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it.each([
    [false, 'left', 1],
    [false, 'right', 3],
    [true, 'left', 3],
    [true, 'right', 1],
  ] as const)('with isRtl() %s, a %s step from column 2 lands on column %i', (rtl, direction, col) => {
    const { adapter } = makeAdapter({ countRows: () => 5, countCols: () => 5, isRtl: () => rtl });

    expect(adapter.stepCell({ sheet: '', row: 1, col: 2 }, direction)).toEqual({ sheet: '', row: 1, col });
  });

  it('jumps to the data edge in the visual direction of the key', () => {
    const { adapter } = makeAdapter({
      countRows: () => 3,
      countCols: () => 6,
      isRtl: () => true,
      getDataAtCell: (_row, col) => (col <= 4 ? 'x' : ''),
    });

    expect(adapter.getDataEdge({ sheet: '', row: 0, col: 0 }, 'left')).toEqual({ sheet: '', row: 0, col: 4 });
  });
});

