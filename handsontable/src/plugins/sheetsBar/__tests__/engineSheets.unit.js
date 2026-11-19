import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

/**
 * Builds an engine holding the given sheets.
 *
 * @param {object} sheets The sheets, by name.
 * @returns {HyperFormula}
 */
function buildEngine(sheets = {
  Data: [[1, 2], [3, 4]],
  Report: [['=SUM(Data!A1:B2)']],
  Summary: [['=Report!A1*2']],
}) {
  return HyperFormula.buildFromSheets(sheets, { licenseKey: 'internal-use-in-handsontable' });
}

describe('SheetsBar tabs from a formula engine', () => {
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
    jest.restoreAllMocks();
  });

  const build = settings => new Handsontable(container, {
    sheetsBar: true,
    licenseKey: TEST_LICENSE_KEY,
    ...settings,
  });
  const sheetsBar = () => hot.getPlugin('sheetsBar');
  const tabNames = () => sheetsBar().getSheets().map(sheet => sheet.name);
  const idOf = name => sheetsBar().getSheets().find(sheet => sheet.name === name).id;
  const activeName = () => sheetsBar().getSheets().find(sheet => sheet.isActive).name;

  it('shows one tab per engine sheet, in the engine order, and opens the first one', () => {
    const engine = buildEngine();

    hot = build({ formulas: { engine } });

    expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
    expect(activeName()).toBe('Data');
    expect(hot.getData()).toEqual([[1, 2], [3, 4]]);
  });

  it('leaves the engine with its own sheets only when no data is given', () => {
    const engine = buildEngine();

    hot = build({ formulas: { engine } });

    expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
    expect(engine.getSheetSerialized(engine.getSheetId('Data'))).toEqual([[1, 2], [3, 4]]);
  });

  it('writes no engine sheet but the opening one while the workbook is built', () => {
    const engine = buildEngine();
    const setSheetContent = jest.spyOn(engine, 'setSheetContent');
    const addSheet = jest.spyOn(engine, 'addSheet');

    hot = build({ formulas: { engine } });

    const writtenSheets = setSheetContent.mock.calls.map(([sheetId]) => engine.getSheetName(sheetId));

    expect(addSheet).not.toHaveBeenCalled();
    expect(writtenSheets.filter(name => name !== 'Data')).toEqual([]);
  });

  it('keeps formulas as text in the tab data and shows their values', () => {
    const engine = buildEngine();

    hot = build({ formulas: { engine } });

    expect(sheetsBar().getSheetData(idOf('Report'))).toEqual([['=SUM(Data!A1:B2)']]);

    sheetsBar().setActiveSheet(idOf('Report'));

    expect(hot.getDataAtCell(0, 0)).toBe(10);
    expect(hot.getSourceDataAtCell(0, 0)).toBe('=SUM(Data!A1:B2)');
  });

  it('pads uneven engine rows to the widest row', () => {
    const engine = buildEngine({ Data: [[1], [1, 2, 3]] });

    hot = build({ formulas: { engine } });

    expect(sheetsBar().getSheetData(idOf('Data'))).toEqual([[1, null, null], [1, 2, 3]]);
    expect(hot.countCols()).toBe(3);
  });

  it('gives an empty engine sheet the blank data of a new sheet', () => {
    const engine = buildEngine({ Data: [[1]], Empty: [] });

    hot = build({ formulas: { engine } });

    const blank = sheetsBar().getSheetData(idOf('Empty'));

    expect(blank.length).toBeGreaterThan(0);
    expect(blank.flat().every(cell => cell === null)).toBe(true);

    sheetsBar().setActiveSheet(idOf('Empty'));

    expect(hot.getDataAtCell(0, 0)).toBeNull();
    expect(engine.getSheetNames()).toEqual(['Data', 'Empty']);
  });

  it('calculates cross-sheet formulas right after switching tabs', () => {
    const engine = buildEngine();

    hot = build({ formulas: { engine } });
    hot.setDataAtCell(0, 0, 100);
    sheetsBar().setActiveSheet(idOf('Summary'));

    expect(hot.getDataAtCell(0, 0)).toBe(218);

    sheetsBar().setActiveSheet(idOf('Report'));

    expect(hot.getDataAtCell(0, 0)).toBe(109);
  });

  describe('opening tab without data', () => {
    it('opens the `sheetName` sheet in its engine position', () => {
      const engine = buildEngine();

      hot = build({ formulas: { engine, sheetName: 'Summary' } });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(activeName()).toBe('Summary');
      expect(hot.getDataAtCell(0, 0)).toBe(20);
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
    });

    it('opens the `activeSheet` sheet by its engine position', () => {
      const engine = buildEngine();

      hot = build({ formulas: { engine }, sheetsBar: { activeSheet: 1 } });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(activeName()).toBe('Report');
      expect(hot.getDataAtCell(0, 0)).toBe(10);
    });

    it('warns and opens the first sheet, without adding an engine sheet, for a missing `sheetName`', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const engine = buildEngine();

      hot = build({ formulas: { engine, sheetName: 'Missing' } });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(activeName()).toBe('Data');
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(warnSpy.mock.calls.filter(([message]) => String(message).includes('"Missing"'))).toHaveLength(1);
    });
  });

  describe('with grid data', () => {
    it('replaces the content of an existing `sheetName` sheet and does not list it twice', () => {
      const engine = buildEngine();

      hot = build({ data: [[5, 5], [5, 5]], formulas: { engine, sheetName: 'Report' } });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(activeName()).toBe('Report');
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(engine.getSheetSerialized(engine.getSheetId('Report'))).toEqual([[5, 5], [5, 5]]);

      sheetsBar().setActiveSheet(idOf('Summary'));

      expect(hot.getDataAtCell(0, 0)).toBe(10);
    });

    it('replaces the content of the first engine sheet when `sheetName` names it', () => {
      const engine = buildEngine();

      hot = build({ data: [[5, 5], [5, 5]], formulas: { engine, sheetName: 'Data' } });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(activeName()).toBe('Data');
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(engine.getSheetSerialized(engine.getSheetId('Data'))).toEqual([[5, 5], [5, 5]]);

      sheetsBar().setActiveSheet(idOf('Report'));

      expect(hot.getDataAtCell(0, 0)).toBe(20);
    });

    it('creates a missing `sheetName` sheet for the data tab', () => {
      const engine = buildEngine();

      hot = build({ data: [[7]], formulas: { engine, sheetName: 'New' } });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary', 'New']);
      expect(activeName()).toBe('New');
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary', 'New']);
      expect(engine.getSheetSerialized(engine.getSheetId('New'))).toEqual([[7]]);
    });

    it('names the data tab and its new engine sheet alike without a `sheetName`', () => {
      const engine = buildEngine();
      const data = [[7]];

      hot = build({ data, formulas: { engine } });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary', 'Sheet1']);
      expect(activeName()).toBe('Sheet1');
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary', 'Sheet1']);
      expect(hot.getPlugin('formulas').sheetName).toBe('Sheet1');
      expect(sheetsBar().getSheetData(idOf('Sheet1'))).toBe(data);
    });

    it('puts new grid data into the data tab, not into the first tab', () => {
      const engine = buildEngine();

      hot = build({ data: [[7]], formulas: { engine } });
      sheetsBar().setActiveSheet(idOf('Data'));

      const nextData = [[8]];

      hot.updateSettings({ data: nextData });

      expect(hot.getData()).toEqual([[1, 2], [3, 4]]);
      expect(sheetsBar().getSheetData(idOf('Sheet1'))).toBe(nextData);
    });

    it('numbers the data tab name when the engine already holds it', () => {
      const engine = buildEngine({ Sheet1: [[1]] });

      hot = build({ data: [[7]], formulas: { engine } });

      expect(tabNames()).toEqual(['Sheet1', 'Sheet1 (2)']);
      expect(activeName()).toBe('Sheet1 (2)');
      expect(engine.getSheetNames()).toEqual(['Sheet1', 'Sheet1 (2)']);
    });
  });

  it('keeps today\'s behavior when `sheets` is set', () => {
    const engine = buildEngine();

    hot = build({
      formulas: { engine },
      sheetsBar: { sheets: [{ name: 'Only', data: [[1]], settings: { formulas: { engine, sheetName: 'Data' } } }] },
    });

    expect(tabNames()).toEqual(['Only']);
  });

  it('keeps today\'s behavior for the HyperFormula class', () => {
    hot = build({ data: [[1]], formulas: { engine: HyperFormula } });

    expect(tabNames()).toEqual(['Sheet1']);
  });

  it('keeps today\'s behavior for an engine without sheets', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });

    hot = build({ data: [[1]], formulas: { engine } });

    expect(tabNames()).toEqual(['Sheet1']);
  });

  it('keeps the workbook through an update with the same engine and settings', () => {
    const engine = buildEngine();
    const settings = { formulas: { engine }, sheetsBar: true };

    hot = build(settings);
    sheetsBar().renameSheet(idOf('Report'), 'Totals');

    const getSheetNames = jest.spyOn(engine, 'getSheetNames');

    hot.updateSettings({ ...settings });

    expect(tabNames()).toEqual(['Data', 'Totals', 'Summary']);
    expect(getSheetNames).not.toHaveBeenCalled();
  });

  it('does not follow engine sheets added after init', () => {
    const engine = buildEngine();

    hot = build({ formulas: { engine } });
    engine.addSheet('Later');
    hot.updateSettings({ sheetsBar: true });

    expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
  });

  it('removes the engine sheet with its tab', () => {
    const engine = buildEngine();

    hot = build({ formulas: { engine } });
    sheetsBar().removeSheet(idOf('Summary'));

    expect(engine.getSheetNames()).toEqual(['Data', 'Report']);
  });

  it('keeps the active sheet rows bound to its engine sheet after `sheetsBar: false`', () => {
    const engine = buildEngine();

    hot = build({ formulas: { engine } });
    sheetsBar().setActiveSheet(idOf('Report'));
    hot.updateSettings({ sheetsBar: false });

    expect(hot.getDataAtCell(0, 0)).toBe(10);
    expect(hot.getPlugin('formulas').sheetName).toBe('Report');
    expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
  });

  describe('on an engine another grid is bound to', () => {
    let otherContainer;
    let otherHot;

    beforeEach(() => {
      otherContainer = document.createElement('div');
      document.body.appendChild(otherContainer);
    });

    afterEach(() => {
      otherHot?.destroy();
      otherHot = null;
      otherContainer.remove();
    });

    it('lists, edits, and removes none of the other grid\'s engine sheet', () => {
      const engine = buildEngine({
        Data: [[1, 2], [3, 4]],
        Rates: [[7]],
        Report: [['=SUM(Data!A1:B2)']],
      });

      otherHot = new Handsontable(otherContainer, {
        data: [[7]],
        formulas: { engine, sheetName: 'Rates' },
        licenseKey: TEST_LICENSE_KEY,
      });
      hot = build({ formulas: { engine } });

      expect(tabNames()).toEqual(['Data', 'Report']);

      sheetsBar().renameSheet(idOf('Report'), 'Rates');
      sheetsBar().addSheet();
      sheetsBar().removeSheet(idOf('Data'));

      expect(tabNames()).toHaveLength(2);
      expect(tabNames()[0]).toBe('Report');
      expect(engine.getSheetNames()).toEqual(['Rates', 'Report', tabNames()[1]]);
      expect(engine.getSheetSerialized(engine.getSheetId('Rates'))).toEqual([[7]]);
      expect(otherHot.getPlugin('formulas').sheetName).toBe('Rates');
      expect(otherHot.getData()).toEqual([[7]]);
    });

    it('warns once and opens the first tab for a `sheetName` the other grid is bound to, without data', () => {
      const engine = buildEngine({
        Data: [[1, 2], [3, 4]],
        Rates: [[7]],
        Report: [['=SUM(Data!A1:B2)']],
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      otherHot = new Handsontable(otherContainer, {
        data: [[7]],
        formulas: { engine, sheetName: 'Rates' },
        licenseKey: TEST_LICENSE_KEY,
      });
      hot = build({ formulas: { engine, sheetName: 'Rates' } });

      const warnings = warnSpy.mock.calls.map(call => String(call[0])).filter(text => text.includes('Rates'));

      expect(tabNames()).toEqual(['Data', 'Report']);
      expect(activeName()).toBe('Data');
      expect(hot.getData()).toEqual([[1, 2], [3, 4]]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('another grid');
      expect(warnings[0]).not.toContain('no sheet named');
      expect(engine.getSheetNames()).toEqual(['Data', 'Rates', 'Report']);
    });

    it('warns about a `sheetName` the other grid is bound to when every engine sheet belongs to it', () => {
      const engine = buildEngine({
        Rates: [[7]],
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      otherHot = new Handsontable(otherContainer, {
        data: [[7]],
        formulas: { engine, sheetName: 'Rates' },
        licenseKey: TEST_LICENSE_KEY,
      });
      hot = build({ formulas: { engine, sheetName: 'Rates' } });

      const warnings = warnSpy.mock.calls.map(call => String(call[0])).filter(text => text.includes('Rates'));

      expect(tabNames()).toHaveLength(1);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('another grid');
      expect(warnings[0]).toContain('builds no tabs from the engine');
    });

    it('binds no tab to a `sheetName` the other grid is bound to, with data, so no removal reaches it', () => {
      const engine = buildEngine({
        Data: [[1, 2], [3, 4]],
        Rates: [[7]],
        Report: [['=SUM(Data!A1:B2)']],
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      otherHot = new Handsontable(otherContainer, {
        data: [[7]],
        formulas: { engine, sheetName: 'Rates' },
        licenseKey: TEST_LICENSE_KEY,
      });
      hot = build({ data: [[9]], formulas: { engine, sheetName: 'Rates' } });

      const warnings = warnSpy.mock.calls.map(call => String(call[0])).filter(text => text.includes('Rates'));

      expect(tabNames()).toEqual(['Data', 'Report']);
      expect(activeName()).toBe('Data');
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('another grid');

      sheetsBar().removeSheet(idOf('Report'));

      expect(engine.getSheetNames()).toEqual(['Data', 'Rates']);
      expect(engine.getSheetSerialized(engine.getSheetId('Rates'))).toEqual([[7]]);
      expect(otherHot.getData()).toEqual([[7]]);
    });

    it('ignores later grid data whose `sheetName` the other grid is bound to, with one accurate warning', () => {
      const engine = buildEngine({
        Data: [[1, 2], [3, 4]],
        Rates: [[7]],
        Report: [['=SUM(Data!A1:B2)']],
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      otherHot = new Handsontable(otherContainer, {
        data: [[7]],
        formulas: { engine, sheetName: 'Rates' },
        licenseKey: TEST_LICENSE_KEY,
      });
      hot = build({ data: [[9]], formulas: { engine, sheetName: 'Rates' } });
      hot.updateSettings({ data: [['NEW']] });

      const warnings = warnSpy.mock.calls.map(call => String(call[0]));

      expect(engine.getSheetNames()).toEqual(['Data', 'Rates', 'Report']);
      expect(engine.getSheetSerialized(engine.getSheetId('Data'))).toEqual([[1, 2], [3, 4]]);
      expect(engine.getSheetSerialized(engine.getSheetId('Rates'))).toEqual([[7]]);
      expect(engine.getSheetSerialized(engine.getSheetId('Report'))).toEqual([['=SUM(Data!A1:B2)']]);
      expect(otherHot.getData()).toEqual([[7]]);
      expect(hot.getData()).toEqual([[1, 2], [3, 4]]);
      expect(tabNames()).toEqual(['Data', 'Report']);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('another grid');
      expect(warnings[0]).toContain('`data`');
      expect(warnings[0]).not.toContain('was removed');
    });

    it('lists none of a sheet two grids are bound to when the bar is enabled on the later grid', () => {
      const engine = buildEngine({
        Data: [[1, 2], [3, 4]],
        Rates: [[7]],
      });

      jest.spyOn(console, 'warn').mockImplementation(() => {});
      otherHot = new Handsontable(otherContainer, {
        data: [[7]],
        formulas: { engine, sheetName: 'Rates' },
        licenseKey: TEST_LICENSE_KEY,
      });
      hot = new Handsontable(container, {
        data: [[7]],
        formulas: { engine, sheetName: 'Rates' },
        licenseKey: TEST_LICENSE_KEY,
      });
      hot.updateSettings({ sheetsBar: true });

      expect(tabNames()).not.toContain('Rates');
      expect(engine.getSheetNames()).toContain('Rates');
    });
  });

  describe('enabled on a live grid', () => {
    it('makes the engine sheet the grid\'s data is in the open data tab, adding no engine sheet', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, {
        data: [[7]],
        formulas: { engine },
        licenseKey: TEST_LICENSE_KEY,
      });

      const namesAfterInit = engine.getSheetNames();

      hot.updateSettings({ sheetsBar: true });

      expect(namesAfterInit).toHaveLength(4);
      expect(tabNames()).toEqual(namesAfterInit);
      expect(activeName()).toBe(namesAfterInit[3]);
      expect(hot.getData()).toEqual([[7]]);
      expect(engine.getSheetNames()).toEqual(namesAfterInit);
    });

    it('shows the empty engine sheet a grid without data added as one tab, adding no engine sheet', () => {
      const engine = buildEngine();

      hot = new Handsontable(container, {
        formulas: { engine },
        licenseKey: TEST_LICENSE_KEY,
      });

      const namesAfterInit = engine.getSheetNames();

      hot.updateSettings({ sheetsBar: true });

      expect(namesAfterInit).toHaveLength(4);
      expect(tabNames()).toEqual(namesAfterInit);
      expect(activeName()).toBe(namesAfterInit[3]);
      expect(engine.getSheetNames()).toEqual(namesAfterInit);
    });

    it('builds the same tabs again after `sheetsBar: false` and `true`, opening the sheet the grid kept', () => {
      const engine = buildEngine();

      hot = build({ formulas: { engine } });
      hot.updateSettings({ sheetsBar: false });
      hot.updateSettings({ sheetsBar: true });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(activeName()).toBe('Data');
      expect(hot.getData()).toEqual([[1, 2], [3, 4]]);
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
    });

    it('opens the sheet the grid kept after `sheetsBar: false` and `true`, wherever it sits', () => {
      const engine = buildEngine();

      hot = build({ formulas: { engine } });
      sheetsBar().setActiveSheet(idOf('Report'));
      hot.updateSettings({ sheetsBar: false });
      hot.updateSettings({ sheetsBar: true });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(activeName()).toBe('Report');
      expect(hot.getDataAtCell(0, 0)).toBe(10);
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
    });

    it('keeps new grid data in the data tab after `sheetsBar: false` and `true` on another tab', () => {
      const engine = buildEngine();

      hot = build({ data: [[5, 6]], formulas: { engine } });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary', 'Sheet1']);

      sheetsBar().setActiveSheet(idOf('Report'));
      hot.updateSettings({ sheetsBar: false });
      hot.updateSettings({ sheetsBar: true });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary', 'Sheet1']);
      expect(activeName()).toBe('Report');

      hot.updateSettings({ data: [['NEW']] });

      expect(activeName()).toBe('Report');
      expect(hot.getDataAtCell(0, 0)).toBe(10);
      expect(engine.getSheetSerialized(engine.getSheetId('Report'))).toEqual([['=SUM(Data!A1:B2)']]);
      expect(engine.getSheetSerialized(engine.getSheetId('Sheet1'))).toEqual([['NEW']]);
      expect(tabNames()).toEqual(['Data', 'Report', 'Summary', 'Sheet1']);
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary', 'Sheet1']);

      sheetsBar().setActiveSheet(idOf('Sheet1'));

      expect(hot.getData()).toEqual([['NEW']]);
    });

    it('keeps new grid data in the first data tab after `sheetsBar: false` and `true` without data', () => {
      const engine = buildEngine();

      hot = build({ formulas: { engine } });
      sheetsBar().setActiveSheet(idOf('Report'));
      hot.updateSettings({ sheetsBar: false });
      hot.updateSettings({ sheetsBar: true });

      expect(activeName()).toBe('Report');

      sheetsBar().setActiveSheet(idOf('Data'));
      hot.updateSettings({ data: [[8, 9]] });

      expect(activeName()).toBe('Data');
      expect(hot.getData()).toEqual([[8, 9]]);
      expect(engine.getSheetSerialized(engine.getSheetId('Data'))).toEqual([[8, 9]]);
      expect(engine.getSheetSerialized(engine.getSheetId('Report'))).toEqual([['=SUM(Data!A1:B2)']]);
      expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
    });

    it('keeps the grid data array in the data tab after `sheetsBar: false` and `true` on that tab', () => {
      const engine = buildEngine();
      const data = [[5, 6]];

      hot = build({ data, formulas: { engine } });
      hot.updateSettings({ sheetsBar: false });
      hot.updateSettings({ sheetsBar: true });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary', 'Sheet1']);
      expect(activeName()).toBe('Sheet1');
      expect(sheetsBar().getSheetData(idOf('Sheet1'))).toBe(data);
    });
  });

  it('warns about an engine sheet whose name the tab cannot keep', () => {
    const longName = 'A'.repeat(60);
    const engine = buildEngine({ Data: [[1]], [longName]: [[2]] });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    hot = build({ formulas: { engine } });

    const warnings = warnSpy.mock.calls.map(call => String(call[0])).filter(text => text.includes(longName));

    expect(tabNames()).toEqual(['Data', 'A'.repeat(50)]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('renaming the tab does not rename the engine sheet');
  });
});
