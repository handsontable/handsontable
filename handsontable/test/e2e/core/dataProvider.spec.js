describe('Core dataProvider', () => {
  const id = 'testContainer';

  function createDeferred() {
    let resolve;
    let reject;

    const promise = new Promise((nextResolve, nextReject) => {
      resolve = nextResolve;
      reject = nextReject;
    });

    return { promise, resolve, reject };
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should fetch and render rows on initialization', async() => {
    const afterDataProviderResponse = jasmine.createSpy('afterDataProviderResponse');
    const dataProvider = jasmine.createSpy('dataProvider').and.callFake(async() => ({
      rows: [['server-A1', 'server-B1']],
      totalRows: 1,
    }));

    const hot = handsontable({
      dataProvider,
      afterDataProviderResponse,
      colHeaders: true,
    });

    await sleep(0);

    expect(dataProvider).toHaveBeenCalledTimes(1);
    expect(dataProvider.calls.argsFor(0)[0]).toEqual({
      page: 1,
      pageSize: 20,
      sort: null,
      filters: null,
    });
    expect(dataProvider.calls.argsFor(0)[1].signal).toBeDefined();
    expect(afterDataProviderResponse).toHaveBeenCalledWith({
      rows: [['server-A1', 'server-B1']],
      totalRows: 1,
    }, {
      page: 1,
      pageSize: 20,
      sort: null,
      filters: null,
    });
    expect(hot.getQueryParameters()).toEqual({
      page: 1,
      pageSize: 20,
      sort: null,
      filters: null,
    });
    expect(hot.getSettings().rowId).toBe('id');
    expect(getDataAtCell(0, 0)).toBe('server-A1');
    expect(getDataAtCell(0, 1)).toBe('server-B1');
  });

  it('should re-fetch rows when `refreshData()` is called', async() => {
    let requestCounter = 0;
    const dataProvider = jasmine.createSpy('dataProvider').and.callFake(async() => {
      requestCounter += 1;

      return {
        rows: [[`server-${requestCounter}`]],
        totalRows: 1,
      };
    });

    const hot = handsontable({
      dataProvider,
    });

    await sleep(0);
    expect(getDataAtCell(0, 0)).toBe('server-1');

    await hot.refreshData();

    expect(dataProvider).toHaveBeenCalledTimes(2);
    expect(getDataAtCell(0, 0)).toBe('server-2');
  });

  it('should pass modified query parameters from `beforeDataProviderRequest` hook', async() => {
    const dataProvider = jasmine.createSpy('dataProvider').and.callFake(async() => ({
      rows: [['A1']],
      totalRows: 1,
    }));

    handsontable({
      dataProvider,
      beforeDataProviderRequest(queryParameters) {
        return {
          ...queryParameters,
          page: 2,
          pageSize: 50,
        };
      },
    });

    await sleep(0);

    expect(dataProvider.calls.argsFor(0)[0]).toEqual({
      page: 2,
      pageSize: 50,
      sort: null,
      filters: null,
    });
  });

  it('should call `afterDataProviderError` hook when provider rejects', async() => {
    const afterDataProviderError = jasmine.createSpy('afterDataProviderError');

    handsontable({
      dataProvider: async() => Promise.reject(new Error('Request failed')),
      afterDataProviderError,
    });

    await sleep(0);

    expect(afterDataProviderError).toHaveBeenCalledTimes(1);
    expect(afterDataProviderError.calls.argsFor(0)[0].message).toBe('Request failed');
  });

  it('should abort stale requests when refreshing data', async() => {
    const firstRequest = createDeferred();
    const secondRequest = createDeferred();
    const dataProvider = jasmine.createSpy('dataProvider')
      .and.returnValues(firstRequest.promise, secondRequest.promise);

    const hot = handsontable({
      dataProvider,
    });

    await sleep(0);

    const firstSignal = dataProvider.calls.argsFor(0)[1].signal;
    const refreshPromise = hot.refreshData();

    expect(firstSignal.aborted).toBe(true);

    firstRequest.resolve({
      rows: [['stale']],
      totalRows: 1,
    });
    secondRequest.resolve({
      rows: [['fresh']],
      totalRows: 1,
    });
    await refreshPromise;

    expect(getDataAtCell(0, 0)).toBe('fresh');
  });

  it('should prefer `dataProvider` over `data` and warn about the conflict', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [['from-data']],
      dataProvider: async() => ({
        rows: [['from-provider']],
        totalRows: 1,
      }),
    });

    await sleep(0);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith('Both `data` and `dataProvider` are defined in your configuration. ' +
      'The `dataProvider` option has priority, and the `data` option will be ignored.');
    expect(getDataAtCell(0, 0)).toBe('from-provider');
  });
});
