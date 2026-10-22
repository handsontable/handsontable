import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * Builds an engine for one test.
 *
 * @returns {HyperFormula}
 */
function buildEngine() {
  return HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
}

/**
 * Returns a sheet entry bound to `engine` under its own name.
 *
 * @param {HyperFormula} engine The engine.
 * @param {string} name The sheet name.
 * @param {Array} data The sheet's data.
 * @param {object} [settings] More settings of the sheet.
 * @returns {object}
 */
function boundSheet(engine, name, data, settings = {}) {
  return { name, data, settings: { ...settings, formulas: { engine, sheetName: name } } };
}

describe('SheetsBar formula sheets', () => {
  let container;
  let hot;
  let errorSpy;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    errorSpy = jest.spyOn(console, 'error');
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  const build = sheets => new Handsontable(container, { sheetsBar: { sheets }, licenseKey: LICENSE_KEY });
  const sheetsBar = () => hot.getPlugin('sheetsBar');
  const idOf = name => sheetsBar().getSheets().find(sheet => sheet.name === name).id;

  describe('rename', () => {
    it('keeps the active sheet bound after its rename, through settings updates and a data load', () => {
      const engine = buildEngine();

      hot = build([
        boundSheet(engine, 'Prices', [[1, '=A1*2']]),
        boundSheet(engine, 'Other', [['=Prices!B1']]),
      ]);
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');

      hot.updateSettings({ maxRows: 100 });
      hot.updateSettings({ language: 'en-US' });
      hot.updateSettings({ formulas: { ...hot.getSettings().formulas } });

      expect(errorSpy).not.toHaveBeenCalled();
      expect(hot.getPlugin('formulas').sheetName).toBe('Costs');
      expect(hot.getDataAtCell(0, 1)).toBe(2);

      hot.loadData([[3, '=A1*2']]);

      expect(engine.getSheetNames()).toEqual(['Costs', 'Other']);
      expect(hot.getDataAtCell(0, 1)).toBe(6);
    });

    it('quotes a new name the engine cannot read back without quotes', () => {
      const engine = buildEngine();
      const report = [['=Prices!A1']];

      hot = build([boundSheet(engine, 'Report', report), boundSheet(engine, 'Prices', [[99]])]);
      sheetsBar().renameSheet(idOf('Prices'), '2026');

      expect(report[0][0]).toBe('=\'2026\'!A1');
      expect(hot.getDataAtCell(0, 0)).toBe(99);

      sheetsBar().setActiveSheet('2026');
      sheetsBar().setActiveSheet('Report');

      expect(hot.getDataAtCell(0, 0)).toBe(99);
    });

    it('keeps a reference to a digit-named sheet working when its cell is committed unchanged', () => {
      const engine = buildEngine();
      const report = [['=Prices!A1']];

      hot = build([boundSheet(engine, 'Report', report), boundSheet(engine, 'Prices', [[99]])]);
      sheetsBar().renameSheet(idOf('Prices'), '2026');

      expect(hot.getSourceDataAtCell(0, 0)).toBe('=\'2026\'!A1');

      hot.setDataAtCell(0, 0, hot.getSourceDataAtCell(0, 0));

      expect(hot.getDataAtCell(0, 0)).toBe(99);
      expect(report[0][0]).toBe('=\'2026\'!A1');
    });

    it('does not throw on a sheet whose data the host froze, and renames every sheet', () => {
      const engine = buildEngine();
      const frozen = Object.freeze([Object.freeze(['=Prices!A1'])]);

      hot = build([
        boundSheet(engine, 'Prices', [[99]]),
        boundSheet(engine, 'A', frozen),
        boundSheet(engine, 'B', [['=Prices!A1*2']]),
      ]);

      expect(() => sheetsBar().renameSheet(idOf('Prices'), 'Costs')).not.toThrow();

      sheetsBar().setActiveSheet('A');

      expect(hot.getSettings().data[0][0]).toBe('=Costs!A1');
      expect(hot.getDataAtCell(0, 0)).toBe(99);
      expect(frozen[0][0]).toBe('=Prices!A1');

      sheetsBar().setActiveSheet('B');

      expect(hot.getDataAtCell(0, 0)).toBe(198);
    });

    it('is undone before an older row removal, so the removed formula reads its sheet again', () => {
      const engine = buildEngine();
      const undoRedo = () => hot.getPlugin('undoRedo');

      hot = build([
        boundSheet(engine, 'Report', [['=Prices!A1', 'x'], ['keep', 'y']]),
        boundSheet(engine, 'Prices', [[99]]),
      ]);
      hot.alter('remove_row', 0, 1);
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');

      undoRedo().undo();

      expect(sheetsBar().getSheets().map(sheet => sheet.name)).toEqual(['Report', 'Prices']);

      undoRedo().undo();

      expect(hot.getDataAtCell(0, 0)).toBe(99);

      undoRedo().redo();
      undoRedo().redo();

      expect(sheetsBar().getSheets().map(sheet => sheet.name)).toEqual(['Report', 'Costs']);
      expect(hot.getData()).toEqual([['keep', 'y']]);
    });

    it('renames a sheet when only the case of its name changes', () => {
      const engine = buildEngine();
      const report = [['=prices!A1']];

      hot = build([boundSheet(engine, 'Report', report), boundSheet(engine, 'prices', [[99]])]);

      expect(sheetsBar().renameSheet(idOf('prices'), 'Prices')).toBe(true);
      expect(engine.getSheetNames()).toEqual(['Report', 'Prices']);
      expect(report[0][0]).toBe('=Prices!A1');
    });

    it('rewrites the array the host loaded into the active sheet', () => {
      const engine = buildEngine();
      const loaded = [['=Prices!A1*2'], ['=Prices!A1+1']];

      hot = build([boundSheet(engine, 'Report', [['=Prices!A1']]), boundSheet(engine, 'Prices', [[99]])]);
      hot.loadData(loaded);
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');

      expect(loaded).toEqual([['=Costs!A1*2'], ['=Costs!A1+1']]);

      sheetsBar().setActiveSheet('Costs');
      sheetsBar().setActiveSheet('Report');

      expect(hot.getData()).toEqual([[198], [100]]);
    });
  });

  describe('duplicate', () => {
    it('copies the sheet-scoped named expressions to the copy', () => {
      const engine = buildEngine();

      hot = build([boundSheet(engine, 'A', [[10, '=Rate*2']])]);
      engine.addNamedExpression('Rate', 10, engine.getSheetId('A'));
      hot.render();

      const copy = sheetsBar().duplicateSheet(idOf('A'));

      sheetsBar().setActiveSheet(copy.id);

      expect(hot.getDataAtCell(0, 1)).toBe(20);
    });

    it('points the references the original makes to itself at the copy', () => {
      const engine = buildEngine();

      hot = build([boundSheet(engine, 'A', [[1, '=A!A1*10', '=A1*10']])]);

      const copy = sheetsBar().duplicateSheet(idOf('A'));

      sheetsBar().setActiveSheet(copy.id);
      hot.setDataAtCell(0, 0, 7);

      expect(hot.getSettings().data[0][1]).toBe('=\'A (2)\'!A1*10');
      expect(hot.getDataAtRow(0)).toEqual([7, 70, 70]);
    });
  });

  describe('sheet names the engine reads only in quotes', () => {
    it('calculates an unquoted reference on the active sheet and on a sheet not shown yet', () => {
      const engine = buildEngine();
      const third = [['=Лист2!A1*10']];

      hot = build([
        boundSheet(engine, 'Лист1', [['=Лист2!A1', '=\'Лист2\'!A1']]),
        boundSheet(engine, 'Лист2', [[7]]),
        boundSheet(engine, 'Лист3', third),
      ]);

      expect(third[0][0]).toBe('=Лист2!A1*10');

      expect(hot.getDataAtRow(0)).toEqual([7, 7]);
      expect(engine.getCellValue({ sheet: engine.getSheetId('Лист3'), row: 0, col: 0 })).toBe(70);

      sheetsBar().setActiveSheet('Лист3');

      expect(hot.getDataAtCell(0, 0)).toBe(70);
    });
  });

  describe('remove and add', () => {
    it('repaints a formula that reads a sheet removed and added again', () => {
      const engine = buildEngine();

      hot = build([boundSheet(engine, 'Summary', [['=Prices!A1']]), boundSheet(engine, 'Prices', [[99]])]);

      expect(hot.getCell(0, 0).textContent).toBe('99');

      sheetsBar().removeSheet(idOf('Prices'));

      expect(hot.getCell(0, 0).textContent).toBe('#REF!');

      sheetsBar().addSheet('Prices', [[7]]);

      expect(hot.getCell(0, 0).textContent).toBe('7');
    });

    it('repaints another grid on the same engine that reads the removed sheet', () => {
      const engine = buildEngine();
      const otherContainer = document.createElement('div');

      document.body.appendChild(otherContainer);
      hot = build([boundSheet(engine, 'Summary', [[1]]), boundSheet(engine, 'Prices', [[99]])]);

      const other = new Handsontable(otherContainer, {
        data: [['=Prices!A1']],
        formulas: { engine, sheetName: 'Report' },
        licenseKey: LICENSE_KEY,
      });

      expect(other.getCell(0, 0).textContent).toBe('99');

      sheetsBar().removeSheet(idOf('Prices'));

      expect(other.getCell(0, 0).textContent).toBe('#REF!');

      other.destroy();
      otherContainer.remove();
    });
  });

  describe('engine binding', () => {
    it('registers a sheet of object rows bound to the shared engine', () => {
      const engine = buildEngine();
      const columns = [{ data: 'qty' }, { data: 'total' }];

      expect(() => {
        hot = build([
          boundSheet(engine, 'A', [[1]]),
          boundSheet(engine, 'B', [{ qty: 5, total: '=A!A1+1' }], { columns }),
        ]);
      }).not.toThrow();

      expect(engine.getSheetSerialized(engine.getSheetId('B'))).toEqual([[5, '=A!A1+1']]);
      expect(() => sheetsBar().addSheet('C', [{ x: 1 }], { formulas: { engine, sheetName: 'C' } })).not.toThrow();
    });

    it('feeds the opening sheet to the engine once', () => {
      const engine = buildEngine();
      const feeds = [];
      const setSheetContent = engine.setSheetContent.bind(engine);

      jest.spyOn(engine, 'setSheetContent').mockImplementation((sheetId, content) => {
        feeds.push(engine.getSheetName(sheetId));

        return setSheetContent(sheetId, content);
      });

      hot = build([boundSheet(engine, 'A', [[1, '=A1*2']]), boundSheet(engine, 'B', [[5, '=A!A1+1']])]);

      expect(feeds.filter(name => name === 'A')).toEqual(['A']);
      expect(hot.getDataAtCell(0, 1)).toBe(2);
    });

    it('logs no error when every sheet passes the HyperFormula class', () => {
      hot = build([
        { name: 'A', data: [[1, '=A1*2']], settings: { formulas: { engine: HyperFormula, sheetName: 'A' } } },
        { name: 'B', data: [[5, '=A1+1']], settings: { formulas: { engine: HyperFormula, sheetName: 'B' } } },
      ]);
      sheetsBar().setActiveSheet('B');
      sheetsBar().setActiveSheet('A');

      expect(errorSpy).not.toHaveBeenCalled();
      expect(hot.getDataAtCell(0, 1)).toBe(2);
    });

    it('moves to the engine the arriving sheet is bound to', () => {
      const first = buildEngine();
      const second = buildEngine();

      hot = build([
        boundSheet(first, 'A', [[1, '=A1*2']]),
        boundSheet(second, 'B', [[5, '=A1+1']]),
        boundSheet(second, 'C', [['=B!B1*10']]),
      ]);
      sheetsBar().setActiveSheet('B');
      hot.setDataAtCell(0, 0, 100);

      expect(errorSpy).not.toHaveBeenCalled();
      expect(hot.getPlugin('formulas').engine).toBe(second);
      expect(first.getSheetNames()).toEqual(['A']);
      expect(second.getSheetSerialized(second.getSheetId('B'))).toEqual([[100, '=A1+1']]);
      expect(second.getSheetValues(second.getSheetId('C'))).toEqual([[1010]]);
    });
  });
});
