import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { DataProvider } from '../dataProvider';

const flush = () => new Promise(resolve => queueMicrotask(resolve));

/**
 * Lets every queued microtask chain run to its end.
 *
 * @returns {Promise<void>}
 */
async function settle() {
  for (let i = 0; i < 20; i++) {
    await flush();
  }
}

/**
 * @returns {object} A `dataProvider` config that answers every fetch with one row.
 */
function createProvider() {
  return {
    rowId: 'id',
    fetchRows: jest.fn(() => Promise.resolve({ rows: [{ id: 1, name: 'Row' }], totalRows: 1 })),
    onRowsCreate: jest.fn(() => Promise.resolve()),
    onRowsUpdate: jest.fn(() => Promise.resolve()),
    onRowsRemove: jest.fn(() => Promise.resolve()),
  };
}

/**
 * DataProvider starts the fetch of an enable or update in the ready step (`onGridReady()`), once the call
 * returns. An enable or update made inside `_runWithoutFetching()` owes no fetch, even when the step runs
 * after that scope has ended.
 */
describe('DataProvider ready step', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(DataProvider);
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
   * Builds a grid.
   *
   * @param {object} settings Settings merged over the defaults.
   * @returns {Handsontable}
   */
  function buildGrid(settings) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      ...settings,
    });

    return hot;
  }

  it('should start the first fetch before the init hook', async() => {
    const provider = createProvider();
    const fetchesAtInit = [];

    buildGrid({
      dataProvider: provider,
      init() {
        fetchesAtInit.push(provider.fetchRows.mock.calls.length);
      },
    });
    await settle();

    expect(fetchesAtInit).toEqual([1]);
    expect(provider.fetchRows).toHaveBeenCalledTimes(1);
  });

  it('should fetch once when updateSettings() turns the plugin on', async() => {
    const provider = createProvider();

    buildGrid({});
    hot.updateSettings({ dataProvider: provider });
    await settle();

    expect(provider.fetchRows).toHaveBeenCalledTimes(1);
  });

  it('should fetch after a direct disable and enable', async() => {
    const provider = createProvider();

    buildGrid({ dataProvider: provider });
    await settle();
    provider.fetchRows.mockClear();

    const plugin = hot.getPlugin('dataProvider');

    plugin.disablePlugin();
    plugin.enablePlugin();
    await settle();

    expect(provider.fetchRows).toHaveBeenCalledTimes(1);
  });

  it('should not fetch for an enable made inside `_runWithoutFetching()`, even from an outer pass', async() => {
    const provider = createProvider();

    buildGrid({ dataProvider: provider });
    await settle();
    provider.fetchRows.mockClear();

    const plugin = hot.getPlugin('dataProvider');

    plugin.disablePlugin();
    // Inside an outer lifecycle pass the step runs when that pass closes, after the passive scope has ended.
    hot._runInPluginLifecyclePass(() => {
      plugin._runWithoutFetching(() => plugin.enablePlugin());
    });
    await settle();

    expect(plugin.enabled).toBe(true);
    expect(provider.fetchRows).not.toHaveBeenCalled();
  });
});
