describe('DataProvider `afterDataProviderFetch` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be called after successful fetch with result', async() => {
    const afterFetch = jasmine.createSpy('afterDataProviderFetch');
    const rows = [{ id: 1, name: 'A' }];

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows, totalRows: 1 }),
      }),
      afterDataProviderFetch: afterFetch,
    });

    await sleep(50);

    expect(afterFetch).toHaveBeenCalledTimes(1);
    const [result] = afterFetch.calls.mostRecent().args;

    expect(result.rows).toEqual(rows);
    expect(result.totalRows).toBe(1);
    expect(result.queryParameters).toEqual(jasmine.objectContaining({
      page: 1,
      pageSize: 10,
    }));
    expect(result.columnSortConfig).toEqual([]);
    expect(result.filtersConditionsStack).toEqual([]);
  });

  it('should be called after fetchData', async() => {
    const afterFetch = jasmine.createSpy('afterDataProviderFetch');

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 25 }),
      }),
      afterDataProviderFetch: afterFetch,
    });

    await sleep(50);

    afterFetch.calls.reset();

    const plugin = getPlugin('dataProvider');

    await plugin.fetchData({ page: 2 });

    expect(afterFetch).toHaveBeenCalledTimes(1);
    expect(afterFetch.calls.mostRecent().args[0].queryParameters.page).toBe(2);
  });
});
