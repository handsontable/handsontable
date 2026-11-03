import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

describe('SheetsBar#getSheetData()', () => {
  let container;
  let hot;

  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
  });

  afterAll(() => {
    delete Element.prototype.scrollIntoView;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (hot && !hot.isDestroyed) {
      hot.destroy();
    }

    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  /**
   * Builds a grid with the given settings.
   *
   * @param {object} settings The grid settings.
   * @returns {object} The SheetsBar plugin.
   */
  function build(settings) {
    hot = new Handsontable(container, { ...settings, licenseKey: TEST_LICENSE_KEY });

    return hot.getPlugin('sheetsBar');
  }

  /**
   * Returns the id of the sheet with the given name.
   *
   * @param {object} bar The SheetsBar plugin.
   * @param {string} name The sheet's name.
   * @returns {number}
   */
  function idOf(bar, name) {
    return bar.getSheets().find(sheet => sheet.name === name).id;
  }

  it('returns the array the host declared for each sheet, by id and by name', () => {
    const sheets = [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }];
    const bar = build({ sheetsBar: { sheets } });

    expect(bar.getSheetData('A')).toBe(sheets[0].data);
    expect(bar.getSheetData(idOf(bar, 'B'))).toBe(sheets[1].data);
  });

  it('returns the grid\'s data for the first sheet and the plugin\'s own array for an added sheet with `sheetsBar: true`', () => {
    const appData = [['A1', 'B1']];
    const bar = build({ data: appData, sheetsBar: true });
    const added = bar.addSheet('Second', [['s']]);

    expect(bar.getSheetData('Sheet1')).toBe(appData);
    expect(bar.getSheetData(added.id)).toEqual([['s']]);

    bar.setActiveSheet('Second');
    hot.setDataAtCell(0, 0, 'typed');
    bar.setActiveSheet('Sheet1');

    expect(bar.getSheetData('Second')).toEqual([['typed']]);
    expect(bar.getSheetData('Sheet1')).toBe(appData);
  });

  it('returns the array the grid holds for the active sheet after a `loadData()`', () => {
    const sheets = [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }];
    const bar = build({ sheetsBar: { sheets } });
    const loaded = [['new']];

    hot.loadData(loaded);

    expect(bar.getSheetData('A')).toBe(loaded);
    expect(bar.getSheetData('B')).toBe(sheets[1].data);
  });

  it('keeps an edit made on a sheet once the sheet is hidden', () => {
    const sheets = [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }];
    const bar = build({ sheetsBar: { sheets } });

    bar.setActiveSheet('B');
    hot.setDataAtCell(0, 0, 'edited');
    bar.setActiveSheet('A');

    expect(bar.getSheetData('B')).toBe(sheets[1].data);
    expect(sheets[1].data[0][0]).toBe('edited');
  });

  it('returns a sorted sheet\'s rows in their own order, on the sheet and after it is left', () => {
    const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
    const summary = [['=Data!A2', 'b'], ['=Data!A1', 'a']];
    const bar = build({
      sheetsBar: {
        sheets: [
          { name: 'Data', data: [[10], [20]], settings: { formulas: { engine, sheetName: 'Data' } } },
          {
            name: 'Summary',
            data: summary,
            settings: { formulas: { engine, sheetName: 'Summary' }, columnSorting: true },
          },
        ],
      },
    });

    bar.setActiveSheet('Summary');
    hot.getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    expect(bar.getSheetData('Summary')).toBe(summary);
    expect(summary.map(row => row[1])).toEqual(['b', 'a']);

    bar.setActiveSheet('Data');

    expect(bar.getSheetData('Summary')).toBe(summary);
    expect(summary.map(row => row[1])).toEqual(['b', 'a']);
  });

  it('returns each sheet\'s own array while a switch loads the arriving sheet', () => {
    const sheets = [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }];
    const bar = build({ minSpareRows: 1, sheetsBar: { sheets } });
    const seen = [];

    hot.addHook('afterCreateRow', () => {
      seen.push([bar.getSheetData('A'), bar.getSheetData('B')]);
    });
    bar.setActiveSheet('B');

    expect(seen.length).toBeGreaterThan(0);
    seen.forEach(([dataOfA, dataOfB]) => {
      expect(dataOfA).toBe(sheets[0].data);
      expect(dataOfB).toBe(sheets[1].data);
    });
  });

  it('fires no hook and switches nothing', () => {
    const bar = build({ sheetsBar: { sheets: [{ name: 'A', data: [['a']] }, { name: 'B', data: [['b']] }] } });
    const hooks = ['beforeSheetTabChange', 'afterSheetTabChange', 'afterSheetTabStateCapture', 'afterLoadData'];
    const spies = hooks.map((hookName) => {
      const spy = jest.fn();

      hot.addHook(hookName, spy);

      return spy;
    });

    hot.selectCell(0, 0);
    bar.getSheetData('B');
    bar.getSheetData('A');

    spies.forEach(spy => expect(spy).not.toHaveBeenCalled());
    expect(bar.getSheets().find(sheet => sheet.isActive).name).toBe('A');
    expect(hot.getSelected()).toEqual([[0, 0, 0, 0]]);
  });

  it('returns `null` for a sheet that does not exist or a value that names none', () => {
    const bar = build({ sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] } });

    expect(bar.getSheetData(999)).toBeNull();
    expect(bar.getSheetData('Missing')).toBeNull();
    expect(bar.getSheetData(undefined)).toBeNull();
    expect(bar.getSheetData({})).toBeNull();
  });

  it('returns `null` while the bar is off and after the grid is destroyed', () => {
    const bar = build({ sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] } });

    hot.updateSettings({ sheetsBar: false });

    expect(bar.getSheetData('A')).toBeNull();

    hot.updateSettings({ sheetsBar: { sheets: [{ name: 'A', data: [['a']] }] } });
    hot.destroy();

    expect(() => bar.getSheetData('A')).not.toThrow();
    expect(bar.getSheetData('A')).toBeNull();
  });
});
