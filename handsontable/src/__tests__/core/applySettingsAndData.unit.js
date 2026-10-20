import Handsontable from 'handsontable';

const probeLog = [];

/**
 * A plugin that records what it sees when it is enabled and when its data is ready.
 */
class DataProbe extends Handsontable.plugins.BasePlugin {
  static get PLUGIN_KEY() {
    return 'dataProbe';
  }

  isEnabled() {
    return !!this.hot.getSettings().dataProbe;
  }

  enablePlugin() {
    if (this.hot.view) {
      probeLog.push(['enable', this.isDataWorkDeferred(), this.hot.getDataAtCol(0)]);
    }

    this.addHook('afterLoadData', () => probeLog.push(['afterLoadData', this.isDataWorkDeferred()]));
    super.enablePlugin();
  }

  onDataReady() {
    probeLog.push(['ready', this.isDataWorkDeferred(), this.hot.getDataAtCol(0)]);
  }
}

Handsontable.plugins.registerPlugin('dataProbe', DataProbe);

/**
 * A plugin with a priority, so it runs ahead of the unprioritized `DataProbe`, and that makes a
 * public settings update of its own while it is enabled, the way ColumnSorting turns a conflicting
 * sorting plugin off from its `enablePlugin()`.
 */
class NestingProbe extends Handsontable.plugins.BasePlugin {
  static get PLUGIN_KEY() {
    return 'nestingProbe';
  }

  isEnabled() {
    return !!this.hot.getSettings().nestingProbe;
  }

  enablePlugin() {
    super.enablePlugin();

    if (this.hot.view) {
      this.hot.updateSettings({ minRows: 4 });
    }
  }

  onDataReady() {
    probeLog.push(['nesting ready']);
  }
}

Handsontable.plugins.registerPlugin('nestingProbe', NestingProbe, 985);

/**
 * `Core#_applySettingsAndData()` applies settings and the data they describe in the order the grid's own
 * initialization uses: plugins configure first, then the data loads, then the work that reads it runs.
 */
describe('Core#_applySettingsAndData', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    probeLog.length = 0;
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  /**
   * Creates a grid on the test container.
   *
   * @param {object} settings The grid settings.
   * @returns {Handsontable}
   */
  function createGrid(settings) {
    hot = new Handsontable(container, { licenseKey: 'non-commercial-and-evaluation', ...settings });

    return hot;
  }

  it('enables a plugin before the load and runs its data-ready step against the new data', () => {
    createGrid({ data: [['old']] });

    hot._applySettingsAndData({ dataProbe: true }, [['new-1'], ['new-2']], 'test');

    expect(probeLog).toEqual([
      ['enable', true, ['old']],
      ['afterLoadData', true],
      ['ready', false, ['new-1', 'new-2']],
    ]);
    expect(hot._isDataWorkDeferred()).toBe(false);
  });

  it('fires afterUpdateSettings before the load and afterCellMetaReset after it', () => {
    const order = [];

    createGrid({
      data: [['old']],
      afterUpdateSettings() {
        order.push('afterUpdateSettings');
      },
      beforeLoadData() {
        order.push('beforeLoadData');
      },
      afterLoadData() {
        order.push('afterLoadData');
      },
      afterCellMetaReset() {
        order.push('afterCellMetaReset');
      },
    });
    order.length = 0;

    hot._applySettingsAndData({ cell: [] }, [['new']], 'test');

    expect(order).toEqual(['afterUpdateSettings', 'beforeLoadData', 'afterLoadData', 'afterCellMetaReset']);
  });

  it('applies the `cell` option to the new data, after the load clears the cell meta', () => {
    createGrid({ data: [['a', 'b']] });

    hot._applySettingsAndData({ cell: [{ row: 0, col: 1, readOnly: true }] }, [['c', 'd']], 'test');

    expect(hot.getCellMeta(0, 1).readOnly).toBe(true);
    expect(hot.getCellMeta(0, 0).readOnly).toBe(false);
  });

  it('neither pads nor trims the data the grid held, and sizes the new data to the new minimums', () => {
    const departing = [['a'], ['b'], [null]];
    const arriving = [['x']];

    createGrid({ data: departing, minSpareRows: 1 });

    hot._applySettingsAndData({ minSpareRows: 0, minRows: 3 }, arriving, 'test');

    expect(departing).toEqual([['a'], ['b'], [null]]);
    expect(hot.countRows()).toBe(3);
    expect(arriving.length).toBe(3);
  });

  it('renders once', () => {
    createGrid({ data: [['old']] });

    const render = jest.fn();

    hot.addHook('afterRender', render);
    hot._applySettingsAndData({ colHeaders: true }, [['new']], 'test');

    expect(render).toHaveBeenCalledTimes(1);
  });

  it('leaves the flag down when a listener throws, so a later update is applied as usual', () => {
    createGrid({ data: [['old']] });

    const failing = () => {
      throw new Error('listener failed');
    };

    hot.addHook('afterUpdateSettings', failing);

    expect(() => hot._applySettingsAndData({ colHeaders: true }, [['new']], 'test')).toThrow('listener failed');
    expect(hot._isDataWorkDeferred()).toBe(false);

    hot.removeHook('afterUpdateSettings', failing);
    hot.updateSettings({ minRows: 4 });

    expect(hot.countRows()).toBe(4);
  });

  it('applies a public settings update made during the call in full, and keeps the call\'s own meta phase', () => {
    const arriving = [['x']];

    createGrid({ data: [['old']] });

    hot._applySettingsAndData({
      nestingProbe: true,
      cell: [{ row: 0, col: 0, readOnly: true }],
    }, arriving, 'test');

    expect(hot.getSettings().minRows).toBe(4);
    expect(hot.countRows()).toBe(4);
    expect(arriving.length).toBe(4);
    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
    expect(hot._isDataWorkDeferred()).toBe(false);
  });

  it('runs onDataReady() in plugin priority order, and not for a plugin the call turned off', () => {
    createGrid({ data: [['old']], dataProbe: true });

    hot._applySettingsAndData({ nestingProbe: true }, [['new']], 'test');

    expect(probeLog.filter(entry => entry[0].includes('ready')).map(entry => entry[0])).toEqual([
      'nesting ready',
      'ready',
    ]);

    probeLog.length = 0;
    hot._applySettingsAndData({ dataProbe: false }, [['newer']], 'test');

    expect(probeLog.filter(entry => entry[0] === 'ready')).toEqual([]);
  });

  it('resumes rendering and leaves the flag down when an onDataReady() step throws', () => {
    createGrid({ data: [['old']], dataProbe: true });

    jest.spyOn(DataProbe.prototype, 'onDataReady').mockImplementationOnce(() => {
      throw new Error('ready failed');
    });

    expect(() => hot._applySettingsAndData({ colHeaders: true }, [['new']], 'test')).toThrow('ready failed');
    expect(hot._isDataWorkDeferred()).toBe(false);
    expect(hot.isRenderSuspended()).toBe(false);
  });
});
