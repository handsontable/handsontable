import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';

describe('Search: options after a new `search` value', () => {
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
  });

  /**
   * Builds a grid with the given `search` value.
   *
   * @param {*} search The `search` option.
   * @returns {object} The Search plugin.
   */
  function buildGrid(search) {
    hot = new Handsontable(container, {
      data: [['apple', 'pear'], ['plum', 'grape']],
      search,
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin('search');
  }

  it('resets every option an object set once `search: true` replaces the object', () => {
    const queryMethod = jest.fn(() => true);
    const callback = jest.fn();
    const plugin = buildGrid({ queryMethod, callback, searchResultClass: 'my-hit' });

    hot.updateSettings({ search: true });

    const results = plugin.query('pl');

    expect(queryMethod).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
    expect(plugin.getSearchResultClass()).toBe('htSearchResult');
    expect(results.map(({ row, col }) => [row, col])).toEqual([[0, 0], [1, 0]]);
    expect(hot.getCellMeta(0, 0).isSearchResult).toBe(true);
    expect(hot.getCellMeta(0, 1).isSearchResult).toBe(false);
  });

  it('resets the options an object set at runtime once `search: true` replaces it', () => {
    const queryMethod = jest.fn(() => true);
    const callback = jest.fn();
    const plugin = buildGrid(true);

    hot.updateSettings({ search: { queryMethod, callback, searchResultClass: 'my-hit' } });
    hot.updateSettings({ search: true });

    plugin.query('pl');

    expect(queryMethod).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
    expect(plugin.getSearchResultClass()).toBe('htSearchResult');
  });

  it('keeps the object options when `search: false` comes between the object and `search: true`', () => {
    const queryMethod = jest.fn(() => true);
    const callback = jest.fn();
    const plugin = buildGrid({ queryMethod, callback, searchResultClass: 'my-hit' });

    hot.updateSettings({ search: false });
    hot.updateSettings({ search: true });

    expect(plugin.isEnabled()).toBe(true);
    expect(plugin.getQueryMethod()).toBe(queryMethod);
    expect(plugin.getCallback()).toBe(callback);
    expect(plugin.getSearchResultClass()).toBe('my-hit');
  });

  it('resets the values set through the plugin API on a grid built with an object once `search: true` replaces it', () => {
    const queryMethod = jest.fn(() => true);
    const runtimeQueryMethod = jest.fn(() => true);
    const plugin = buildGrid({ queryMethod });

    plugin.setQueryMethod(runtimeQueryMethod);
    plugin.setSearchResultClass('runtime-hit');
    hot.updateSettings({ search: true });

    expect(plugin.getQueryMethod()).not.toBe(runtimeQueryMethod);
    expect(plugin.getQueryMethod()).not.toBe(queryMethod);
    expect(plugin.getSearchResultClass()).toBe('htSearchResult');
  });

  it('keeps the values set through the plugin API when `search: true` is sent again', () => {
    const queryMethod = jest.fn(() => false);
    const callback = jest.fn();
    const plugin = buildGrid(true);

    plugin.setQueryMethod(queryMethod);
    plugin.setCallback(callback);
    plugin.setSearchResultClass('runtime-hit');

    hot.updateSettings({ search: true });
    plugin.query('pl');

    expect(plugin.getQueryMethod()).toBe(queryMethod);
    expect(plugin.getCallback()).toBe(callback);
    expect(plugin.getSearchResultClass()).toBe('runtime-hit');
    expect(queryMethod).toHaveBeenCalledTimes(4);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('keeps the values set through the plugin API when an unrelated setting changes', () => {
    const queryMethod = jest.fn(() => false);
    const plugin = buildGrid(true);

    plugin.setQueryMethod(queryMethod);
    hot.updateSettings({ colHeaders: true });

    expect(plugin.getQueryMethod()).toBe(queryMethod);
  });

  it('merges a partial object into the options of the previous object', () => {
    const queryMethod = jest.fn(() => true);
    const callback = jest.fn();
    const plugin = buildGrid({ queryMethod, callback });

    hot.updateSettings({ search: { searchResultClass: 'my-hit' } });

    expect(plugin.getQueryMethod()).toBe(queryMethod);
    expect(plugin.getCallback()).toBe(callback);
    expect(plugin.getSearchResultClass()).toBe('my-hit');
  });
});
