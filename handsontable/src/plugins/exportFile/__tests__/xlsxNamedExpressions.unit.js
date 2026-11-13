import { HyperFormula } from 'hyperformula';
import ExcelJS from 'exceljs';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ExportFile } from '../exportFile';
import { Formulas } from '../../formulas';
import { HiddenRows } from '../../hiddenRows';
import { HiddenColumns } from '../../hiddenColumns';
import { ManualColumnMove } from '../../manualColumnMove';
import { registerCellType } from '../../../cellTypes/registry';
import { IntlDateCellType } from '../../../cellTypes/intlDateType';
import { NumericCellType } from '../../../cellTypes/numericType';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';
import { excelJsAdapter } from '../../../utils/xlsxEngine/adapters/exceljs';
import { DroppedFeatures } from '../../../utils/xlsxEngine/capabilities';
import { toArrayBuffer } from '../../../utils/xlsxEngine/__tests__/helpers/fixtures';
import { resetTierKeys, tierKeyWithout } from '../../../utils/entitlementLicenseKey/__tests__/tierKeys';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * DEV-3648: with `exportFormulas`, the workbook-scoped named expressions of the Formulas plugin's
 * engine export as workbook defined names. A reference to the grid's own engine sheet moves with
 * the header band and the left-out rows and columns, exactly as a cell formula's does, and is
 * qualified with the exported sheet name; any other qualifier is kept as written.
 */
describe('Xlsx export: named expressions as defined names', () => {
  let container;
  let hot;
  let writeSpy;

  beforeAll(() => {
    registerPlugin(Formulas);
    registerPlugin(ExportFile);
    registerPlugin(HiddenRows);
    registerPlugin(HiddenColumns);
    registerPlugin(ManualColumnMove);
    registerCellType(IntlDateCellType);
    registerCellType(NumericCellType);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // The snapshot is what this suite is about, so the write itself is not run.
    writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
    resetTierKeys();
    writeSpy.mockRestore();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  function createGrid(settings = {}, sheetName = 'Sheet1') {
    hot = new Handsontable(container, {
      data: [[1], [2], [3], [4]],
      formulas: { engine: HyperFormula, sheetName },
      exportFile: true,
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });

    return hot.getPlugin('formulas').engine;
  }

  async function exportWorkbook(exportOptions = { exportFormulas: true }) {
    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', exportOptions);

    const [snapshot, , dropped] = writeSpy.mock.calls[0];

    return { snapshot, dropped };
  }

  it('should export a range name shifted by the column header and a formula constant', async() => {
    const engine = createGrid();

    engine.addNamedExpression('Sales', '=Sheet1!$A$1:$A$3');
    engine.addNamedExpression('TaxRate', '=0.07');

    const { snapshot } = await exportWorkbook({ exportFormulas: true, colHeaders: true });

    expect(snapshot.definedNames).toEqual([
      { name: 'Sales', formula: 'Sheet1!$A$2:$A$4', sheetName: null },
      { name: 'TaxRate', formula: '0.07', sheetName: null },
    ]);
  });

  it('should leave `definedNames` unset without `exportFormulas`', async() => {
    const engine = createGrid();

    engine.addNamedExpression('Sales', '=Sheet1!$A$1:$A$3');

    const { snapshot } = await exportWorkbook({});

    expect(snapshot.definedNames).toBeUndefined();
  });

  it('should shift a name by both header bands', async() => {
    const engine = createGrid({ colHeaders: true, rowHeaders: true });

    engine.addNamedExpression('Sales', '=Sheet1!$A$1:$A$3');
    engine.addNamedExpression('First', '=Sheet1!$A$1');

    const { snapshot } = await exportWorkbook({ exportFormulas: true, colHeaders: true, rowHeaders: true });

    expect(snapshot.definedNames).toEqual([
      { name: 'Sales', formula: 'Sheet1!$B$2:$B$4', sheetName: null },
      { name: 'First', formula: 'Sheet1!$B$2', sheetName: null },
    ]);
  });

  it('should spell a constant name as a literal', async() => {
    const engine = createGrid();

    engine.addNamedExpression('Count', 5);
    engine.addNamedExpression('Label', 'say "hi"');
    engine.addNamedExpression('Flag', true);
    engine.addNamedExpression('Off', false);

    const { snapshot } = await exportWorkbook();

    expect(snapshot.definedNames).toEqual([
      { name: 'Count', formula: '5', sheetName: null },
      { name: 'Label', formula: '"say ""hi"""', sheetName: null },
      { name: 'Flag', formula: 'TRUE()', sheetName: null },
      { name: 'Off', formula: 'FALSE()', sheetName: null },
    ]);
  });

  it('should leave out a constant name when the engine cannot read its value', async() => {
    // `getNamedExpressionValue` is optional on the engine type: without it a constant name has no
    // definition to write, so it is left out and reported instead of the export throwing.
    const engine = createGrid();

    engine.addNamedExpression('Count', 5);
    engine.addNamedExpression('Sales', '=Sheet1!$A$1:$A$3');
    engine.getNamedExpressionValue = undefined;

    const { snapshot, dropped } = await exportWorkbook();

    expect(snapshot.definedNames).toEqual([{ name: 'Sales', formula: 'Sheet1!$A$1:$A$3', sheetName: null }]);
    expect(dropped.list()).toContain('definedNames:unsupported');
  });

  it('should re-qualify the engine sheet name (any case) with the exported sheet name', async() => {
    const engine = createGrid({}, 'My Data');

    engine.addNamedExpression('Sales', '=\'my data\'!$A$1:$A$2');

    const { snapshot } = await exportWorkbook();

    expect(snapshot.definedNames).toEqual([
      { name: 'Sales', formula: 'Sheet1!$A$1:$A$2', sheetName: null },
    ]);
  });

  it('should quote the exported sheet name when it needs quotes', async() => {
    const engine = createGrid();

    engine.addNamedExpression('Sales', '=Sheet1!$A$1');

    const { snapshot } = await exportWorkbook({
      exportFormulas: true,
      colHeaders: true,
      sheets: [{ instance: hot, name: 'Q1 Sales' }],
    });

    expect(snapshot.definedNames).toEqual([
      { name: 'Sales', formula: '\'Q1 Sales\'!$A$2', sheetName: null },
    ]);
  });

  it('should leave out a name that references an engine sheet the export does not write', async() => {
    const engine = createGrid({ data: [[1], [2], [3], ['=SUM(Rate)']] });

    engine.addSheet('Rates');
    engine.setCellContents({ sheet: engine.getSheetId('Rates'), row: 0, col: 0 }, [[5, 6]]);
    engine.addNamedExpression('Rate', '=Rates!$A$1:$B$2');
    engine.addNamedExpression('Kept', '=Sheet1!$A$1');

    const { snapshot, dropped } = await exportWorkbook({ exportFormulas: true, colHeaders: true });
    const summed = snapshot.sheets[0].rows[4][0];

    expect(snapshot.definedNames).toEqual([
      { name: 'Kept', formula: 'Sheet1!$A$2', sheetName: null },
    ]);
    expect(dropped.count('definedNames:unsupported')).toBe(1);
    // In the file, `Rate` does not exist, so the formula goes out as its value.
    expect(summed.formula).toBeNull();
    expect(summed.value).toBe(11);
    expect(dropped.count('formula:definedName')).toBe(1);
  });

  it('should write each name once, against the sheet of every grid sharing the engine', async() => {
    const engine = createGrid();
    const second = document.createElement('div');

    document.body.appendChild(second);

    const hot2 = new Handsontable(second, {
      data: [[10], [20]],
      formulas: { engine, sheetName: 'Sheet2' },
      licenseKey: TEST_LICENSE_KEY,
    });

    try {
      engine.addNamedExpression('OnA', '=Sheet1!$A$1:$A$2');
      engine.addNamedExpression('OnB', '=Sheet2!$A$1');
      engine.addNamedExpression('Both', '=SUM(Sheet1!$A$1,sheet2!$A$2)');

      const { snapshot, dropped } = await exportWorkbook({
        exportFormulas: true,
        colHeaders: true,
        sheets: [{ instance: hot, name: 'Alpha' }, { instance: hot2, name: 'Beta Sheet', rowHeaders: true }],
      });

      expect(snapshot.definedNames).toEqual([
        { name: 'OnA', formula: 'Alpha!$A$2:$A$3', sheetName: null },
        { name: 'OnB', formula: '\'Beta Sheet\'!$B$2', sheetName: null },
        { name: 'Both', formula: 'SUM(Alpha!$A$2,\'Beta Sheet\'!$B$3)', sheetName: null },
      ]);
      expect(dropped.count('definedNames:unsupported')).toBe(0);
    } finally {
      hot2.destroy();
      second.remove();
    }
  });

  it('should keep a name that points at a sheet exported without `exportFormulas`', async() => {
    // The sheet is in the file as values, so the name still has its target. Registering only the
    // grids with `exportFormulas` dropped the name and left `#NAME?` in the other sheet's formulas.
    const engine = createGrid();
    const second = document.createElement('div');

    document.body.appendChild(second);

    const hot2 = new Handsontable(second, {
      data: [[10], [20]],
      formulas: { engine, sheetName: 'Sheet2' },
      licenseKey: TEST_LICENSE_KEY,
    });

    try {
      engine.addNamedExpression('OnB', '=Sheet2!$A$1:$A$2');

      const { snapshot, dropped } = await exportWorkbook({
        exportFormulas: true,
        colHeaders: true,
        sheets: [{ instance: hot, name: 'Alpha' }, { instance: hot2, name: 'Beta', exportFormulas: false }],
      });

      expect(snapshot.definedNames).toEqual([{ name: 'OnB', formula: 'Beta!$A$2:$A$3', sheetName: null }]);
      expect(dropped.count('definedNames:unsupported')).toBe(0);
    } finally {
      hot2.destroy();
      second.remove();
    }
  });

  it('should write no names when no grid of the engine is exported with `exportFormulas`', async() => {
    const engine = createGrid();
    const second = document.createElement('div');

    document.body.appendChild(second);

    const hot2 = new Handsontable(second, {
      data: [[10], [20]],
      formulas: { engine, sheetName: 'Sheet2' },
      licenseKey: TEST_LICENSE_KEY,
    });

    try {
      engine.addNamedExpression('OnB', '=Sheet2!$A$1:$A$2');

      const { snapshot } = await exportWorkbook({
        sheets: [{ instance: hot, name: 'Alpha' }, { instance: hot2, name: 'Beta' }],
      });

      expect(snapshot.definedNames).toBeUndefined();
    } finally {
      hot2.destroy();
      second.remove();
    }
  });

  it('should shift an open span by the row-header band only on the column axis', async() => {
    const engine = createGrid();

    engine.addNamedExpression('Whole', '=Sheet1!$A:$A');

    const { snapshot } = await exportWorkbook({ exportFormulas: true, colHeaders: true, rowHeaders: true });

    expect(snapshot.definedNames).toEqual([
      { name: 'Whole', formula: 'Sheet1!$B:$B', sheetName: null },
    ]);
  });

  it('should spell an error constant as its code and leave out a string Excel cannot hold', async() => {
    const engine = createGrid();

    engine.addNamedExpression('Missing', '#N/A');
    engine.addNamedExpression('Long', 'x'.repeat(256));

    const { snapshot, dropped } = await exportWorkbook();

    expect(snapshot.definedNames).toEqual([
      { name: 'Missing', formula: '#N/A', sheetName: null },
    ]);
    expect(dropped.count('definedNames:unsupported')).toBe(1);
  });

  it('should leave out a text constant with a control character and export the formulas over it as values', async() => {
    // The XML writer strips the character, so the name would silently hold `xy`, not `x\u0001y`.
    const engine = createGrid({ data: [['=LEN(Ctl)'], ['=LEN(Tab)']] });

    engine.addNamedExpression('Ctl', 'x\u0001y');
    engine.addNamedExpression('Tab', 'x\ty');

    const { snapshot, dropped } = await exportWorkbook();
    const [[ctl], [tab]] = snapshot.sheets[0].rows;

    expect(snapshot.definedNames).toEqual([{ name: 'Tab', formula: '"x\ty"', sheetName: null }]);
    expect(ctl.formula).toBeNull();
    expect(ctl.value).toBe(3);
    expect(tab.formula).toEqual(expect.objectContaining({ text: 'LEN(Tab)', result: 3 }));
    expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
  });

  it('should write a text constant holding a quote with the quote doubled in the file text, as the reader reads it', async() => {
    // This checks the file text and the reader only, not an import of `"a""b"` into HyperFormula.
    writeSpy.mockRestore();
    writeSpy = jest.spyOn(nativeAdapter, 'write');

    const engine = createGrid();

    engine.addNamedExpression('Quoted', 'a"b');

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true });

    const bytes = await writeSpy.mock.results[0].value;
    const read = await nativeAdapter.read(toArrayBuffer(bytes), undefined, new DroppedFeatures());

    expect(read.definedNames).toEqual([{ name: 'Quoted', formula: '"a""b"', sheetName: null }]);
  });

  it('should leave out a text constant holding a carriage return, which the file reads back as a line feed', async() => {
    writeSpy.mockRestore();
    writeSpy = jest.spyOn(nativeAdapter, 'write');

    const engine = createGrid({ data: [['=LEN(Cr)']] });

    engine.addNamedExpression('Cr', 'a\rb');
    engine.addNamedExpression('Lf', 'a\nb');

    await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true });

    const [snapshot] = writeSpy.mock.calls[0];
    const bytes = await writeSpy.mock.results[0].value;
    const read = await nativeAdapter.read(toArrayBuffer(bytes), undefined, new DroppedFeatures());

    // Written, `"a\rb"` came back as `"a\nb"`.
    expect(read.definedNames).toEqual([{ name: 'Lf', formula: '"a\nb"', sheetName: null }]);
    expect(snapshot.sheets[0].rows[0][0].formula).toBeNull();
    expect(snapshot.sheets[0].rows[0][0].value).toBe(3);
  });

  it('should convert the engine argument separator to a comma', async() => {
    hot = new Handsontable(container, {
      data: [[1], [2]],
      formulas: { engine: { hyperformula: HyperFormula, functionArgSeparator: ';' }, sheetName: 'Sheet1' },
      exportFile: true,
      licenseKey: TEST_LICENSE_KEY,
    });
    hot.getPlugin('formulas').engine.addNamedExpression('Total', '=SUM(Sheet1!$A$1;Sheet1!$A$2)');

    const { snapshot } = await exportWorkbook({ exportFormulas: true, colHeaders: true });

    expect(snapshot.definedNames).toEqual([
      { name: 'Total', formula: 'SUM(Sheet1!$A$2,Sheet1!$A$3)', sheetName: null },
    ]);
  });

  it('should write a decimal comma of the engine as a dot in a name and in a cell formula', async() => {
    hot = new Handsontable(container, {
      data: [[1, '=SUM(A1;1,5)', '="1,5"']],
      formulas: {
        engine: { hyperformula: HyperFormula, decimalSeparator: ',', functionArgSeparator: ';' },
        sheetName: 'Sheet1',
      },
      exportFile: true,
      licenseKey: TEST_LICENSE_KEY,
    });
    hot.getPlugin('formulas').engine.addNamedExpression('Half', '=Sheet1!$A$1*0,5');

    const { snapshot } = await exportWorkbook({ exportFormulas: true, colHeaders: true });

    expect(snapshot.definedNames).toEqual([
      { name: 'Half', formula: 'Sheet1!$A$2*0.5', sheetName: null },
    ]);
    // `SUM(A2,1,5)` would sum three arguments in Excel (8, not the engine's 2.5).
    expect(snapshot.sheets[0].rows[1][1].formula.text).toBe('SUM(A2,1.5)');
    expect(snapshot.sheets[0].rows[1][2].formula.text).toBe('"1,5"');
  });

  it('should export a sheet-scoped name scoped to the exported sheet of its grid', async() => {
    // Left out, `=Local*2` was still written live and Excel and LibreOffice showed `#NAME?`.
    const engine = createGrid({ data: [[1], [2], ['=Local*2']] });
    const sheetId = hot.getPlugin('formulas').sheetId;

    engine.addNamedExpression('Global', '=Sheet1!$A$1');
    engine.addNamedExpression('Local', '=Sheet1!$A$2', sheetId);

    const { snapshot, dropped } = await exportWorkbook({
      exportFormulas: true, sheets: [{ instance: hot, name: 'Data' }],
    });

    expect(snapshot.definedNames).toEqual([
      { name: 'Global', formula: 'Data!$A$1', sheetName: null },
      { name: 'Local', formula: 'Data!$A$2', sheetName: 'Data' },
    ]);
    expect(snapshot.sheets[0].rows[2][0].formula).toEqual(expect.objectContaining({ text: 'Local*2', result: 4 }));
    expect(dropped.list()).toEqual([]);
  });

  it('should write a sheet-scoped name beside a workbook name spelled the same, as the engine reads them', async() => {
    // On the sheet, `Rate` is the sheet's own name (2), in Excel as in HyperFormula; `Total` is a
    // workbook name, so it reads the workbook `Rate` (1).
    const engine = createGrid({ data: [[1], [2], ['=Rate*10'], ['=Total']] });
    const sheetId = hot.getPlugin('formulas').sheetId;

    engine.addNamedExpression('Rate', '=Sheet1!$A$1');
    engine.addNamedExpression('Total', '=Rate*100');
    engine.addNamedExpression('Rate', '=Sheet1!$A$2', sheetId);

    const { snapshot, dropped } = await exportWorkbook();
    const [, , scaled, total] = snapshot.sheets[0].rows.map(row => row[0]);

    expect(snapshot.definedNames).toEqual([
      { name: 'Rate', formula: 'Sheet1!$A$1', sheetName: null },
      { name: 'Total', formula: 'Rate*100', sheetName: null },
      { name: 'Rate', formula: 'Sheet1!$A$2', sheetName: 'Sheet1' },
    ]);
    expect(scaled.formula).toEqual(expect.objectContaining({ text: 'Rate*10', result: 20 }));
    expect(total.formula).toEqual(expect.objectContaining({ text: 'Total', result: 100 }));
    expect(dropped.list()).toEqual([]);
  });

  it('should export a formula over a sheet-scoped name as its value when the scope did not reach the file', async() => {
    // The workbook `Rate` is written, but a cell over the left-out sheet `Rate` must not fall back
    // on it in Excel (1, not 2).
    const engine = createGrid({ data: [[1], [2], ['=Rate*10']], hiddenRows: { rows: [1] } });
    const sheetId = hot.getPlugin('formulas').sheetId;

    engine.addNamedExpression('Rate', '=Sheet1!$A$1');
    engine.addNamedExpression('Rate', '=Sheet1!$A$2', sheetId);

    const { snapshot, dropped } = await exportWorkbook({ exportFormulas: true, exportHiddenRows: false });
    const scaled = snapshot.sheets[0].rows[1][0];

    expect(snapshot.definedNames).toEqual([{ name: 'Rate', formula: 'Sheet1!$A$1', sheetName: null }]);
    expect(scaled.formula).toBeNull();
    expect(scaled.value).toBe(20);
    expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
  });

  it('should keep a scoped name live when the scoped name it would shadow was left out', async() => {
    // HyperFormula reads `Rate` inside the scoped `Total` from the workbook (1, so 2). The sheet's own
    // `Rate` is left out (its range ends on the hidden row), so Excel reads the workbook `Rate` in
    // the file's `Total` too: `Total` is written, and the cell over it stays live.
    const engine = createGrid({ data: [[1], [2], ['=Total']], hiddenRows: { rows: [1] } });
    const sheetId = hot.getPlugin('formulas').sheetId;

    engine.addNamedExpression('Rate', '=Sheet1!$A$1');
    engine.addNamedExpression('Rate', '=Sheet1!$A$2', sheetId);
    engine.addNamedExpression('Total', '=Rate*2', sheetId);

    const { snapshot, dropped } = await exportWorkbook({ exportFormulas: true, exportHiddenRows: false });
    const total = snapshot.sheets[0].rows[1][0];

    expect(snapshot.definedNames).toEqual([
      { name: 'Rate', formula: 'Sheet1!$A$1', sheetName: null },
      { name: 'Total', formula: 'Rate*2', sheetName: 'Sheet1' },
    ]);
    expect(total.formula).toEqual(expect.objectContaining({ text: 'Total', result: 2 }));
    expect(dropped.list()).toEqual(['definedNames:unsupported']);
  });

  it('should leave out a scoped name whose definition uses a name the file holds in both scopes', async() => {
    // HyperFormula reads `Rate` inside the scoped `Total` from the workbook (2). Excel may read the
    // sheet's own `Rate` (4), so the file cannot hold `Total` with a value the engine agrees on: it is
    // left out, and the cell keeps the engine's value. The sheet's own `Rate` stays, and the cell
    // over it stays live.
    const engine = createGrid({ data: [[1], [2], ['=Total'], ['=Rate*10']] });
    const sheetId = hot.getPlugin('formulas').sheetId;

    engine.addNamedExpression('Rate', '=Sheet1!$A$1');
    engine.addNamedExpression('Rate', '=Sheet1!$A$2', sheetId);
    engine.addNamedExpression('Total', '=Rate*2', sheetId);

    const { snapshot, dropped } = await exportWorkbook();
    const [, , total, scaled] = snapshot.sheets[0].rows.map(row => row[0]);

    expect(snapshot.definedNames).toEqual([
      { name: 'Rate', formula: 'Sheet1!$A$1', sheetName: null },
      { name: 'Rate', formula: 'Sheet1!$A$2', sheetName: 'Sheet1' },
    ]);
    expect(total.formula).toBeNull();
    expect(total.value).toBe(2);
    expect(scaled.formula).toEqual(expect.objectContaining({ text: 'Rate*10', result: 20 }));
    expect(dropped.list()).toEqual(['definedNames:unsupported', 'formula:definedName']);
  });

  it('should leave out a scoped name whose definition reads a workbook name the file does not hold', async() => {
    // HyperFormula reads `Rate` inside the scoped `Total` from the workbook (`Other!A1`, 7). The
    // workbook `Rate` cannot reach the file (`Other` is not exported), so Excel would read the
    // sheet's own `Rate` (1) instead: `Total` is left out, and the cell keeps the engine's value.
    const engine = createGrid({ data: [[1], [2], ['=Total']] });
    const sheetId = hot.getPlugin('formulas').sheetId;

    engine.addSheet('Other');
    engine.setCellContents({ sheet: engine.getSheetId('Other'), row: 0, col: 0 }, [[7]]);
    engine.addNamedExpression('Rate', '=Other!$A$1');
    engine.addNamedExpression('Rate', '=Sheet1!$A$1', sheetId);
    engine.addNamedExpression('Total', '=Rate*2', sheetId);

    const { snapshot, dropped } = await exportWorkbook();
    const total = snapshot.sheets[0].rows[2][0];

    expect(snapshot.definedNames).toEqual([{ name: 'Rate', formula: 'Sheet1!$A$1', sheetName: 'Sheet1' }]);
    expect(total.formula).toBeNull();
    expect(total.value).toBe(14);
    expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
  });

  it('should leave out a scoped name whose definition reads a name only its own sheet scope holds', async() => {
    // With no workbook `Rate`, HyperFormula shows `#NAME?` for the scoped `Total`, while Excel would
    // read the sheet's own `Rate`. `Total` is left out, and the cell keeps the engine's error.
    const engine = createGrid({ data: [[1], [2], ['=Total']] });
    const sheetId = hot.getPlugin('formulas').sheetId;

    engine.addNamedExpression('Rate', '=Sheet1!$A$1', sheetId);
    engine.addNamedExpression('Total', '=Rate*2', sheetId);

    const { snapshot, dropped } = await exportWorkbook();
    const total = snapshot.sheets[0].rows[2][0];

    expect(snapshot.definedNames).toEqual([{ name: 'Rate', formula: 'Sheet1!$A$1', sheetName: 'Sheet1' }]);
    expect(total.formula).toBeNull();
    expect(total.value).toBe('#NAME?');
    expect(total.valueIsError).toBe(true);
    expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
  });

  it('should keep the formulas live when one engine scopes `Rate` and another defines it for the workbook', async() => {
    // In the file, `Alpha!Rate` is the first grid's own name, and the workbook `Rate` the second
    // engine's. Each sheet's `Rate` reads the definition its engine reads.
    createGrid({ data: [[1], [2], ['=Rate*10']] });
    hot.getPlugin('formulas').engine.addNamedExpression('Rate', '=Sheet1!$A$1', hot.getPlugin('formulas').sheetId);

    const second = document.createElement('div');

    document.body.appendChild(second);

    const hot2 = new Handsontable(second, {
      data: [[100], [200], ['=Rate*10']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      licenseKey: TEST_LICENSE_KEY,
    });

    try {
      hot2.getPlugin('formulas').engine.addNamedExpression('Rate', '=Sheet1!$A$2');

      const { snapshot, dropped } = await exportWorkbook({
        exportFormulas: true,
        sheets: [{ instance: hot, name: 'Alpha' }, { instance: hot2, name: 'Beta' }],
      });
      const cellOf = name => snapshot.sheets.find(sheet => sheet.name === name).rows[2][0];

      expect(snapshot.definedNames).toEqual([
        { name: 'Rate', formula: 'Alpha!$A$1', sheetName: 'Alpha' },
        { name: 'Rate', formula: 'Beta!$A$2', sheetName: null },
      ]);
      expect(cellOf('Alpha').formula).toEqual(expect.objectContaining({ text: 'Rate*10', result: 10 }));
      expect(cellOf('Beta').formula).toEqual(expect.objectContaining({ text: 'Rate*10', result: 2000 }));
      expect(dropped.list()).toEqual([]);
    } finally {
      hot2.destroy();
      second.remove();
    }
  });

  it('should scope a name to the first sheet only when the export lists the same grid twice', async() => {
    // The second sheet has no `Local` in the file, so its cell keeps the value.
    const engine = createGrid({ data: [[1], [2], ['=Local*2']] });

    engine.addNamedExpression('Local', '=Sheet1!$A$2', hot.getPlugin('formulas').sheetId);

    const { snapshot, dropped } = await exportWorkbook({
      exportFormulas: true,
      sheets: [{ instance: hot, name: 'First' }, { instance: hot, name: 'Second' }],
    });
    const cellOf = name => snapshot.sheets.find(sheet => sheet.name === name).rows[2][0];

    expect(snapshot.definedNames).toEqual([{ name: 'Local', formula: 'First!$A$2', sheetName: 'First' }]);
    expect(cellOf('First').formula).toEqual(expect.objectContaining({ text: 'Local*2', result: 4 }));
    expect(cellOf('Second').formula).toBeNull();
    expect(cellOf('Second').value).toBe(4);
    expect(dropped.list()).toEqual(['formula:definedName']);
  });

  it('should leave out a sheet-scoped name with the ExcelJS engine and export the formulas over it as values', async() => {
    const excelJsWrite = jest.spyOn(excelJsAdapter, 'write').mockResolvedValue(new Uint8Array());

    try {
      const engine = createGrid({ data: [[1], [2], ['=Local*2'], ['=SUM(Global)']] });
      const sheetId = hot.getPlugin('formulas').sheetId;

      engine.addNamedExpression('Global', '=Sheet1!$A$1:$A$2');
      engine.addNamedExpression('Local', '=Sheet1!$A$2', sheetId);

      await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true, engine: ExcelJS });

      const [snapshot, , dropped] = excelJsWrite.mock.calls[0];
      const [, , local, global] = snapshot.sheets[0].rows.map(row => row[0]);

      expect(snapshot.definedNames).toEqual([{ name: 'Global', formula: 'Sheet1!$A$1:$A$2', sheetName: null }]);
      expect(local.formula).toBeNull();
      expect(local.value).toBe(4);
      expect(global.formula).toEqual(expect.objectContaining({ text: 'SUM(Global)', result: 3 }));
      expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
    } finally {
      excelJsWrite.mockRestore();
    }
  });

  it('should skip a sheet-scoped name of an engine sheet the export does not write', async() => {
    const engine = createGrid();

    engine.addSheet('Other');
    engine.addNamedExpression('Elsewhere', '=Other!$A$1', engine.getSheetId('Other'));
    engine.addNamedExpression('Here', '=Sheet1!$A$1');

    const { snapshot, dropped } = await exportWorkbook();

    expect(snapshot.definedNames).toEqual([{ name: 'Here', formula: 'Sheet1!$A$1', sheetName: null }]);
    expect(dropped.list()).toEqual([]);
  });

  it('should shrink a range around a hidden row the export leaves out', async() => {
    const engine = createGrid({ hiddenRows: { rows: [1] } });

    engine.addNamedExpression('Sales', '=Sheet1!$A$1:$A$3');

    const { snapshot, dropped } = await exportWorkbook({ exportFormulas: true, exportHiddenRows: false });

    expect(snapshot.definedNames).toEqual([
      { name: 'Sales', formula: 'Sheet1!$A$1:$A$2', sheetName: null },
    ]);
    expect(dropped.count('definedNames:unsupported')).toBe(0);
  });

  it('should leave out the hidden ENGINE column after a column move, for names and cell formulas', async() => {
    // The engine's column order follows the visual one: the grid shows 4, 1, 2, 3, the hidden
    // physical column 3 is engine column A (value 4), and the file holds 1, 2, 3. Leaving out the
    // physical index instead (engine column D) wrote every reference one column too far right.
    const engine = createGrid({
      data: [[1, 2, 3, 4], [null, null, null, null]],
      manualColumnMove: [3, 0, 1, 2],
      hiddenColumns: { columns: [3] },
    });

    hot.setDataAtCell(1, 1, '=B1*10+D1');
    engine.addNamedExpression('First', '=Sheet1!$B$1');
    engine.addNamedExpression('Last', '=Sheet1!$D$1');
    engine.addNamedExpression('Pair', '=Sheet1!$A$1:$B$1');

    const { snapshot, dropped } = await exportWorkbook({ exportFormulas: true, exportHiddenColumns: false });
    // Visual column 0 is the hidden one, so the formula typed at visual column 1 is the first cell.
    const [values, [formulaCell]] = snapshot.sheets[0].rows;

    expect(values.map(cell => cell.value)).toEqual(['1', '2', '3']);
    expect(formulaCell.formula).toEqual(expect.objectContaining({ text: 'A1*10+C1', result: 13 }));
    expect(snapshot.definedNames).toEqual([
      { name: 'First', formula: 'Sheet1!$A$1', sheetName: null },
      { name: 'Last', formula: 'Sheet1!$C$1', sheetName: null },
    ]);
    expect(dropped.count('definedNames:unsupported')).toBe(1);
  });

  it('should move a name by the start of `range`, and leave out one that starts or ends outside it', async() => {
    const engine = createGrid({ data: [[10, 1], [20, 2], [30, 3], [40, 4], [50, 5], [60, 6]] });

    engine.addNamedExpression('Tail', '=Sheet1!$A$3:$A$5');
    engine.addNamedExpression('Second', '=Sheet1!$B$4');
    engine.addNamedExpression('FromTop', '=Sheet1!$A$1:$A$4');
    engine.addNamedExpression('PastEnd', '=Sheet1!$A$5:$A$6');
    engine.addNamedExpression('LeftColumn', '=Sheet1!$A$4');

    const { snapshot, dropped } = await exportWorkbook({ exportFormulas: true, range: [2, 0, 4, 1] });

    expect(snapshot.definedNames).toEqual([
      { name: 'Tail', formula: 'Sheet1!$A$1:$A$3', sheetName: null },
      { name: 'Second', formula: 'Sheet1!$B$2', sheetName: null },
      { name: 'LeftColumn', formula: 'Sheet1!$A$2', sheetName: null },
    ]);
    expect(dropped.count('definedNames:unsupported')).toBe(1);

    hot.destroy();
    writeSpy.mockClear();

    const shifted = createGrid({ data: [[1, 10], [2, 20]] });

    shifted.addNamedExpression('Right', '=Sheet1!$B$1:$B$2');
    shifted.addNamedExpression('Left', '=Sheet1!$A$1');

    const columns = await exportWorkbook({ exportFormulas: true, range: [0, 1, 1, 1] });

    expect(columns.snapshot.definedNames).toEqual([{ name: 'Right', formula: 'Sheet1!$A$1:$A$2', sheetName: null }]);
  });

  it('should leave out a name whose reference ends on a row or a column the export leaves out', async() => {
    const engine = createGrid({
      data: [[1, 2], [3, 4], [5, 6], ['=SUM(From)', null], ['=Kept*2', null]],
      hiddenRows: { rows: [1] },
      hiddenColumns: { columns: [1] },
    });

    engine.addNamedExpression('Second', '=Sheet1!$A$2');
    engine.addNamedExpression('From', '=Sheet1!$A$2:$A$3');
    engine.addNamedExpression('Upto', '=Sheet1!$A$1:$A$2');
    engine.addNamedExpression('Col', '=Sheet1!$B$1');
    engine.addNamedExpression('Kept', '=Sheet1!$A$3');

    const { snapshot, dropped } = await exportWorkbook({
      exportFormulas: true, exportHiddenRows: false, exportHiddenColumns: false,
    });

    const [summed, doubled] = snapshot.sheets[0].rows.slice(2).map(row => row[0]);

    expect(snapshot.definedNames).toEqual([
      { name: 'Kept', formula: 'Sheet1!$A$2', sheetName: null },
    ]);
    expect(dropped.count('definedNames:unsupported')).toBe(1);
    expect(summed.formula).toBeNull();
    expect(summed.value).toBe(8);
    expect(doubled.formula).toEqual(expect.objectContaining({ text: 'Kept*2', result: 10 }));
    expect(dropped.count('formula:definedName')).toBe(1);
  });

  it('should leave `definedNames` unset when the engine defines no name', async() => {
    createGrid();

    const { snapshot } = await exportWorkbook();

    expect(snapshot.definedNames).toBeUndefined();
  });

  it('should export a formula over a name another engine defines differently as its value', async() => {
    // Two engines both define `Rate`. The file holds one `Rate`, the first engine's, so a live
    // `=SUM(Rate)` of the second grid would sum the first grid's cells in Excel (3, not 300).
    createGrid({ data: [[1], [2], ['=SUM(Rate)']] });
    hot.getPlugin('formulas').engine.addNamedExpression('Rate', '=Sheet1!$A$1:$A$2');

    const second = document.createElement('div');

    document.body.appendChild(second);

    const hot2 = new Handsontable(second, {
      data: [[100], [200], ['=SUM(Rate)']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      licenseKey: TEST_LICENSE_KEY,
    });

    try {
      hot2.getPlugin('formulas').engine.addNamedExpression('Rate', '=Sheet1!$A$1:$A$2');

      const { snapshot, dropped } = await exportWorkbook({
        exportFormulas: true,
        sheets: [{ instance: hot, name: 'Alpha' }, { instance: hot2, name: 'Beta' }],
      });
      const cellOf = name => snapshot.sheets.find(sheet => sheet.name === name).rows[2][0];

      expect(snapshot.definedNames).toEqual([{ name: 'Rate', formula: 'Alpha!$A$1:$A$2', sheetName: null }]);
      expect(cellOf('Alpha').formula).toEqual(expect.objectContaining({ text: 'SUM(Rate)', result: 3 }));
      expect(cellOf('Beta').formula).toBeNull();
      expect(cellOf('Beta').value).toBe(300);
      expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
    } finally {
      hot2.destroy();
      second.remove();
    }
  });

  it('should export a formula over a name the ExcelJS writer leaves out as its value', async() => {
    // ExcelJS writes no constant name, so `=TaxRate*100` would show `#NAME?` in Excel.
    const excelJsWrite = jest.spyOn(excelJsAdapter, 'write').mockResolvedValue(new Uint8Array());

    try {
      const engine = createGrid({ data: [[1], ['=TaxRate*100'], ['=SUM(Sales)']] });

      engine.addNamedExpression('TaxRate', 0.07);
      engine.addNamedExpression('Sales', '=Sheet1!$A$1');

      await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true, engine: ExcelJS });

      const [snapshot, , dropped] = excelJsWrite.mock.calls[0];
      const [, taxed, summed] = snapshot.sheets[0].rows.map(row => row[0]);

      expect(taxed.formula).toBeNull();
      expect(taxed.value).toBe(7);
      // `Sales` is one sheet-qualified range, which the ExcelJS writer keeps.
      expect(summed.formula).toEqual(expect.objectContaining({ text: 'SUM(Sales)' }));
      expect(dropped.list()).toContain('formula:definedName');
    } finally {
      excelJsWrite.mockRestore();
    }
  });

  it('should keep a formula live when a left-out name is only quoted, a sheet name or a call', async() => {
    const excelJsWrite = jest.spyOn(excelJsAdapter, 'write').mockResolvedValue(new Uint8Array());

    try {
      const engine = createGrid({ data: [[1], ['=SUM(Sales)&"TaxRate"&\'TaxRate\'!A1&TaxRate!A1'], ['=TAXRATE(1)']] });

      // `TaxRate` is a constant, which the ExcelJS writer leaves out; here it is never used as a name.
      engine.addNamedExpression('TaxRate', 0.07);
      engine.addNamedExpression('Sales', '=Sheet1!$A$1');
      engine.addSheet('TaxRate');

      await hot.getPlugin('exportFile').exportAsBlobAsync('xlsx', { exportFormulas: true, engine: ExcelJS });

      const [snapshot, , dropped] = excelJsWrite.mock.calls[0];
      const [, joined, called] = snapshot.sheets[0].rows.map(row => row[0]);

      expect(joined.formula).not.toBeNull();
      expect(called.formula).not.toBeNull();
      expect(dropped.list()).not.toContain('formula:definedName');
    } finally {
      excelJsWrite.mockRestore();
    }
  });
  it('should export a formula over a name the native writer leaves out as its value', async() => {
    // `R` is a name HyperFormula takes, but Excel reads it as an R1C1 reference, so the native
    // writer leaves it out (`nativeAdapter.selectDefinedNames`).
    const engine = createGrid({ data: [[1], ['=R*2'], ['=1/(R-1)']] });

    engine.addNamedExpression('R', '=Sheet1!$A$1');

    const { snapshot, dropped } = await exportWorkbook();
    const [, doubled, divided] = snapshot.sheets[0].rows.map(row => row[0]);

    expect(nativeAdapter.selectDefinedNames(snapshot)).toEqual([]);
    expect(doubled.formula).toBeNull();
    expect(doubled.value).toBe(2);
    // An error value goes out as its code, typed as an error.
    expect(divided.formula).toBeNull();
    expect(divided.value).toBe('#DIV/0!');
    expect(divided.valueIsError).toBe(true);
    expect(dropped.count('formula:definedName')).toBe(1);
  });

  it('should leave out a name over a name the file does not hold, and export the formulas over it as values', async() => {
    // `Base` points at a sheet the export does not write; `Total` uses `Base`, so in the file it
    // would show `#NAME?` the same way.
    const engine = createGrid({ data: [[1], ['=Total'], ['=Kept+1']] });

    engine.addSheet('Rates');
    engine.setCellContents({ sheet: engine.getSheetId('Rates'), row: 0, col: 0 }, 5);
    engine.addNamedExpression('Base', '=Rates!$A$1');
    engine.addNamedExpression('Total', '=Base*2');
    engine.addNamedExpression('Kept', '=Sheet1!$A$1');

    const { snapshot, dropped } = await exportWorkbook();
    const [, total, kept] = snapshot.sheets[0].rows.map(row => row[0]);

    expect(snapshot.definedNames).toEqual([{ name: 'Kept', formula: 'Sheet1!$A$1', sheetName: null }]);
    expect(total.formula).toBeNull();
    expect(total.value).toBe(10);
    expect(kept.formula).toEqual(expect.objectContaining({ text: 'Kept+1', result: 2 }));
    expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
  });

  it('should leave out a name HyperFormula could not parse, and export the cells over it as values', async() => {
    // HyperFormula stores `=1+` as `=#ERROR!`, which no reader parses as a definition.
    const engine = createGrid({ data: [[1], ['=IFERROR(Bad,7)']] });

    engine.addNamedExpression('Bad', '=1+');

    const { snapshot, dropped } = await exportWorkbook();
    const [, cell] = snapshot.sheets[0].rows.map(row => row[0]);

    expect(snapshot.definedNames ?? []).toEqual([]);
    expect(cell.formula).toBeNull();
    expect(cell.value).toBe(7);
    expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
  });

  it('should leave out every name of a chain over a name the file does not hold, however deep', async() => {
    // `Grand` uses `Total` only, which uses `Base`. Only the chain walk sees that `Grand` needs the
    // left-out `Base`: the file kept `Grand = Total*2` with no `Total`, and `=Grand` opened as `#NAME?`.
    const engine = createGrid({ data: [[1], ['=Grand']] });

    engine.addSheet('Rates');
    engine.setCellContents({ sheet: engine.getSheetId('Rates'), row: 0, col: 0 }, 2);
    engine.addNamedExpression('Base', '=Rates!$A$1');
    engine.addNamedExpression('Total', '=Base*2');
    engine.addNamedExpression('Grand', '=Total*2');

    const { snapshot, dropped } = await exportWorkbook();
    const [, grand] = snapshot.sheets[0].rows.map(row => row[0]);

    expect(snapshot.definedNames ?? []).toEqual([]);
    expect(grand.formula).toBeNull();
    expect(grand.value).toBe(8);
    expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
  });

  it('should export a formula over a name whose used name another engine defines differently as its value', async() => {
    // Both engines define `Total` as `Rate*2`, so the file's one `Total` reads the first engine's
    // `Rate`. The second grid's `=Total` would read the first grid's cell in Excel (2, not 200).
    createGrid({ data: [[1], ['=Total']] });
    hot.getPlugin('formulas').engine.addNamedExpression('Rate', '=Sheet1!$A$1');
    hot.getPlugin('formulas').engine.addNamedExpression('Total', '=Rate*2');

    const second = document.createElement('div');

    document.body.appendChild(second);

    const hot2 = new Handsontable(second, {
      data: [[100], ['=Total']],
      formulas: { engine: HyperFormula, sheetName: 'Sheet1' },
      licenseKey: TEST_LICENSE_KEY,
    });

    try {
      hot2.getPlugin('formulas').engine.addNamedExpression('Rate', '=Sheet1!$A$1');
      hot2.getPlugin('formulas').engine.addNamedExpression('Total', '=Rate*2');

      const { snapshot, dropped } = await exportWorkbook({
        exportFormulas: true,
        sheets: [{ instance: hot, name: 'Alpha' }, { instance: hot2, name: 'Beta' }],
      });
      const cellOf = name => snapshot.sheets.find(sheet => sheet.name === name).rows[1][0];

      expect(snapshot.definedNames).toHaveLength(2);
      expect(snapshot.definedNames).toEqual(expect.arrayContaining([
        { name: 'Rate', formula: 'Alpha!$A$1', sheetName: null },
        { name: 'Total', formula: 'Rate*2', sheetName: null },
      ]));
      expect(cellOf('Alpha').formula).toEqual(expect.objectContaining({ text: 'Total', result: 2 }));
      expect(cellOf('Beta').formula).toBeNull();
      expect(cellOf('Beta').value).toBe(200);
      expect(dropped.list()).toEqual(expect.arrayContaining(['definedNames:unsupported', 'formula:definedName']));
    } finally {
      hot2.destroy();
      second.remove();
    }
  });

  it('should give a formula exported as its value over a left-out name its column\'s number format', async() => {
    const engine = createGrid({
      data: [['=R+45000']],
      // The Formulas plugin hands an `intl-date` cell its number, not a date string.
      columns: [{
        type: 'intl-date', locale: 'en-US', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },
      }],
    });

    engine.addNamedExpression('R', 5);

    const { snapshot } = await exportWorkbook();
    const [[dated]] = snapshot.sheets[0].rows;

    expect(dated.formula).toBeNull();
    expect(dated.value).toBe(45005);
    expect(dated.numFmt).toBe('mm/dd/yyyy');
  });

  it('should give a formula exported as its value over a left-out name no number format without xlsx:number_formats', async() => {
    const engine = createGrid({
      data: [['=R+0.5']],
      columns: [{ type: 'numeric', numericFormat: { minimumFractionDigits: 2 } }],
      licenseKey: tierKeyWithout(['xlsx:number_formats']),
    });

    engine.addNamedExpression('R', 5);

    const { snapshot } = await exportWorkbook();
    const [[cell]] = snapshot.sheets[0].rows;

    expect(cell.formula).toBeNull();
    expect(cell.value).toBe(5.5);
    expect(cell.numFmt).toBeNull();
  });
});
