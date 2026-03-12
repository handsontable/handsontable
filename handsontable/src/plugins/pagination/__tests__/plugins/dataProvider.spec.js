describe('Pagination integration with DataProvider', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should enable both pagination and dataProvider and load first page', async() => {
    const totalRows = 50;
    const pageSize = 10;

    handsontable({
      dataProvider: async(params) => {
        const start = (params.page - 1) * params.pageSize;
        const rows = createSpreadsheetData(pageSize, 5).map((row, i) =>
          row.map(cell => `${cell}-${start + i}`)
        );

        return { rows, totalRows };
      },
      columns: 5,
      pagination: { pageSize },
    });

    await sleep(150);

    const pagination = getPlugin('pagination');
    const dataProvider = getPlugin('dataProvider');

    expect(pagination.isEnabled()).toBe(true);
    expect(dataProvider.isEnabled()).toBe(true);
    expect(dataProvider.getTotalRows()).toBe(totalRows);
    expect(countVisibleRows()).toBe(pageSize);

    const paginationData = pagination.getPaginationData();

    expect(paginationData.currentPage).toBe(1);
    expect(paginationData.totalPages).toBe(5);
    expect(paginationData.pageSize).toBe(pageSize);
    expect(paginationData.firstVisibleRowIndex).toBe(0);
    expect(paginationData.lastVisibleRowIndex).toBe(9);
  });

  it('should change page and trigger dataProvider fetch', async() => {
    const fetchParams = [];

    handsontable({
      dataProvider: async(params) => {
        fetchParams.push({ page: params.page, pageSize: params.pageSize });
        const start = (params.page - 1) * params.pageSize;
        const rows = createSpreadsheetData(params.pageSize, 3).map((row, i) =>
          row.map(cell => `${cell}-p${params.page}-${start + i}`)
        );

        return { rows, totalRows: 60 };
      },
      columns: 3,
      pagination: { pageSize: 10 },
    });

    await sleep(100);

    const pagination = getPlugin('pagination');

    expect(fetchParams.length).toBeGreaterThanOrEqual(1);
    expect(fetchParams[fetchParams.length - 1].page).toBe(1);

    pagination.setPage(2);
    await sleep(100);

    expect(fetchParams[fetchParams.length - 1].page).toBe(2);
    expect(getPlugin('dataProvider').getQueryParameters().page).toBe(2);
  });

  it('should use default pageSize when pagination is true and dataProvider is set', async() => {
    handsontable({
      dataProvider: async(params) => {
        return {
          rows: createSpreadsheetData(params.pageSize, 3),
          totalRows: 100,
        };
      },
      columns: 3,
      pagination: true,
    });

    await sleep(100);

    const dataProvider = getPlugin('dataProvider');
    const pagination = getPlugin('pagination');

    expect(dataProvider.getQueryParameters().pageSize).toBe(10);
    expect(pagination.getPaginationData().pageSize).toBe(10);
  });

  it('should reflect totalRows from dataProvider in getPaginationData', async() => {
    const totalRows = 37;
    const pageSize = 10;

    handsontable({
      dataProvider: async params => ({
        rows: createSpreadsheetData(params.pageSize, 3),
        totalRows,
      }),
      columns: 3,
      pagination: { pageSize },
    });

    await sleep(100);

    const pagination = getPlugin('pagination');
    const paginationData = pagination.getPaginationData();

    expect(paginationData.totalPages).toBe(4);
    expect(getPlugin('dataProvider').getTotalRows()).toBe(totalRows);
  });

  it('should display global row indexes in row headers on page 2', async() => {
    const pageSize = 10;

    handsontable({
      dataProvider: async(params) => {
        const start = (params.page - 1) * params.pageSize;
        const rows = createSpreadsheetData(pageSize, 2).map((row, i) =>
          [`Row ${start + i + 1}`, row[1]]
        );

        return { rows, totalRows: 25 };
      },
      columns: 2,
      rowHeaders: true,
      pagination: { pageSize },
    });

    await sleep(100);

    expect(getRowHeader(0)).toBeDefined();
    expect(getRowHeader(0)).toBe(1);

    getPlugin('pagination').setPage(2);
    await sleep(150);

    expect(getRowHeader(0)).toBe(11);
  });

  it('should revert to previous page when dataProvider fetch fails on setPage', async() => {
    const pageSize = 10;

    handsontable({
      dataProvider: async(params) => {
        callCount += 1;

        if (params.page > 1) {
          throw new Error('Network error');
        }

        const start = (params.page - 1) * params.pageSize;
        const rows = createSpreadsheetData(params.pageSize, 2).map((row, i) =>
          [`Page1-${start + i}`, row[1]]
        );

        return { rows, totalRows: 25 };
      },
      columns: 2,
      rowHeaders: true,
      pagination: { pageSize },
    });

    await sleep(100);

    const pagination = getPlugin('pagination');
    const dataProvider = getPlugin('dataProvider');

    expect(pagination.getPaginationData().currentPage).toBe(1);
    expect(getRowHeader(0)).toBe(1);

    pagination.setPage(2);
    await sleep(100);

    expect(pagination.getPaginationData().currentPage).toBe(1);
    expect(dataProvider.getQueryParameters().page).toBe(1);
    expect(getRowHeader(0)).toBe(1);
    expect(getData()[0][0]).toContain('Page1-');
  });

  it('should revert to previous page size when dataProvider fetch fails on setPageSize', async() => {
    const initialPageSize = 10;

    handsontable({
      dataProvider: async(params) => {
        if (params.pageSize !== initialPageSize) {
          throw new Error('Network error');
        }

        return {
          rows: createSpreadsheetData(params.pageSize, 2),
          totalRows: 50,
        };
      },
      columns: 2,
      pagination: { pageSize: initialPageSize },
    });

    await sleep(100);

    const pagination = getPlugin('pagination');
    const dataProvider = getPlugin('dataProvider');

    expect(pagination.getPaginationData().pageSize).toBe(initialPageSize);

    pagination.setPageSize(5);
    await sleep(100);

    expect(pagination.getPaginationData().pageSize).toBe(initialPageSize);
    expect(dataProvider.getQueryParameters().pageSize).toBe(initialPageSize);
  });
});
