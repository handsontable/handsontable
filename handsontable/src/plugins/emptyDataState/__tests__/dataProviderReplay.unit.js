import Handsontable from '../../../index';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

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
      data: [],
      columns: [{ data: 'id' }],
      emptyDataState: true,
      dataProvider: {
        rowId: 'id',
        fetchRows,
        onRowsCreate: async() => [],
        onRowsUpdate: async() => {},
        onRowsRemove: async() => {},
      },
      licenseKey: 'non-commercial-and-evaluation',
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
