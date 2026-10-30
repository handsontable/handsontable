import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { MultiColumnSorting } from '../../multiColumnSorting/multiColumnSorting';

const DATA = [['Banana'], ['Apple'], ['Cherry']];

/**
 * The settings sort of an enable runs in the ready step (`onGridReady()`). At init core holds the
 * render the sort asks for, so the first render draws sorted rows and the grid renders once. Before,
 * an `afterInit` listener sorted after the first render had drawn the rows unsorted, and rendered again.
 */
describe.each([
  ['columnSorting', ColumnSorting],
  ['multiColumnSorting', MultiColumnSorting],
])('%s ready step', (pluginKey, PluginClass) => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(PluginClass);
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
   * Builds a one-column grid.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings) {
    hot = new Handsontable(container, {
      data: DATA.map(row => [...row]),
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    return hot;
  }

  it('should sort before the init hook and draw sorted rows with the first and only render', () => {
    const events = [];

    buildGrid({
      [pluginKey]: { initialConfig: { column: 0, sortOrder: 'asc' } },
      afterColumnSort() {
        events.push('sort');
      },
      init() {
        events.push('init');
      },
      afterRender() {
        events.push(`render:${this.getDataAtCell(0, 0)}`);
      },
    });

    expect(events).toEqual(['sort', 'init', 'render:Apple']);
  });

  it('should sort once when updateSettings() turns the plugin on', () => {
    const sorts = jest.fn();

    buildGrid({ afterColumnSort: sorts });

    hot.updateSettings({ [pluginKey]: { initialConfig: { column: 0, sortOrder: 'desc' } } });

    expect(sorts).toHaveBeenCalledTimes(1);
    expect(hot.getDataAtCol(0)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('should sort once when updateSettings() changes the settings of the enabled plugin', () => {
    const sorts = jest.fn();

    buildGrid({ [pluginKey]: true, afterColumnSort: sorts });

    hot.updateSettings({ [pluginKey]: { initialConfig: { column: 0, sortOrder: 'desc' } } });

    expect(sorts).toHaveBeenCalledTimes(1);
    expect(hot.getDataAtCol(0)).toEqual(['Cherry', 'Banana', 'Apple']);
  });
});
