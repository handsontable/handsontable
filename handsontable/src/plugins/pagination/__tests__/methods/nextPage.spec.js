describe('Pagination `nextPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change the page to next one', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 2,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.nextPage();

    expect(plugin.getPaginationData().currentPage).toBe(3);
    expect(countVisibleRows()).toBe(10);
  });

  it('should not change the page to the next one if there are no more pages', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 5,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.nextPage();

    expect(plugin.getPaginationData().currentPage).toBe(5);
    expect(countVisibleRows()).toBe(5);
  });
});
