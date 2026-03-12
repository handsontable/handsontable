describe('DataProvider', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not be enabled when dataProvider option is not set', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      columns: 5,
    });

    const plugin = getPlugin('dataProvider');

    expect(plugin.isEnabled()).toBe(false);
  });

  it('should be enabled when dataProvider option is a function', async() => {
    handsontable({
      dataProvider: async() => ({ rows: [], totalRows: 0 }),
      columns: 5,
      pagination: true,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.isEnabled()).toBe(true);
  });

  it('should load initial data after init and expose getTotalRows / getQueryParameters', async() => {
    const rows = createSpreadsheetData(10, 5);
    const totalRows = 100;

    handsontable({
      dataProvider: async(params, { signal }) => {
        expect(params.page).toBe(1);
        expect(params.pageSize).toBeDefined();
        expect(signal).toBeDefined();

        return { rows, totalRows };
      },
      columns: 5,
      pagination: true,
    });

    await sleep(100);

    const plugin = getPlugin('dataProvider');

    expect(plugin.getTotalRows()).toBe(totalRows);
    expect(getData().length).toBe(10);
    const q = plugin.getQueryParameters();

    expect(q.page).toBe(1);
    expect(typeof q.pageSize).toBe('number');
    expect(q.sort).toBe(null);
    expect(q.filters).toBe(null);
  });

  it('should fire beforeDataProviderFetch and afterDataProviderFetch hooks', async() => {
    const beforeSpy = jasmine.createSpy('beforeDataProviderFetch');
    const afterSpy = jasmine.createSpy('afterDataProviderFetch');

    handsontable({
      dataProvider: async() => ({ rows: createSpreadsheetData(5, 3), totalRows: 50 }),
      columns: 3,
      pagination: true,
      beforeDataProviderFetch: beforeSpy,
      afterDataProviderFetch: afterSpy,
    });

    await sleep(100);

    expect(beforeSpy).toHaveBeenCalled();
    expect(afterSpy).toHaveBeenCalled();
    const afterResult = afterSpy.calls.mostRecent().args[0];

    expect(afterResult.rows).toBeDefined();
    expect(afterResult.totalRows).toBe(50);
    expect(afterResult.queryParameters).toBeDefined();
    expect(afterResult.queryParameters.page).toBe(1);
  });

  it('should cancel fetch when beforeDataProviderFetch returns false', async() => {
    const afterSpy = jasmine.createSpy('afterDataProviderFetch');

    handsontable({
      dataProvider: async() => ({ rows: createSpreadsheetData(5, 3), totalRows: 50 }),
      columns: 3,
      pagination: true,
      beforeDataProviderFetch: () => false,
      afterDataProviderFetch: afterSpy,
    });

    await sleep(50);

    expect(afterSpy).not.toHaveBeenCalled();
  });

  it('should fire afterDataProviderFetchError when provider throws', async() => {
    const errorSpy = jasmine.createSpy('afterDataProviderFetchError');
    let callCount = 0;

    handsontable({
      dataProvider: async() => {
        callCount += 1;

        if (callCount > 1) {

          throw new Error('Network error');
        }

        return { rows: createSpreadsheetData(5, 3), totalRows: 50 };
      },
      columns: 3,
      pagination: true,
      afterDataProviderFetchError: errorSpy,
    });

    await sleep(100);

    expect(callCount).toBe(1);

    const plugin = getPlugin('dataProvider');
    const dataBeforeFail = getData().map(row => [...row]);

    try {
      await plugin.goToPage(2);
    } catch (err) {

      expect(err.message).toBe('Network error');
    }

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.calls.mostRecent().args[0].message).toBe('Network error');
    expect(plugin.getQueryParameters().page).toBe(1);
    expect(getData().length).toBe(dataBeforeFail.length);
    expect(getData()).toEqual(dataBeforeFail);
  });

  it('should abort previous fetch when fetchData is called again (goToPage)', async() => {
    let fetchCount = 0;

    handsontable({
      dataProvider: async(params, { signal }) => {
        fetchCount += 1;
        await new Promise(resolve => setTimeout(resolve, 100));

        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        return {
          rows: createSpreadsheetData(5, 3),
          totalRows: 30,
        };
      },
      columns: 3,
      pagination: true,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    plugin.goToPage(2);
    plugin.goToPage(3);

    await sleep(250);

    expect(fetchCount).toBeGreaterThanOrEqual(2);
    expect(plugin.getQueryParameters().page).toBe(3);
  });

  it('should support goToPage, setPageSize, setSort, setFilters', async() => {
    const calls = [];

    handsontable({
      dataProvider: async(params) => {
        calls.push({ ...params });

        return {
          rows: createSpreadsheetData(params.pageSize || 10, 3),
          totalRows: 100,
        };
      },
      columns: 3,
      pagination: { pageSize: 5 },
    });

    await sleep(100);

    const plugin = getPlugin('dataProvider');

    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[0].pageSize).toBe(5);

    await plugin.goToPage(2);
    await sleep(50);
    expect(plugin.getQueryParameters().page).toBe(2);

    await plugin.setPageSize(8);
    await sleep(50);
    expect(plugin.getQueryParameters().pageSize).toBe(8);
    expect(plugin.getQueryParameters().page).toBe(1);

    await plugin.setSort({ column: 0, sortOrder: 'asc' });
    await sleep(50);
    expect(plugin.getQueryParameters().sort).toEqual({ column: 0, sortOrder: 'asc' });

    await plugin.setFilters({ col: 0, value: 'x' });
    await sleep(50);
    expect(plugin.getQueryParameters().filters).toEqual({ col: 0, value: 'x' });
  });

  it('should disable plugin and remove hooks on updateSettings without dataProvider', async() => {
    handsontable({
      dataProvider: async() => ({ rows: createSpreadsheetData(5, 3), totalRows: 10 }),
      columns: 3,
      pagination: true,
    });

    await sleep(50);

    expect(getPlugin('dataProvider').isEnabled()).toBe(true);

    await updateSettings({ dataProvider: undefined });

    expect(getPlugin('dataProvider').isEnabled()).toBe(false);
  });
});
