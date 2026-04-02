describe('Pagination `getCurrentPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return the internal 1-based page index', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 2,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getCurrentPage()).toBe(2);

    plugin.setPage(4);

    expect(plugin.getCurrentPage()).toBe(4);
    expect(plugin.getPaginationData().currentPage).toBe(4);
  });
});
