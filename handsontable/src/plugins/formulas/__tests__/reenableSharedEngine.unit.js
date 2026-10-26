import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Formulas turned on again with a shared engine', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('feeds the engine the edits made while the plugin was off', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('Other');
    engine.setSheetContent(engine.getSheetId('Other'), [['=S!B1*5']]);

    hot = new Handsontable(container, {
      data: [[1, '=A1*2']],
      formulas: { engine, sheetName: 'S' },
      licenseKey: LICENSE_KEY,
    });

    hot.updateSettings({ formulas: false });
    hot.setDataAtCell(0, 0, 50);
    hot.updateSettings({ formulas: { engine, sheetName: 'S' } });
    hot.render();

    expect(hot.getDataAtCell(0, 1)).toBe(100);
    expect(engine.getSheetSerialized(engine.getSheetId('S'))).toEqual([[50, '=A1*2']]);
    expect(engine.getSheetValues(engine.getSheetId('Other'))).toEqual([[500]]);
  });
});
