import Handsontable from '../../../index';

const LICENSE_KEY = 'non-commercial-and-evaluation';
const OBJECT_SETTINGS = { indicator: false, headerAction: false, sortEmptyCells: true };

describe.each([
  ['columnSorting'],
  ['multiColumnSorting'],
])('%s: options after a new plugin value', (pluginKey) => {
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
   * Builds a grid with an empty cell between two numbers and the given plugin value.
   *
   * @param {*} value The plugin option value.
   * @returns {object} The sorting plugin.
   */
  function buildGrid(value) {
    hot = new Handsontable(container, {
      data: [[2], [null], [1]],
      colHeaders: true,
      [pluginKey]: value,
      licenseKey: LICENSE_KEY,
    });

    return hot.getPlugin(pluginKey);
  }

  /**
   * Reads the classes of the sorting span in the first column header.
   *
   * @returns {string[]}
   */
  function headerSortClasses() {
    const span = container.querySelector('.ht_master thead th .columnSorting');

    return span ? Array.from(span.classList) : [];
  }

  it('resets every option the object set once `true` replaces the object', () => {
    const plugin = buildGrid(OBJECT_SETTINGS);

    hot.updateSettings({ [pluginKey]: true });

    const merged = plugin.getMergedPluginSettings(0);

    expect(merged.indicator).toBe(true);
    expect(merged.headerAction).toBe(true);
    expect(merged.sortEmptyCells).toBe(false);

    plugin.sort({ column: 0, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual([1, 2, null]);
    expect(headerSortClasses()).not.toContain('indicatorDisabled');
    expect(headerSortClasses()).toContain('sortAction');
  });

  it('resets the options an object set at runtime once `true` replaces it', () => {
    const plugin = buildGrid(true);

    hot.updateSettings({ [pluginKey]: OBJECT_SETTINGS });
    hot.updateSettings({ [pluginKey]: true });

    const merged = plugin.getMergedPluginSettings(0);

    expect(merged.indicator).toBe(true);
    expect(merged.headerAction).toBe(true);
    expect(merged.sortEmptyCells).toBe(false);
  });

  it('drops a `compareFunctionFactory` the object set once `true` replaces it', () => {
    const compareFunctionFactory = jest.fn(() => () => 0);
    const plugin = buildGrid({ compareFunctionFactory });

    hot.updateSettings({ [pluginKey]: true });
    plugin.sort({ column: 0, sortOrder: 'asc' });

    expect(compareFunctionFactory).not.toHaveBeenCalled();
    expect(hot.getDataAtCol(0)).toEqual([1, 2, null]);
  });

  it('starts from the default options when `false` comes between the object and `true`', () => {
    const compareFunctionFactory = jest.fn(() => () => 0);
    const plugin = buildGrid({ ...OBJECT_SETTINGS, compareFunctionFactory });

    hot.updateSettings({ [pluginKey]: false });
    hot.updateSettings({ [pluginKey]: true });

    const merged = plugin.getMergedPluginSettings(0);

    expect(plugin.enabled).toBe(true);
    expect(merged.indicator).toBe(true);
    expect(merged.headerAction).toBe(true);
    expect(merged.sortEmptyCells).toBe(false);

    plugin.sort({ column: 0, sortOrder: 'asc' });

    expect(compareFunctionFactory).not.toHaveBeenCalled();
    expect(hot.getDataAtCol(0)).toEqual([1, 2, null]);
  });

  it('applies the object options it replaced `true` with', () => {
    const plugin = buildGrid(true);

    hot.updateSettings({ [pluginKey]: OBJECT_SETTINGS });
    plugin.sort({ column: 0, sortOrder: 'asc' });

    expect(hot.getDataAtCol(0)).toEqual([null, 1, 2]);
    expect(headerSortClasses()).toContain('indicatorDisabled');
    expect(headerSortClasses()).not.toContain('sortAction');
  });

  it('keeps the sort when `true` is sent again', () => {
    const plugin = buildGrid(true);

    plugin.sort({ column: 0, sortOrder: 'desc' });
    hot.updateSettings({ [pluginKey]: true });

    expect(plugin.getSortConfig(0)).toEqual({ column: 0, sortOrder: 'desc' });
    expect(hot.getDataAtCol(0)).toEqual([2, 1, null]);
  });

  it('merges a partial object into the options of the previous object', () => {
    const plugin = buildGrid(OBJECT_SETTINGS);

    hot.updateSettings({ [pluginKey]: { indicator: true } });

    const merged = plugin.getMergedPluginSettings(0);

    expect(merged.indicator).toBe(true);
    expect(merged.headerAction).toBe(false);
    expect(merged.sortEmptyCells).toBe(true);
  });
});
