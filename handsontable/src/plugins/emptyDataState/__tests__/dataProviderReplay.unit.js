import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

// The specs in this file provoke console output on purpose (a product warning, or a library's
// own), and the cases that care assert it through a spy of their own. Keep the rest out of the
// Jest output, so a warning nobody expected stands out in a run.
let expectedConsoleSpies;

beforeEach(() => {
  expectedConsoleSpies = ['warn'].map(level => jest.spyOn(console, level).mockImplementation(() => {}));
});

afterEach(() => {
  expectedConsoleSpies.forEach(spy => spy.mockRestore());
});

describe('EmptyDataState loading overlay and a replayed DataProvider response', () => {
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

  it('stays visible while the fetch it waits for runs, and hides when that fetch loads', async() => {
    const pending = [];
    const fetchRows = jest.fn(() => new Promise((resolve) => {
      pending.push(resolve);
    }));

    hot = new Handsontable(container, {
      columns: [{ data: 'id' }],
      emptyDataState: true,
      dataProvider: {
        rowId: 'id',
        fetchRows,
        onRowsCreate: async() => [],
        onRowsUpdate: async() => {},
        onRowsRemove: async() => {},
      },
      licenseKey: TEST_LICENSE_KEY,
    });
    await flush();

    pending.shift()({ rows: [{ id: 1 }, { id: 2 }], totalRows: 2 });
    await flush();

    const dataProvider = hot.getPlugin('dataProvider');
    const emptyDataState = hot.getPlugin('emptyDataState');
    const loaded = jest.fn();

    hot.addHook('afterDataProviderFetch', loaded);
    void dataProvider.fetchData();

    expect(emptyDataState.isVisible()).toBe(true);

    dataProvider._restoreFetchResult({ totalRows: 2, queryParameters: dataProvider.getQueryParameters() });

    expect(loaded).toHaveBeenCalledWith(expect.objectContaining({ isRestored: true }));
    expect(emptyDataState.isVisible()).toBe(true);

    pending.shift()({ rows: [{ id: 1 }, { id: 2 }], totalRows: 2 });
    await flush();

    expect(emptyDataState.isVisible()).toBe(false);
  });
});
