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
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1 }, { id: 2 }, { id: 3 }],
        }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.getTotalRows()).toBe(3);
  });

  it('should use rows.length as totalRows when result.totalRows is negative', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1 }, { id: 2 }],
          totalRows: -1,
        }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.getTotalRows()).toBe(2);
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

    await plugin.fetchData({ page: 2, pageSize: 25 });

    expect(fetchRows).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 2, pageSize: 25 }),
      jasmine.any(Object)
    );
    expect(plugin.getTotalRows()).toBe(100);
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

      return Promise.resolve({ rows: [{ id: 1 }], totalRows: 1 });
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

    expect(result).toEqual({ rows: [{ id: 1 }], totalRows: 1 });
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
});
