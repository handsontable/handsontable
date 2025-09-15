describe('Pagination `hasPreviousPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return `true` when there is previous page', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 2,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.hasPreviousPage()).toBe(true);
  });

  it('should return `false` when there is no previous page', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 1,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.hasPreviousPage()).toBe(false);
  });
});
