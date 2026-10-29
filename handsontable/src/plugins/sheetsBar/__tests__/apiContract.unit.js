import HyperFormula from 'hyperformula';
import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('SheetsBar: the public methods keep their documented contract', () => {
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
   * @param {object} [gridSettings] More grid settings.
   * @returns {object} The SheetsBar plugin.
   */
  function buildWorkbook(sheets, gridSettings = {}) {
    hot = new Handsontable(container, {
      sheetsBar: { sheets },
      licenseKey: LICENSE_KEY,
      ...gridSettings,
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
   * Returns the tab names in tab order.
   *
   * @param {object} plugin The SheetsBar plugin.
   * @returns {string[]}
   */
  function namesOf(plugin) {
    return plugin.getSheets().map(sheet => sheet.name);
  }

  describe('a rename onto a name another sheet uses', () => {
    it('is refused before `beforeSheetTabRename` fires', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const beforeRename = jest.fn();

      hot.addHook('beforeSheetTabRename', beforeRename);

      expect(plugin.renameSheet(idOf(plugin, 'B'), 'A')).toBe(false);
      expect(beforeRename).not.toHaveBeenCalled();
      expect(namesOf(plugin)).toEqual(['A', 'B']);
    });

    it('still fires `beforeSheetTabRename` for a case-only rename of the same sheet', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const beforeRename = jest.fn();

      hot.addHook('beforeSheetTabRename', beforeRename);

      expect(plugin.renameSheet(idOf(plugin, 'A'), 'a')).toBe(true);
      expect(beforeRename).toHaveBeenCalledTimes(1);
    });
  });

  describe('the add hooks', () => {
    it('tell an add apart from a duplicate', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }]);
      const beforeAdd = jest.fn();
      const afterAdd = jest.fn();

      hot.addHook('beforeSheetTabAdd', beforeAdd);
      hot.addHook('afterSheetTabAdd', afterAdd);

      const added = plugin.addSheet('New');

      expect(beforeAdd).toHaveBeenLastCalledWith('New', null, 'SheetsBar.api');
      expect(afterAdd).toHaveBeenLastCalledWith(added.id, 'New', null, 'SheetsBar.api');

      const originalId = idOf(plugin, 'A');
      const copy = plugin.duplicateSheet(originalId);

      expect(beforeAdd).toHaveBeenLastCalledWith('A (2)', originalId, 'SheetsBar.api');
      expect(afterAdd).toHaveBeenLastCalledWith(copy.id, 'A (2)', originalId, 'SheetsBar.api');
    });

    it('report the name a duplicate gets to `beforeSheetTabAdd`, not the original\'s', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'A (2)', data: [[2]] }]);
      const beforeAdd = jest.fn();

      hot.addHook('beforeSheetTabAdd', beforeAdd);

      const copy = plugin.duplicateSheet(idOf(plugin, 'A'));

      expect(beforeAdd.mock.calls[0][0]).toBe('A (3)');
      expect(copy.name).toBe('A (3)');
    });
  });

  describe('a sheet name that is not a string', () => {
    it.each([
      ['a number', 42],
      ['an object', { label: 'A' }],
      ['an array', ['A']],
    ])('in a declared entry (%s) warns and keeps the grid working', (_label, name) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      let plugin;

      expect(() => {
        plugin = buildWorkbook([{ name, data: [[1]] }, { name: 'B', data: [[2]] }], { data: [['grid']] });
      }).not.toThrow();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"sheets" option is not valid'));
      expect(plugin.getSheets().length).toBeGreaterThan(0);
    });

    it('in an `updateSettings()` entry warns and keeps the current workbook', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => {
        hot.updateSettings({ sheetsBar: { sheets: [{ name: 42, data: [[3]] }] } });
      }).not.toThrow();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"sheets" option is not valid'));
      expect(plugin.enabled).toBe(true);
      expect(namesOf(plugin)).toEqual(['A', 'B']);
      expect(hot.getDataAtCell(0, 0)).toBe(1);
    });

    it.each([
      ['`data` that is not an array', { name: 'A', data: 'rows' }],
      ['`settings` that is not an object', { name: 'A', data: [[1]], settings: 5 }],
    ])('in an entry with %s is refused the same way', (_label, entry) => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => {
        hot.updateSettings({ sheetsBar: { sheets: [entry] } });
      }).not.toThrow();

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"sheets" option is not valid'));
      expect(namesOf(plugin)).toEqual(['A', 'B']);
    });

    it('passed to `addSheet()` returns `null` before any hook fires', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }]);
      const beforeAdd = jest.fn();

      hot.addHook('beforeSheetTabAdd', beforeAdd);

      expect(plugin.addSheet(42)).toBe(null);
      expect(plugin.addSheet({})).toBe(null);
      expect(beforeAdd).not.toHaveBeenCalled();
      expect(namesOf(plugin)).toEqual(['A']);
    });

    it('builds a sheet whose declared `data` is `null` as a blank one, also with a shared formula engine', () => {
      const engine = HyperFormula.buildEmpty({ licenseKey: 'internal-use-in-handsontable' });
      const bound = (name, data) => ({ name, data, settings: { formulas: { engine, sheetName: name } } });
      let plugin;

      expect(() => {
        plugin = buildWorkbook([bound('Revenue', [[4200000]]), bound('Costs', null)]);
      }).not.toThrow();

      expect(plugin.setActiveSheet('Costs')).toBe(true);
      expect(hot.countRows()).toBeGreaterThan(0);
    });

    it('accepts an omitted or `null` name in a declared entry and in `addSheet()`', () => {
      const plugin = buildWorkbook([{ data: [[1]] }, { name: null, data: [[2]] }]);

      expect(namesOf(plugin)).toEqual(['Sheet1', 'Sheet2']);
      expect(plugin.addSheet(null).name).toBe('Sheet3');
    });
  });

  describe('with the bar turned off', () => {
    it('returns `false` or `null` from every workbook method instead of throwing', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const idA = idOf(plugin, 'A');

      hot.updateSettings({ sheetsBar: false });

      expect(plugin.enabled).toBe(false);
      expect(plugin.removeSheet(idA)).toBe(false);
      expect(plugin.moveSheetToIndex(idA, 1)).toBe(false);
      expect(plugin.duplicateSheet(idA)).toBe(null);
      expect(plugin.renameSheet(idA, 'C')).toBe(false);
      expect(plugin.addSheet('C')).toBe(null);
      expect(plugin.setActiveSheet(idA)).toBe(false);
      expect(plugin.updateSheetSettings(idA, { readOnly: true })).toBe(false);
      expect(plugin.getSheets()).toEqual([]);
    });
  });

  describe('sheet ids', () => {
    it('are never reused by a rebuilt workbook', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const oldIds = plugin.getSheets().map(sheet => sheet.id);

      hot.updateSettings({ sheetsBar: { sheets: [{ name: 'C', data: [[3]] }, { name: 'D', data: [[4]] }] } });

      const newIds = plugin.getSheets().map(sheet => sheet.id);

      expect(namesOf(plugin)).toEqual(['C', 'D']);
      expect(newIds.some(id => oldIds.includes(id))).toBe(false);
      expect(plugin.setActiveSheet(oldIds[1])).toBe(false);
      expect(plugin.removeSheet(oldIds[0])).toBe(false);
      expect(namesOf(plugin)).toEqual(['C', 'D']);
    });

    it('are never reused after the bar is turned off and on again', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);
      const oldIds = plugin.getSheets().map(sheet => sheet.id);

      hot.updateSettings({ sheetsBar: false });
      hot.updateSettings({ sheetsBar: { sheets: [{ name: 'C', data: [[3]] }, { name: 'D', data: [[4]] }] } });

      expect(plugin.getSheets().some(sheet => oldIds.includes(sheet.id))).toBe(false);
    });
  });

  describe('`moveSheetToIndex()`', () => {
    it.each([
      ['NaN', NaN],
      ['a fraction', 1.5],
      ['a numeric string', '1'],
      ['`null`', null],
    ])('refuses %s as the target index before any hook fires', (_label, to) => {
      const plugin = buildWorkbook([
        { name: 'A', data: [[1]] },
        { name: 'B', data: [[2]] },
        { name: 'C', data: [[3]] },
      ]);
      const beforeMove = jest.fn();
      const afterMove = jest.fn();

      hot.addHook('beforeSheetTabMove', beforeMove);
      hot.addHook('afterSheetTabMove', afterMove);

      expect(plugin.moveSheetToIndex(idOf(plugin, 'A'), to)).toBe(false);
      expect(namesOf(plugin)).toEqual(['A', 'B', 'C']);
      expect(beforeMove).not.toHaveBeenCalled();
      expect(afterMove).not.toHaveBeenCalled();
    });
  });

  describe('a sheet reference that is neither a number nor a string', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an object', { id: 1 }],
    ])('makes `setActiveSheet(%s)` and `updateSheetSettings()` return `false`', (_label, value) => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }, { name: 'B', data: [[2]] }]);

      expect(plugin.setActiveSheet(value)).toBe(false);
      expect(plugin.updateSheetSettings(value, { readOnly: true })).toBe(false);
      expect(plugin.getSheets().find(sheet => sheet.isActive).name).toBe('A');
    });
  });

  describe('the descriptor a new sheet is returned with', () => {
    it('reports `isActive: true` when an `afterSheetTabAdd` listener switched to the added sheet', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }]);

      hot.addHook('afterSheetTabAdd', (id) => {
        plugin.setActiveSheet(id);
      });

      const added = plugin.addSheet('New');

      expect(added.isActive).toBe(true);
      expect(added).toEqual(plugin.getSheets().find(sheet => sheet.id === added.id));
    });

    it('reports `isActive: true` when an `afterSheetTabAdd` listener switched to the duplicate', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }]);

      hot.addHook('afterSheetTabAdd', (id) => {
        plugin.setActiveSheet(id);
      });

      const copy = plugin.duplicateSheet(idOf(plugin, 'A'));

      expect(copy.isActive).toBe(true);
      expect(copy).toEqual(plugin.getSheets().find(sheet => sheet.id === copy.id));
    });

    it('is still returned when an `afterSheetTabAdd` listener removed the new sheet', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }]);

      hot.addHook('afterSheetTabAdd', (id) => {
        plugin.removeSheet(id);
      });

      expect(plugin.addSheet('New')).toEqual(expect.objectContaining({ name: 'New', isActive: false }));
      expect(plugin.duplicateSheet(idOf(plugin, 'A')))
        .toEqual(expect.objectContaining({ name: 'A (2)', isActive: false }));
      expect(namesOf(plugin)).toEqual(['A']);
    });

    it('reports `isActive: false` when nothing switched', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }]);

      expect(plugin.addSheet('New').isActive).toBe(false);
      expect(plugin.duplicateSheet(idOf(plugin, 'A')).isActive).toBe(false);
    });
  });

  describe('names that differ only in case', () => {
    it('name the same sheet in `setActiveSheet()` and `updateSheetSettings()`', () => {
      const plugin = buildWorkbook([{ name: 'Alpha', data: [[1]] }, { name: 'Beta', data: [[2]] }]);

      expect(plugin.setActiveSheet('BETA')).toBe(true);
      expect(plugin.getSheets().find(sheet => sheet.isActive).name).toBe('Beta');
      expect(plugin.updateSheetSettings('alpha', { readOnly: true })).toBe(true);
    });

    it('refuse a rename onto another sheet before `beforeSheetTabRename` fires', () => {
      const plugin = buildWorkbook([{ name: 'Alpha', data: [[1]] }, { name: 'Beta', data: [[2]] }]);
      const beforeRename = jest.fn();

      hot.addHook('beforeSheetTabRename', beforeRename);

      expect(plugin.renameSheet(idOf(plugin, 'Beta'), 'alpha')).toBe(false);
      expect(beforeRename).not.toHaveBeenCalled();
      expect(namesOf(plugin)).toEqual(['Alpha', 'Beta']);
    });

    it('keep the active sheet active through a rebuild that changes only its name\'s case', () => {
      const plugin = buildWorkbook([{ name: 'Alpha', data: [[1]] }, { name: 'Budget', data: [[2]] }]);

      plugin.setActiveSheet('Budget');
      hot.updateSettings({
        sheetsBar: { sheets: [{ name: 'Alpha', data: [[1]] }, { name: 'BUDGET', data: [[2]] }], activeSheet: 0 },
      });

      expect(plugin.getSheets().find(sheet => sheet.isActive).name).toBe('BUDGET');
    });

    it('number a declared sheet that repeats another one\'s name in another case', () => {
      const plugin = buildWorkbook([{ name: 'Budget', data: [[1]] }, { name: 'BUDGET', data: [[2]] }]);

      expect(namesOf(plugin)).toEqual(['Budget', 'BUDGET (2)']);
    });
  });

  describe('a duplicate of a sheet whose cells hold a RegExp or a Map', () => {
    it('keeps them as a RegExp and a Map', () => {
      const plugin = buildWorkbook([{ name: 'Rules', data: [[/^SKU-\d+$/i, new Map([['Seattle', 142]])]] }]);
      const copy = plugin.duplicateSheet(idOf(plugin, 'Rules'));

      plugin.setActiveSheet(copy.id);

      const [pattern, stock] = hot.getSourceDataAtRow(0);

      expect(pattern).toBeInstanceOf(RegExp);
      expect(pattern.test('SKU-4821')).toBe(true);
      expect(stock).toBeInstanceOf(Map);
      expect(stock.get('Seattle')).toBe(142);
    });
  });

  describe('a duplicate of a sheet whose rows are class instances with private fields', () => {
    it('renders the copy with the values the getters read', () => {
      class Product {
        #stock;

        constructor(sku, stock) {
          this.sku = sku;
          this.#stock = stock;
        }

        get stock() {
          return this.#stock;
        }
      }

      const plugin = buildWorkbook(
        [{ name: 'Stock', data: [new Product('SKU-4821', 142), new Product('SKU-0093', 67)] }],
        { columns: [{ data: 'sku' }, { data: 'stock' }] },
      );
      const copy = plugin.duplicateSheet(idOf(plugin, 'Stock'));

      expect(() => plugin.setActiveSheet(copy.id)).not.toThrow();
      expect(hot.getDataAtCol(1)).toEqual([142, 67]);
    });
  });

  describe('a name with no visible character', () => {
    it('is refused by `renameSheet()` before `beforeSheetTabRename` fires', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }]);
      const beforeRename = jest.fn();

      hot.addHook('beforeSheetTabRename', beforeRename);

      expect(plugin.renameSheet(idOf(plugin, 'A'), '​‎')).toBe(false);
      expect(beforeRename).not.toHaveBeenCalled();
      expect(namesOf(plugin)).toEqual(['A']);
    });

    it('gives `addSheet()` the default name', () => {
      const plugin = buildWorkbook([{ name: 'A', data: [[1]] }]);

      expect(plugin.addSheet('⁠').name).toBe('Sheet2');
    });
  });
});
