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
      pageSizeList: [5, 10, 20, 50, 100],
      numberOfVisibleRows: 10,
      firstVisibleRow: 0,
      lastVisibleRow: 9,
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
      pageSizeList: [5, 10, 20, 50, 100],
      numberOfVisibleRows: 10,
      firstVisibleRow: 20,
      lastVisibleRow: 29,
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
      pageSizeList: [5, 10, 20, 50, 100],
      numberOfVisibleRows: 12,
      firstVisibleRow: 0,
      lastVisibleRow: 11,
    });
  });
});
