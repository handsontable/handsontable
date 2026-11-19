import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const LICENSE_KEY = TEST_LICENSE_KEY;

describe('SheetsBar: a plugin option object stays on its own sheet', () => {
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
  });

  /**
   * Builds a workbook whose first sheet configures a plugin with an object and whose second sheet
   * turns it on with `true`.
   *
   * @param {string} pluginKey The plugin option key.
   * @param {object} options The first sheet's plugin options.
   * @returns {object} The SheetsBar plugin.
   */
  function buildWorkbook(pluginKey, options) {
    hot = new Handsontable(container, {
      colHeaders: true,
      sheetsBar: {
        sheets: [
          { name: 'Custom', data: [[2], [null], [1]], settings: { [pluginKey]: options } },
          { name: 'Plain', data: [['apple'], [null], ['plum']], settings: { [pluginKey]: true } },
        ],
      },
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('sheetsBar');
  }

  it('opens a `search: true` sheet with the default search options', () => {
    const queryMethod = jest.fn(() => true);
    const callback = jest.fn();
    const plugin = buildWorkbook('search', { queryMethod, callback, searchResultClass: 'my-hit' });

    plugin.setActiveSheet('Plain');

    const search = hot.getPlugin('search');
    const results = search.query('pl');

    expect(queryMethod).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
    expect(search.getSearchResultClass()).toBe('htSearchResult');
    expect(results.map(({ row, col }) => [row, col])).toEqual([[0, 0], [2, 0]]);
  });

  it('applies the object again on a return to the sheet that declares it', () => {
    const queryMethod = jest.fn(() => true);
    const plugin = buildWorkbook('search', { queryMethod, searchResultClass: 'my-hit' });

    plugin.setActiveSheet('Plain');
    plugin.setActiveSheet('Custom');

    expect(hot.getPlugin('search').getQueryMethod()).toBe(queryMethod);
    expect(hot.getPlugin('search').getSearchResultClass()).toBe('my-hit');
  });

  it.each([
    ['columnSorting'],
    ['multiColumnSorting'],
  ])('opens a `%s: true` sheet with the default sorting options', (pluginKey) => {
    const plugin = buildWorkbook(pluginKey, { indicator: false, headerAction: false, sortEmptyCells: true });

    plugin.setActiveSheet('Plain');

    const sorting = hot.getPlugin(pluginKey);
    const merged = sorting.getMergedPluginSettings(0);

    expect(merged.indicator).toBe(true);
    expect(merged.headerAction).toBe(true);
    expect(merged.sortEmptyCells).toBe(false);

    sorting.sort({ column: 0, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual(['apple', 'plum', null]);
  });

  describe('an object a sheet sets, after a sheet that set another', () => {
    /**
     * Builds a workbook with a grid-level object for a plugin option, a sheet 'X' setting one object and a
     * sheet 'Y' setting another, and a 'Plain' sheet that sets none.
     *
     * @param {string} pluginKey The plugin option key.
     * @param {object} gridLevel The grid-level object.
     * @param {object} x The object of sheet 'X'.
     * @param {object} y The object of sheet 'Y'.
     * @returns {object} The SheetsBar plugin.
     */
    function buildObjects(pluginKey, gridLevel, x, y) {
      hot = new Handsontable(container, {
        colHeaders: true,
        [pluginKey]: gridLevel,
        sheetsBar: {
          sheets: [
            { name: 'Plain', data: [[1]] },
            { name: 'X', data: [[1]], settings: { [pluginKey]: x } },
            { name: 'Y', data: [[1]], settings: { [pluginKey]: y } },
          ],
        },
        licenseKey: LICENSE_KEY,
      });

      return hot.getPlugin('sheetsBar');
    }

    it.each([
      ['autoLink', { target: '_blank' }, { target: '_self', className: 'x' }, { className: 'y' },
        { target: '_blank', className: 'y' }, { target: '_blank', className: '' }],
      ['notification', { stackLimit: 3 }, { stackLimit: 5, animation: false }, { stackLimit: 4 },
        { stackLimit: 4, animation: true }, { stackLimit: 3, animation: true }],
      ['filters', { searchMode: 'apply' }, { searchMode: 'show' }, {},
        { searchMode: 'apply' }, { searchMode: 'apply' }],
    ])('gives `%s` keys a sheet leaves out the grid-level value or the default', (
      pluginKey, gridLevel, x, y, onY, onPlain
    ) => {
      const plugin = buildObjects(pluginKey, gridLevel, x, y);

      plugin.setActiveSheet('X');
      plugin.setActiveSheet('Y');

      expect(hot.getPlugin(pluginKey).getSetting()).toEqual(expect.objectContaining(onY));

      plugin.setActiveSheet('X');
      plugin.setActiveSheet('Plain');

      expect(hot.getPlugin(pluginKey).getSetting()).toEqual(expect.objectContaining(onPlain));
    });

    it.each([
      ['columnSorting'],
      ['multiColumnSorting'],
    ])('gives a `%s` object the default sorting options it leaves out', (pluginKey) => {
      const plugin = buildObjects(pluginKey, true, { indicator: false, headerAction: false, sortEmptyCells: true }, {});

      plugin.setActiveSheet('X');
      plugin.setActiveSheet('Y');

      const merged = hot.getPlugin(pluginKey).getMergedPluginSettings(0);

      expect(merged.indicator).toBe(true);
      expect(merged.headerAction).toBe(true);
      expect(merged.sortEmptyCells).toBe(false);
    });

    it('gives a `search` object the default result class it leaves out', () => {
      const plugin = buildObjects('search', true, { searchResultClass: 'x-hit' }, { callback: null });

      plugin.setActiveSheet('X');
      plugin.setActiveSheet('Y');

      expect(hot.getPlugin('search').getSearchResultClass()).toBe('htSearchResult');
    });

    it('gives a sheet the default Loading `title` and Dialog `template` it leaves out', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      hot = new Handsontable(container, {
        sheetsBar: {
          sheets: [
            {
              name: 'X',
              data: [[1]],
              settings: {
                dialog: { template: { type: 'alert', title: 'From X' } },
                loading: { title: 'Loading X' },
              },
            },
            { name: 'Y', data: [[1]], settings: { dialog: { content: 'y' }, loading: { description: 'y' } } },
          ],
        },
        licenseKey: LICENSE_KEY,
      });

      const plugin = hot.getPlugin('sheetsBar');

      expect(hot.getPlugin('dialog').getSetting('template')).toEqual({ type: 'alert', title: 'From X' });
      expect(hot.getPlugin('loading').getSetting('title')).toBe('Loading X');

      plugin.setActiveSheet('Y');

      expect(hot.getPlugin('dialog').getSetting('template')).toBeNull();
      expect(hot.getPlugin('loading').getSetting('title')).toBeUndefined();
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('merges an `updateSheetSettings()` object into the visible sheet\'s own, as `updateSettings()` does', () => {
      const plugin = buildWorkbook('columnSorting', { headerAction: false });

      plugin.updateSheetSettings('Custom', { columnSorting: { indicator: false } });

      const merged = hot.getPlugin('columnSorting').getMergedPluginSettings(0);

      expect(merged.indicator).toBe(false);
      expect(merged.headerAction).toBe(false);
    });

    it('merges an `updateSheetSettings()` object into a hidden sheet\'s own, applied on its next visit', () => {
      const plugin = buildWorkbook('columnSorting', { headerAction: false });

      plugin.setActiveSheet('Plain');
      plugin.updateSheetSettings('Custom', { columnSorting: { indicator: false } });
      plugin.setActiveSheet('Custom');

      const merged = hot.getPlugin('columnSorting').getMergedPluginSettings(0);

      expect(merged.indicator).toBe(false);
      expect(merged.headerAction).toBe(false);
    });

    it('keeps a plain `updateSettings()` object merging into the previous one', () => {
      hot = new Handsontable(container, {
        autoLink: { target: '_self', className: 'x' },
        licenseKey: LICENSE_KEY,
      });

      hot.updateSettings({ autoLink: { className: 'y' } });

      expect(hot.getPlugin('autoLink').getSetting())
        .toEqual(expect.objectContaining({ target: '_self', className: 'y' }));
    });
  });
});
