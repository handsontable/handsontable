import { CompressionStream, DecompressionStream } from 'node:stream/web';
import ExcelJS from 'exceljs';
import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../index';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

// jsdom's window has neither; both xlsx engines' zip code reaches for them.
global.CompressionStream ??= CompressionStream;
global.DecompressionStream ??= DecompressionStream;

/**
 * DEV-3648, across the whole pipeline: a real grid with a real HyperFormula engine is exported
 * (`exportFile`, each xlsx engine), the file is read back, and `importFile` puts it into the same
 * grid and into a fresh one. A dynamic array (`SEQUENCE`), a CSE array (`ARRAYFORMULA`), a one-cell
 * dynamic array (`IFS`), a named range, a constant name, a formula error and a typed `#N/A` must
 * come back evaluating to what the grid showed.
 */
describe('xlsx round trip through exportFile and importFile with HyperFormula', () => {
  const FORMULAS = [
    '=SEQUENCE(3)', '=ARRAYFORMULA(A1:A3*2)', '=IFS(A1>0,"p",TRUE(),"n")', '=SUM(Sales)', '=1/0', '=TaxRate*A1',
  ];
  // The grid's engine is `HyperFormula.buildEmpty`, which has no array arithmetic, so the import
  // wraps the dynamic masters in `ARRAYFORMULA(...)`: without it, such an engine evaluates a dynamic
  // array that needs array arithmetic (`=A1:A3*2`) as one value.
  const REIMPORTED = [
    '=ARRAYFORMULA(SEQUENCE(3))', '=ARRAYFORMULA(A1:A3*2)', '=ARRAYFORMULA(IFS(A1>0,"p",TRUE(),"n"))',
    '=SUM(Sales)', '=1/0', '=TaxRate*A1',
  ];
  const containers = [];
  let warn;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    containers.splice(0).forEach((container) => {
      container.hot?.destroy();
      container.remove();
    });
  });

  /**
   * A grid with the Formulas plugin over its own HyperFormula instance (engine sheet `Data`).
   *
   * @param {Array[]} data The grid's data.
   * @returns {Handsontable}
   */
  function createGrid(data) {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      licenseKey: TEST_LICENSE_KEY,
      colHeaders: true,
      rowHeaders: true,
      exportFile: true,
      importFile: true,
      formulas: { engine: HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' }), sheetName: 'Data' },
      columns: [{ type: 'numeric' }, {}, {}, {}, {}, {}, {}, {}],
      data,
    });

    container.hot = hot;
    containers.push(container);

    return hot;
  }

  /**
   * The source grid: A1:A3 hold 1, 2, 3; row 1 holds the formulas and a typed `#N/A`. `Sales` names
   * A1:A3 and `TaxRate` is the constant 0.07.
   *
   * @returns {Handsontable}
   */
  function createSourceGrid() {
    const hot = createGrid([
      [1, ...FORMULAS, '#N/A'],
      [2, null, null, null, null, null, null, null],
      [3, null, null, null, null, null, null, null],
    ]);
    const engine = hot.getPlugin('formulas').engine;

    engine.addNamedExpression('Sales', '=Data!$A$1:$A$3');
    engine.addNamedExpression('TaxRate', 0.07);

    return hot;
  }

  /**
   * Exports a grid to xlsx bytes. jsdom's `Blob` has no `arrayBuffer()`, so the blob is read with a
   * `FileReader`.
   *
   * @param {Handsontable} hot The grid.
   * @param {object} [engine] The ExcelJS module, or `undefined` for the built-in engine.
   * @returns {Promise<ArrayBuffer>}
   */
  async function exportBytes(hot, engine) {
    const blob = await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', {
      exportFormulas: true, colHeaders: true, rowHeaders: true, engine,
    });

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Imports xlsx bytes into a grid the way they were exported (header row and row-header column).
   *
   * @param {Handsontable} hot The grid.
   * @param {ArrayBuffer} bytes The file.
   * @param {object} [engine] The ExcelJS module, or `undefined` for the built-in engine.
   * @returns {Promise<object>} The import result.
   */
  function importBytes(hot, bytes, engine) {
    return hot.getPlugin('importFile').importFromArrayBuffer('xlsx', bytes, {
      colHeaders: 'firstRow', rowHeaders: true, engine,
    });
  }

  /**
   * What an import dropped besides `cellStyles`: the export styles its header band, and an import
   * without `importStyles` reports that.
   *
   * @param {object} result The import result.
   * @returns {string[]}
   */
  const droppedBesidesStyles = result => result.dropped.filter(name => name !== 'cellStyles');

  const SHOWN = [
    [1, 1, 2, 'p', 6, '#DIV/0!', 0.07, '#N/A'],
    [2, 2, 4, null, null, null, null, null],
    [3, 3, 6, null, null, null, null, null],
  ];

  it('should write the arrays, the errors and the names into the file (built-in engine)', async() => {
    const bytes = await exportBytes(createSourceGrid());
    const snapshot = await nativeAdapter.read(bytes, undefined, new DroppedFeatures());
    const [header, first] = snapshot.sheets[0].rows;

    expect(header.map(cell => cell?.value ?? null)).toEqual(['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    expect(first[2].formula).toEqual({ text: '_xlfn.SEQUENCE(3)', result: 1, array: { ref: 'C2:C4', dynamic: true } });
    expect(first[3].formula).toEqual({ text: 'B2:B4*2', result: 2, array: { ref: 'D2:D4', dynamic: false } });
    expect(first[4].formula.array).toEqual({ ref: 'E2', dynamic: true });
    expect(first[6].formula).toEqual({ text: '1/0', result: '#DIV/0!', resultIsError: true });
    expect(first[8]).toEqual(expect.objectContaining({ value: '#N/A', valueIsError: true }));
    expect(snapshot.definedNames).toEqual([
      { name: 'Sales', formula: 'Sheet1!$B$2:$B$4', sheetName: null },
      { name: 'TaxRate', formula: '0.07', sheetName: null },
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('should re-import its own export into the same grid with every formula live (built-in engine)', async() => {
    const hot = createSourceGrid();

    expect(hot.getData()).toEqual(SHOWN);

    const result = await importBytes(hot, await exportBytes(hot));

    expect(droppedBesidesStyles(result)).toEqual([]);
    // The engine already defines both names with the file's definitions, so nothing is re-added.
    expect(result.namedExpressions).toBeUndefined();
    expect(hot.getSourceDataAtRow(0).slice(1, 7)).toEqual(REIMPORTED);
    expect(hot.getData()).toEqual(SHOWN);
  });

  it('should import the export into a fresh grid, registering the names (built-in engine)', async() => {
    const bytes = await exportBytes(createSourceGrid());
    const target = createGrid([[null]]);
    const result = await importBytes(target, bytes);

    expect(droppedBesidesStyles(result)).toEqual([]);
    expect(result.namedExpressions).toEqual([
      { name: 'Sales', formula: 'Data!$A$1:$A$3' },
      { name: 'TaxRate', formula: '0.07' },
    ]);
    expect(target.getSourceDataAtRow(0).slice(1, 7)).toEqual(REIMPORTED);
    expect(target.getData()).toEqual(SHOWN);
  });

  it('should round-trip through the ExcelJS engine with its documented losses', async() => {
    const hot = createSourceGrid();
    const bytes = await exportBytes(hot, ExcelJS);
    const snapshot = await nativeAdapter.read(bytes, undefined, new DroppedFeatures());

    // ExcelJS writes every array as CSE, and leaves the constant name out, so `=TaxRate*A1` is
    // written as its value instead of a formula Excel shows as `#NAME?`.
    expect(snapshot.sheets[0].rows[1][2].formula.array).toEqual({ ref: 'C2:C4', dynamic: false });
    expect(snapshot.definedNames).toEqual([{ name: 'Sales', formula: 'Sheet1!$B$2:$B$4', sheetName: null }]);
    expect(snapshot.sheets[0].rows[1][7]).toEqual(expect.objectContaining({ value: 0.07, formula: null }));

    // The same grid: ExcelJS reads every array back as CSE (`ARRAYFORMULA`). It loses the scope of
    // every name, so the engine's `Sales` is not taken for the file's, though they are spelled alike,
    // and `=SUM(Sales)` imports its cached value.
    const same = await importBytes(hot, bytes, ExcelJS);

    expect(droppedBesidesStyles(same)).toEqual(['definedNames:unsupported', 'formula:definedName']);
    expect(hot.getSourceDataAtRow(0).slice(1, 7)).toEqual([
      '=ARRAYFORMULA(SEQUENCE(3))', '=ARRAYFORMULA(A1:A3*2)', '=ARRAYFORMULA(IFS(A1>0,"p",TRUE(),"n"))',
      SHOWN[0][4], '=1/0', 0.07,
    ]);
    expect(hot.getData()).toEqual(SHOWN);

    // A fresh grid: ExcelJS loses the scope of every name, so none is registered and `=SUM(Sales)`
    // imports its cached value; the cell over the left-out constant holds its value.
    const target = createGrid([[null]]);
    const fresh = await importBytes(target, bytes, ExcelJS);

    expect(fresh.namedExpressions).toBeUndefined();
    expect(fresh.dropped).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
    expect(target.getSourceDataAtRow(0)[4]).toBe(SHOWN[0][4]);
    expect(target.getData()).toEqual(SHOWN);
  });

  it('should import a workbook name over a name the sheet scopes too as its cached value (built-in engine)', async() => {
    // The file holds `Rate` for the workbook (1) and for the sheet (2). The grid has one sheet, so
    // the import registers the sheet's `Rate` at workbook scope. The workbook `Triple = Rate*3` reads
    // the workbook `Rate` in the file (3); registered, it would read the sheet's (6). It is left out,
    // and the formula over it imports its cached value. The sheet's own formula over `Rate` stays live.
    const hot = createGrid([
      [1, '=Triple', '=Rate*10'],
      [2, null, null],
    ]);
    const engine = hot.getPlugin('formulas').engine;

    engine.addNamedExpression('Rate', '=Data!$A$1');
    engine.addNamedExpression('Rate', '=Data!$A$2', hot.getPlugin('formulas').sheetId);
    engine.addNamedExpression('Triple', '=Rate*3');

    const shown = [[1, 3, 20], [2, null, null]];

    expect(hot.getData().map(row => row.slice(0, 3))).toEqual(shown);

    const target = createGrid([[null]]);
    const result = await importBytes(target, await exportBytes(hot));

    expect(result.namedExpressions).toEqual([{ name: 'Rate', formula: 'Data!$A$2' }]);
    expect(droppedBesidesStyles(result)).toEqual(['definedNames:unsupported', 'formula:definedName']);
    expect(target.getSourceDataAtRow(0).slice(1, 3)).toEqual([3, '=Rate*10']);
    expect(target.getData().map(row => row.slice(0, 3))).toEqual(shown);
  });

  it('should re-import a formula with nested or partial ARRAYFORMULA calls as a live CSE array (built-in engine)', async() => {
    // The export strips every ARRAYFORMULA call, which Excel cannot read, and writes a CSE array;
    // the import wraps a CSE array in one ARRAYFORMULA call again.
    const hot = createGrid([
      [1, '=ARRAYFORMULA(ARRAYFORMULA(A1:A3*2))', '=SUM(ARRAYFORMULA(A1:A3*2))'],
      [2, null, null],
      [3, null, null],
    ]);
    const shown = [[1, 2, 12], [2, 4, null], [3, 6, null]];

    expect(hot.getData().map(row => row.slice(0, 3))).toEqual(shown);

    const result = await importBytes(hot, await exportBytes(hot));

    expect(droppedBesidesStyles(result)).toEqual([]);
    expect(hot.getSourceDataAtRow(0).slice(1, 3)).toEqual(['=ARRAYFORMULA(A1:A3*2)', '=ARRAYFORMULA(SUM(A1:A3*2))']);
    expect(hot.getData().map(row => row.slice(0, 3))).toEqual(shown);
  });

  it('should re-import a one-cell dynamic SEQUENCE live, with the value the grid showed (built-in engine)', async() => {
    // The export writes `=SEQUENCE(1)` as a one-cell dynamic array, as Excel Online saves it; the
    // engine has no array arithmetic, so the import wraps it in ARRAYFORMULA, which evaluates the same.
    const hot = createGrid([[1, '=SEQUENCE(1)', '=SUM(SEQUENCE(3))']]);
    const shown = [[1, 1, 6]];

    expect(hot.getData().map(row => row.slice(0, 3))).toEqual(shown);

    const bytes = await exportBytes(hot);
    const snapshot = await nativeAdapter.read(bytes, undefined, new DroppedFeatures());

    expect(snapshot.sheets[0].rows[1][2].formula).toEqual({
      text: '_xlfn.SEQUENCE(1)', result: 1, array: { ref: 'C2', dynamic: true },
    });
    expect(snapshot.sheets[0].rows[1][3].formula.array).toBeUndefined();

    const target = createGrid([[null]]);
    const result = await importBytes(target, bytes);

    expect(droppedBesidesStyles(result)).toEqual([]);
    expect(target.getSourceDataAtRow(0).slice(1, 3)).toEqual(['=ARRAYFORMULA(SEQUENCE(1))', '=SUM(SEQUENCE(3))']);
    expect(target.getData().map(row => row.slice(0, 3))).toEqual(shown);
  });
});
