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

  it('should trim rows with client-side Filters when dataProvider has no fetchRows', async() => {
    handsontable({
      data: [
        { id: 1, name: 'Alice', city: 'Warsaw' },
        { id: 2, name: 'Bob', city: 'Berlin' },
      ],
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: { rowId: 'id' },
    });

    await render();

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(2, 'eq', ['Warsaw']);
    filtersPlugin.filter();

    await render();

    expect(countRows()).toBe(1);
    expect(getDataAtCell(0, 2)).toBe('Warsaw');
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

  it('should render every row from fetchRows after filter when several rows share the filtered value', async() => {
    const rows = [
      { id: 37, model: 'Carbon Handlebar', price: 60.41 },
      { id: 76, model: 'Carbon Handlebar', price: 309.18 },
    ];

    const beforeDataProviderFetch = jasmine.createSpy('beforeDataProviderFetch');
    const afterDataProviderFetch = jasmine.createSpy('afterDataProviderFetch');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'model' }, { data: 'price' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows, totalRows: 2 }),
      }),
      beforeDataProviderFetch,
      afterDataProviderFetch,
    });

    await sleep(50);

    expect(beforeDataProviderFetch).toHaveBeenCalledTimes(1);
    expect(afterDataProviderFetch).toHaveBeenCalledTimes(1);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(1, 'contains', ['carbon handlebar']);
    filtersPlugin.filter();

    await sleep(50);

    expect(beforeDataProviderFetch).toHaveBeenCalledTimes(2);
    expect(afterDataProviderFetch).toHaveBeenCalledTimes(2);
    expect(afterDataProviderFetch.calls.mostRecent().args[0].queryParameters.filters).not.toBeNull();

    expect(countRows()).toBe(2);
    expect(getDataAtCell(0, 1)).toBe('Carbon Handlebar');
    expect(getDataAtCell(1, 1)).toBe('Carbon Handlebar');
  });

  it('should pass Filters UI conditions to fetchRows after updateSettings changes dataProvider', async() => {
    const fetchRows1 = jasmine.createSpy('fetchRows1').and.returnValue(
      Promise.resolve({ rows: [{ id: 1, name: 'A', city: 'Warsaw' }], totalRows: 1 })
    );
    const fetchRows2 = jasmine.createSpy('fetchRows2').and.returnValue(
      Promise.resolve({ rows: [{ id: 1, name: 'A', city: 'Warsaw' }], totalRows: 1 })
    );

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: createDataProviderConfig({ fetchRows: fetchRows1 }),
    });

    await sleep(50);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(2, 'eq', ['Warsaw']);
    filtersPlugin.filter();

    await sleep(100);

    await updateSettings({
      dataProvider: createDataProviderConfig({ fetchRows: fetchRows2 }),
    });

    await sleep(100);

    expect(fetchRows2).toHaveBeenCalled();
    const [params] = fetchRows2.calls.mostRecent().args;

    expect(params.filters).not.toBeNull();
    expect(params.filters[0]).toEqual(jasmine.objectContaining({
      prop: 'city',
      operation: 'conjunction',
    }));
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

  it('should roll Filters conditions back to the last good state when fetchRows rejects after a new filter', async() => {
    const allRows = [
      { id: 1, name: 'Alice', city: 'Warsaw' },
      { id: 2, name: 'Bob', city: 'Berlin' },
      { id: 3, name: 'Carol', city: 'Warsaw' },
    ];
    const warsawRows = allRows.filter(r => r.city === 'Warsaw');
    let fetchCall = 0;

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => {
          fetchCall += 1;

          if (fetchCall === 1) {
            return Promise.resolve({ rows: allRows, totalRows: allRows.length });
          }

          if (fetchCall === 2) {
            return Promise.resolve({ rows: warsawRows, totalRows: warsawRows.length });
          }

          return Promise.reject(new Error('fetchRows failed'));
        },
      }),
    });

    const dataProviderPlugin = getPlugin('dataProvider');
    const originalFetchData = dataProviderPlugin.fetchData.bind(dataProviderPlugin);

    dataProviderPlugin.fetchData = (...args) =>
      originalFetchData(...args).catch(() => {
        // fetchData already invoked afterDataProviderFetchError before rejecting; consume rejection because filter() does not await fetchData.
      });

    await sleep(50);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(2, 'eq', ['warsaw']);
    filtersPlugin.filter();

    await sleep(100);

    const conditionsAfterWarsawFetch = filtersPlugin.exportConditions();

    expect(conditionsAfterWarsawFetch.length).toBeGreaterThan(0);

    filtersPlugin.clearConditions();
    filtersPlugin.addCondition(2, 'eq', ['berlin']);
    filtersPlugin.filter();

    await sleep(150);

    expect(filtersPlugin.exportConditions()).toEqual(conditionsAfterWarsawFetch);
  });

  it('should pass null (not an empty array) for filters in fetch params when no column filters apply', async() => {
    const filtersSnapshots = [];

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [
            { id: 1, name: 'A', city: 'Warsaw' },
          ],
          totalRows: 1,
        }),
      }),
      beforeDataProviderFetch: (params) => {
        filtersSnapshots.push(params.filters);
      },
    });

    await sleep(50);

    expect(filtersSnapshots[0]).toBeNull();

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(2, 'eq', ['warsaw']);
    filtersPlugin.filter();

    await sleep(100);

    expect(filtersSnapshots.length).toBeGreaterThanOrEqual(2);
    expect(filtersSnapshots[filtersSnapshots.length - 1]).not.toBeNull();
    expect(Array.isArray(filtersSnapshots[filtersSnapshots.length - 1])).toBe(true);

    filtersPlugin.clearConditions();
    filtersPlugin.filter();

    await sleep(100);

    expect(filtersSnapshots[filtersSnapshots.length - 1]).toBeNull();
  });

  it('should map fetchRows filters by column data prop when columns are reordered (no manualColumnMove with dataProvider)', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({
        rows: [{ id: 1, name: 'A', city: 'Warsaw' }],
        totalRows: 1,
      })
    );

    handsontable({
      data: [],
      columns: [{ data: 'city' }, { data: 'name' }, { data: 'id' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(50);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(0, 'eq', ['warsaw']);
    filtersPlugin.filter();

    await sleep(100);

    expect(fetchRows).toHaveBeenCalled();
    const [params] = fetchRows.calls.mostRecent().args;

    expect(params.filters[0]).toEqual(jasmine.objectContaining({
      prop: 'city',
      operation: 'conjunction',
      conditions: [{ name: 'eq', args: ['warsaw'] }],
    }));
  });

  it('should map fetchRows filters by column data prop when the first physical column is hidden', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({
        rows: [{ id: 1, name: 'A', city: 'Warsaw' }],
        totalRows: 1,
      })
    );

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }, { data: 'city' }],
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      hiddenColumns: {
        columns: [0],
        indicators: true,
      },
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(50);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(2, 'eq', ['warsaw']);
    filtersPlugin.filter();

    await sleep(100);

    expect(fetchRows).toHaveBeenCalled();
    const [params] = fetchRows.calls.mostRecent().args;

    expect(params.filters[0]).toEqual(jasmine.objectContaining({
      prop: 'city',
      operation: 'conjunction',
      conditions: [{ name: 'eq', args: ['warsaw'] }],
    }));
  });
});
