describe('DataProvider integration with ColumnSorting', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should pass sort with prop to fetchRows when column is sorted', async() => {
    const beforeFetch = jasmine.createSpy('beforeDataProviderFetch');
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      const sort = params.sort;

      if (sort && sort.prop === 'name' && sort.order === 'asc') {
        return Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
          totalRows: 2,
        });
      }

      return Promise.resolve({
        rows: [{ id: 2, name: 'Bob' }, { id: 1, name: 'Alice' }],
        totalRows: 2,
      });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      colHeaders: true,
      columnSorting: true,
      dataProvider: createDataProviderConfig({ fetchRows }),
      beforeDataProviderFetch: beforeFetch,
    });

    await sleep(100);

    fetchRows.calls.reset();

    getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    await sleep(100);

    expect(fetchRows).toHaveBeenCalledWith(
      jasmine.objectContaining({
        sort: jasmine.objectContaining({ prop: 'name', order: 'asc' }),
      }),
      jasmine.any(Object)
    );

    const sortFetchBeforeArgs = beforeFetch.calls.all().map(c => c.args[0]).filter(p => p.sort?.prop === 'name');

    expect(sortFetchBeforeArgs.length).toBeGreaterThan(0);
    expect(sortFetchBeforeArgs.some(p => p.skipLoading === true)).toBe(true);
  });
});
