import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { ColumnSorting } from '../columnSorting';
import { MultiColumnSorting } from '../../multiColumnSorting/multiColumnSorting';

// `sortByPresetSortStates()` must read the upper bound of the sortable band through
// `this.getNumberOfRowsToSort()`, so a subclass that overrides it decides where the sort stops. A
// refactor once inlined that bound into a private helper, and the override was silently ignored.
//
// Each subclass is registered under its parent's own key, the way a modular build (`handsontable/base`)
// swaps in a customized plugin. That is also why this lives apart from `sortableRowRange.unit.js`:
// that file registers the built-in plugins under these same keys.
class NarrowedColumnSorting extends ColumnSorting {
  getNumberOfRowsToSort() {
    return 4;
  }
}

class NarrowedMultiColumnSorting extends MultiColumnSorting {
  getNumberOfRowsToSort() {
    return 4;
  }
}

describe.each([
  ['columnSorting', NarrowedColumnSorting],
  ['multiColumnSorting', NarrowedMultiColumnSorting],
])('a subclass of %s that overrides `getNumberOfRowsToSort()`', (pluginKey, PluginClass) => {
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

  it('should stop the sort where the override says, and keep the lower bound', () => {
    hot = new Handsontable(container, {
      data: [
        ['Header', 25],
        ['Banana', 20],
        ['Apple', 10],
        ['Date', 40],
        ['Cherry', 30],
        ['Total', 35],
      ],
      fixedRowsTop: 1,
      [pluginKey]: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin(pluginKey).sort({ column: 1, sortOrder: 'asc' });

    // Row 0 stays pinned by `fixedRowsTop`, rows 1-3 are the band the override allows, and rows 4-5
    // keep their place. Ignoring the override would sort every row below the pinned one:
    // [25, 10, 20, 30, 35, 40].
    expect(hot.getDataAtCol(1)).toEqual([25, 10, 20, 40, 30, 35]);
  });
});
