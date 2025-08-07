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
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A10');
    expect(stringifyPageCounterSection()).toBe('1 - 10 of 45');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 5 [>] [>|]');
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
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A10');
    expect(stringifyPageCounterSection()).toBe('1 - 10 of 45');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 5 [>] [>|]');
  });
});
