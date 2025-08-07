describe('Pagination `getPaginationData` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return correct pagination data (defaults)', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 1,
      totalPages: 5,
      pageSize: 10,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 10,
      firstVisibleRowIndex: 0,
      lastVisibleRowIndex: 9,
    });
  });

  it('should return correct pagination data (custom page)', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    plugin.setPage(3);

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 3,
      totalPages: 5,
      pageSize: 10,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 10,
      firstVisibleRowIndex: 20,
      lastVisibleRowIndex: 29,
    });
  });

  it('should return correct pagination data (custom page size)', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(12);

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 1,
      totalPages: 4,
      pageSize: 12,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 12,
      firstVisibleRowIndex: 0,
      lastVisibleRowIndex: 11,
    });
  });

  it('should return correct pagination data when all rows are hidden (fixed page size)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 10),
      pagination: {
        pageSize: 3,
      },
    });

    rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 1,
      totalPages: 1,
      pageSize: 3,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 0,
      firstVisibleRowIndex: -1,
      lastVisibleRowIndex: -1,
    });
  });

  it('should return correct pagination data when all rows are hidden (auto page size)', async() => {
    handsontable({
      data: createSpreadsheetData(6, 10),
      pagination: {
        pageSize: 'auto',
      },
    });

    rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 1,
      totalPages: 1,
      pageSize: 0,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: true,
      numberOfRenderedRows: 0,
      firstVisibleRowIndex: -1,
      lastVisibleRowIndex: -1,
    });
  });

  it('should return correct pagination data when the external hidden rows index mapper is used', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      pagination: {
        pageSize: 3,
      },
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(8, true);
    hidingMap.setValueAtIndex(9, true);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 1,
      totalPages: 2,
      pageSize: 3,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 3,
      firstVisibleRowIndex: 1,
      lastVisibleRowIndex: 5,
    });

    plugin.setPage(2);

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 2,
      totalPages: 2,
      pageSize: 3,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 2,
      firstVisibleRowIndex: 6,
      lastVisibleRowIndex: 7,
    });
  });

  it('should return correct pagination data when the rows order is changed', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      pagination: {
        pageSize: 3,
      },
    });

    rowIndexMapper().setIndexesSequence([9, 7, 4, 2, 1, 3, 5, 6, 8, 0]);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 1,
      totalPages: 4,
      pageSize: 3,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 3,
      firstVisibleRowIndex: 0,
      lastVisibleRowIndex: 2,
    });

    plugin.setPage(2);

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 2,
      totalPages: 4,
      pageSize: 3,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 3,
      firstVisibleRowIndex: 3,
      lastVisibleRowIndex: 5,
    });

    plugin.setPage(3);

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 3,
      totalPages: 4,
      pageSize: 3,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 3,
      firstVisibleRowIndex: 6,
      lastVisibleRowIndex: 8,
    });

    plugin.setPage(4);

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 4,
      totalPages: 4,
      pageSize: 3,
      pageSizeList: ['auto', 5, 10, 20, 50, 100],
      autoPageSize: false,
      numberOfRenderedRows: 1,
      firstVisibleRowIndex: 9,
      lastVisibleRowIndex: 9,
    });
  });
});
