describe('Pagination `resetPageSize` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should reset the page size to the initial value', async() => {
    handsontable({
      data: createSpreadsheetData(50, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(5);
    plugin.resetPageSize();

    expect(plugin.getPaginationData().pageSize).toBe(10);

    await updateSettings({
      pagination: {
        pageSize: 8,
      },
    });

    plugin.setPageSize(5);
    plugin.resetPageSize();

    expect(plugin.getPaginationData().pageSize).toBe(8);
  });
});
