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
    it('opens the `sheetName` sheet, first in tab order', () => {
      const engine = buildEngine();

      hot = build({ formulas: { engine, sheetName: 'Summary' } });

      expect(tabNames()).toEqual(['Summary', 'Data', 'Report']);
      expect(activeName()).toBe('Summary');
      expect(hot.getDataAtCell(0, 0)).toBe(20);
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
    });

    it('opens the `activeSheet` sheet by its engine position, first in tab order', () => {
      const engine = buildEngine();

      hot = build({ formulas: { engine }, sheetsBar: { activeSheet: 1 } });

      expect(tabNames()).toEqual(['Report', 'Data', 'Summary']);
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

      hot = build({ data: [[5, 5], [5, 5]], formulas: { engine, sheetName: 'Data' } });

      expect(tabNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary']);
      expect(engine.getSheetSerialized(engine.getSheetId('Data'))).toEqual([[5, 5], [5, 5]]);

      sheetsBar().setActiveSheet(idOf('Report'));

      expect(hot.getDataAtCell(0, 0)).toBe(20);
    });

    it('creates a missing `sheetName` sheet for the data tab', () => {
      const engine = buildEngine();

      hot = build({ data: [[7]], formulas: { engine, sheetName: 'New' } });

      expect(tabNames()).toEqual(['New', 'Data', 'Report', 'Summary']);
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary', 'New']);
      expect(engine.getSheetSerialized(engine.getSheetId('New'))).toEqual([[7]]);
    });

    it('names the data tab and its new engine sheet alike without a `sheetName`', () => {
      const engine = buildEngine();
      const data = [[7]];

      hot = build({ data, formulas: { engine } });

      expect(tabNames()).toEqual(['Sheet1', 'Data', 'Report', 'Summary']);
      expect(engine.getSheetNames()).toEqual(['Data', 'Report', 'Summary', 'Sheet1']);
      expect(hot.getPlugin('formulas').sheetName).toBe('Sheet1');
      expect(sheetsBar().getSheetData(idOf('Sheet1'))).toBe(data);
    });

    it('numbers the data tab name when the engine already holds it', () => {
      const engine = buildEngine({ Sheet1: [[1]] });

      hot = build({ data: [[7]], formulas: { engine } });

      expect(tabNames()).toEqual(['Sheet1 (2)', 'Sheet1']);
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
});
