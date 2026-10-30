import { HyperFormula } from 'hyperformula';
import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ExportFile } from '../exportFile';
import { Formulas } from '../../formulas';
import { HiddenRows } from '../../hiddenRows';
import { HiddenColumns } from '../../hiddenColumns';
import { nativeAdapter } from '../../../utils/xlsxEngine/adapters/native';

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
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // The snapshot is what this suite is about, so the write itself is not run.
    writeSpy = jest.spyOn(nativeAdapter, 'write').mockResolvedValue(new Uint8Array());
  });

  afterEach(() => {
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
      licenseKey: 'non-commercial-and-evaluation',
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

  it('should keep a reference to another engine sheet untouched', async() => {
    const engine = createGrid();

    engine.addSheet('Rates');
    engine.addNamedExpression('Rate', '=Rates!$A$1:$B$2');

    const { snapshot } = await exportWorkbook({ exportFormulas: true, colHeaders: true });

    expect(snapshot.definedNames).toEqual([
      { name: 'Rate', formula: 'Rates!$A$1:$B$2', sheetName: null },
    ]);
  });

  it('should convert the engine argument separator to a comma', async() => {
    hot = new Handsontable(container, {
      data: [[1], [2]],
      formulas: { engine: { hyperformula: HyperFormula, functionArgSeparator: ';' }, sheetName: 'Sheet1' },
      exportFile: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    hot.getPlugin('formulas').engine.addNamedExpression('Total', '=SUM(Sheet1!$A$1;Sheet1!$A$2)');

    const { snapshot } = await exportWorkbook({ exportFormulas: true, colHeaders: true });

    expect(snapshot.definedNames).toEqual([
      { name: 'Total', formula: 'SUM(Sheet1!$A$2,Sheet1!$A$3)', sheetName: null },
    ]);
  });

  it('should export workbook-scoped names only', async() => {
    const engine = createGrid();
    const sheetId = hot.getPlugin('formulas').sheetId;

    engine.addNamedExpression('Global', '=Sheet1!$A$1');
    engine.addNamedExpression('Local', '=Sheet1!$A$2', sheetId);

    const { snapshot } = await exportWorkbook();

    expect(snapshot.definedNames).toEqual([
      { name: 'Global', formula: 'Sheet1!$A$1', sheetName: null },
    ]);
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

  it('should leave out a name whose reference ends on a row or a column the export leaves out', async() => {
    const engine = createGrid({
      data: [[1, 2], [3, 4], [5, 6]],
      hiddenRows: { rows: [1] },
      hiddenColumns: { columns: [1] },
    });

    engine.addNamedExpression('Second', '=Sheet1!$A$2');
    engine.addNamedExpression('Upto', '=Sheet1!$A$1:$A$2');
    engine.addNamedExpression('Col', '=Sheet1!$B$1');
    engine.addNamedExpression('Kept', '=Sheet1!$A$3');

    const { snapshot, dropped } = await exportWorkbook({
      exportFormulas: true, exportHiddenRows: false, exportHiddenColumns: false,
    });

    expect(snapshot.definedNames).toEqual([
      { name: 'Kept', formula: 'Sheet1!$A$2', sheetName: null },
    ]);
    expect(dropped.count('definedNames:unsupported')).toBe(1);
  });

  it('should leave `definedNames` unset when the engine defines no name', async() => {
    createGrid();

    const { snapshot } = await exportWorkbook();

    expect(snapshot.definedNames).toBeUndefined();
  });
});
