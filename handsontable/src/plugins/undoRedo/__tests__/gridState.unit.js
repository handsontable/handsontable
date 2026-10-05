import Handsontable from 'handsontable/base';
import {
  AutoColumnSize,
  BasePlugin,
  DropdownMenu,
  Filters,
  HiddenRows,
  Pagination,
  registerPlugin,
} from 'handsontable/plugins';
import { registerAllCellTypes } from 'handsontable/registry';
import { GridStateTracker } from '../snapshot/gridState';

registerAllCellTypes();

/**
 * A plugin whose state lives outside the index maps: a list of labels.
 */
class LabelsPlugin extends BasePlugin {
  static get PLUGIN_KEY() {
    return 'labelsPlugin';
  }

  labels = [];

  version = 0;

  lastCapture = { version: -1, labels: [] };

  restored = [];

  isEnabled() {
    return !!this.hot.getSettings().labelsPlugin;
  }

  enablePlugin() {
    super.enablePlugin();
  }

  addLabel(label) {
    this.labels = [...this.labels, label];
    this.version += 1;
  }

  captureState(previous) {
    if (previous !== undefined && previous.version === this.version) {
      return previous;
    }

    return { version: this.version, labels: this.labels.slice() };
  }

  restoreState(state) {
    this.restored.push(state);
    this.labels = state.labels.slice();
    this.version = state.version;
  }
}

registerPlugin(LabelsPlugin);
registerPlugin(Pagination);
registerPlugin(AutoColumnSize);
registerPlugin(HiddenRows);
registerPlugin(DropdownMenu);
registerPlugin(Filters);

describe('GridStateTracker', () => {
  let container;
  let hot;
  let tracker;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    tracker?.destroy();
    tracker = null;
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Creates a grid and a tracker for it.
   *
   * @param {object} settings The grid settings.
   */
  function createGrid(settings = {}) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [0, 1, 2, 3, 4].map(row => [0, 1, 2, 3, 4].map(column => `${row}:${column}`)),
      ...settings,
    });
    tracker = new GridStateTracker(hot);
  }

  it('should return the previous snapshot itself when nothing changed', () => {
    createGrid({ labelsPlugin: true });

    const first = tracker.capture();

    hot.render();

    expect(tracker.capture()).toBe(first);
  });

  it('should reuse the unchanged parts and replace the changed ones', () => {
    createGrid({ labelsPlugin: true });

    const before = tracker.capture();

    hot.getPlugin('labelsPlugin').addLabel('a');

    const after = tracker.capture();

    expect(after).not.toBe(before);
    expect(after.rows).toBe(before.rows);
    expect(after.columns).toBe(before.columns);
    expect(after.settings).toBe(before.settings);
    // States are keyed by the registered plugin name.
    expect(after.plugins.get('LabelsPlugin')).toEqual({ version: 1, labels: ['a'] });
  });

  it('should restore the index maps, the plugin state and the frozen row counts', () => {
    createGrid({ labelsPlugin: true, fixedRowsTop: 2 });

    const before = tracker.capture();
    const plugin = hot.getPlugin('labelsPlugin');

    hot.rowIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
    plugin.addLabel('a');
    hot.alter('remove_row', 0);

    expect(hot.getSettings().fixedRowsTop).toBe(1);

    tracker.capture();
    hot.alter('insert_row_above', 0);
    tracker.restore(before);

    expect(hot.rowIndexMapper.getIndexesSequence()).toEqual([0, 1, 2, 3, 4]);
    expect(hot.getSettings().fixedRowsTop).toBe(2);
    expect(plugin.labels).toEqual([]);
    expect(plugin.restored.length).toBe(1);
  });

  it('should refill an array `colHeaders` in place', () => {
    const colHeaders = ['A', 'B', 'C', 'D', 'E'];

    createGrid({ colHeaders });

    const before = tracker.capture();

    hot.alter('remove_col', 1, 2);

    expect(hot.getSettings().colHeaders).toEqual(['A', 'D', 'E']);

    hot.alter('insert_col_start', 1, 2);
    tracker.restore(before);

    expect(hot.getSettings().colHeaders).toBe(colHeaders);
    expect(colHeaders).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('should skip the state of a plugin that is disabled when the snapshot is restored', () => {
    createGrid({ labelsPlugin: true });

    const plugin = hot.getPlugin('labelsPlugin');

    plugin.addLabel('a');

    const snapshot = tracker.capture();

    hot.updateSettings({ labelsPlugin: false });
    plugin.disablePlugin();

    expect(() => tracker.restore(snapshot)).not.toThrow();
    expect(plugin.restored).toEqual([]);
  });

  it('should record the Pagination page, not its page map, which the plugin rebuilds', () => {
    createGrid({ pagination: { pageSize: 2 } });

    const pagination = hot.getPlugin('pagination');
    const before = tracker.capture();

    pagination.setPage(2);

    const after = tracker.capture();

    // The page map changed, yet the rows are shared with the previous capture: the map is derived.
    expect(hot.rowIndexMapper.hidingMapsCollection.get(pagination.pluginName)).toBeDefined();
    expect(after.rows).toBe(before.rows);
    expect(after.rows.hiding.has(pagination.pluginName)).toBe(false);
    expect(after.plugins.get(pagination.pluginName)).toEqual({ currentPage: 2, pageSize: 2 });
  });

  it('should not capture the Filters menu components\' maps, which the plugin rebuilds', () => {
    createGrid({ filters: true, dropdownMenu: true });

    const registered = Array.from(hot.columnIndexMapper.variousMapsCollection.collection.keys());
    const captured = Array.from(tracker.capture().columns.various.keys());

    // The name pattern is real: the components register their maps under it.
    expect(registered.some(name => name.startsWith('Filters.component.'))).toBe(true);
    expect(captured.some(name => name.startsWith('Filters.component.'))).toBe(false);
  });

  it('should put rows and columns back in physical order for a replay, without touching hidden indexes', () => {
    createGrid();

    const hidingMap = hot.rowIndexMapper.createAndRegisterIndexMap('testHiding', 'hiding');
    const trimmingMap = hot.rowIndexMapper.createAndRegisterIndexMap('testTrimming', 'trimming');

    hot.rowIndexMapper.setIndexesSequence([2, 1, 0, 3, 4]);
    hot.columnIndexMapper.setIndexesSequence([4, 3, 2, 1, 0]);
    hidingMap.setValueAtIndex(1, true);
    trimmingMap.setValueAtIndex(3, true);

    tracker.resetToPhysicalOrder();

    expect(hot.toPhysicalRow(2)).toBe(2);
    expect(hot.toPhysicalColumn(0)).toBe(0);
    expect(hot.countRows()).toBe(5);
    expect(hidingMap.getValueAtIndex(1)).toBe(true);
  });
});
