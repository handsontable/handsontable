import Handsontable from 'handsontable/base';
import { registerPlugin } from 'handsontable/plugins';
import { ColumnSorting } from 'handsontable/plugins/columnSorting';
import { MultiColumnSorting } from 'handsontable/plugins/multiColumnSorting';
import { ManualRowMove } from 'handsontable/plugins/manualRowMove';

registerPlugin(ColumnSorting);
registerPlugin(MultiColumnSorting);
registerPlugin(ManualRowMove);

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
      manualRowMove: true,
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

  it('should return to the order the rows had when the sort started, after a row move', () => {
    const plugin = hot.getPlugin(pluginKey);

    plugin.setSortConfig([{ column: 0, sortOrder: 'asc' }]);
    hot.getPlugin('manualRowMove').moveRow(2, 0);

    expect(hot.getData()).toEqual([[2, 'b'], [3, 'c'], [1, 'a']]);

    plugin.sort({ column: 0, sortOrder: 'desc' });
    plugin.clearSort();

    expect(hot.getData()).toEqual([[2, 'b'], [3, 'c'], [1, 'a']]);
  });

  it('should return to the order the rows had when the sort started, after a row insert', () => {
    const plugin = hot.getPlugin(pluginKey);

    plugin.setSortConfig([{ column: 0, sortOrder: 'asc' }]);
    hot.alter('insert_row_above', 1);

    expect(hot.getData()).toEqual([[3, 'c'], [null, null], [1, 'a'], [2, 'b']]);

    plugin.sort({ column: 0, sortOrder: 'desc' });
    plugin.clearSort();

    expect(hot.getData()).toEqual([[3, 'c'], [null, null], [1, 'a'], [2, 'b']]);
  });

  it('should return to the original order after states were emptied and the rows sorted again', () => {
    const plugin = hot.getPlugin(pluginKey);

    plugin.setSortConfig([{ column: 0, sortOrder: 'asc' }]);
    plugin.sort({ column: 0, sortOrder: 'desc' });
    plugin.setSortConfig([]);
    plugin.sort({ column: 0, sortOrder: 'asc' });
    plugin.clearSort();

    expect(hot.getData()).toEqual([[3, 'c'], [1, 'a'], [2, 'b']]);
  });
});
