describe('Filters integration with DataProvider', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should trigger dataProvider with filters model when filter is applied', async() => {
    const fetchParams = [];

    handsontable({
      dataProvider: async(params) => {
        fetchParams.push({ ...params });

        return {
          rows: createSpreadsheetData(params.pageSize || 10, 3),
          totalRows: params.filters ? 5 : 50,
        };
      },
      columns: 3,
      dropdownMenu: true,
      filters: true,
      pagination: true,
    });

    await sleep(100);

    const filtersPlugin = getPlugin('filters');
    const dataProvider = getPlugin('dataProvider');

    filtersPlugin.addCondition(0, 'contains', ['a']);
    filtersPlugin.filter();

    await sleep(150);

    const lastCall = fetchParams[fetchParams.length - 1];

    expect(lastCall.filters).not.toBe(null);
    expect(Array.isArray(lastCall.filters)).toBe(true);
    expect(lastCall.filters.length).toBe(1);
    expect(lastCall.filters[0].column).toBe(0);
    expect(lastCall.filters[0].operation).toBe('conjunction');
    expect(lastCall.filters[0].conditions).toEqual([{ name: 'contains', args: ['a'] }]);
    expect(lastCall.page).toBe(1);
    expect(dataProvider.getQueryParameters().page).toBe(1);
    expect(dataProvider.getQueryParameters().filters).toEqual(lastCall.filters);
  });

  it('should reset page to 1 when filter is applied', async() => {
    const fetchParams = [];

    handsontable({
      dataProvider: async(params) => {
        fetchParams.push({ ...params });

        return {
          rows: createSpreadsheetData(params.pageSize || 10, 3),
          totalRows: 30,
        };
      },
      columns: 3,
      dropdownMenu: true,
      filters: true,
      pagination: { pageSize: 10 },
    });

    await sleep(100);

    const pagination = getPlugin('pagination');
    const filtersPlugin = getPlugin('filters');

    pagination.setPage(2);
    await sleep(100);

    expect(fetchParams[fetchParams.length - 1].page).toBe(2);

    filtersPlugin.addCondition(1, 'eq', ['x']);
    filtersPlugin.filter();

    await sleep(150);

    expect(fetchParams[fetchParams.length - 1].page).toBe(1);
    expect(getPlugin('dataProvider').getQueryParameters().page).toBe(1);
  });

  it('should trigger dataProvider with filters null when all filters are cleared', async() => {
    const fetchParams = [];

    handsontable({
      dataProvider: async(params) => {
        fetchParams.push({ ...params });

        return {
          rows: createSpreadsheetData(params.pageSize || 10, 3),
          totalRows: 50,
        };
      },
      columns: 3,
      dropdownMenu: true,
      filters: true,
      pagination: true,
    });

    await sleep(100);

    const filtersPlugin = getPlugin('filters');
    const dataProvider = getPlugin('dataProvider');

    filtersPlugin.addCondition(0, 'contains', ['a']);
    filtersPlugin.filter();
    await sleep(100);

    expect(fetchParams[fetchParams.length - 1].filters).not.toBe(null);

    filtersPlugin.clearConditions();
    filtersPlugin.filter();
    await sleep(150);

    const lastCall = fetchParams[fetchParams.length - 1];

    expect(lastCall.filters).toBe(null);
    expect(dataProvider.getQueryParameters().filters).toBe(null);
  });

  it('should combine multiple column filters correctly in the filters object', async() => {
    const fetchParams = [];

    handsontable({
      dataProvider: async(params) => {
        fetchParams.push({ ...params });

        return {
          rows: createSpreadsheetData(params.pageSize || 10, 4),
          totalRows: 20,
        };
      },
      columns: 4,
      dropdownMenu: true,
      filters: true,
      pagination: true,
    });

    await sleep(100);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(0, 'begins_with', ['a']);
    filtersPlugin.addCondition(1, 'gt', [10]);
    filtersPlugin.addCondition(2, 'contains', ['z']);
    filtersPlugin.filter();

    await sleep(150);

    const lastCall = fetchParams[fetchParams.length - 1];

    expect(lastCall.filters).not.toBe(null);
    expect(lastCall.filters.length).toBe(3);
    expect(lastCall.filters[0]).toEqual({
      column: 0,
      operation: 'conjunction',
      conditions: [{ name: 'begins_with', args: ['a'] }],
    });
    expect(lastCall.filters[1]).toEqual({
      column: 1,
      operation: 'conjunction',
      conditions: [{ name: 'gt', args: [10] }],
    });
    expect(lastCall.filters[2]).toEqual({
      column: 2,
      operation: 'conjunction',
      conditions: [{ name: 'contains', args: ['z'] }],
    });
  });

  it('should update pagination total to reflect totalRows from filtered response', async() => {
    const totalUnfiltered = 100;
    const totalFiltered = 12;

    handsontable({
      dataProvider: async(params) => {
        const total = params.filters && params.filters.length > 0 ? totalFiltered : totalUnfiltered;

        return {
          rows: createSpreadsheetData(params.pageSize || 10, 3),
          totalRows: total,
        };
      },
      columns: 3,
      dropdownMenu: true,
      filters: true,
      pagination: { pageSize: 10 },
    });

    await sleep(100);

    const dataProvider = getPlugin('dataProvider');
    const filtersPlugin = getPlugin('filters');

    expect(dataProvider.getTotalRows()).toBe(totalUnfiltered);

    filtersPlugin.addCondition(0, 'contains', ['x']);
    filtersPlugin.filter();

    await sleep(150);

    expect(dataProvider.getTotalRows()).toBe(totalFiltered);
  });

  it('should not use server-side filtering when dataProvider is not set (client-side filtering unaffected)', async() => {
    const data = createSpreadsheetData(20, 5);

    handsontable({
      data,
      columns: 5,
      dropdownMenu: true,
      filters: true,
      width: 500,
      height: 300,
    });

    const plugin = getPlugin('filters');

    expect(getPlugin('dataProvider').isEnabled()).toBe(false);

    plugin.addCondition(0, 'eq', ['A1']);
    plugin.filter();

    const filteredData = getData();

    expect(filteredData.length).toBe(1);
    expect(filteredData[0][0]).toBe('A1');
  });

  it('should hide "Filter by value" section in the dropdown menu when dataProvider is enabled', async() => {
    handsontable({
      dataProvider: async params => ({
        rows: createSpreadsheetData(params.pageSize || 10, 3),
        totalRows: 50,
      }),
      columns: 3,
      dropdownMenu: true,
      filters: true,
      pagination: true,
    });

    await sleep(100);

    getPlugin('dropdownMenu').open({ top: 100, left: 100 });
    await sleep(100);

    const menuRoot = dropdownMenuRootElement();

    expect(menuRoot).not.toBeNull();
    expect(menuRoot.querySelector('.htFiltersMenuValue')).toBeNull();
  });

  it('should preserve filter conditions after dataProvider fetch completes', async() => {
    const fetchParams = [];

    handsontable({
      dataProvider: async(params) => {
        fetchParams.push({ ...params });

        return {
          rows: createSpreadsheetData(params.pageSize || 10, 3),
          totalRows: params.filters ? 5 : 50,
        };
      },
      columns: 3,
      dropdownMenu: true,
      filters: true,
      pagination: { pageSize: 10 },
    });

    await sleep(100);

    const filtersPlugin = getPlugin('filters');
    const pagination = getPlugin('pagination');

    filtersPlugin.addCondition(0, 'contains', ['a']);
    filtersPlugin.filter();

    await sleep(150);

    const conditionsAfterFirstFetch = filtersPlugin.exportConditions();

    expect(conditionsAfterFirstFetch.length).toBe(1);
    expect(conditionsAfterFirstFetch[0].column).toBe(0);
    expect(conditionsAfterFirstFetch[0].operation).toBe('conjunction');
    expect(conditionsAfterFirstFetch[0].conditions[0].name).toBe('contains');
    expect(conditionsAfterFirstFetch[0].conditions[0].args).toEqual(['a']);

    pagination.setPage(2);
    await sleep(150);

    const conditionsAfterPageChange = filtersPlugin.exportConditions();

    expect(conditionsAfterPageChange.length).toBe(1);
    expect(conditionsAfterPageChange[0].column).toBe(0);
    expect(conditionsAfterPageChange[0].operation).toBe('conjunction');
    expect(conditionsAfterPageChange[0].conditions[0].name).toBe('contains');
    expect(conditionsAfterPageChange[0].conditions[0].args).toEqual(['a']);

    pagination.setPage(1);
    await sleep(150);

    const conditionsAfterReturnToPage1 = filtersPlugin.exportConditions();

    expect(conditionsAfterReturnToPage1.length).toBe(1);
    expect(conditionsAfterReturnToPage1[0].column).toBe(0);
    expect(conditionsAfterReturnToPage1[0].operation).toBe('conjunction');
    expect(conditionsAfterReturnToPage1[0].conditions[0].name).toBe('contains');
    expect(conditionsAfterReturnToPage1[0].conditions[0].args).toEqual(['a']);
  });

  it('should preserve filter operation type (disjunction) after dataProvider fetch', async() => {
    handsontable({
      dataProvider: async(params) => {
        return {
          rows: createSpreadsheetData(params.pageSize || 10, 3),
          totalRows: params.filters ? 5 : 50,
        };
      },
      columns: 3,
      dropdownMenu: true,
      filters: true,
      pagination: { pageSize: 10 },
    });

    await sleep(100);

    const filtersPlugin = getPlugin('filters');
    const pagination = getPlugin('pagination');

    filtersPlugin.addCondition(0, 'contains', ['a'], 'disjunction');
    filtersPlugin.addCondition(0, 'begins_with', ['b'], 'disjunction');
    filtersPlugin.filter();

    await sleep(150);

    expect(filtersPlugin.exportConditions()[0].operation).toBe('disjunction');

    pagination.setPage(2);
    await sleep(150);

    const conditionsAfterPageChange = filtersPlugin.exportConditions();

    expect(conditionsAfterPageChange.length).toBe(1);
    expect(conditionsAfterPageChange[0].operation).toBe('disjunction');
    expect(conditionsAfterPageChange[0].conditions.map(c => c.name)).toEqual(['contains', 'begins_with']);

    pagination.setPage(1);
    await sleep(150);

    expect(filtersPlugin.exportConditions()[0].operation).toBe('disjunction');
  });

  it('should restore previous filter state when dataProvider fetch fails', async() => {
    let fetchCallCount = 0;

    handsontable({
      dataProvider: async(params) => {
        fetchCallCount += 1;

        if (fetchCallCount === 3) {
          throw new Error('Network error');
        }

        return {
          rows: createSpreadsheetData(params.pageSize || 10, 3),
          totalRows: params.filters ? 5 : 50,
        };
      },
      columns: 3,
      dropdownMenu: true,
      filters: true,
      pagination: true,
    });

    await sleep(100);

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(0, 'contains', ['a']);
    filtersPlugin.filter();
    await sleep(150);

    const conditionsAfterFirstFetch = filtersPlugin.exportConditions();

    expect(conditionsAfterFirstFetch.length).toBe(1);
    expect(conditionsAfterFirstFetch[0].conditions[0].name).toBe('contains');
    expect(conditionsAfterFirstFetch[0].conditions[0].args).toEqual(['a']);

    filtersPlugin.addCondition(1, 'eq', ['x']);
    filtersPlugin.filter();

    await sleep(150);

    const conditionsAfterFailedFetch = filtersPlugin.exportConditions();

    expect(conditionsAfterFailedFetch.length).toBe(1);
    expect(conditionsAfterFailedFetch[0].column).toBe(0);
    expect(conditionsAfterFailedFetch[0].conditions[0].name).toBe('contains');
    expect(conditionsAfterFailedFetch[0].conditions[0].args).toEqual(['a']);
  });
});
