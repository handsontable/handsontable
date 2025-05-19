describe('Pagination `setPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to change the page', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 2,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.setPage(1);

    expect(plugin.getPaginationData().currentPage).toBe(1);

    plugin.setPage(0);

    expect(plugin.getPaginationData().currentPage).toBe(1);

    plugin.setPage(-1);

    expect(plugin.getPaginationData().currentPage).toBe(1);

    plugin.setPage(4);

    expect(plugin.getPaginationData().currentPage).toBe(4);

    plugin.setPage(8);

    expect(plugin.getPaginationData().currentPage).toBe(5);
  });
});
