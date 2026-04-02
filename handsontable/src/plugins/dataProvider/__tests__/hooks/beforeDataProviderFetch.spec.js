describe('DataProvider `beforeDataProviderFetch` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be called with query parameters before fetch', async() => {
    const beforeFetch = jasmine.createSpy('beforeDataProviderFetch');

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
      beforeDataProviderFetch: beforeFetch,
    });

    await sleep(50);

    expect(beforeFetch).toHaveBeenCalled();
    const [params] = beforeFetch.calls.mostRecent().args;

    expect(params).toEqual(jasmine.objectContaining({
      page: 1,
      pageSize: 10,
      sort: null,
      filters: null,
    }));
  });

  it('should cancel fetch when hook returns false', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({ rows: [], totalRows: 0 })
    );

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({ fetchRows }),
      beforeDataProviderFetch: () => false,
    });

    await sleep(50);

    expect(fetchRows).not.toHaveBeenCalled();
  });

  it('should allow fetch when hook returns true', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(
      Promise.resolve({ rows: [{ id: 1 }], totalRows: 1 })
    );

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({ fetchRows }),
      beforeDataProviderFetch: () => true,
    });

    await sleep(50);

    expect(fetchRows).toHaveBeenCalled();
    expect(countRows()).toBe(1);
  });
});
