import { FormulaBuilder } from '../formulaBuilder';
import { getFormulaBuilderAdapter } from '../handsontableAdapter';
import type { HandsontableAdapter } from '../handsontableAdapter';
import { makePluginHotStub } from './helpers/pluginHotStub';
import type { PluginHotStubBundle } from './helpers/pluginHotStub';

/**
 * The cell budget `selectFirstFormulaCell` spends on the full-grid scan after
 * the rendered viewport holds no formula cell.
 */
const SCAN_CELL_CAP = 10000;

/**
 * Makes `getCellMetaTransient` report the formula editor on the given cells only.
 *
 * @param {PluginHotStubBundle} stub The stub bundle.
 * @param {Array<[number, number]>} formulaCells Visual `[row, col]` pairs that use the formula editor.
 */
function useFormulaEditorAt(stub: PluginHotStubBundle, formulaCells: Array<[number, number]>): void {
  stub.hot.getCellMetaTransient.mockImplementation((row, col) => ({
    editor: formulaCells.some(([formulaRow, formulaCol]) => formulaRow === row && formulaCol === col) ?
      'formula' :
      'text',
  }));
}

/**
 * Sets the stub's grid size and the rendered viewport (inclusive bounds).
 *
 * @param {PluginHotStubBundle} stub The stub bundle.
 * @param {object} layout The grid dimensions and viewport bounds.
 * @param {number} layout.rows The row count.
 * @param {number} layout.cols The column count.
 * @param {number[]} layout.viewportRows The first and last rendered row.
 * @param {number[]} layout.viewportCols The first and last rendered column.
 */
function layoutGrid(
  stub: PluginHotStubBundle,
  layout: { rows: number; cols: number; viewportRows: [number, number]; viewportCols: [number, number] },
): void {
  stub.hot.countRows = () => layout.rows;
  stub.hot.countCols = () => layout.cols;
  stub.hot.getFirstRenderedVisibleRow = () => layout.viewportRows[0];
  stub.hot.getLastRenderedVisibleRow = () => layout.viewportRows[1];
  stub.hot.getFirstRenderedVisibleColumn = () => layout.viewportCols[0];
  stub.hot.getLastRenderedVisibleColumn = () => layout.viewportCols[1];
}

/**
 * Builds and enables a plugin over a fresh stub.
 *
 * @param {PluginHotStubBundle} stub The stub bundle.
 * @returns {FormulaBuilder}
 */
function enabledPlugin(stub: PluginHotStubBundle): FormulaBuilder {
  const plugin = new FormulaBuilder(stub.instance);

  plugin.enablePlugin();

  return plugin;
}

/**
 * Returns the adapter of an enabled plugin.
 *
 * @param {FormulaBuilder} plugin The enabled plugin.
 * @returns {HandsontableAdapter}
 */
function adapterOf(plugin: FormulaBuilder): HandsontableAdapter {
  const adapter = getFormulaBuilderAdapter(plugin);

  if (!adapter) {
    throw new Error('the plugin has no adapter');
  }

  return adapter;
}

describe('FormulaBuilder selection API used by the formula bar', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('selectFormulaCell selects exactly that cell', () => {
    const stub = makePluginHotStub();
    const plugin = enabledPlugin(stub);

    plugin.selectFormulaCell(3, 4);

    expect(stub.hot.selectCell.mock.calls).toEqual([[3, 4]]);
    expect(stub.hot.selectCells).not.toHaveBeenCalled();

    plugin.disablePlugin();
  });

  it('selectFormulaCells selects the range as one Handsontable selection', () => {
    const stub = makePluginHotStub();
    const plugin = enabledPlugin(stub);

    plugin.selectFormulaCells(1, 2, 3, 4);

    expect(stub.hot.selectCells.mock.calls).toEqual([[[[1, 2, 3, 4]]]]);
    expect(stub.hot.selectCell).not.toHaveBeenCalled();

    plugin.disablePlugin();
  });

  it('selectFirstFormulaCell prefers a formula cell in the rendered viewport over an earlier one', () => {
    const stub = makePluginHotStub();

    layoutGrid(stub, { rows: 50, cols: 5, viewportRows: [10, 20], viewportCols: [0, 4] });
    useFormulaEditorAt(stub, [[0, 0], [12, 3]]);

    const plugin = enabledPlugin(stub);

    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell.mock.calls).toEqual([[12, 3]]);

    plugin.disablePlugin();
  });

  it('selectFirstFormulaCell scans the whole grid when the viewport has no formula cell', () => {
    const stub = makePluginHotStub();

    layoutGrid(stub, { rows: 50, cols: 5, viewportRows: [10, 20], viewportCols: [0, 4] });
    useFormulaEditorAt(stub, [[30, 1]]);

    const plugin = enabledPlugin(stub);

    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell.mock.calls).toEqual([[30, 1]]);

    plugin.disablePlugin();
  });

  it('selectFirstFormulaCell finds a cell inside the scan budget', () => {
    const stub = makePluginHotStub();

    layoutGrid(stub, { rows: 200, cols: 100, viewportRows: [0, 0], viewportCols: [0, 0] });
    useFormulaEditorAt(stub, [[99, 50]]);

    const plugin = enabledPlugin(stub);

    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell.mock.calls).toEqual([[99, 50]]);

    plugin.disablePlugin();
  });

  it('selectFirstFormulaCell gives up after the scan budget instead of visiting every cell', () => {
    const stub = makePluginHotStub();

    layoutGrid(stub, { rows: 200, cols: 100, viewportRows: [0, 0], viewportCols: [0, 0] });
    useFormulaEditorAt(stub, [[150, 0]]);

    const plugin = enabledPlugin(stub);
    const viewportLookups = 1;

    stub.hot.getCellMetaTransient.mockClear();
    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell).not.toHaveBeenCalled();
    expect(stub.hot.getCellMetaTransient.mock.calls.length).toBe(SCAN_CELL_CAP + viewportLookups);

    plugin.disablePlugin();
  });

  it.each([
    ['finds a formula cell that is exactly the last cell of the budget', [99, 99], [[99, 99]]],
    ['does not reach the cell one past the budget', [100, 0], []],
  ] as const)('selectFirstFormulaCell %s', (_label, formulaCell, expectedSelection) => {
    // Row-major over 100 columns: (99, 99) is the 10,000th scanned cell, (100, 0) the 10,001st.
    const stub = makePluginHotStub();

    layoutGrid(stub, { rows: 200, cols: 100, viewportRows: [0, 0], viewportCols: [0, 0] });
    useFormulaEditorAt(stub, [[formulaCell[0], formulaCell[1]]]);

    const plugin = enabledPlugin(stub);

    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell.mock.calls).toEqual(expectedSelection);

    plugin.disablePlugin();
  });

  it('selectFirstFormulaCell selects nothing when no cell uses the formula editor', () => {
    const stub = makePluginHotStub();

    layoutGrid(stub, { rows: 3, cols: 3, viewportRows: [0, 2], viewportCols: [0, 2] });
    useFormulaEditorAt(stub, []);

    const plugin = enabledPlugin(stub);

    plugin.selectFirstFormulaCell();

    expect(stub.hot.selectCell).not.toHaveBeenCalled();

    plugin.disablePlugin();
  });
});

describe('FormulaBuilder raw cell API used by the formula bar', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('getRawCellText is empty before enabling and after disabling', () => {
    const stub = makePluginHotStub();

    stub.engine.addSheet('Sheet1');
    stub.engine.setCellContents({ sheet: 0, row: 0, col: 0 }, [['=1+1']]);

    const plugin = new FormulaBuilder(stub.instance);

    expect(plugin.getRawCellText(0, 0)).toBe('');

    plugin.enablePlugin();

    expect(plugin.getRawCellText(0, 0)).toBe('=1+1');

    plugin.disablePlugin();

    expect(plugin.getRawCellText(0, 0)).toBe('');
  });
});

describe('FormulaBuilder.getRawCellText coordinates', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('takes visual indexes and reads the HyperFormula cell they map to', () => {
    const stub = makePluginHotStub();

    stub.engine.addSheet('Sheet1');
    stub.engine.setCellContents({ sheet: 0, row: 0, col: 0 }, [['visual'], ['=2+3']]);
    // Visual row 0 is HyperFormula row 1 (a sort moved it), and the reverse.
    stub.formulas.rowAxisSyncer = {
      getHfIndexFromVisualIndex: visualRow => (visualRow === 0 ? 1 : 0),
      getVisualIndexFromHfIndex: hfRow => (hfRow === 1 ? 0 : 1),
    };

    const plugin = enabledPlugin(stub);

    expect(plugin.getRawCellText(0, 0)).toBe('=2+3');
    expect(plugin.getRawCellText(1, 0)).toBe('visual');

    plugin.disablePlugin();
  });

  it('returns an empty string for a visual cell with no HyperFormula index', () => {
    const stub = makePluginHotStub();

    stub.engine.addSheet('Sheet1');
    stub.engine.setCellContents({ sheet: 0, row: 0, col: 0 }, [['=1+1']]);
    stub.formulas.columnAxisSyncer = {
      getHfIndexFromVisualIndex: () => -1,
      getVisualIndexFromHfIndex: () => -1,
    };

    const plugin = enabledPlugin(stub);

    expect(plugin.getRawCellText(0, 0)).toBe('');

    plugin.disablePlugin();
  });
});

describe('FormulaBuilder adapter end of the formula bar contract', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('adapter.getCellFormula reads the formula source at HyperFormula coordinates', () => {
    const stub = makePluginHotStub();

    stub.engine.addSheet('Sheet1');
    stub.engine.setCellContents({ sheet: 0, row: 0, col: 0 }, [[7, '=A1*2']]);

    const plugin = enabledPlugin(stub);

    expect(adapterOf(plugin).getCellFormula({ sheet: '', row: 0, col: 0 })).toBe('7');
    expect(adapterOf(plugin).getCellFormula({ sheet: '', row: 0, col: 1 })).toBe('=A1*2');

    plugin.disablePlugin();
  });

  it('adapter.selectFirstCell selects the first formula cell of the grid', () => {
    const stub = makePluginHotStub();

    layoutGrid(stub, { rows: 4, cols: 4, viewportRows: [0, 3], viewportCols: [0, 3] });
    useFormulaEditorAt(stub, [[2, 2]]);

    const plugin = enabledPlugin(stub);

    adapterOf(plugin).selectFirstCell();

    expect(stub.hot.selectCell.mock.calls).toEqual([[2, 2]]);

    plugin.disablePlugin();
  });

  it('adapter.setActiveCell and adapter.setSelection reach the grid in visual coordinates', () => {
    const stub = makePluginHotStub();
    const plugin = enabledPlugin(stub);

    adapterOf(plugin).setActiveCell({ sheet: '', row: 2, col: 3 });
    adapterOf(plugin).setSelection({
      start: { sheet: '', row: 1, col: 1 },
      end: { sheet: '', row: 2, col: 3 },
    });

    expect(stub.hot.selectCell.mock.calls).toEqual([[2, 3]]);
    expect(stub.hot.selectCells.mock.calls).toEqual([[[[1, 1, 2, 3]]]]);

    plugin.disablePlugin();
  });
});
