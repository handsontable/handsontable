import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('SheetsBar: the `sheets` array works like `data`', () => {
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
   * @param {object} [barSettings] More `sheetsBar` options.
   * @returns {object} The SheetsBar plugin.
   */
  function buildWorkbook(sheets, barSettings = {}) {
    hot = new Handsontable(container, {
      sheetsBar: { sheets, ...barSettings },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  /**
   * Returns the id of the sheet with the given name.
   *
   * @param {object} plugin The SheetsBar plugin.
   * @param {string} name The sheet name.
   * @returns {number}
   */
  function idOf(plugin, name) {
    return plugin.getSheets().find(sheet => sheet.name === name).id;
  }

  /**
   * Returns the name of the active sheet.
   *
   * @param {object} plugin The SheetsBar plugin.
   * @returns {string}
   */
  function activeName(plugin) {
    return plugin.getSheets().find(sheet => sheet.isActive).name;
  }

  describe('writes into the app\'s array', () => {
    it('writes a rename into the entry', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }];
      const entry = sheets[0];
      const plugin = buildWorkbook(sheets);

      plugin.renameSheet(idOf(plugin, 'A'), 'Renamed');

      expect(sheets[0]).toBe(entry);
      expect(entry.name).toBe('Renamed');
    });

    it('pushes an added sheet to the end of the array, with the rows it shows', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }];
      const plugin = buildWorkbook(sheets);
      const added = plugin.addSheet('New');

      plugin.setActiveSheet(added.id);
      hot.setDataAtCell(0, 0, 'typed');

      expect(sheets.length).toBe(3);
      expect(sheets[2].name).toBe('New');
      expect(sheets[2].data[0][0]).toBe('typed');
    });

    it('pushes a duplicate to the end of the array, while its tab sits next to the original', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }];
      const plugin = buildWorkbook(sheets);
      const copy = plugin.duplicateSheet(idOf(plugin, 'A'));

      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', copy.name, 'B']);
      expect(sheets.map(entry => entry.name)).toEqual(['A', 'B', copy.name]);
      expect(sheets[2].data).not.toBe(sheets[0].data);
      expect(sheets[2].data).toEqual([[1]]);
    });

    it('splices a removed sheet out of the array', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets);

      plugin.removeSheet(idOf(plugin, 'B'));

      expect(sheets.map(entry => entry.name)).toEqual(['A', 'C']);
    });

    it('keeps the array in its own order when a tab moves', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }];
      const plugin = buildWorkbook(sheets);

      plugin.moveSheetToIndex(idOf(plugin, 'A'), 1);

      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['B', 'A']);
      expect(sheets.map(entry => entry.name)).toEqual(['A', 'B']);
    });

    it('throws on a frozen array, as a frozen `data` array does', () => {
      const sheets = Object.freeze([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const plugin = buildWorkbook(sheets);

      expect(() => plugin.addSheet('New')).toThrow(TypeError);
    });
  });

  describe('a re-sent `sheets`', () => {
    it('keeps the workbook when the same array comes back after the bar wrote into it', () => {
      const sheets = [{ name: 'A', data: [[1, 2]] }, { name: 'B', data: [[3, 4]] }];
      const plugin = buildWorkbook(sheets);

      plugin.addSheet('Extra');
      plugin.renameSheet(idOf(plugin, 'A'), 'A2');
      hot.selectCell(0, 1);
      hot.updateSettings({ sheetsBar: { sheets } });

      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A2', 'B', 'Extra']);
      expect(hot.getSelectedLast()).toEqual([0, 1, 0, 1]);
    });

    it('keeps the workbook when a new array holds the same entries', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }];
      const plugin = buildWorkbook(sheets);

      plugin.addSheet('Extra');
      plugin.renameSheet(idOf(plugin, 'A'), 'A2');
      hot.updateSettings({ sheetsBar: { sheets: [...sheets] } });

      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A2', 'B', 'Extra']);
    });

    it('does not watch the app\'s own edits of the same array', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }];
      const plugin = buildWorkbook(sheets);

      sheets.push({ name: 'Pushed', data: [[3]] });
      hot.updateSettings({ sheetsBar: { sheets } });

      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
    });

    it('rebuilds the workbook from an array that declares other sheets', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);

      hot.updateSettings({ sheetsBar: { sheets: [{ name: 'Other', data: [[9]] }] } });

      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['Other']);
    });
  });

  describe('`activeSheet` is a position in the app\'s array', () => {
    it('opens the sheet at that position', () => {
      const plugin = buildWorkbook(
        [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }],
        { activeSheet: 2 },
      );

      expect(activeName(plugin)).toBe('C');
    });

    it('switches to the sheet at that position after its tab moved', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets, { activeSheet: 1 });

      plugin.moveSheetToIndex(idOf(plugin, 'A'), 2);
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 0 } });

      expect(activeName(plugin)).toBe('A');
    });

    it('settles when an `afterSheetTabChange` listener sends the position of the sheet just shown', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets, { activeSheet: 1 });
      let changes = 0;

      plugin.moveSheetToIndex(idOf(plugin, 'A'), 2);
      hot.addHook('afterSheetTabChange', (oldId, newId) => {
        changes += 1;

        if (changes > 10) {
          return;
        }

        const name = plugin.getSheets().find(sheet => sheet.id === newId).name;

        hot.updateSettings({ sheetsBar: { sheets, activeSheet: sheets.findIndex(entry => entry.name === name) } });
      });
      plugin.setActiveSheet('A');

      expect(changes).toBe(1);
      expect(activeName(plugin)).toBe('A');
    });

    it('shifts the stored value when a sheet in front of it is removed', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets, { activeSheet: 2 });

      plugin.removeSheet(idOf(plugin, 'A'));

      expect(plugin.getSetting('activeSheet')).toBe(1);
      expect(activeName(plugin)).toBe('C');
    });

    it('follows the neighbor that becomes active when the sheet it names is removed', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets, { activeSheet: 1 });

      plugin.removeSheet(idOf(plugin, 'B'));

      expect(activeName(plugin)).toBe('C');
      expect(plugin.getSetting('activeSheet')).toBe(1);
    });

    it('leaves the stored value alone when a sheet after it is removed', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets, { activeSheet: 0 });

      plugin.removeSheet(idOf(plugin, 'C'));

      expect(plugin.getSetting('activeSheet')).toBe(0);
    });

    it('does not switch when the adjusted value is sent again', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets, { activeSheet: 2 });
      const listener = jest.fn();

      plugin.removeSheet(idOf(plugin, 'A'));
      hot.addHook('afterSheetTabChange', listener);
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });

      expect(listener).not.toHaveBeenCalled();
      expect(activeName(plugin)).toBe('C');
    });

    it('leaves the app\'s own `sheetsBar` object alone', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const barSettings = { sheets, activeSheet: 2 };

      hot = new Handsontable(container, { sheetsBar: barSettings, licenseKey: LICENSE_KEY });
      hot.getPlugin('sheetsBar').removeSheet(idOf(hot.getPlugin('sheetsBar'), 'A'));

      expect(barSettings.activeSheet).toBe(2);
    });
  });

  describe('updateSheetSettings()', () => {
    it('applies the settings to the visible sheet at once', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);

      expect(plugin.updateSheetSettings('A', { colHeaders: ['X'] })).toBe(true);
      expect(hot.getColHeader(0)).toBe('X');
    });

    it('applies the settings to another sheet on its next visit, and keeps them there', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);

      plugin.updateSheetSettings('B', { readOnly: true });

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);

      plugin.setActiveSheet('B');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(true);

      plugin.setActiveSheet('A');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
    });

    it('merges the keys into the sheet\'s own settings', () => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1]], settings: { colHeaders: ['X'] } },
        { name: 'B', data: [[2]] },
      ]);

      plugin.updateSheetSettings('A', { readOnly: true });

      expect(hot.getColHeader(0)).toBe('X');
      expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
    });

    it('leaves the app\'s entry settings as declared', () => {
      const declared = { colHeaders: ['X'] };
      const sheets = [{ name: 'A', data: [[1]], settings: declared }, { name: 'B', data: [[2]] }];
      const plugin = buildWorkbook(sheets);

      plugin.updateSheetSettings('A', { readOnly: true });

      expect(sheets[0].settings).toBe(declared);
      expect(declared).toEqual({ colHeaders: ['X'] });
    });

    it('takes a sheet id too', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);

      expect(plugin.updateSheetSettings(idOf(plugin, 'A'), { colHeaders: ['X'] })).toBe(true);
      expect(hot.getColHeader(0)).toBe('X');
    });

    it('returns `false` for an unknown sheet', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }]);

      expect(plugin.updateSheetSettings('Nope', { readOnly: true })).toBe(false);
    });

    it('returns `false` while the bar is off', () => {
      hot = new Handsontable(container, { data: [[1]], licenseKey: LICENSE_KEY });

      expect(hot.getPlugin('sheetsBar').updateSheetSettings('Sheet 1', { readOnly: true })).toBe(false);
    });

    it('ignores a `sheetsBar` key, which a sheet cannot carry', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);

      plugin.updateSheetSettings('A', { sheetsBar: false, readOnly: true });

      expect(plugin.enabled).toBe(true);
      expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
    });
  });
});
