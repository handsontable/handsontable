describe('Pagination `lastPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change the page to last one', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 1,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.lastPage();

    expect(plugin.getPaginationData().currentPage).toBe(5);
    expect(countVisibleRows()).toBe(5);
  });

  it('should change the page to last one (empty dataset)', async() => {
    handsontable({
      data: [[]],
      pagination: {
        initialPage: 1,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.lastPage();

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(countVisibleRows()).toBe(1);
  });
});
