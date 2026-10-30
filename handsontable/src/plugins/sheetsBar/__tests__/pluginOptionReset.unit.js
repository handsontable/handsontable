import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

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
});
