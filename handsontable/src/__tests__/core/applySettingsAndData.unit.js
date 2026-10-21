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
 * A plugin that records the work an update owes to `onDataReady()` through the BasePlugin contract, the
 * way the plugins that defer data work do.
 */
class OwedWorkProbe extends Handsontable.plugins.BasePlugin {
  static get PLUGIN_KEY() {
    return 'owedWorkProbe';
  }

  isEnabled() {
    return !!this.hot.getSettings().owedWorkProbe;
  }

  updatePlugin() {
    this.disablePlugin();
    this.enablePlugin();

    if (this.isDataWorkDeferred()) {
      this.deferDataWork();
    }

    super.updatePlugin();
  }

  onDataReady() {
    if (this.takeDeferredDataWork()) {
      probeLog.push(['owed', this.hot.getDataAtCol(0)]);
    }
  }
}

Handsontable.plugins.registerPlugin('owedWorkProbe', OwedWorkProbe);

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
    const departing = [['a'], ['b']];
    const arriving = [['x']];

    createGrid({ data: departing, minSpareRows: 2 });

    expect(departing.length).toBe(4);

    hot._applySettingsAndData({ minSpareRows: 0, minRows: 6 }, arriving, 'test');

    expect(departing.length).toBe(4);
    expect(hot.countRows()).toBe(6);
    expect(arriving.length).toBe(6);
  });

  it('defers a settings update a sorting plugin makes on a conflict, so the data the grid held is not padded', () => {
    const departing = [['a']];
    const arriving = [['x']];

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    createGrid({ data: departing, multiColumnSorting: true });

    hot._applySettingsAndData({
      columnSorting: true,
      minSpareRows: 1,
      cell: [{ row: 0, col: 0, readOnly: true }],
    }, arriving, 'test');

    expect(hot.getSettings().columnSorting).toBe(false);
    expect(departing).toEqual([['a']]);
    expect(arriving.length).toBe(2);
    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
    expect(hot._isDataWorkDeferred()).toBe(false);
  });

  it('applies a settings update an afterLoadData listener makes in full', () => {
    const arriving = [['x']];
    const listener = () => hot.updateSettings({ minSpareRows: 2 });

    createGrid({ data: [['old']] });
    hot.addHook('afterLoadData', listener);

    hot._applySettingsAndData({ colHeaders: true }, arriving, 'test');

    expect(arriving.length).toBe(3);
    expect(hot.countRows()).toBe(3);
  });

  it('validates the new data against the column meta a `columns` function gives it', () => {
    const arriving = [['Alice']];

    createGrid({ data: [['2024-01-01']], columns: [{ type: 'date', allowInvalid: false }] });

    hot._applySettingsAndData({ columns: () => ({ type: 'text' }) }, arriving, 'test');

    expect(arriving[0][0]).toBe('Alice');
    expect(hot.getDataAtCell(0, 0)).toBe('Alice');
  });

  it('validates the new data without the previous column types once `columns: null` clears them', () => {
    const arriving = [['hello', 'world']];
    const dateColumn = { type: 'date', dateFormat: 'YYYY-MM-DD', allowInvalid: false };

    createGrid({ data: [['2024-01-01', '2024-01-02']], columns: [dateColumn, dateColumn] });

    hot._applySettingsAndData({ columns: null }, arriving, 'test');

    expect(arriving).toEqual([['hello', 'world']]);
    expect(hot.getCellMeta(0, 0).type).toBe('text');
  });

  it('applies a `columns` function to the new data', () => {
    createGrid({ data: [['old']] });

    hot._applySettingsAndData({ columns: () => ({ readOnly: true }) }, [['new']], 'test');

    expect(hot.getCellMeta(0, 0).readOnly).toBe(true);
  });

  it('keeps the flag up in afterCellMetaReset and lowers it before onDataReady()', () => {
    const seen = [];

    createGrid({ data: [['old']], dataProbe: true });
    hot.addHook('afterCellMetaReset', () => seen.push(['afterCellMetaReset', hot._isDataWorkDeferred()]));
    probeLog.length = 0;

    hot._applySettingsAndData({ cell: [] }, [['new']], 'test');

    expect(seen).toEqual([['afterCellMetaReset', true]]);
    expect(probeLog.find(entry => entry[0] === 'ready')).toEqual(['ready', false, ['new']]);
  });

  it('runs no onDataReady() step while the grid has no view yet', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      dataProbe: true,
      beforeInit() {
        this._applySettingsAndData({ colHeaders: true }, [['new']], 'test');
      },
    });

    expect(probeLog.filter(entry => entry[0] === 'ready')).toEqual([]);
    expect(hot._isDataWorkDeferred()).toBe(false);
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

  it('applies a settings update a plugin makes while the call configures, and keeps the call\'s own meta phase', () => {
    const departing = [['old']];
    const arriving = [['x']];

    createGrid({ data: departing });

    hot._applySettingsAndData({
      nestingProbe: true,
      cell: [{ row: 0, col: 0, readOnly: true }],
    }, arriving, 'test');

    expect(departing).toEqual([['old']]);
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

  it('runs the work an update owed against the data of its own call', () => {
    createGrid({ data: [['old']], owedWorkProbe: true });

    hot._applySettingsAndData({ owedWorkProbe: { pass: 1 } }, [['new']], 'test');

    expect(probeLog.filter(entry => entry[0] === 'owed')).toEqual([['owed', ['new']]]);
  });

  it('drops the work an update owed when the call throws, so a later call does not run it', () => {
    createGrid({ data: [['old']], owedWorkProbe: true });

    const failing = () => {
      throw new Error('load listener failed');
    };

    hot.addHook('afterLoadData', failing);

    expect(() => hot._applySettingsAndData({ owedWorkProbe: { pass: 1 } }, [['first']], 'test'))
      .toThrow('load listener failed');

    hot.removeHook('afterLoadData', failing);
    hot._applySettingsAndData({ colHeaders: true }, [['second']], 'test');

    expect(probeLog.filter(entry => entry[0] === 'owed')).toEqual([]);
  });

  it('records no owed work while the grid has no view, so the first later call does not run it', () => {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      owedWorkProbe: true,
      beforeInit() {
        this._applySettingsAndData({ owedWorkProbe: { pass: 1 } }, [['init']], 'test');
      },
    });

    hot._applySettingsAndData({ colHeaders: true }, [['later']], 'test');

    expect(probeLog.filter(entry => entry[0] === 'owed')).toEqual([]);
  });

  it('answers that the load is pending only before the load of the call', () => {
    const seen = [];

    createGrid({
      data: [['old']],
      afterUpdateSettings() {
        seen.push(['afterUpdateSettings', this._isDataLoadPending()]);
      },
      afterLoadData() {
        seen.push(['afterLoadData', this._isDataLoadPending()]);
      },
    });
    seen.length = 0;

    hot._applySettingsAndData({ colHeaders: true }, [['new']], 'test');

    expect(seen).toEqual([['afterUpdateSettings', true], ['afterLoadData', false]]);
    expect(hot._isDataLoadPending()).toBe(false);
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
