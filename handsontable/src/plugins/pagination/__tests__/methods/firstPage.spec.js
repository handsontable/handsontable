describe('Pagination `firstPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change the page to first one', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 5,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.firstPage();

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(countVisibleRows()).toBe(10);
  });

  it('should change the page to last one (empty dataset)', async() => {
    handsontable({
      data: [[]],
      pagination: {
        initialPage: 5,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.firstPage();

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(countVisibleRows()).toBe(1);
  });
});
