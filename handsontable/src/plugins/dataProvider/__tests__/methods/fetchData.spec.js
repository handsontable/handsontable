describe('DataProvider `fetchData` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call fetchRows with default query parameters on init', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 })
    );

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(50);

    expect(fetchRows).toHaveBeenCalled();
    const [params] = fetchRows.calls.mostRecent().args;

    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(10);
    expect(params.sort).toBeNull();
    expect(params.filters).toBeNull();
  });

  it('should use rows.length as totalRows when result.totalRows is missing or invalid', async() => {
    const afterFetch = jasmine.createSpy('afterDataProviderFetch');

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1 }, { id: 2 }, { id: 3 }],
        }),
      }),
      afterDataProviderFetch: afterFetch,
    });

    await sleep(50);

    expect(afterFetch).toHaveBeenCalled();
    expect(afterFetch.calls.mostRecent().args[0].totalRows).toBe(3);
  });

  it('should use rows.length as totalRows when result.totalRows is negative', async() => {
    const afterFetch = jasmine.createSpy('afterDataProviderFetch');

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1 }, { id: 2 }],
          totalRows: -1,
        }),
      }),
      afterDataProviderFetch: afterFetch,
    });

    await sleep(50);

    expect(afterFetch).toHaveBeenCalled();
    expect(afterFetch.calls.mostRecent().args[0].totalRows).toBe(2);
  });

  it('should load rows and update the table', async() => {
    const rows = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows, totalRows: 2 }),
      }),
    });

    await sleep(50);

    expect(countRows()).toBe(2);
    expect(getDataAtCell(0, 0)).toBe(1);
    expect(getDataAtCell(0, 1)).toBe('Alice');
    expect(getDataAtCell(1, 0)).toBe(2);
    expect(getDataAtCell(1, 1)).toBe('Bob');
  });

  it('should accept overrides (page, pageSize)', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({ rows: [], totalRows: 100 })
    );

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(50);

    fetchRows.calls.reset();

    const plugin = getPlugin('dataProvider');

    const fetchResult = await plugin.fetchData({ page: 2, pageSize: 25 });

    expect(fetchRows).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 2, pageSize: 25 }),
      jasmine.any(Object)
    );
    expect(fetchResult.totalRows).toBe(100);
  });

  it('should refetch at the last valid page when the requested page is past totalPages without aborting a duplicate request', async() => {
    const afterAbort = jasmine.createSpy('afterDataProviderFetchAbort');
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      if (params.page === 2) {
        return Promise.resolve({ rows: [], totalRows: 2 });
      }

      return Promise.resolve({
        rows: [{ id: 1 }, { id: 2 }],
        totalRows: 2,
      });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({ fetchRows }),
      afterDataProviderFetchAbort: afterAbort,
    });

    await sleep(50);

    fetchRows.calls.reset();
    afterAbort.calls.reset();

    const plugin = getPlugin('dataProvider');

    await plugin.fetchData({ page: 2, pageSize: 2, skipLoading: true });

    expect(fetchRows.calls.count()).toBe(2);
    expect(fetchRows.calls.argsFor(0)[0].page).toBe(2);
    expect(fetchRows.calls.argsFor(1)[0].page).toBe(1);
    expect(afterAbort).not.toHaveBeenCalled();
    expect(countRows()).toBe(2);
    expect(plugin.getQueryParameters().page).toBe(1);
  });

  it('should clamp page to at least 1', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({ rows: [], totalRows: 0 })
    );

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(50);

    fetchRows.calls.reset();

    const plugin = getPlugin('dataProvider');

    await plugin.fetchData({ page: 0 });
    await plugin.fetchData({ page: -5 });

    expect(fetchRows.calls.first().args[0].page).toBe(1);
    expect(fetchRows.calls.mostRecent().args[0].page).toBe(1);
  });

  it('should pass skipLoading to beforeDataProviderFetch and omit it from fetchRows', async() => {
    const beforeFetch = jasmine.createSpy('beforeDataProviderFetch');
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({ rows: [], totalRows: 0 })
    );

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({ fetchRows }),
      beforeDataProviderFetch: beforeFetch,
    });

    await sleep(50);

    beforeFetch.calls.reset();
    fetchRows.calls.reset();

    const plugin = getPlugin('dataProvider');

    await plugin.fetchData({ skipLoading: true });

    expect(beforeFetch).toHaveBeenCalled();
    const [hookParams] = beforeFetch.calls.mostRecent().args;

    expect(hookParams.skipLoading).toBe(true);

    const [rowsParams] = fetchRows.calls.mostRecent().args;

    expect(rowsParams.skipLoading).toBeUndefined();
  });

  it('should return null when beforeDataProviderFetch returns false', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({ rows: [], totalRows: 0 })
    );

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({ fetchRows }),
      beforeDataProviderFetch: () => false,
    });

    await sleep(50);

    fetchRows.calls.reset();

    const plugin = getPlugin('dataProvider');
    const result = await plugin.fetchData();

    expect(result).toBeNull();
    expect(fetchRows).not.toHaveBeenCalled();
  });

  it('should pass AbortSignal in options to fetchRows', async() => {
    let signalRef;

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: (params, options) => {
          signalRef = options.signal;

          return Promise.resolve({ rows: [], totalRows: 0 });
        },
      }),
    });

    await sleep(50);

    expect(signalRef).toBeDefined();
    expect(signalRef.aborted).toBe(false);
  });

  it('should abort previous fetch when fetchData is called again before first resolves', async() => {
    let resolveFirst;

    const firstFetchPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const fetchRows = jasmine.createSpy('fetchRows').and.callFake(() => {
      if (fetchRows.calls.count() === 1) {
        return firstFetchPromise;
      }

      return Promise.resolve({ rows: [{ id: 1 }], totalRows: 25 });
    });

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    plugin.fetchData();

    const secondResult = plugin.fetchData({ page: 2 });

    resolveFirst({ rows: [], totalRows: 0 });

    const result = await secondResult;

    expect(result).toEqual({ rows: [{ id: 1 }], totalRows: 25 });
    expect(plugin.getQueryParameters().page).toBe(2);
  });

  it('should return null when plugin is disabled (no fetchRows)', async() => {
    handsontable({
      data: [],
      dataProvider: false,
    });

    const plugin = getPlugin('dataProvider');
    const result = await plugin.fetchData();

    expect(result).toBeNull();
  });

  it('should not call fetchRows when beforeDataProviderFetch returns false', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(Promise.resolve({ rows: [], totalRows: 0 }));

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      beforeDataProviderFetch: () => false,
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(0);

    expect(fetchRows).not.toHaveBeenCalled();
  });

  it('should update getQueryParameters after a successful fetch', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: params => Promise.resolve({
          rows: [{ id: params.page }],
          totalRows: 100,
        }),
      }),
    });

    const plugin = getPlugin('dataProvider');

    await sleep(0);

    expect(plugin.getQueryParameters().page).toBe(1);

    await plugin.fetchData({ page: 3 });

    expect(plugin.getQueryParameters().page).toBe(3);
  });

  it('should not run afterDataProviderFetch until fetchRows resolves', async() => {
    const afterFetch = jasmine.createSpy('afterDataProviderFetch');

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => new Promise(() => {}),
      }),
      afterDataProviderFetch: afterFetch,
    });

    await sleep(10);

    expect(afterFetch).not.toHaveBeenCalled();
  });

  it('should return updated totalRows from each fetchData call', async() => {
    let totalRows = 10;

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');
    const first = await plugin.fetchData();

    expect(first.totalRows).toBe(10);

    totalRows = 99;
    const second = await plugin.fetchData();

    expect(second.totalRows).toBe(99);
  });
});
