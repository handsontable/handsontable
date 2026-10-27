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

    it('throws on an add into a frozen array before anything changes', () => {
      const sheets = Object.freeze([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const plugin = buildWorkbook(sheets);
      const added = jest.fn();

      hot.addHook('afterSheetTabAdd', added);

      expect(() => plugin.addSheet('New')).toThrow();
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
      expect(added).not.toHaveBeenCalled();
    });

    it('throws on a duplicate into a frozen array before anything changes', () => {
      const sheets = Object.freeze([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const plugin = buildWorkbook(sheets);

      expect(() => plugin.duplicateSheet(idOf(plugin, 'A'))).toThrow();
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
    });

    it('throws on a rename of a frozen entry before anything changes', () => {
      const sheets = [Object.freeze({ name: 'A', data: [[1]] }), { name: 'B', data: [[2]] }];
      const plugin = buildWorkbook(sheets);
      const renamed = jest.fn();

      hot.addHook('afterSheetTabRename', renamed);

      expect(() => plugin.renameSheet(idOf(plugin, 'A'), 'A2')).toThrow();
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
      expect(renamed).not.toHaveBeenCalled();
    });

    it('throws on a removal from a frozen array before anything changes', () => {
      const sheets = Object.freeze([
        { name: 'A', data: [[1]] },
        { name: 'B', data: [[2]] },
        { name: 'C', data: [[3]] },
      ]);
      const plugin = buildWorkbook(sheets, { activeSheet: 1 });
      const removed = jest.fn();

      hot.addHook('afterSheetTabRemove', removed);

      expect(() => plugin.removeSheet(idOf(plugin, 'B'))).toThrow();
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B', 'C']);
      expect(activeName(plugin)).toBe('B');
      expect(removed).not.toHaveBeenCalled();
    });

    it('refuses an inline rename of a frozen entry with a warning, and gives the tab its label back', () => {
      const sheets = [Object.freeze({ name: 'A', data: [[1]] }), { name: 'B', data: [[2]] }];
      const plugin = buildWorkbook(sheets);
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const tab = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab--active');

      tab.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

      const input = tab.querySelector('.ht-sheets-bar__tab-rename');

      input.value = 'A2';

      expect(() => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }).not.toThrow();

      const activeTab = hot.rootWrapperElement.querySelector('.ht-sheets-bar__tab--active');

      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
      expect(activeTab.querySelector('.ht-sheets-bar__tab-rename')).toBe(null);
      expect(activeTab.getAttribute('role')).toBe('button');
      expect(activeTab.textContent).toContain('A');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('frozen'));
    });

    it('refuses the add button on a frozen array with a warning', () => {
      const sheets = Object.freeze([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const plugin = buildWorkbook(sheets);
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => {
        hot.rootWrapperElement.querySelector('.ht-sheets-bar__add').click();
      }).not.toThrow();
      expect(plugin.getSheets().map(sheet => sheet.name)).toEqual(['A', 'B']);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('frozen'));
    });

    it('stores a sheet the bar created through the array it was pushed into', () => {
      const pushed = [];
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }];
      const tracked = new Proxy(sheets, {
        set(target, key, value) {
          if (key !== 'length') {
            const entry = new Proxy(value, {
              set(entryTarget, entryKey, entryValue) {
                pushed.push(entryValue);
                entryTarget[entryKey] = entryValue;

                return true;
              },
            });

            target[key] = entry;
          } else {
            target[key] = value;
          }

          return true;
        },
      });
      const plugin = buildWorkbook(tracked);

      plugin.addSheet('Extra');
      plugin.renameSheet(idOf(plugin, 'Extra'), 'Extra2');

      expect(pushed).toEqual(['Extra2']);
      expect(sheets[2].name).toBe('Extra2');
    });

    it('writes a rename into the entry that holds the sheet when the app edited the array in place', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets);

      sheets.splice(0, 1);
      hot.updateSettings({ sheetsBar: { sheets } });
      plugin.renameSheet(idOf(plugin, 'B'), 'B2');

      expect(sheets.map(entry => entry.name)).toEqual(['B2', 'C']);
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

    it('keeps the active sheet when the app sends its unchanged value again after a removal in front of it', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets, { activeSheet: 1 });

      plugin.removeSheet(idOf(plugin, 'A'));
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 1 } });

      expect(activeName(plugin)).toBe('B');
    });

    it('keeps the active sheet when the app sends its unchanged value again after the sheet it named was removed', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets, { activeSheet: 0 });

      plugin.setActiveSheet('C');
      plugin.removeSheet(idOf(plugin, 'A'));
      hot.updateSettings({ sheetsBar: { sheets, activeSheet: 0 } });

      expect(activeName(plugin)).toBe('C');
    });

    it('keeps the active sheet when a payload without `activeSheet` follows a removal', () => {
      const sheets = [{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }, { name: 'C', data: [[3]] }];
      const plugin = buildWorkbook(sheets, { activeSheet: 2 });

      plugin.setActiveSheet('B');
      plugin.removeSheet(idOf(plugin, 'A'));
      hot.updateSettings({ sheetsBar: { paging: false } });

      expect(activeName(plugin)).toBe('B');
    });

    it('counts in tab order when the bar declares no `sheets` array', () => {
      hot = new Handsontable(container, { data: [[1]], sheetsBar: true, licenseKey: LICENSE_KEY });

      const plugin = hot.getPlugin('sheetsBar');

      plugin.addSheet('Second');
      plugin.addSheet('Third');
      plugin.moveSheetToIndex(idOf(plugin, 'Third'), 0);
      hot.updateSettings({ sheetsBar: { activeSheet: 0 } });

      expect(activeName(plugin)).toBe('Third');
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

    it('does not carry a key set on the visible sheet over to the other sheets', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);

      plugin.updateSheetSettings('A', { readOnly: true });
      plugin.setActiveSheet('B');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(false);

      plugin.setActiveSheet('A');

      expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
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

    it('applies a new `cell` to a hidden sheet the user already visited', () => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1, 2]] },
        { name: 'B', data: [[3, 4]], settings: { cell: [{ row: 0, col: 0, className: 'old' }] } },
      ]);

      plugin.setActiveSheet('B');
      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { cell: [{ row: 0, col: 1, className: 'new' }] });
      plugin.setActiveSheet('B');

      expect(hot.getCellMeta(0, 0).className).toBeUndefined();
      expect(hot.getCellMeta(0, 1).className).toBe('new');
    });

    it('applies a new `columnSummary` to a hidden sheet the user already visited', () => {
      const summary = type => [{ sourceColumn: 0, destinationRow: 2, destinationColumn: 0, type, ranges: [[0, 1]] }];
      const plugin = buildWorkbook([
        { name: 'A', data: [[1]] },
        { name: 'B', data: [[1], [2], [null]], settings: { columnSummary: summary('sum') } },
      ]);

      plugin.setActiveSheet('B');

      expect(hot.getDataAtCell(2, 0)).toBe(3);

      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { columnSummary: summary('max') });
      plugin.setActiveSheet('B');

      expect(hot.getDataAtCell(2, 0)).toBe(2);
    });

    it('applies new `mergeCells` to a hidden sheet the user already visited', () => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1]] },
        { name: 'B', data: [[1, 2], [3, 4]], settings: { mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 1 }] } },
      ]);

      plugin.setActiveSheet('B');
      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { mergeCells: [{ row: 0, col: 0, rowspan: 1, colspan: 2 }] });
      plugin.setActiveSheet('B');

      expect(hot.getCellMeta(0, 0).colspan).toBe(2);
      expect(hot.getCellMeta(0, 0).rowspan).toBe(1);
    });

    it('applies new `customBorders` to a hidden sheet the user already visited', () => {
      const border = (row, col) => [{ row, col, top: { width: 2, color: 'blue' } }];
      const plugin = buildWorkbook([
        { name: 'A', data: [[1]] },
        { name: 'B', data: [[1, 2], [3, 4]], settings: { customBorders: border(0, 0) } },
      ]);

      plugin.setActiveSheet('B');
      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { customBorders: border(1, 1) });
      plugin.setActiveSheet('B');

      const borders = hot.getPlugin('customBorders').getBorders();

      expect(borders.map(entry => [entry.row, entry.col])).toEqual([[1, 1]]);
    });

    it('applies a new frozen count to a hidden sheet the user already visited, and keeps the rest of its view', () => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1, 2, 3], [4, 5, 6]] },
        { name: 'B', data: [[1, 2, 3], [4, 5, 6]] },
      ]);

      plugin.setActiveSheet('B');
      hot.selectCell(1, 1);
      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { fixedColumnsStart: 2 });
      plugin.setActiveSheet('B');

      expect(hot.getSettings().fixedColumnsStart).toBe(2);
      expect(hot.getSelectedLast()).toEqual([1, 1, 1, 1]);

      plugin.setActiveSheet('A');

      expect(hot.getSettings().fixedColumnsStart).toBe(0);
    });

    it('applies new `hiddenColumns` to a hidden sheet the user already visited', () => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1, 2, 3]] },
        { name: 'B', data: [[1, 2, 3]], settings: { hiddenColumns: { columns: [0] } } },
      ]);

      plugin.setActiveSheet('B');
      hot.getPlugin('hiddenColumns').hideColumn(1);
      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { hiddenColumns: { columns: [2] } });
      plugin.setActiveSheet('B');

      expect(hot.getPlugin('hiddenColumns').getHiddenColumns()).toEqual([2]);
    });

    it('applies new `colWidths` over the widths a hidden sheet the user already visited was resized to', () => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1, 2]] },
        { name: 'B', data: [[1, 2]], settings: { manualColumnResize: true } },
      ]);

      plugin.setActiveSheet('B');
      hot.getPlugin('manualColumnResize').setManualSize(0, 200);
      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { colWidths: 80 });
      plugin.setActiveSheet('B');

      expect(hot.getColWidth(0)).toBe(80);
    });

    it('applies a new sort to a hidden sheet the user already visited', () => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1]] },
        { name: 'B', data: [[2], [3], [1]], settings: { columnSorting: true } },
      ]);

      plugin.setActiveSheet('B');
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { columnSorting: { initialConfig: { column: 0, sortOrder: 'asc' } } });
      plugin.setActiveSheet('B');

      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([{ column: 0, sortOrder: 'asc' }]);
      expect(hot.getDataAtCol(0)).toEqual([1, 2, 3]);
    });

    it('applies a new row order to a hidden sheet the user left sorted', () => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1]] },
        { name: 'B', data: [[2], [3], [1]], settings: { columnSorting: true, manualRowMove: true } },
      ]);

      plugin.setActiveSheet('B');
      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'asc' });
      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { manualRowMove: [1, 0, 2] });
      plugin.setActiveSheet('B');

      expect(hot.getDataAtCol(0)).toEqual([3, 2, 1]);
      expect(hot.getPlugin('columnSorting').getSortConfig()).toEqual([]);
    });

    it('applies a new page setup to a hidden sheet the user already visited', () => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1]] },
        { name: 'B', data: [[1], [2], [3]], settings: { pagination: { pageSize: 1 } } },
      ]);

      plugin.setActiveSheet('B');
      hot.getPlugin('pagination').setPage(3);
      plugin.setActiveSheet('A');
      plugin.updateSheetSettings('B', { pagination: { pageSize: 1, initialPage: 2 } });
      plugin.setActiveSheet('B');

      expect(hot.getPlugin('pagination').getPaginationData().currentPage).toBe(2);
    });

    it('refuses a sheet\'s `data`, which the sheets bar keeps itself', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1, 2]] }, { name: 'B', data: [[3, 4]] }]);

      plugin.updateSheetSettings('A', { data: [[9, 9]], readOnly: true });
      plugin.setActiveSheet('B');
      hot.updateSettings({ sheetsBar: false });

      expect(hot.getDataAtCell(0, 0)).toBe(3);
    });

    it('returns `false` when nothing changes', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);

      expect(plugin.updateSheetSettings('A', {})).toBe(false);
      expect(plugin.updateSheetSettings('A', { colHeaders: undefined })).toBe(false);
      expect(plugin.updateSheetSettings('A', { sheetsBar: false, data: [[9]] })).toBe(false);
    });

    it('ignores a `sheetsBar` key, which a sheet cannot carry', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);

      plugin.updateSheetSettings('A', { sheetsBar: false, readOnly: true });

      expect(plugin.enabled).toBe(true);
      expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
    });
  });
});
