describe('DataProvider with Filters plugin', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should hide "Filter by value" section when dataProvider is enabled', async() => {
    const rows = [
      { id: 1, name: 'A1', city: 'Warsaw' },
      { id: 2, name: 'B2', city: 'Berlin' },
    ];

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows, totalRows: 2 }),
      }),
    });

    await sleep(50);

    const dropdownMenuPlugin = getPlugin('dropdownMenu');

    dropdownMenuPlugin.open(0);

    await sleep(100);

    const menuRoot = document.querySelector('.htDropdownMenu');

    expect(menuRoot).not.toBeNull();
    expect(menuRoot.querySelector('.htFiltersMenuValue')).toBeNull();
  });

  it('should preserve filter conditions after dataProvider fetch completes', async() => {
    const rowsPage1 = [
      { id: 1, name: 'Alice', city: 'Warsaw' },
      { id: 2, name: 'Bob', city: 'Berlin' },
    ];
    const rowsPage2 = [
      { id: 3, name: 'Charlie', city: 'Warsaw' },
      { id: 4, name: 'Diana', city: 'Berlin' },
    ];

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      pagination: true,
      dataProvider: createDataProviderConfig({
        fetchRows: (params) => {
          const page = params?.page ?? 1;
          const rows = page === 1 ? rowsPage1 : rowsPage2;

          return Promise.resolve({ rows, totalRows: 4 });
        },
      }),
    });

    await sleep(50);

    const filtersPlugin = getPlugin('filters');
    const dataProviderPlugin = getPlugin('dataProvider');

    filtersPlugin.addCondition(2, 'eq', ['Warsaw']);
    filtersPlugin.filter();

    await sleep(100);

    const conditionsAfterFilter = filtersPlugin.exportConditions();

    expect(conditionsAfterFilter.length).toBeGreaterThan(0);

    await dataProviderPlugin.fetchData({ page: 2 });
    await sleep(50);

    const conditionsAfterPage2 = filtersPlugin.exportConditions();

    expect(conditionsAfterPage2).toEqual(conditionsAfterFilter);

    await dataProviderPlugin.fetchData({ page: 1 });
    await sleep(50);

    const conditionsAfterPage1 = filtersPlugin.exportConditions();

    expect(conditionsAfterPage1).toEqual(conditionsAfterFilter);
  });

  it('should pass filters with prop (column data key) to fetchRows, same as sort', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({ rows: [{ id: 1, name: 'A', city: 'Warsaw' }], totalRows: 1 })
    );

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(50);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(2, 'eq', ['Warsaw']);
    filtersPlugin.filter();

    await sleep(100);

    expect(fetchRows).toHaveBeenCalled();
    const [params] = fetchRows.calls.mostRecent().args;

    expect(params.filters).not.toBeNull();
    expect(Array.isArray(params.filters)).toBe(true);
    expect(params.filters.length).toBe(1);
    // Filters plugin normalizes string condition args to lowercase for client-side matching.
    expect(params.filters[0]).toEqual(jasmine.objectContaining({
      prop: 'city',
      operation: 'conjunction',
      conditions: [{ name: 'eq', args: ['warsaw'] }],
    }));
  });

  it('should ignore addCondition(column, "by_value", ...) when dataProvider is enabled', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(2, 'by_value', [['Warsaw', 'Berlin']]);

    const conditions = filtersPlugin.exportConditions();

    expect(conditions.length).toBe(0);
    expect(conditions.filter(c => c.conditions.some(cond => cond.name === 'by_value')).length).toBe(0);
  });
});
