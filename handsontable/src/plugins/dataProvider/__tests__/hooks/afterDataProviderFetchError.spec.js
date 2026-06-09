describe('DataProvider `afterDataProviderFetchError` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be called when fetchRows throws', async() => {
    const afterError = jasmine.createSpy('afterDataProviderFetchError');
    const err = new Error('Network error');

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
      afterDataProviderFetchError: afterError,
    });

    await sleep(50);

    const config = spec().$container.handsontable('getInstance').getSettings().dataProvider;

    config.fetchRows = () => Promise.reject(err);

    const plugin = getPlugin('dataProvider');

    try {
      await plugin.fetchData();
    } catch (e) {
      expect(e).toBe(err);
    }

    expect(afterError).toHaveBeenCalledWith(err, jasmine.objectContaining({
      page: 1,
      pageSize: 10,
    }));
  });

  it('should not be called on successful fetch', async() => {
    const afterError = jasmine.createSpy('afterDataProviderFetchError');

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
      afterDataProviderFetchError: afterError,
    });

    await sleep(50);

    expect(afterError).not.toHaveBeenCalled();
  });
});
