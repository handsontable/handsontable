describe('DataProvider integration with Pagination', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should use pagination pageSize and initialPage in fetchRows', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      const page = params.page;
      const pageSize = params.pageSize;
      const start = (page - 1) * pageSize;
      const rows = Array.from({ length: pageSize }, (_, i) => ({
        id: start + i + 1,
        name: `Row ${start + i + 1}`,
      }));

      return Promise.resolve({
        rows,
        totalRows: 25,
      });
    });
    const afterFetch = jasmine.createSpy('afterDataProviderFetch');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      pagination: {
        pageSize: 5,
        initialPage: 2,
      },
      dataProvider: createDataProviderConfig({ fetchRows }),
      afterDataProviderFetch: afterFetch,
    });

    await sleep(100);

    expect(fetchRows).toHaveBeenCalled();
    const [params] = fetchRows.calls.mostRecent().args;

    expect(params.page).toBe(2);
    expect(params.pageSize).toBe(5);
    expect(countRows()).toBe(5);
    expect(afterFetch.calls.mostRecent().args[0].totalRows).toBe(25);
  });

  it('should load new page when pagination page changes', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      const { page, pageSize } = params;
      const start = (page - 1) * pageSize;
      const rows = Array.from({ length: Math.min(pageSize, 25 - start) }, (_, i) => ({
        id: start + i + 1,
        name: `Item ${start + i + 1}`,
      }));

      return Promise.resolve({ rows, totalRows: 25 });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      pagination: { pageSize: 5 },
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(100);

    expect(getDataAtCell(0, 0)).toBe(1);

    getPlugin('pagination').setPage(2);

    await sleep(100);

    expect(fetchRows).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 2, pageSize: 5 }),
      jasmine.any(Object)
    );
    expect(getDataAtCell(0, 0)).toBe(6);
  });

  it('should keep user-selected pageSize when column sort triggers refetch', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      const { page, pageSize } = params;
      const start = (page - 1) * pageSize;
      const rows = Array.from({ length: Math.min(pageSize, 100 - start) }, (_, i) => ({
        id: start + i + 1,
        name: `Item ${start + i + 1}`,
      }));

      return Promise.resolve({ rows, totalRows: 100 });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      colHeaders: true,
      columnSorting: true,
      pagination: { pageSize: 10, initialPage: 1 },
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(100);

    getPlugin('pagination').setPageSize(50);

    await sleep(100);

    fetchRows.calls.reset();

    getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    await sleep(100);

    expect(fetchRows).toHaveBeenCalledWith(
      jasmine.objectContaining({ pageSize: 50 }),
      jasmine.any(Object)
    );
    expect(getPlugin('pagination').getPaginationData().pageSize).toBe(50);
  });

  it('should keep current pagination page when column sort triggers refetch', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      const { page, pageSize } = params;
      const start = (page - 1) * pageSize;
      const rows = Array.from({ length: Math.min(pageSize, 30 - start) }, (_, i) => ({
        id: start + i + 1,
        name: `Item ${start + i + 1}`,
      }));

      return Promise.resolve({ rows, totalRows: 30 });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      colHeaders: true,
      columnSorting: true,
      pagination: { pageSize: 5, initialPage: 1 },
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(100);

    getPlugin('pagination').setPage(3);

    await sleep(100);

    fetchRows.calls.reset();

    getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    await sleep(100);

    expect(fetchRows).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 3, pageSize: 5 }),
      jasmine.any(Object)
    );
  });

  it('should provide total count to pagination after DataProvider fetch', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      pagination: { pageSize: 10 },
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1 }, { id: 2 }],
          totalRows: 100,
        }),
      }),
    });

    await sleep(100);

    const pagination = getPlugin('pagination');

    expect(pagination.getPaginationData().totalPages).toBe(10);
  });

  it('should fetch with new pageSize and page 1 when page size changes', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      const { page, pageSize } = params;
      const start = (page - 1) * pageSize;
      const rows = Array.from({ length: Math.min(pageSize, 25 - start) }, (_, i) => ({
        id: start + i + 1,
        name: `Item ${start + i + 1}`,
      }));

      return Promise.resolve({ rows, totalRows: 25 });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      pagination: { pageSize: 5 },
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(100);

    expect(fetchRows).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 1, pageSize: 5 }),
      jasmine.any(Object)
    );

    getPlugin('pagination').setPageSize(10);

    await sleep(100);

    expect(fetchRows).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 1, pageSize: 10 }),
      jasmine.any(Object)
    );
    expect(countRows()).toBe(10);
  });

  it('should revert to previous page when fetch fails on page change', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      if (params.page === 1) {
        return Promise.resolve({
          rows: [{ id: 1 }, { id: 2 }],
          totalRows: 10,
        });
      }

      return Promise.reject(new Error('Network error'));
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      pagination: { pageSize: 2 },
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(100);

    expect(getPlugin('pagination').getPaginationData().currentPage).toBe(1);

    getPlugin('pagination').setPage(2);

    await sleep(150);

    expect(getPlugin('pagination').getPaginationData().currentPage).toBe(1);
  });

  it('should apply row header index from current page (modifyRowHeader)', async() => {
    handsontable({
      data: [],
      rowHeaders: true,
      columns: [{ data: 'id' }],
      pagination: { pageSize: 5, initialPage: 2 },
      dataProvider: createDataProviderConfig({
        fetchRows: (params) => {
          const start = (params.page - 1) * params.pageSize;

          return Promise.resolve({
            rows: Array.from({ length: 5 }, (_, i) => ({ id: start + i + 1 })),
            totalRows: 20,
          });
        },
      }),
    });

    await sleep(100);

    expect(getRowHeader(0)).toBe(6);
    expect(getRowHeader(1)).toBe(7);
  });
});
