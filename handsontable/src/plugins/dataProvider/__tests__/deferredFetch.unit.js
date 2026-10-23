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
 * @param {string[]} log The list each `fetchRows` call is recorded in.
 * @returns {object} A `dataProvider` config that answers every fetch with one row.
 */
function createProvider(log) {
  return {
    rowId: 'id',
    fetchRows: jest.fn(() => {
      log.push('fetchRows');

      return Promise.resolve({ rows: [{ id: 1, name: 'Row' }], totalRows: 1 });
    }),
    onRowsCreate: jest.fn(() => Promise.resolve()),
    onRowsUpdate: jest.fn(() => Promise.resolve()),
    onRowsRemove: jest.fn(() => Promise.resolve()),
  };
}

/**
 * `Core#_applySettingsAndData()` loads the data a `dataProvider` update comes with before the plugin
 * fetches, so the fetch starts from the configuration of the call, not from the grid it replaces.
 */
describe('DataProvider fetch held for onDataReady()', () => {
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
   * @param {string[]} log The list hooks and fetches are recorded in.
   * @returns {Promise<Handsontable>} A grid built on its own `dataProvider`, with its first fetch settled.
   */
  async function createGrid(log) {
    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createProvider([]),
    });
    await settle();
    hot.addHook('afterLoadData', () => log.push('afterLoadData'));

    return hot;
  }

  it('fetches once, after the load of the call', async() => {
    const log = [];

    await createGrid(log);

    const next = createProvider(log);

    hot._applySettingsAndData({ dataProvider: next }, [], 'test');
    await settle();

    expect(next.fetchRows).toHaveBeenCalledTimes(1);
    expect(log.slice(0, 2)).toEqual(['afterLoadData', 'fetchRows']);
  });

  it('fetches nothing while the plugin is kept from fetching', async() => {
    const log = [];

    await createGrid(log);

    const next = createProvider(log);

    hot.getPlugin('dataProvider')._runWithoutFetching(() => {
      hot._applySettingsAndData({ dataProvider: next }, [], 'test');
    });
    await settle();

    expect(next.fetchRows).not.toHaveBeenCalled();
  });
});
