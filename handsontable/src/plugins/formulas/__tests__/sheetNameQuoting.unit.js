import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Formulas text of a reference to a sheet the engine reads only in quotes', () => {
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

  /**
   * Builds a grid on a sheet that reads the engine sheet `2026`.
   *
   * @param {Array[]} data The grid's data.
   * @returns {HyperFormula}
   */
  function buildGrid(data) {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    engine.addSheet('2026');
    engine.setSheetContent(engine.getSheetId('2026'), [[99], [1]]);

    hot = new Handsontable(container, {
      data,
      formulas: { engine, sheetName: 'Report' },
      licenseKey: LICENSE_KEY,
    });

    return engine;
  }

  it('hands out the formula with the quotes the engine needs to read it again', () => {
    buildGrid([['=\'2026\'!A1', 'x']]);

    expect(hot.getSourceDataAtCell(0, 0)).toBe('=\'2026\'!A1');
    expect(hot.getDataAtCell(0, 0)).toBe(99);
  });

  it('keeps the value when the formula it hands out is written back', () => {
    const data = [['=\'2026\'!A1', 'x']];

    buildGrid(data);
    hot.setDataAtCell(0, 0, hot.getSourceDataAtCell(0, 0));

    expect(hot.getDataAtCell(0, 0)).toBe(99);
    expect(data[0][0]).toBe('=\'2026\'!A1');
  });

  it('writes the quoted text into the data when a row insert moves the reference', () => {
    const data = [['=\'2026\'!A1+0', 'x'], ['plain', 'y']];

    buildGrid(data);
    hot.alter('insert_row_above', 0);

    expect(data[1][0]).toBe('=\'2026\'!A1+0');
    expect(hot.getDataAtCell(1, 0)).toBe(99);
  });
});
