import Handsontable from '../../../index';
import ExportDataProvider from '../../exportFile/dataProvider';
import BaseType from '../../exportFile/types/_base';
import { loadFixture } from '../../../utils/xlsxEngine/__tests__/helpers/fixtures';

const LICENSE_KEY = 'non-commercial-and-evaluation';

/**
 * Builds a DataProvider configuration whose fetch answers with no rows.
 *
 * @returns {object}
 */
function makeProvider() {
  return {
    rowId: 'id',
    fetchRows: jest.fn(async() => ({ rows: [], totalRows: 0 })),
    onRowsCreate: async() => [],
    onRowsUpdate: async() => {},
    onRowsRemove: async() => {},
  };
}

describe('SheetsBar settings baseline and lifecycle', () => {
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
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  /**
   * Builds a grid with a sheets bar over the given sheets.
   *
   * @param {object[]} sheets The `sheets` setting.
   * @param {object} [settings] Grid-level settings.
   * @returns {object} The SheetsBar plugin.
   */
  function buildWorkbook(sheets, settings = {}) {
    hot = new Handsontable(container, {
      ...settings,
      sheetsBar: { sheets },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  describe('a grid-level value set after the workbook started', () => {
    const sheets = () => [
      { name: 'Plain', data: [['a']] },
      { name: 'Locked', data: [['b']], settings: { readOnly: false } },
    ];

    it('stays in force on a sheet that does not declare it after a round trip', () => {
      const bar = buildWorkbook(sheets());

      bar.setActiveSheet('Locked');
      bar.setActiveSheet('Plain');
      hot.updateSettings({ readOnly: true });
      bar.setActiveSheet('Locked');

      expect(hot.getSettings().readOnly).toBe(false);

      bar.setActiveSheet('Plain');

      expect(hot.getSettings().readOnly).toBe(true);
    });

    it('is what a `sheetsBar: false` teardown gives back to the grid', () => {
      const bar = buildWorkbook(sheets());

      bar.setActiveSheet('Locked');
      bar.setActiveSheet('Plain');
      hot.updateSettings({ readOnly: true });
      hot.updateSettings({ sheetsBar: false });

      expect(hot.getSettings().readOnly).toBe(true);
    });

    it('wins over the active sheet\'s own value when the same payload turns the bar off', () => {
      buildWorkbook([
        { name: 'Locked', data: [['a']], settings: { readOnly: false } },
        { name: 'Plain', data: [['b']] },
      ]);

      hot.updateSettings({ readOnly: true, sheetsBar: false });

      expect(hot.getSettings().readOnly).toBe(true);
    });

    it('is what a rebuild in the same payload starts from', () => {
      buildWorkbook([
        { name: 'Locked', data: [['a']], settings: { readOnly: false } },
        { name: 'Plain', data: [['b']] },
      ]);

      hot.updateSettings({
        readOnly: true,
        sheetsBar: { sheets: [{ name: 'Fresh', data: [['c']] }] },
      });

      expect(hot.getSettings().readOnly).toBe(true);
    });

    it('is not taken from the settings an import writes on the active sheet', async() => {
      const bar = buildWorkbook([
        { name: 'Plain', data: [['a']] },
        { name: 'Fixed', data: [['b']], settings: { colWidths: 120 } },
        { name: 'Other', data: [['c']] },
      ], { importFile: true });

      bar.setActiveSheet('Fixed');
      bar.setActiveSheet('Plain');
      await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', loadFixture('layout'), { importLayout: true });

      expect(Array.isArray(hot.getSettings().colWidths)).toBe(true);

      bar.setActiveSheet('Other');

      expect(hot.getSettings().colWidths).toBeNull();
    });

    it('is taken from the settings a `beforeImport` listener writes', async() => {
      const bar = buildWorkbook(sheets(), { importFile: true });

      bar.setActiveSheet('Locked');
      bar.setActiveSheet('Plain');
      hot.addHook('beforeImport', () => {
        hot.updateSettings({ readOnly: true });
      });
      await hot.getPlugin('importFile').importFromArrayBuffer('xlsx', loadFixture('layout'));
      bar.setActiveSheet('Locked');
      bar.setActiveSheet('Plain');

      expect(hot.getSettings().readOnly).toBe(true);
    });

    it('does not replace the baseline when it is set on a sheet that declares the key', () => {
      const bar = buildWorkbook(sheets());

      bar.setActiveSheet('Locked');
      hot.updateSettings({ readOnly: true });
      bar.setActiveSheet('Plain');

      expect(hot.getSettings().readOnly).toBe(false);
    });
  });

  describe('an unchanged `sheetsBar` value sent again', () => {
    it('keeps the bar\'s elements, so an open rename keeps its input', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];

      buildWorkbook(sheets);

      const barElement = hot.rootWrapperElement.querySelector('.ht-sheets-bar');
      const label = barElement.querySelector('.ht-sheets-bar__tab--active .ht-sheets-bar__tab-label');

      label.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

      const input = barElement.querySelector('input');

      hot.updateSettings({ sheetsBar: { sheets: sheets.map(sheet => ({ ...sheet })) } });

      expect(input).not.toBeNull();
      expect(input.isConnected).toBe(true);
      expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar')).toBe(barElement);
    });

    it('keeps the bar when the same settings arrive with a sheet settings object that refers to itself', () => {
      const cyclic = { label: 'loop' };

      cyclic.self = cyclic;

      const sheets = [{ name: 'Alpha', data: [['a']], settings: { meta: cyclic } }];
      const bar = buildWorkbook(sheets);

      bar.addSheet('Runtime');

      expect(() => hot.updateSettings({ sheetsBar: { sheets } })).not.toThrow();
      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha', 'Runtime']);
    });

    it('rebuilds the bar when the `animation` object is edited in place and sent again', () => {
      const animation = { move: true };
      const sheets = [{ name: 'Alpha', data: [['a']] }];

      hot = new Handsontable(container, { sheetsBar: { sheets, animation }, licenseKey: LICENSE_KEY });

      const strip = () => hot.rootWrapperElement.querySelector('.ht-sheets-bar__tabs');

      expect(strip().style.getPropertyValue('--ht-private-tab-slide-duration')).toBe('');

      animation.move = false;
      hot.updateSettings({ sheetsBar: { sheets, animation } });

      expect(strip().style.getPropertyValue('--ht-private-tab-slide-duration')).toBe('0ms');
    });

    it('still switches when only `activeSheet` changed', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];

      buildWorkbook(sheets);
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });

      expect(hot.getDataAtCell(0, 0)).toBe('b');
    });

    it('rebuilds the bar when a key that shapes it changed', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }];

      buildWorkbook(sheets);

      const barElement = hot.rootWrapperElement.querySelector('.ht-sheets-bar');

      hot.updateSettings({ sheetsBar: { sheets, controls: false } });

      expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar')).not.toBe(barElement);
      expect(hot.rootWrapperElement.querySelector('.ht-sheets-bar__add').closest('[hidden]')).not.toBeNull();
    });
  });

  describe('turning the bar off and on again', () => {
    it('wraps the rows the plain grid shows on `sheetsBar: true`, without loading another sheet', () => {
      const bar = buildWorkbook([{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }]);
      const loads = jest.fn();

      bar.setActiveSheet('Beta');
      hot.updateSettings({ sheetsBar: false });
      hot.addHook('afterLoadData', loads);
      hot.updateSettings({ sheetsBar: true });

      expect(hot.getDataAtCell(0, 0)).toBe('b');
      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Sheet1']);
      expect(loads).not.toHaveBeenCalled();
    });

    it('builds a new workbook once, without rebuilding the old one first', () => {
      const bar = buildWorkbook([{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }]);
      const loads = jest.fn();

      bar.setActiveSheet('Beta');
      hot.updateSettings({ sheetsBar: false });
      hot.addHook('afterLoadData', loads);
      hot.updateSettings({ sheetsBar: { sheets: [{ name: 'Gamma', data: [['c']] }] } });

      expect(hot.getDataAtCell(0, 0)).toBe('c');
      expect(loads).toHaveBeenCalledTimes(1);
    });
  });

  describe('comparing a `sheets` value sent again', () => {
    it('reads an equal fresh `Date` in a sheet\'s settings as unchanged', () => {
      const data = [['a']];
      const bar = buildWorkbook([{ name: 'Alpha', data, settings: { reviewedOn: new Date(2026, 0, 1) } }]);

      bar.addSheet('Runtime');
      hot.updateSettings({
        sheetsBar: { sheets: [{ name: 'Alpha', data, settings: { reviewedOn: new Date(2026, 0, 1) } }] },
      });

      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha', 'Runtime']);
    });

    it('reads two invalid dates as unchanged', () => {
      const data = [['a']];
      const bar = buildWorkbook([{ name: 'Alpha', data, settings: { reviewedOn: new Date('x') } }]);

      bar.addSheet('Runtime');
      hot.updateSettings({ sheetsBar: { sheets: [{ name: 'Alpha', data, settings: { reviewedOn: new Date('y') } }] } });

      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha', 'Runtime']);
    });

    it('reads another `Date` as a new workbook', () => {
      const data = [['a']];
      const bar = buildWorkbook([{ name: 'Alpha', data, settings: { reviewedOn: new Date(2026, 0, 1) } }]);

      bar.addSheet('Runtime');
      hot.updateSettings({
        sheetsBar: { sheets: [{ name: 'Alpha', data, settings: { reviewedOn: new Date(2026, 0, 2) } }] },
      });

      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha']);
    });

    it('reads a `Date` edited in place as a new workbook', () => {
      const reviewedOn = new Date(2026, 0, 1);
      const sheets = [{ name: 'Alpha', data: [['a']], settings: { reviewedOn } }];
      const bar = buildWorkbook(sheets);

      bar.addSheet('Runtime');
      reviewedOn.setFullYear(2027);
      hot.updateSettings({ sheetsBar: { sheets } });

      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha']);
    });

    it('reads a new class instance with the same fields as a new workbook', () => {
      class Engine {
        constructor(level) {
          this.level = level;
        }
      }
      const data = [['a']];
      const bar = buildWorkbook([{ name: 'Alpha', data, settings: { engine: new Engine(1) } }]);

      bar.addSheet('Runtime');
      hot.updateSettings({ sheetsBar: { sheets: [{ name: 'Alpha', data, settings: { engine: new Engine(1) } }] } });

      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha']);
    });

    it('keeps the workbook when the same class instance is sent again', () => {
      class Engine {
        constructor(level) {
          this.level = level;
        }
      }
      const engine = new Engine(1);
      const data = [['a']];
      const bar = buildWorkbook([{ name: 'Alpha', data, settings: { engine } }]);

      bar.addSheet('Runtime');
      hot.updateSettings({ sheetsBar: { sheets: [{ name: 'Alpha', data, settings: { engine } }] } });

      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha', 'Runtime']);
    });

    it('applies the host\'s `sheets` array edited in place', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];

      buildWorkbook(sheets);
      sheets[0].settings = { readOnly: true };
      hot.updateSettings({ sheetsBar: { sheets } });

      expect(hot.getSettings().readOnly).toBe(true);
    });

    it('applies a sheet\'s settings object edited in place', () => {
      const sheets = [{ name: 'Alpha', data: [['a']], settings: { readOnly: false } }, { name: 'Beta', data: [['b']] }];

      buildWorkbook(sheets);
      sheets[0].settings.readOnly = true;
      hot.updateSettings({ sheetsBar: { sheets } });

      expect(hot.getSettings().readOnly).toBe(true);
    });

    it('reads a fresh inline function in a sheet\'s settings as a new workbook', () => {
      const data = [['a']];
      const bar = buildWorkbook([{ name: 'Alpha', data, settings: { cells: () => ({}) } }]);

      bar.addSheet('Runtime');
      hot.updateSettings({ sheetsBar: { sheets: [{ name: 'Alpha', data, settings: { cells: () => ({}) } }] } });

      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha']);
    });

    it('keeps the workbook when the host sends its array again after `removeSheet()` pruned it', () => {
      const sheets = [
        { name: 'Alpha', data: [['a']] },
        { name: 'Beta', data: [['b']] },
        { name: 'Gamma', data: [['c']] },
      ];
      const bar = buildWorkbook(sheets);

      bar.addSheet('Runtime');
      bar.removeSheet(bar.getSheets()[2].id);
      hot.updateSettings({ sheetsBar: { sheets } });

      expect(sheets.map(sheet => sheet.name)).toEqual(['Alpha', 'Beta']);
      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha', 'Beta', 'Runtime']);
    });

    it('keeps the workbook when a host that rebuilds its entries on every render removes a sheet', () => {
      const dataA = [['a']];
      const dataB = [['b']];
      const dataC = [['c']];
      const entries = () => [
        { name: 'Alpha', data: dataA },
        { name: 'Beta', data: dataB },
        { name: 'Gamma', data: dataC },
      ];
      const bar = buildWorkbook(entries());

      bar.addSheet('Runtime');
      hot.updateSettings({ sheetsBar: { sheets: entries() } });
      bar.removeSheet(bar.getSheets()[2].id);
      hot.updateSettings({ sheetsBar: { sheets: entries().slice(0, 2) } });

      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha', 'Beta', 'Runtime']);
    });

    it('keeps the workbook when the same array is sent again unchanged', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }];
      const bar = buildWorkbook(sheets);

      bar.addSheet('Runtime');
      hot.updateSettings({ sheetsBar: { sheets } });

      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Alpha', 'Runtime']);
    });
  });

  describe('a key only some sheets declare, with no grid-level value', () => {
    it('lets AutoColumnSize size the columns of a sheet that declares no `colWidths`', () => {
      const bar = buildWorkbook([
        { name: 'Fixed', data: [['a']], settings: { colWidths: 120 } },
        { name: 'Auto', data: [['b']] },
      ]);

      bar.setActiveSheet('Auto');

      const autoColumnSize = hot.getPlugin('autoColumnSize');

      jest.spyOn(autoColumnSize.columnWidthsMap, 'getValueAtIndex').mockReturnValue(87);

      expect(autoColumnSize.enabled).toBe(true);
      expect(hot._getColWidthFromSettings(0)).toBeUndefined();
      expect(hot.getColWidth(0)).toBe(87);

      bar.setActiveSheet('Fixed');

      expect(hot.getColWidth(0)).toBe(120);
    });

    it('exports the sized width of a sheet that declares no `colWidths`', () => {
      const bar = buildWorkbook([
        { name: 'Fixed', data: [['a']], settings: { colWidths: 120 } },
        { name: 'Auto', data: [['b']] },
      ]);

      bar.setActiveSheet('Auto');
      jest.spyOn(hot.getPlugin('autoColumnSize').columnWidthsMap, 'getValueAtIndex').mockReturnValue(87);

      const exportProvider = new ExportDataProvider(hot);

      exportProvider.setOptions({ ...BaseType.DEFAULT_OPTIONS });

      expect(exportProvider.getColumnsWidths()).toEqual([87]);
    });

    it('lets AutoColumnSize size the columns after a `sheetsBar: false` teardown', () => {
      buildWorkbook([
        { name: 'Fixed', data: [['a']], settings: { colWidths: 120 } },
        { name: 'Auto', data: [['b']] },
      ]);

      hot.updateSettings({ sheetsBar: false });
      jest.spyOn(hot.getPlugin('autoColumnSize').columnWidthsMap, 'getValueAtIndex').mockReturnValue(87);

      expect(hot.getColWidth(0)).toBe(87);
    });

    it('still clears the departing sheet\'s `columns`', () => {
      const bar = buildWorkbook([
        { name: 'Typed', data: [[1]], settings: { columns: [{ type: 'numeric' }] } },
        { name: 'Plain', data: [['b', 'c']] },
      ]);

      bar.setActiveSheet('Plain');

      expect(hot.getCellMeta(0, 0).type).toBe('text');
      expect(hot.countCols()).toBe(2);
    });

    it('binds the row headers the way a sheet\'s own `bindRowsWithHeaders` says on its first visit', () => {
      const bar = buildWorkbook([
        { name: 'Alpha', data: [['a']] },
        { name: 'Strict', data: [['b1'], ['b2']], settings: { bindRowsWithHeaders: 'strict', rowHeaders: true } },
      ]);

      bar.setActiveSheet('Strict');
      hot.alter('insert_row_above', 0);

      expect(hot.getRowHeader(0)).toBe(3);
      expect(hot.getRowHeader(1)).toBe(1);
    });
  });

  describe('a hook only one sheet declares', () => {
    it('does not run on a sheet that does not declare it', () => {
      const afterChange = jest.fn();
      const bar = buildWorkbook([
        { name: 'Hooked', data: [['a']], settings: { afterChange } },
        { name: 'Plain', data: [['b']] },
      ]);

      bar.setActiveSheet('Plain');
      afterChange.mockClear();
      hot.setDataAtCell(0, 0, 'x');

      expect(afterChange).not.toHaveBeenCalled();

      bar.setActiveSheet('Hooked');
      afterChange.mockClear();
      hot.setDataAtCell(0, 0, 'y');

      expect(afterChange).toHaveBeenCalledTimes(1);
    });

    it('does not run after a `sheetsBar: false` teardown', () => {
      const afterChange = jest.fn();

      buildWorkbook([
        { name: 'Hooked', data: [['a']], settings: { afterChange } },
        { name: 'Plain', data: [['b']] },
      ]);
      hot.updateSettings({ sheetsBar: false });
      afterChange.mockClear();
      hot.setDataAtCell(0, 0, 'x');

      expect(afterChange).not.toHaveBeenCalled();
    });

    it('gives a sheet without its own callback the grid-level one back', () => {
      const gridLevel = jest.fn();
      const own = jest.fn();
      const bar = buildWorkbook([
        { name: 'Hooked', data: [['a']], settings: { afterChange: own } },
        { name: 'Plain', data: [['b']] },
      ], { afterChange: gridLevel });

      bar.setActiveSheet('Plain');
      own.mockClear();
      hot.setDataAtCell(0, 0, 'x');

      expect(own).not.toHaveBeenCalled();
      expect(gridLevel).toHaveBeenCalled();
    });
  });

  describe('a hook the grid sets as an array', () => {
    const sheets = own => [
      { name: 'Plain', data: [['a']] },
      { name: 'Hooked', data: [['b']], settings: { afterChange: own } },
    ];

    it('does not run a sheet\'s own callback after a switch away from it', () => {
      const gridLevel = jest.fn();
      const own = jest.fn();
      const bar = buildWorkbook(sheets(own), { afterChange: [gridLevel] });

      bar.setActiveSheet('Hooked');
      bar.setActiveSheet('Plain');
      own.mockClear();
      gridLevel.mockClear();
      hot.setDataAtCell(0, 0, 'x');

      expect(own).not.toHaveBeenCalled();
      expect(gridLevel).toHaveBeenCalledTimes(1);
    });

    it('does not run a sheet\'s own callback after a `sheetsBar: false` teardown', () => {
      const gridLevel = jest.fn();
      const own = jest.fn();
      const bar = buildWorkbook(sheets(own), { afterChange: [gridLevel] });

      bar.setActiveSheet('Hooked');
      hot.updateSettings({ sheetsBar: false });
      own.mockClear();
      gridLevel.mockClear();
      hot.setDataAtCell(0, 0, 'x');

      expect(own).not.toHaveBeenCalled();
      expect(gridLevel).toHaveBeenCalledTimes(1);
    });

    it('does not run a sheet\'s own array after a switch to a sheet with the grid-level function', () => {
      const gridLevel = jest.fn();
      const own = jest.fn();
      const bar = buildWorkbook(sheets([own]), { afterChange: gridLevel });

      bar.setActiveSheet('Hooked');
      bar.setActiveSheet('Plain');
      own.mockClear();
      gridLevel.mockClear();
      hot.setDataAtCell(0, 0, 'x');

      expect(own).not.toHaveBeenCalled();
      expect(gridLevel).toHaveBeenCalledTimes(1);
    });
  });

  describe('a top-level `data` beside a declared workbook', () => {
    it('is ignored when an update sends it, like at init', () => {
      const topLevel = [['top']];
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const bar = buildWorkbook([{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }], {
        data: topLevel,
      });

      hot.updateSettings({ data: topLevel });

      expect(hot.getDataAtCell(0, 0)).toBe('a');

      bar.setActiveSheet('Beta');
      bar.setActiveSheet('Alpha');

      expect(hot.getDataAtCell(0, 0)).toBe('a');
      expect(warnSpy.mock.calls.filter(args => String(args[0]).includes('The `data` setting is ignored')))
        .toHaveLength(1);
    });

    it('loads the rows sent in the same call that turns the bar off', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      buildWorkbook([{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }]);
      hot.updateSettings({ sheetsBar: false, data: [['new']] });

      expect(hot.getDataAtCell(0, 0)).toBe('new');
    });

    it('loads the rows sent in the same call that turns the declared workbook into `sheetsBar: true`', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const bar = buildWorkbook([{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }]);

      hot.updateSettings({ sheetsBar: true, data: [['new']] });

      expect(hot.getDataAtCell(0, 0)).toBe('new');
      expect(bar.getSheets().map(sheet => sheet.name)).toEqual(['Sheet1']);
    });

    it('loads the rows sent in the same call that drops the declared sheets', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      buildWorkbook([{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }]);
      hot.updateSettings({ sheetsBar: { sheets: null }, data: [['new']] });

      expect(hot.getDataAtCell(0, 0)).toBe('new');
    });

    it('still ignores the rows of a call that sends the same declared workbook again', () => {
      const sheets = [{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }];

      jest.spyOn(console, 'warn').mockImplementation(() => {});
      buildWorkbook(sheets);
      hot.updateSettings({ sheetsBar: { sheets }, data: [['new']] });

      expect(hot.getDataAtCell(0, 0)).toBe('a');
    });

    it('still reaches a `sheetsBar: true` workbook, whose only sheet is the grid\'s own data', () => {
      hot = new Handsontable(container, {
        data: [['a']],
        sheetsBar: true,
        licenseKey: LICENSE_KEY,
      });

      hot.updateSettings({ data: [['b']] });

      expect(hot.getDataAtCell(0, 0)).toBe('b');
    });

    it('does not change how a grid-level `dataProvider` set later keeps the shown rows', async() => {
      const provider = makeProvider();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      buildWorkbook([{ name: 'Alpha', data: [['a']] }, { name: 'Beta', data: [['b']] }]);
      hot.updateSettings({ dataProvider: provider });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(hot.getDataAtCell(0, 0)).toBe('a');
      expect(hot.getSettings().dataProvider).toBeNull();
      expect(provider.fetchRows).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('does not change how a server sheet keeps its rows when the grid-level `dataProvider` is sent again', async() => {
      const gridLevel = makeProvider();
      const own = makeProvider();

      jest.spyOn(console, 'warn').mockImplementation(() => {});
      own.fetchRows.mockImplementation(async() => ({ rows: [{ id: 1, name: 'Ann' }], totalRows: 1 }));
      buildWorkbook([
        { name: 'Server', data: [], settings: { dataProvider: own, columns: [{ data: 'name' }] } },
        { name: 'Local', data: [['b']] },
      ], { dataProvider: gridLevel });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(hot.getDataAtCell(0, 0)).toBe('Ann');

      hot.updateSettings({ dataProvider: gridLevel });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(hot.getDataAtCell(0, 0)).toBe('Ann');
      expect(hot.getSettings().dataProvider).toBe(own);
      expect(gridLevel.fetchRows).not.toHaveBeenCalled();
    });
  });

  describe('`dataProvider: null` set on the visible server sheet', () => {
    it('stays that sheet\'s own after a switch away and back', async() => {
      const own = makeProvider();
      const bar = buildWorkbook([
        { name: 'Server', data: [], settings: { dataProvider: own } },
        { name: 'Local', data: [[1]] },
      ]);

      await new Promise(resolve => setTimeout(resolve, 0));
      hot.updateSettings({ dataProvider: null });
      bar.setActiveSheet('Local');
      bar.setActiveSheet('Server');

      expect(hot.getSettings().dataProvider).toBeNull();
      expect(hot.getPlugin('dataProvider').enabled).toBe(false);
    });

    it('is not taken from a wrapper sending `dataProvider: null` again beside `sheetsBar`', async() => {
      const own = makeProvider();
      const sheets = [{ name: 'Server', data: [], settings: { dataProvider: own } }, { name: 'Local', data: [[1]] }];
      const bar = buildWorkbook(sheets);

      await new Promise(resolve => setTimeout(resolve, 0));
      hot.updateSettings({ sheetsBar: { sheets }, dataProvider: null });
      bar.setActiveSheet('Local');
      bar.setActiveSheet('Server');

      expect(hot.getSettings().dataProvider).toBe(own);
    });

    it('leaves the declared settings object alone', async() => {
      const own = makeProvider();
      const declared = { dataProvider: own };

      buildWorkbook([{ name: 'Server', data: [], settings: declared }, { name: 'Local', data: [[1]] }]);
      await new Promise(resolve => setTimeout(resolve, 0));
      hot.updateSettings({ dataProvider: null });

      expect(declared.dataProvider).toBe(own);
    });
  });
});
