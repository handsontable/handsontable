describe('Pagination', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to enable the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(true);
    expect(countVisibleRows()).toBe(10);
  });

  it('should be possible to disable the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
      },
    });

    await updateSettings({
      pagination: false,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(false);
    expect(countVisibleRows()).toBe(10);
  });
});
