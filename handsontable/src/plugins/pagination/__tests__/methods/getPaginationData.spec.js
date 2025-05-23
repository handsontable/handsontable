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
      numberOfRenderedRows: 10,
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
      numberOfRenderedRows: 10,
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
      numberOfRenderedRows: 12,
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
      pageSizeList: [5, 10, 20, 50, 100],
      numberOfRenderedRows: 3,
    });

    plugin.setPage(2);

    expect(plugin.getPaginationData()).toEqual({
      currentPage: 2,
      totalPages: 2,
      pageSize: 3,
      pageSizeList: [5, 10, 20, 50, 100],
      numberOfRenderedRows: 2,
    });
  });
});
