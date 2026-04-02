describe('DataProvider `afterDataProviderFetchAbort` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should run when a newer fetchData aborts an in-flight fetchRows', async() => {
    let resolveFirst;

    const firstFetchPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const afterAbort = jasmine.createSpy('afterDataProviderFetchAbort');

    const fetchRows = jasmine.createSpy('fetchRows').and.callFake(() => {
      if (fetchRows.calls.count() === 1) {
        return firstFetchPromise;
      }

      return Promise.resolve({ rows: [{ id: 1 }], totalRows: 25 });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({ fetchRows }),
      afterDataProviderFetchAbort: afterAbort,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    const second = plugin.fetchData({ page: 2 });

    resolveFirst({ rows: [], totalRows: 0 });

    await second;
    await sleep(50);

    expect(afterAbort).toHaveBeenCalledTimes(1);
    expect(afterAbort).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1 }));
  });

  it('should run when fetchRows rejects with AbortError without firing afterDataProviderFetchError', async() => {
    const afterAbort = jasmine.createSpy('afterDataProviderFetchAbort');
    const afterError = jasmine.createSpy('afterDataProviderFetchError');
    const abortErr = Object.assign(new Error('Aborted'), { name: 'AbortError' });

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.reject(abortErr),
      }),
      afterDataProviderFetchAbort: afterAbort,
      afterDataProviderFetchError: afterError,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.fetchData();

    expect(afterAbort).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1 }), abortErr);
    expect(afterError).not.toHaveBeenCalled();
  });

  it('should not run on successful fetch', async() => {
    const afterAbort = jasmine.createSpy('afterDataProviderFetchAbort');
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({ rows: [{ id: 9 }], totalRows: 1 })
    );

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({ fetchRows }),
      afterDataProviderFetchAbort: afterAbort,
    });

    await sleep(50);

    expect(fetchRows).toHaveBeenCalled();
    expect(afterAbort).not.toHaveBeenCalled();

    await getPlugin('dataProvider').fetchData();

    await sleep(50);

    expect(fetchRows.calls.count()).toBe(2);
    expect(afterAbort).not.toHaveBeenCalled();
  });
});
