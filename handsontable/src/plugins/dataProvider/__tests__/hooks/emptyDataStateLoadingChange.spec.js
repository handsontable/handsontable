describe('DataProvider `emptyDataStateLoadingChange` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should fire true while fetchRows is pending on an empty grid, then false when it resolves', async() => {
    let resolveFetch;

    const loadingChange = jasmine.createSpy('emptyDataStateLoadingChange');

    const fetchRows = () => new Promise((resolve) => {
      resolveFetch = resolve;
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({ fetchRows }),
      emptyDataStateLoadingChange: loadingChange,
    });

    await sleep(0);

    expect(loadingChange).toHaveBeenCalledWith(true);

    resolveFetch({ rows: [], totalRows: 0 });

    await sleep(0);

    expect(loadingChange).toHaveBeenCalledWith(false);
    expect(loadingChange.calls.mostRecent().args[0]).toBe(false);
  });

  it('should not fire true for sort-only refetch when rows are visible', async() => {
    let resolveSortFetch;
    let fetchCount = 0;

    const loadingChange = jasmine.createSpy('emptyDataStateLoadingChange');

    const fetchRows = jasmine.createSpy('fetchRows').and.callFake(() => {
      fetchCount += 1;

      if (fetchCount === 1) {
        return Promise.resolve({
          rows: [{ id: 2, name: 'B' }, { id: 1, name: 'A' }],
          totalRows: 2,
        });
      }

      return new Promise((resolve) => {
        resolveSortFetch = resolve;
      });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      colHeaders: true,
      columnSorting: true,
      dataProvider: createDataProviderConfig({ fetchRows }),
      emptyDataStateLoadingChange: loadingChange,
    });

    await sleep(100);

    loadingChange.calls.reset();
    fetchRows.calls.reset();

    getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    await sleep(0);

    expect(loadingChange).not.toHaveBeenCalledWith(true);

    resolveSortFetch({
      rows: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
      totalRows: 2,
    });

    await sleep(50);

    expect(loadingChange).not.toHaveBeenCalledWith(true);
    expect(getDataAtCell(0, 1)).toBe('A');
    expect(getDataAtCell(1, 1)).toBe('B');
  });
});
