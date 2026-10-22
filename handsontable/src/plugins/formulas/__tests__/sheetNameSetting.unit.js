import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Formulas `sheetName` setting', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  it('binds a sheet the same setting named before the engine held it', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = new Handsontable(container, { data: [[1]], formulas: { engine, sheetName: 'S1' }, licenseKey: LICENSE_KEY });
    hot.updateSettings({ formulas: { engine, sheetName: 'S2' } });
    engine.addSheet('S2');
    engine.setSheetContent(engine.getSheetId('S2'), [[42]]);
    hot.updateSettings({ formulas: { engine, sheetName: 'S2' } });

    expect(hot.getPlugin('formulas').sheetName).toBe('S2');
    expect(hot.getData()).toEqual([[42]]);
  });

  it('stays on its engine when a re-render passes a new engine instance that holds no sheet of that name', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const settings = () => ({
      engine: HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' }),
      sheetName: 'S',
    });

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      formulas: { engine, sheetName: 'S' },
      licenseKey: LICENSE_KEY,
    });
    hot.getPlugin('formulas').showFormulas();
    hot.updateSettings({ formulas: settings() });
    hot.updateSettings({ data: [[3, '=A1*2']], formulas: settings() });

    expect(hot.getPlugin('formulas').engine).toBe(engine);
    expect(hot.getPlugin('formulas').sheetName).toBe('S');
    expect(hot.getPlugin('formulas').isShowingFormulas()).toBe(true);
    expect(hot.getDataAtCell(0, 1)).toBe(6);
  });

  it('moves to a new engine instance that holds the sheet the setting names', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const other = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    other.addSheet('S');
    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      formulas: { engine, sheetName: 'S' },
      licenseKey: LICENSE_KEY,
    });
    hot.updateSettings({ formulas: { engine: other, sheetName: 'S' } });

    expect(hot.getPlugin('formulas').engine).toBe(other);
  });

  it('switches the sheet on an update that names only `sheetName`', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('B');
    engine.setSheetContent(engine.getSheetId('B'), [[2]]);
    hot = new Handsontable(container, { data: [[1]], formulas: { engine, sheetName: 'A' }, licenseKey: LICENSE_KEY });
    hot.updateSettings({ formulas: { sheetName: 'B' } });

    expect(hot.getPlugin('formulas').sheetName).toBe('B');
    expect(hot.getData()).toEqual([[2]]);
  });

  it('binds the sheet the setting names again after `switchSheet()` moved the grid away', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('B');
    engine.setSheetContent(engine.getSheetId('B'), [[2]]);
    hot = new Handsontable(container, { data: [[1]], formulas: { engine, sheetName: 'A' }, licenseKey: LICENSE_KEY });
    hot.getPlugin('formulas').switchSheet('B');
    hot.updateSettings({ formulas: { engine, sheetName: 'A' } });

    expect(hot.getPlugin('formulas').sheetName).toBe('A');
    expect(hot.getData()).toEqual([[1]]);
  });
});
