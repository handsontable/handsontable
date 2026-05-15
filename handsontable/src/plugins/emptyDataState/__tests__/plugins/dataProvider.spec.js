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

    expect(root.style.display).toBe('none');
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

    expect(root.style.display).toBe('none');

    resolvePage2({ rows: [], totalRows: 0 });
  });

  it('should not show loading overlay for server-side column sort refetch', async() => {
    let resolveSortFetch;
    let fetchCount = 0;
    const beforeDataProviderFetch = jasmine.createSpy('beforeDataProviderFetch');

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
      beforeDataProviderFetch,
    });

    await sleep(100);

    fetchRows.calls.reset();
    beforeDataProviderFetch.calls.reset();

    getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });

    await sleep(0);

    const root = getEmptyDataStateContainerElement();

    await sleep(50);

    const sortRefetchHookParams = beforeDataProviderFetch.calls.all()
      .map(c => c.args[0])
      .filter(p => p && typeof p === 'object' && p.sort?.prop === 'name');

    expect(sortRefetchHookParams.length).toBeGreaterThan(0);
    expect(sortRefetchHookParams.some(p => p.skipLoading === true)).toBe(true);
    expect(root.style.display).toBe('none');

    resolveSortFetch({
      rows: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
      totalRows: 2,
    });

    await sleep(50);
  });

  it('should use filters message source after load when filters hide all rows', async() => {
    const messageSpy = jasmine.createSpy('message').and.callFake((source) => {
      switch (source) {
        case 'filters':
          return {
            title: 'Filtered empty',
            description: 'All rows hidden by filters',
          };
        case 'loading':
          return {
            title: 'Loading',
            description: 'Please wait',
          };
        default:
          return {
            title: 'No data',
            description: 'Empty',
          };
      }
    });

    const rows = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      colHeaders: true,
      filters: true,
      emptyDataState: {
        message: messageSpy,
      },
      dataProvider: createDataProviderConfig({
        fetchRows: (params) => {
          const idFilter = params?.filters?.find(f => f.prop === 'id');
          const eqNonexistent = idFilter?.conditions?.some(
            c => c.name === 'eq' && Array.isArray(c.args) && c.args.includes('nonexistent')
          );

          if (eqNonexistent) {
            return Promise.resolve({ rows: [], totalRows: 0 });
          }

          return Promise.resolve({ rows, totalRows: rows.length });
        },
      }),
    });

    await sleep(50);

    expect(getPlugin('emptyDataState').isVisible()).toBe(false);
    expect(countRows()).toBe(2);

    messageSpy.calls.reset();

    const filtersPlugin = getPlugin('filters');

    filtersPlugin.addCondition(0, 'eq', ['nonexistent']);
    filtersPlugin.filter();

    await sleep(100);

    const root = getEmptyDataStateContainerElement();

    expect(getPlugin('emptyDataState').isVisible()).toBe(true);
    expect(countRows()).toBe(0);
    expect(root.querySelector('.ht-empty-data-state__title').textContent).toBe('Filtered empty');
    expect(root.querySelector('.ht-empty-data-state__description').textContent)
      .toBe('All rows hidden by filters');
    expect(messageSpy).toHaveBeenCalledWith('filters');
  });

  it('should not scroll the page when fetchRows loads data for the first time', async() => {
    // Push the grid below the browser viewport so scrollIntoView would actually scroll
    const spacer = document.createElement('div');

    spacer.style.height = '2000px';
    document.body.insertBefore(spacer, spec().$container[0]);
    window.scrollTo(0, 0);

    let resolveFetch;
    const fetchRows = () => new Promise((resolve) => {
      resolveFetch = resolve;
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      height: 300,
      emptyDataState: true,
      dataProvider: createDataProviderConfig({ fetchRows }),
    });

    await sleep(0);

    const scrollBefore = window.scrollY;

    resolveFetch({ rows: [{ id: 1, name: 'Alice' }], totalRows: 1 });

    await sleep(50);

    expect(window.scrollY).toBe(scrollBefore);

    spacer.remove();
  });
});
