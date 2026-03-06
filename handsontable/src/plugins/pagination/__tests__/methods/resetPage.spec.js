describe('Pagination `resetPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should reset the page to the initial value', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    plugin.setPage(3);
    plugin.resetPage();

    expect(plugin.getPaginationData().currentPage).toBe(1);

    await updateSettings({
      pagination: {
        initialPage: 2,
      },
    });

    plugin.setPage(3);
    plugin.resetPage();

    expect(plugin.getPaginationData().currentPage).toBe(2);
  });
});
