import Handsontable from 'handsontable/base';
import { registerPlugin } from 'handsontable/plugins';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';
import { MultiColumnSorting } from 'handsontable/plugins/multiColumnSorting';

registerPlugin(ColumnSorting);
registerPlugin(MultiColumnSorting);

describe.each([
  ['columnSorting', { columnSorting: true }],
  ['multiColumnSorting', { multiColumnSorting: true }],
])('%s -> clearSort() on a grid whose sort states came from setSortConfig()', (pluginKey, pluginSettings) => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = new Handsontable(container, {
      data: [[3, 'c'], [1, 'a'], [2, 'b']],
      ...pluginSettings,
      licenseKey: 'non-commercial-and-evaluation',
    });
  });

  afterEach(() => {
    hot.destroy();
    container.remove();
  });

  it('should clear the sort states and keep the rows in their current order', () => {
    const plugin = hot.getPlugin(pluginKey);

    plugin.setSortConfig([{ column: 0, sortOrder: 'asc' }]);

    expect(() => plugin.clearSort()).not.toThrow();
    expect(plugin.getSortConfig()).toEqual([]);
    expect(hot.getData()).toEqual([[3, 'c'], [1, 'a'], [2, 'b']]);
  });

  it('should sort the rows after setSortConfig() and bring back the original order on clearSort()', () => {
    const plugin = hot.getPlugin(pluginKey);

    plugin.setSortConfig([{ column: 0, sortOrder: 'asc' }]);
    plugin.sort({ column: 0, sortOrder: 'desc' });

    expect(hot.getData()).toEqual([[3, 'c'], [2, 'b'], [1, 'a']]);

    plugin.clearSort();

    expect(plugin.getSortConfig()).toEqual([]);
    expect(hot.getData()).toEqual([[3, 'c'], [1, 'a'], [2, 'b']]);
  });
});
