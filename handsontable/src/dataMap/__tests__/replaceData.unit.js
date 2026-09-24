import Core from 'handsontable/core';
import { registerCellType, TextCellType, CheckboxCellType } from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';

registerCellType(TextCellType);
registerCellType(CheckboxCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

const WARNING_FRAGMENT = 'Handsontable found no columns in the data source';

describe('replaceData', () => {
  let container;
  let warnSpy;

  /**
   * Builds and initializes a grid in the shared container.
   *
   * @param {object} settings The grid settings.
   * @returns {Core}
   */
  function createGrid(settings) {
    const core = new Core(container, {
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    core.init();

    return core;
  }

  /**
   * Returns the console warnings about a dataset with no detectable columns.
   *
   * @returns {string[]}
   */
  function getColumnWarnings() {
    return warnSpy.mock.calls
      .map(([message]) => String(message))
      .filter(message => message.includes(WARNING_FRAGMENT));
  }

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    container.remove();
  });

  describe('warning about a dataset with no detectable columns', () => {
    it.each([
      ['a `null` first row', [null]],
      ['an empty object first row', [{}]],
    ])('should warn once when an object-rowed dataset has %s', (_, data) => {
      const hot = createGrid({ data });

      expect(hot.countRows()).toBe(1);
      expect(hot.countCols()).toBe(0);
      expect(getColumnWarnings()).toHaveLength(1);
      expect(getColumnWarnings()[0]).not.toContain('later rows');

      hot.destroy();
    });

    it.each([
      ['an array-of-arrays', [[], [1, 2, 3]]],
      ['an array-of-objects', [{}, { a: 1, b: 2 }]],
      ['a `null`-first', [null, { a: 1 }]],
    ])('should warn about hidden values when %s dataset has an empty first row', (_, data) => {
      const hot = createGrid({ data });

      expect(hot.countCols()).toBe(0);
      expect(getColumnWarnings()).toHaveLength(1);
      expect(getColumnWarnings()[0]).toContain('later rows have fields that no column displays');

      hot.destroy();
    });

    it.each([
      ['`columns: null`', { columns: null }],
      ['`dataSchema: null`', { dataSchema: null }],
    ])('should warn when %s leaves the column count to the empty first row', (_, settings) => {
      const hot = createGrid({ data: [null], ...settings });

      expect(hot.countCols()).toBe(0);
      expect(getColumnWarnings()).toHaveLength(1);

      hot.destroy();
    });

    it.each([
      ['`minSpareRows`', { minSpareRows: 1 }],
      ['`minRows`', { minRows: 3 }],
    ])('should not warn when %s adds rows to an empty dataset', (_, settings) => {
      const hot = createGrid({ data: [], ...settings });

      expect(hot.countRows()).toBeGreaterThan(0);
      expect(hot.countCols()).toBe(0);
      expect(getColumnWarnings()).toHaveLength(0);

      hot.destroy();
    });

    it('should still warn about a dataset loaded later on a grid that started from an empty dataset', () => {
      const hot = createGrid({ data: [], minSpareRows: 1 });

      expect(getColumnWarnings()).toHaveLength(0);

      hot.loadData([null]);

      expect(getColumnWarnings()).toHaveLength(1);

      hot.destroy();
    });

    it('should warn about an array-of-arrays dataset whose rows are all empty when `allowInsertColumn` is off', () => {
      const hot = createGrid({ data: [[]], allowInsertColumn: false });

      hot.setDataAtCell(0, 0, 'x');

      expect(hot.countCols()).toBe(0);
      expect(getColumnWarnings()).toHaveLength(1);

      hot.destroy();
    });

    it('should warn when `updateData()` and `loadData()` load such a dataset after init', () => {
      const hot = createGrid({ data: [['a', 'b']] });

      expect(getColumnWarnings()).toHaveLength(0);

      hot.updateData([null]);

      expect(hot.countCols()).toBe(0);
      expect(getColumnWarnings()).toHaveLength(1);

      hot.destroy();

      const hot2 = createGrid({ data: [['a', 'b']] });

      hot2.loadData([{}]);

      expect(hot2.countCols()).toBe(0);
      expect(getColumnWarnings()).toHaveLength(2);

      hot2.destroy();
    });

    it('should warn only once per instance, however many times such a dataset is loaded', () => {
      const hot = createGrid({ data: [null] });

      hot.loadData([null]);
      hot.updateData([{}]);
      hot.updateSettings({ data: [null] });

      expect(getColumnWarnings()).toHaveLength(1);

      hot.destroy();
    });

    // `[[], [1, 2]]` warns about hidden fields on its own, so these cases also prove the check runs
    // after `minCols` and `minSpareCols` have created the columns.
    it.each([
      ['`minCols`', { minCols: 2 }],
      ['`minSpareCols`', { minSpareCols: 1 }],
    ])('should not warn when %s creates the columns', (_, settings) => {
      const hot = createGrid({ data: [[], [1, 2]], ...settings });

      expect(hot.countCols()).toBeGreaterThan(0);
      expect(getColumnWarnings()).toHaveLength(0);

      hot.destroy();
    });

    it('should not throw for a duck-typed collection with no Array methods', () => {
      // `replaceData()` accepts any object with `push` and `splice` as a dataset.
      const collection = {
        items: [{ a: 1 }, { a: 2 }],
        push(item) {
          return this.items.push(item);
        },
        splice(...args) {
          return this.items.splice(...args);
        },
        get length() {
          return this.items.length;
        },
      };
      const hot = createGrid({ data: [['a']] });

      expect(() => hot.updateData(collection)).not.toThrow();
      expect(hot.countRows()).toBe(2);
      expect(hot.countCols()).toBe(0);
      expect(getColumnWarnings()).toHaveLength(1);

      hot.destroy();
    });

    it.each([
      ['an empty dataset', { data: [] }],
      ['an array-of-arrays dataset whose rows are all empty', { data: [[]] }],
      ['an array-of-arrays dataset with values', { data: [[1]] }],
      ['an array-of-objects dataset with values', { data: [{ a: 1 }] }],
      ['`columns` defined', { data: [null], columns: [{ data: 'a' }] }],
      ['an empty `columns` array', { data: [null], columns: [] }],
      ['`dataSchema` defined', { data: [null], dataSchema: { a: null } }],
      ['`maxCols: 0`', { data: [null], maxCols: 0 }],
    ])('should not warn for %s', (_, settings) => {
      const hot = createGrid(settings);

      expect(getColumnWarnings()).toHaveLength(0);

      hot.destroy();
    });
  });
});
