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
