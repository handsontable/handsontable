describe('Pagination `firstPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change the page to first one', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 5,
      },
      renderAllRows: true,
    });

    const plugin = getPlugin('pagination');

    plugin.firstPage();

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A10');
    expect(stringifyPageCounterSection()).toBe('1 - 10 of 45');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 5 [>] [>|]');
  });

  it('should change the page to first one (empty dataset)', async() => {
    handsontable({
      data: [[]],
      pagination: {
        initialPage: 5,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.firstPage();

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(getHtCore().find('tr:first td:first').text()).toBe('');
    expect(getHtCore().find('tr:last td:first').text()).toBe('');
    expect(stringifyPageCounterSection()).toBe('1 - 1 of 1');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 1 > >|');
  });
});
