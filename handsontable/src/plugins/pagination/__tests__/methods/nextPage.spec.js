describe('Pagination `nextPage` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should change the page to next one', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 2,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.nextPage();

    expect(plugin.getPaginationData().currentPage).toBe(3);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A21');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A30');
    expect(stringifyPageCounterSection()).toBe('21 - 30 of 45');
    expect(stringifyPageNavigationSection()).toBe('[|<] [<] Page 3 of 5 [>] [>|]');
  });

  it('should not change the page to the next one if there are no more pages', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: {
        initialPage: 5,
      },
    });

    const plugin = getPlugin('pagination');

    plugin.nextPage();

    expect(plugin.getPaginationData().currentPage).toBe(5);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A41');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A45');
    expect(stringifyPageCounterSection()).toBe('41 - 45 of 45');
    expect(stringifyPageNavigationSection()).toBe('[|<] [<] Page 5 of 5 > >|');
  });
});
