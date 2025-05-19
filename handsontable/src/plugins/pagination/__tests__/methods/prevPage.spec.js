describe('Pagination `prevPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change the page to previous one', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 2,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.prevPage();

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(countVisibleRows()).toBe(10);
  });

  it('should not change the page to the previous one if there are no more pages', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 1,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.prevPage();

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(countVisibleRows()).toBe(10);
  });
});
