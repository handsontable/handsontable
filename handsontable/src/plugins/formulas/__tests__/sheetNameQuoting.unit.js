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

  it('keeps the error literals of a formula working through the text it hands out and a row insert', () => {
    const data = [[1, '=IF(A1>5,#DIV/0!,7)', '=IFERROR(1/0,#N/A)']];

    buildGrid(data);
    hot.alter('insert_row_above', 0);

    expect(hot.getDataAtRow(1)).toEqual([1, 7, '#N/A']);
    expect(hot.getSourceDataAtCell(1, 1)).toBe('=IF(A2>5,#DIV/0!,7)');
    expect(data[1][1]).toBe('=IF(A2>5,#DIV/0!,7)');
  });

  describe('a name the engine cannot read unquoted in the data', () => {
    /**
     * Builds a grid on a sheet that reads the engine sheet `Лист2`.
     *
     * @param {Array[]} data The grid's data.
     * @param {object} [settings] More grid settings.
     * @returns {HyperFormula}
     */
    function buildCyrillicGrid(data, settings = {}) {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

      engine.addSheet('Лист2');
      engine.setSheetContent(engine.getSheetId('Лист2'), [[7]]);

      hot = new Handsontable(container, {
        data,
        formulas: { engine, sheetName: 'Report' },
        licenseKey: LICENSE_KEY,
        ...settings,
      });

      return engine;
    }

    it('calculates a loaded formula and leaves the data as written', () => {
      const data = [['=Лист2!A1', 'x']];

      buildCyrillicGrid(data);

      expect(hot.getDataAtCell(0, 0)).toBe(7);
      expect(hot.getSourceDataAtCell(0, 0)).toBe('=\'Лист2\'!A1');
      expect(data[0][0]).toBe('=Лист2!A1');
    });

    it('calculates a loaded formula in a column whose text the engine escapes', () => {
      buildCyrillicGrid([['=Лист2!A1', '007']], { columns: [{}, { type: 'text', preserveTextValue: true }] });

      expect(hot.getDataAtCell(0, 0)).toBe(7);
      expect(hot.getDataAtCell(0, 1)).toBe('007');
    });

    it('calculates a formula typed into a cell and one written to the source data', () => {
      buildCyrillicGrid([['x', 'y']]);

      hot.setDataAtCell(0, 0, '=Лист2!A1*2');
      hot.setSourceDataAtCell(0, 1, '=Лист2!A1*3');

      expect(hot.getDataAtRow(0)).toEqual([14, 21]);
    });

    it('calculates a formula in a row the grid inserts', () => {
      buildCyrillicGrid([['x']]);

      hot.alter('insert_row_above', 0);
      hot.setDataAtCell(0, 0, '=Лист2!A1+1');

      expect(hot.getDataAtCell(0, 0)).toBe(8);
    });

    it('calculates a formula in a sheet added through the plugin', () => {
      const engine = buildCyrillicGrid([['x']]);
      const name = hot.getPlugin('formulas').addSheet('Extra', [['=Лист2!A1']]);

      expect(engine.getCellValue({ sheet: engine.getSheetId(name), row: 0, col: 0 })).toBe(7);
    });
  });

  it('writes the quoted text into the data when a row insert moves the reference', () => {
    const data = [['=\'2026\'!A1+0', 'x'], ['plain', 'y']];

    buildGrid(data);
    hot.alter('insert_row_above', 0);

    expect(data[1][0]).toBe('=\'2026\'!A1+0');
    expect(hot.getDataAtCell(1, 0)).toBe(99);
  });
});
