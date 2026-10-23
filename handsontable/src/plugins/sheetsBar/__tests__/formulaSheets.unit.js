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

    it('quotes a new name with an operator in it', () => {
      const engine = buildEngine();
      const report = [['=Prices!A1', '=SUM(Prices!A1:A2)']];

      hot = build([boundSheet(engine, 'Report', report), boundSheet(engine, 'Prices', [[99], [1]])]);
      sheetsBar().renameSheet(idOf('Prices'), 'Sales-EU');

      expect(report[0]).toEqual(['=\'Sales-EU\'!A1', '=SUM(\'Sales-EU\'!A1:A2)']);
      expect(hot.getDataAtRow(0)).toEqual([99, 100]);
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

    it('lets undo pass a rename step whose bar was turned off, and never renames a sheet of a new workbook', () => {
      const engine = buildEngine();

      hot = build([boundSheet(engine, 'Report', [['=Prices!A1']]), boundSheet(engine, 'Prices', [[99]])]);
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');
      hot.updateSettings({ sheetsBar: false });

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);
      expect(() => hot.getPlugin('undoRedo').undo()).not.toThrow();
      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
      expect(engine.getSheetNames()).toEqual(['Report', 'Costs']);

      hot.updateSettings({ sheetsBar: true });
      hot.getPlugin('undoRedo').undo();

      expect(sheetsBar().getSheets().map(sheet => sheet.name)).not.toContain('Prices');
    });

    it('drops the rename step with the history when the bar rebuilds the workbook', () => {
      const engine = buildEngine();
      const otherEngine = buildEngine();

      hot = build([boundSheet(engine, 'Report', [['=Prices!A1']]), boundSheet(engine, 'Prices', [[99]])]);
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');
      hot.updateSettings({
        sheetsBar: { sheets: [boundSheet(otherEngine, 'Report', [[1]]), boundSheet(otherEngine, 'Costs', [[2]])] },
      });

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
      expect(sheetsBar().getSheets().map(sheet => sheet.name)).toEqual(['Report', 'Costs']);
    });

    it('lets undo pass a rename step of a sheet removed since, and reach the older steps', () => {
      const engine = buildEngine();
      const undoRedo = () => hot.getPlugin('undoRedo');

      hot = build([boundSheet(engine, 'Report', [['=Prices!A1', 'x']]), boundSheet(engine, 'Prices', [[99]])]);
      hot.setDataAtCell(0, 1, 'y');
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');
      sheetsBar().removeSheet(idOf('Costs'));

      undoRedo().undo();
      undoRedo().undo();

      expect(hot.getDataAtCell(0, 1)).toBe('x');
      expect(undoRedo().isUndoAvailable()).toBe(false);
    });

    it('records no rename step while undo is off', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, {
        sheetsBar: { sheets: [boundSheet(engine, 'Report', [['=Prices!A1']]), boundSheet(engine, 'Prices', [[99]])] },
        undo: false,
        licenseKey: LICENSE_KEY,
      });
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');
      hot.updateSettings({ undo: true });

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
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

    it('rewrites the array the host replaced the active sheet\'s data with through updateData', () => {
      const engine = buildEngine();
      const first = [['=Prices!A1', 'x']];
      const live = [['plain', '=Prices!A1*2'], ['two', 'y']];

      hot = build([boundSheet(engine, 'Report', first), boundSheet(engine, 'Prices', [[99]])]);
      hot.updateData(live);
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');

      expect(live).toEqual([['plain', '=Costs!A1*2'], ['two', 'y']]);
      expect(first).toEqual([['=Prices!A1', 'x']]);
      expect(hot.getData()).toEqual([['plain', 198], ['two', 'y']]);
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

  describe('sheet data layout', () => {
    it('keeps the formulas of a sheet whose columns leave a data column out when another sheet gets a row', () => {
      const engine = buildEngine();
      const data = [['a', '=Other!A1', '=Other!A2']];

      hot = build([
        boundSheet(engine, 'Data', data, { columns: [{ data: 0 }, { data: 2 }] }),
        boundSheet(engine, 'Other', [[1], [2]]),
      ]);
      sheetsBar().setActiveSheet('Other');
      hot.alter('insert_row_above', 0);

      expect(data).toEqual([['a', '=Other!A1', '=Other!A3']]);
    });

    it('reads object rows of a sheet not shown yet by the first row\'s columns, nested ones included', () => {
      const engine = buildEngine();

      hot = build([
        boundSheet(engine, 'Report', [['=Data!A2', '=Data!D1', '=Data!B1']]),
        boundSheet(engine, 'Data', [
          { a: 1, address: { city: 'Oslo', zip: '0150' }, total: 5 },
          { total: 6, address: { zip: '0151', city: 'Bergen' }, a: 4 },
        ]),
      ]);

      expect(hot.getDataAtRow(0)).toEqual([4, 5, 'Oslo']);
    });

    it('renames a reference at a nested property of an object row', () => {
      const engine = buildEngine();
      const rows = [{ name: 'x', totals: { sum: '=Prices!A1' } }];

      hot = build([
        boundSheet(engine, 'Prices', [[99]]),
        boundSheet(engine, 'Report', rows, { columns: [{ data: 'name' }, { data: 'totals.sum' }] }),
      ]);
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');

      expect(rows[0].totals.sum).toBe('=Costs!A1');
    });

    it('renames a reference under a nested key that holds a dot, and adds no key', () => {
      const engine = buildEngine();
      const rows = [{ a: { 'b.c': '=Prices!A1' } }];

      hot = build([boundSheet(engine, 'Prices', [[99]]), boundSheet(engine, 'Report', rows)]);
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');

      expect(rows[0].a).toEqual({ 'b.c': '=Costs!A1' });
    });

    it('renames the references of a NestedRows tree at the rows they were written in', () => {
      const engine = buildEngine();
      const tree = [
        { label: 'p1', value: '=Prices!A1', __children: [{ label: 'c1', value: 'plain' }] },
        { label: 'p2', value: 'plain', __children: [{ label: 'c2', value: '=Prices!A1*2' }] },
      ];

      hot = build([
        boundSheet(engine, 'Report', tree, { nestedRows: true, columns: [{ data: 'label' }, { data: 'value' }] }),
        boundSheet(engine, 'Prices', [[5]]),
      ]);
      sheetsBar().renameSheet(idOf('Prices'), 'Costs');

      expect(tree[0].value).toBe('=Costs!A1');
      expect(tree[0].__children[0].value).toBe('plain');
      expect(tree[1].value).toBe('plain');
      expect(tree[1].__children[0].value).toBe('=Costs!A1*2');
      expect(hot.getDataAtCol(1)).toEqual([5, 'plain', 'plain', 10]);
    });

    it('renames the references of an active sheet whose data the host froze, without throwing', () => {
      const engine = buildEngine();
      const frozen = Object.freeze([Object.freeze(['=Prices!A1', 'x'])]);

      hot = build([boundSheet(engine, 'Report', frozen), boundSheet(engine, 'Prices', [[99]])]);

      expect(() => sheetsBar().renameSheet(idOf('Prices'), 'Costs')).not.toThrow();
      expect(frozen[0][0]).toBe('=Prices!A1');
      expect(hot.getSourceDataAtCell(0, 0)).toBe('=Costs!A1');
      expect(hot.getDataAtCell(0, 0)).toBe(99);
    });

    it('reads no other sheet whole when the active sheet gets a row', () => {
      const engine = buildEngine();

      hot = build([
        boundSheet(engine, 'Data', [[1], [2]]),
        boundSheet(engine, 'Plain', [[1, 2], [3, 4]]),
        boundSheet(engine, 'Refs', [['=Data!A2']]),
      ]);

      const serialize = jest.spyOn(engine, 'getSheetSerialized');

      hot.alter('insert_row_above', 0);

      expect(serialize).not.toHaveBeenCalled();
      expect(sheetsBar().getSheets().length).toBe(3);

      sheetsBar().setActiveSheet('Refs');

      expect(hot.getSourceDataAtCell(0, 0)).toBe('=Data!A3');
    });
  });

  describe('a workbook rebuild', () => {
    it('repaints another grid that reads the fed sheets once, with the new values', () => {
      const engine = buildEngine();
      const otherContainer = document.createElement('div');
      const sheets = values => [
        boundSheet(engine, 'A', [[0]]),
        boundSheet(engine, 'B', [[values[0]]]),
        boundSheet(engine, 'C', [[values[1]]]),
        boundSheet(engine, 'D', [[values[2]]]),
      ];

      document.body.appendChild(otherContainer);
      hot = build(sheets([1, 2, 3]));

      const other = new Handsontable(otherContainer, {
        data: [['=B!A1', '=C!A1', '=D!A1']],
        formulas: { engine, sheetName: 'Other' },
        licenseKey: LICENSE_KEY,
      });
      let renders = 0;

      other.addHook('afterRender', () => {
        renders += 1;
      });
      hot.updateSettings({ sheetsBar: { sheets: sheets([4, 5, 6]) } });

      expect(other.getDataAtRow(0)).toEqual([4, 5, 6]);
      expect(renders).toBe(1);

      other.destroy();
      otherContainer.remove();
    });
    it('repaints each cell once in the build after a build that threw', () => {
      const engine = buildEngine();

      hot = build([boundSheet(engine, 'A', [[0]])]);

      const feed = jest.spyOn(engine, 'setSheetContent');

      feed.mockImplementation((sheetId, content) => {
        if (sheetId === engine.getSheetId('Z')) {
          throw new Error('feed');
        }

        return HyperFormula.prototype.setSheetContent.call(engine, sheetId, content);
      });

      expect(() => hot.updateSettings({
        sheetsBar: {
          sheets: [boundSheet(engine, 'A', [[1]]), boundSheet(engine, 'X', [[7]]), boundSheet(engine, 'Z', [[9]])],
        },
      })).toThrow('feed');

      feed.mockRestore();

      const repaint = jest.spyOn(hot.getPlugin('formulas'), 'renderDependentSheets');

      hot.updateSettings({ sheetsBar: { sheets: [boundSheet(engine, 'A', [[2]]), boundSheet(engine, 'Y', [[8]])] } });

      const repaintedTwice = repaint.mock.calls.filter(([changes]) => {
        const addresses = changes.map(({ address }) => `${address.sheet}:${address.row}:${address.col}`);

        return new Set(addresses).size !== addresses.length;
      });

      expect(repaint).toHaveBeenCalled();
      expect(repaintedTwice).toEqual([]);
    });
  });

  describe('other sheets after a structural change', () => {
    it('brings back a reference an undone row removal turned into #REF!', () => {
      const engine = buildEngine();
      const summary = [['=Data!A5']];

      hot = build([boundSheet(engine, 'Data', [[10], [20], [30], [40], [50]]), boundSheet(engine, 'Summary', summary)]);
      hot.alter('remove_row', 4);

      expect(summary[0][0]).toBe('=#REF!');

      hot.getPlugin('undoRedo').undo();

      expect(summary[0][0]).toBe('=Data!A5');
    });

    it('brings back a reference into the rows a detach moved when the detach is undone', () => {
      const engine = buildEngine();
      const tree = [
        { label: 'p1', value: 1, __children: [{ label: 'c1', value: 2 }, { label: 'c2', value: 3 }] },
        { label: 'p2', value: 4 },
      ];
      const summary = [['=Report!B3']];

      hot = build([
        boundSheet(engine, 'Report', tree, { nestedRows: true, columns: [{ data: 'label' }, { data: 'value' }] }),
        boundSheet(engine, 'Summary', summary),
      ]);
      hot.getPlugin('nestedRows').dataManager.detachFromParent([1, 0, 1, 1]);

      const detached = summary[0][0];

      hot.getPlugin('undoRedo').undo();

      expect(detached).not.toBe('=Report!B3');
      expect(summary[0][0]).toBe('=Report!B3');
    });

    it('keeps the text the host wrote when no reference moved', () => {
      const engine = buildEngine();
      const summary = [['=sum(data!a1:a2)', '=data!a5']];

      hot = build([boundSheet(engine, 'Data', [[10], [20], [30], [40], [50]]), boundSheet(engine, 'Summary', summary)]);
      hot.alter('insert_row_above', 3);

      expect(summary[0]).toEqual(['=sum(data!a1:a2)', '=Data!A6']);
    });

    it('keeps the text the host wrote for a sheet the engine reads only in quotes when no reference moved', () => {
      const engine = buildEngine();
      const summary = [['=sum(\'2026\'!a1:a2)', '=\'2026\'!a5']];

      hot = build([boundSheet(engine, '2026', [[10], [20], [30], [40], [50]]), boundSheet(engine, 'Summary', summary)]);
      hot.alter('insert_row_above', 3);

      expect(summary[0]).toEqual(['=sum(\'2026\'!a1:a2)', '=\'2026\'!A6']);
    });

    it('reads no other sheet when an undone step changed only cells', () => {
      const engine = buildEngine();

      hot = build([boundSheet(engine, 'Data', [[10], [20]]), boundSheet(engine, 'Summary', [['=Data!A1']])]);
      hot.setDataAtCell(0, 0, 11);

      const read = jest.spyOn(engine, 'getCellFormula');

      hot.getPlugin('undoRedo').undo();
      hot.getPlugin('undoRedo').redo();

      expect(read).not.toHaveBeenCalled();
    });
  });

  describe('engine order', () => {
    it('calculates a sheet that declares a row move order on its first visit as a plain grid loading it does', () => {
      const rows = () => [[1, '=A5+1000'], [2, '=A1*10'], [3, '=A2*10'], [4, '=A3*10'], [5, '=A4*10']];
      const plainContainer = document.createElement('div');

      document.body.appendChild(plainContainer);

      const plainEngine = buildEngine();
      const plain = new Handsontable(plainContainer, {
        data: [[0]],
        manualRowMove: [2, 3, 4, 0, 1],
        formulas: { engine: plainEngine, sheetName: 'A' },
        licenseKey: LICENSE_KEY,
      });

      plain.loadData(rows());

      const expected = {
        data: plain.getData(),
        engine: plainEngine.getSheetSerialized(plainEngine.getSheetId('A')),
      };

      plain.destroy();
      plainContainer.remove();

      const engine = buildEngine();

      hot = build([
        boundSheet(engine, 'B', [[9]]),
        boundSheet(engine, 'A', rows(), { manualRowMove: [2, 3, 4, 0, 1] }),
      ]);
      sheetsBar().setActiveSheet('A');

      expect(hot.getData()).toEqual(expected.data);
      expect(engine.getSheetSerialized(engine.getSheetId('A'))).toEqual(expected.engine);
    });

    it('keeps each row reading its own cells when a listener sorts the sheet as it is left', () => {
      const engine = buildEngine();
      let sortOnLeave = true;

      hot = build([
        boundSheet(engine, 'A', [[1, '=A1*10'], [3, '=A2*10'], [2, '=A3*10']], { columnSorting: true }),
        boundSheet(engine, 'B', [[9]]),
      ]);
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
      hot.addHook('afterSheetTabStateCapture', () => {
        if (sortOnLeave) {
          sortOnLeave = false;
          hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
        }
      });
      sheetsBar().setActiveSheet('B');
      sheetsBar().setActiveSheet('A');

      expect(hot.getData().map(([value, formula]) => formula - (value * 10))).toEqual([0, 0, 0]);
    });

    it('brings back a sorted sheet that declares a row move order', () => {
      const engine = buildEngine();

      hot = build([
        boundSheet(engine, 'A', [[1, '=A1*10'], [2, '=A2*10'], [3, '=A3*10']], {
          manualRowMove: [2, 0, 1],
          columnSorting: true,
        }),
        boundSheet(engine, 'B', [[9]]),
      ]);
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

      const sorted = hot.getData();

      sheetsBar().setActiveSheet('B');
      sheetsBar().setActiveSheet('A');

      expect(sorted).toEqual([[3, 30], [2, 20], [1, 10]]);
      expect(hot.getData()).toEqual(sorted);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('engine order, a switch that throws', () => {
    it('keeps each row of a sorted sheet reading its own cells after a return to it threw', () => {
      const engine = buildEngine();
      let fail = false;

      hot = build([
        boundSheet(engine, 'A', [[1, '=A1*10'], [2, '=A2*10'], [3, '=A3*10']], { columnSorting: true }),
        boundSheet(engine, 'B', [[9]]),
      ]);
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      sheetsBar().setActiveSheet('B');
      hot.addHook('afterLoadData', () => {
        if (fail) {
          throw new Error('listener');
        }
      });
      fail = true;

      expect(() => sheetsBar().setActiveSheet('A')).toThrow('listener');

      fail = false;
      sheetsBar().setActiveSheet('B');
      sheetsBar().setActiveSheet('A');

      expect(hot.getData().map(([value, formula]) => formula - (value * 10))).toEqual([0, 0, 0]);
    });
  });

  describe('engine order, a sheet the engine refuses', () => {
    it('leaves the sheet it switched away from alone when the arriving sheet is too large for the engine', () => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable', maxColumns: 2 });

      jest.spyOn(console, 'warn').mockImplementation(() => {});
      hot = build([
        boundSheet(engine, 'A', [[1, '=A1*10'], [2, '=A2*10']]),
        boundSheet(engine, 'B', [[2, 'x', 'y'], [1, 'x', 'y']], { columnSorting: true }),
      ]);
      sheetsBar().setActiveSheet('B');
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });

      expect(engine.getSheetSerialized(engine.getSheetId('A'))).toEqual([[1, '=A1*10'], [2, '=A2*10']]);

      sheetsBar().setActiveSheet('A');
      sheetsBar().setActiveSheet('B');

      expect(engine.getSheetSerialized(engine.getSheetId('A'))).toEqual([[1, '=A1*10'], [2, '=A2*10']]);
    });
  });

  describe('engine order, a load of other data in the switch', () => {
    it('feeds the engine the data a listener loads after the sheet was taken over', () => {
      const engine = buildEngine();

      hot = build([
        boundSheet(engine, 'A', [[1, '=A1*10'], [2, '=A2*10']], { columnSorting: true }),
        boundSheet(engine, 'B', [[9]]),
      ]);
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      sheetsBar().setActiveSheet('B');
      let reloaded = false;

      hot.addHook('afterLoadData', () => {
        if (!reloaded) {
          reloaded = true;
          hot.loadData([[5, '=A1*2'], [6, '=A2*2']]);
        }
      });
      sheetsBar().setActiveSheet('A');

      expect(hot.getData()).toEqual([[6, 12], [5, 10]]);
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
      expect(engine.getSheetSerialized(engine.getSheetId('C'))).toEqual([[1]]);
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

    it('builds an engine again for a sheet that passes the class after one bound to an instance', () => {
      const shared = buildEngine();

      hot = build([
        { name: 'A', data: [[1, '=A1*2']], settings: { formulas: { engine: HyperFormula, sheetName: 'A' } } },
        boundSheet(shared, 'B', [[5, '=A1+1']]),
      ]);
      sheetsBar().setActiveSheet('B');
      sheetsBar().setActiveSheet('A');

      expect(hot.getPlugin('formulas').engine).not.toBe(shared);
      expect(shared.getSheetNames()).toEqual(['B']);
      expect(hot.getDataAtCell(0, 1)).toBe(2);
      expect(errorSpy).not.toHaveBeenCalled();
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
