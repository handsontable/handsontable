describe('DataProvider `getQueryParameters` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return initial defaults when no fetch occurred', async() => {
    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => new Promise(() => {}),
      }),
    });

    const plugin = getPlugin('dataProvider');
    const params = plugin.getQueryParameters();

    expect(params).toEqual({
      page: 1,
      pageSize: 10,
      sort: null,
      filters: null,
    });
  });

  it('should return last successful fetch parameters', async() => {
    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: p => Promise.resolve({
          rows: [],
          totalRows: 60,
          _params: p,
        }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.fetchData({ page: 3, pageSize: 20 });

    const params = plugin.getQueryParameters();

    expect(params.page).toBe(3);
    expect(params.pageSize).toBe(20);
    expect(params.sort).toBeNull();
    expect(params.filters).toBeNull();
  });

  it('should return a copy so mutating does not affect internal state', async() => {
    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');
    const params = plugin.getQueryParameters();

    params.page = 999;
    params.pageSize = 999;

    expect(plugin.getQueryParameters().page).toBe(1);
    expect(plugin.getQueryParameters().pageSize).toBe(10);
  });

  it('should return detached sort and filters so mutating them does not affect internal state', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1, city: 'Warsaw' }], totalRows: 1 }),
      }),
    });

    await sleep(50);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(1, 'eq', ['Warsaw']);
    filtersPlugin.filter();

    await sleep(100);

    const plugin = getPlugin('dataProvider');
    const params = plugin.getQueryParameters();

    expect(params.sort).toBeNull();
    expect(params.filters).not.toBeNull();
    params.filters[0].conditions[0].args[0] = 'mutated';
    params.sort = { prop: 'id', order: 'asc' };

    const again = plugin.getQueryParameters();

    expect(again.sort).toBeNull();
    expect(again.filters[0].conditions[0].args[0]).not.toBe('mutated');
  });
});
