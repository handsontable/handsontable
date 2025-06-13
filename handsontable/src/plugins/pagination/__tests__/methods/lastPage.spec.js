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
    expect(getHtCore().find('tr:first td:first').text()).toBe('A41');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A45');
    expect(stringifyPageCounterSection()).toBe('41 - 45 of 45');
    expect(stringifyPageNavigationSection()).toBe('[|<] [<] Page 5 of 5 > >|');
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
    expect(getHtCore().find('tr:first td:first').text()).toBe('');
    expect(getHtCore().find('tr:last td:first').text()).toBe('');
    expect(stringifyPageCounterSection()).toBe('1 - 1 of 1');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 1 > >|');
  });
});
