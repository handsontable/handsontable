import Handsontable from 'handsontable';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Core#updateSettings with external data source', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    hot = null;
  });

  afterEach(() => {
    if (hot) {
      hot.destroy();
    }
    container.remove();
  });

  it('should not clear loaded rows when updateSettings changes an unrelated option', async() => {
    const noop = () => {};
    const fetchRows = jest.fn().mockResolvedValue({
      rows: [{ id: 1, name: 'A' }],
      totalRows: 1,
    });

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: {
        rowId: 'id',
        fetchRows,
        onRowsCreate: noop,
        onRowsUpdate: noop,
        onRowsRemove: noop,
      },
    });

    await delay(50);

    expect(hot.countRows()).toBe(1);
    expect(fetchRows).toHaveBeenCalledTimes(1);

    await hot.updateSettings({ height: 500 });

    await delay(50);

    expect(hot.countRows()).toBe(1);
    expect(hot.getDataAtCell(0, 0)).toBe(1);
    expect(hot.getDataAtCell(0, 1)).toBe('A');
    expect(fetchRows).toHaveBeenCalledTimes(1);
  });

  it('should keep ignoring static data after a DataProvider updatePlugin cycle', async() => {
    const noop = () => {};
    const dp = {
      rowId: 'id',
      fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
      onRowsCreate: noop,
      onRowsUpdate: noop,
      onRowsRemove: noop,
    };

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: dp,
    });

    await delay(50);

    expect(hot.runHooks('hasExternalDataSource')).toBe(true);

    await hot.updateSettings({ dataProvider: { ...dp } });

    await delay(50);

    expect(hot.runHooks('hasExternalDataSource')).toBe(true);

    await hot.updateSettings({ data: [[99, 'Replaced']] });

    expect(hot.countRows()).toBe(1);
    expect(hot.getDataAtCell(0, 0)).toBe(1);
    expect(hot.getDataAtCell(0, 1)).toBe('A');
  });

  describe('a payload that does not replace `dataProvider`', () => {
    const noop = () => {};
    let fetchRows;
    let config;
    let warnSpy;

    beforeEach(async() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      fetchRows = jest.fn().mockResolvedValue({
        rows: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
        totalRows: 2,
      });
      config = {
        rowId: 'id',
        fetchRows,
        onRowsCreate: noop,
        onRowsUpdate: noop,
        onRowsRemove: noop,
      };
      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        data: [],
        columns: [{ data: 'id' }, { data: 'name' }],
        dataProvider: config,
      });

      await delay(50);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('should keep the loaded rows and not refetch when it sends only `data`', async() => {
      await hot.updateSettings({ data: [{ id: 9, name: 'X' }] });
      await delay(50);

      expect(hot.getData()).toEqual([[1, 'A'], [2, 'B']]);
      expect(fetchRows).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        'The "data" setting is ignored when "hasExternalDataSource" returns `true`.'
      );
    });

    it('should keep the loaded rows and not refetch when it sends the same `dataProvider` object again', async() => {
      await hot.updateSettings({ data: [], dataProvider: config, height: 300 });
      await delay(50);

      expect(hot.getData()).toEqual([[1, 'A'], [2, 'B']]);
      expect(fetchRows).toHaveBeenCalledTimes(1);
    });

    it('should keep the query when it sends the same `dataProvider` object again', async() => {
      await hot.getPlugin('dataProvider').fetchData({ page: 2, pageSize: 1 });

      await hot.updateSettings({ dataProvider: config });
      await delay(50);

      expect(hot.getPlugin('dataProvider').getQueryParameters()).toEqual(expect.objectContaining({
        page: 2,
        pageSize: 1,
      }));
      expect(fetchRows).toHaveBeenCalledTimes(2);
    });
  });

  it('should replace the rows and refetch when updateSettings sends another `dataProvider` object', async() => {
    const noop = () => {};
    const config = {
      rowId: 'id',
      fetchRows: jest.fn().mockResolvedValue({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
      onRowsCreate: noop,
      onRowsUpdate: noop,
      onRowsRemove: noop,
    };
    const nextFetchRows = jest.fn().mockResolvedValue({
      rows: [{ id: 2, name: 'B' }, { id: 3, name: 'C' }],
      totalRows: 2,
    });

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: config,
    });

    await delay(50);

    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await hot.updateSettings({ data: [], dataProvider: { ...config, fetchRows: nextFetchRows } });

    expect(hot.countRows()).toBe(0);

    await delay(50);

    expect(hot.getData()).toEqual([[2, 'B'], [3, 'C']]);
    expect(nextFetchRows).toHaveBeenCalledTimes(1);
  });

  it('should let the first fetch land when the same `dataProvider` object is sent while it runs', async() => {
    const noop = () => {};
    let resolveFetch;
    const fetchRows = jest.fn(() => new Promise((resolve) => {
      resolveFetch = resolve;
    }));
    const config = {
      rowId: 'id',
      fetchRows,
      onRowsCreate: noop,
      onRowsUpdate: noop,
      onRowsRemove: noop,
    };
    const afterDataProviderFetchAbort = jest.fn();

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: config,
      afterDataProviderFetchAbort,
    });

    await delay(0);

    expect(fetchRows).toHaveBeenCalledTimes(1);

    await hot.updateSettings({ dataProvider: config });

    resolveFetch({ rows: [{ id: 1, name: 'A' }], totalRows: 1 });
    await delay(50);

    expect(hot.getData()).toEqual([[1, 'A']]);
    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(afterDataProviderFetchAbort).not.toHaveBeenCalled();
  });
});
