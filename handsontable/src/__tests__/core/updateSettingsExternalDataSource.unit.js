import Handsontable from 'handsontable';
import { waitUntil as waitFor } from '../../../test/helpers/common';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Builds a complete DataProvider configuration over `count` products, answering the page and page size it is
 * asked for.
 *
 * @param {number} count The number of rows the server holds.
 * @returns {object}
 */
function createServerConfig(count) {
  const rows = Array.from({ length: count }, (_, index) => ({ id: index + 1, name: `Product ${index + 1}` }));
  const noop = () => {};

  return {
    rowId: 'id',
    fetchRows: jest.fn(async({ page, pageSize }) => ({
      rows: rows.slice((page - 1) * pageSize, page * pageSize),
      totalRows: rows.length,
    })),
    onRowsCreate: noop,
    onRowsUpdate: noop,
    onRowsRemove: noop,
  };
}

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
    jest.restoreAllMocks();
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

  it('should fetch when updateSettings turns DataProvider on for a grid built with local data', async() => {
    const config = createServerConfig(2);

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [{ id: 9, name: 'Local row' }],
      columns: [{ data: 'id' }, { data: 'name' }],
    });

    await hot.updateSettings({ dataProvider: config });
    await waitFor(() => hot.countRows() === 2);

    expect(hot.getData()).toEqual([[1, 'Product 1'], [2, 'Product 2']]);
    expect(config.fetchRows).toHaveBeenCalledTimes(1);
  });

  it('should fetch when a `dataProvider` object completed in place is sent again', async() => {
    const config = { rowId: 'id' };

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      data: [{ id: 9, name: 'Local row' }],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: config,
    });

    await delay(20);

    expect(hot.getData()).toEqual([[9, 'Local row']]);

    const server = createServerConfig(2);

    Object.assign(config, server);
    await hot.updateSettings({ dataProvider: config });
    await waitFor(() => hot.countRows() === 2 && hot.getDataAtCell(0, 0) === 1);

    expect(server.fetchRows).toHaveBeenCalledTimes(1);
  });

  it('should fetch with another page size sent beside the same `dataProvider` object', async() => {
    const config = createServerConfig(20);

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      pagination: { pageSize: 5 },
      dataProvider: config,
    });

    await waitFor(() => hot.countRows() === 5);
    await hot.updateSettings({ dataProvider: config, pagination: { pageSize: 2 } });
    await waitFor(() => hot.countRows() === 2);

    expect(config.fetchRows).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, pageSize: 2 }),
      expect.anything()
    );
    expect(hot.getPlugin('dataProvider').getQueryParameters()).toEqual(expect.objectContaining({ pageSize: 2 }));
    expect(hot.getPlugin('pagination').getPaginationData()).toEqual(expect.objectContaining({
      currentPage: 1,
      pageSize: 2,
      totalPages: 10,
    }));
  });

  it('should keep the page and the pager total when the same `dataProvider` and `pagination` are sent again',
    async() => {
      const config = createServerConfig(20);
      const pagination = { pageSize: 5 };

      hot = new Handsontable(container, {
        licenseKey: 'non-commercial-and-evaluation',
        columns: [{ data: 'id' }, { data: 'name' }],
        pagination,
        dataProvider: config,
      });

      await waitFor(() => hot.countRows() === 5);

      hot.getPlugin('pagination').setPage(3);
      await waitFor(() => hot.getDataAtCell(0, 0) === 11);

      const fetches = config.fetchRows.mock.calls.length;

      await hot.updateSettings({ data: [], dataProvider: config, pagination });
      await delay(50);

      expect(hot.getDataAtCell(0, 0)).toBe(11);
      expect(config.fetchRows).toHaveBeenCalledTimes(fetches);
      expect(hot.getPlugin('pagination').getPaginationData()).toEqual(expect.objectContaining({
        currentPage: 3,
        pageSize: 5,
        totalPages: 4,
      }));
    });

  it('should fetch the unfiltered rows when the same `dataProvider` is sent beside a re-applied Filters', async() => {
    const config = createServerConfig(4);

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      filters: true,
      dropdownMenu: true,
      dataProvider: config,
    });

    await waitFor(() => hot.countRows() === 4);

    const filters = hot.getPlugin('filters');

    filters.addCondition(1, 'contains', ['Product 2']);
    filters.filter();
    await waitFor(() => hot.getPlugin('dataProvider').getQueryParameters().filters !== null);

    const fetches = config.fetchRows.mock.calls.length;

    await hot.updateSettings({ dataProvider: config, filters: true });
    await waitFor(() => config.fetchRows.mock.calls.length === fetches + 1);

    expect(filters.exportConditions()).toEqual([]);
    expect(hot.getPlugin('dataProvider').getQueryParameters().filters).toBeNull();
    expect(config.fetchRows).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: null }),
      expect.anything()
    );
  });

  it('should re-apply the plugin for the same `dataProvider` object while passive', async() => {
    const config = createServerConfig(20);

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: config,
    });

    await waitFor(() => hot.countRows() === 10);

    const plugin = hot.getPlugin('dataProvider');

    await plugin.fetchData({ page: 2 });

    plugin._runWithoutFetching(() => hot.updateSettings({ dataProvider: config }));

    expect(plugin.getQueryParameters().page).toBe(1);
  });

  it('should use members changed in place on the next fetch instead of refetching at once', async() => {
    const config = createServerConfig(2);

    hot = new Handsontable(container, {
      licenseKey: 'non-commercial-and-evaluation',
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: config,
    });

    await waitFor(() => hot.countRows() === 2);

    const nextFetchRows = jest.fn().mockResolvedValue({ rows: [{ id: 3, name: 'Product 3' }], totalRows: 1 });

    config.fetchRows = nextFetchRows;
    await hot.updateSettings({ dataProvider: config });
    await delay(50);

    expect(nextFetchRows).not.toHaveBeenCalled();
    expect(hot.countRows()).toBe(2);

    await hot.getPlugin('dataProvider').fetchData();

    expect(nextFetchRows).toHaveBeenCalledTimes(1);
    expect(hot.getData()).toEqual([[3, 'Product 3']]);
  });
});
