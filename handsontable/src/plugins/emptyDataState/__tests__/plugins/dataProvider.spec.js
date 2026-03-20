describe('EmptyDataState with DataProvider plugin', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should show loading spinner while fetchRows is pending and emptyDataState is enabled', async() => {
    let resolveFetch;

    const fetchRows = () => new Promise((resolve) => {
      resolveFetch = resolve;
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      emptyDataState: true,
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(0);

    const root = getEmptyDataStateContainerElement();

    expect(root.style.display).not.toBe('none');
    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(true);
    expect(root.querySelector('.ht-empty-data-state__spinner')).not.toBe(null);

    resolveFetch({ rows: [], totalRows: 0 });

    await sleep(0);

    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(false);
    expect(root.querySelector('.ht-empty-data-state__spinner')).toBe(null);
  });

  it('should not keep loading spinner after fetchRows resolves quickly', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      emptyDataState: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    const root = getEmptyDataStateContainerElement();

    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(false);
    expect(root.querySelector('.ht-empty-data-state__spinner')).toBe(null);
  });

  it('should use message callback with loading source when set', async() => {
    let resolveFetch;

    const fetchRows = () => new Promise((resolve) => {
      resolveFetch = resolve;
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      emptyDataState: {
        message: (source) => {
          if (source === 'loading') {
            return { title: 'Custom loading', description: 'Wait' };
          }

          return { title: 'Empty', description: 'No rows' };
        },
      },
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(0);

    const root = getEmptyDataStateContainerElement();

    expect(root.querySelector('.ht-empty-data-state__title').textContent).toBe('Custom loading');
    expect(root.querySelector('.ht-empty-data-state__description').textContent).toBe('Wait');

    resolveFetch({ rows: [], totalRows: 0 });

    await sleep(0);

    expect(root.querySelector('.ht-empty-data-state__title').textContent).toBe('Empty');
  });

  it('should show loading overlay during pagination page change while previous rows are visible', async() => {
    let resolveSecondPage;

    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      if (params.page === 1) {
        return Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 10,
        });
      }

      return new Promise((resolve) => {
        resolveSecondPage = resolve;
      });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      pagination: { pageSize: 1 },
      emptyDataState: true,
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(0);

    expect(countRows()).toBe(1);

    getPlugin('pagination').setPage(2);

    await sleep(0);

    const root = getEmptyDataStateContainerElement();

    expect(root.style.display).not.toBe('none');
    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(true);

    resolveSecondPage({ rows: [{ id: 2, name: 'B' }], totalRows: 10 });

    await sleep(50);

    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(false);
    expect(getDataAtCell(0, 0)).toBe(2);
  });

  it('should keep loading overlay when a page fetch is aborted by another page change', async() => {
    let resolvePage2;
    let resolvePage3;

    const fetchRows = jasmine.createSpy('fetchRows').and.callFake((params) => {
      if (params.page === 1) {
        return Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 10,
        });
      }

      if (params.page === 2) {
        return new Promise((resolve) => {
          resolvePage2 = resolve;
        });
      }

      if (params.page === 3) {
        return new Promise((resolve) => {
          resolvePage3 = resolve;
        });
      }

      return Promise.resolve({ rows: [], totalRows: 0 });
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      pagination: { pageSize: 1 },
      emptyDataState: true,
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(0);

    expect(countRows()).toBe(1);

    getPlugin('pagination').setPage(2);

    await sleep(0);

    const root = getEmptyDataStateContainerElement();

    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(true);

    getPlugin('pagination').setPage(3);

    await sleep(0);

    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(true);

    resolvePage3({ rows: [{ id: 3, name: 'C' }], totalRows: 10 });

    await sleep(50);

    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(false);

    resolvePage2({ rows: [], totalRows: 0 });
  });

  it('should not show loading overlay for server-side column sort refetch', async() => {
    let resolveSortFetch;
    let fetchCount = 0;

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
      emptyDataState: true,
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(100);

    fetchRows.calls.reset();

    getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    await sleep(0);

    const root = getEmptyDataStateContainerElement();

    await sleep(50);

    expect(root.classList.contains('ht-empty-data-state--loading')).toBe(false);
    expect(root.querySelector('.ht-empty-data-state__spinner')).toBe(null);

    resolveSortFetch({
      rows: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
      totalRows: 2,
    });

    await sleep(50);
  });
});
