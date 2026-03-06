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
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A10');
    expect(stringifyPageCounterSection()).toBe('1 - 10 of 45');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 5 [>] [>|]');

    plugin.setPage(0);

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A10');
    expect(stringifyPageCounterSection()).toBe('1 - 10 of 45');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 5 [>] [>|]');

    plugin.setPage(-1);

    expect(plugin.getPaginationData().currentPage).toBe(1);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A10');
    expect(stringifyPageCounterSection()).toBe('1 - 10 of 45');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 5 [>] [>|]');

    plugin.setPage(4);

    expect(plugin.getPaginationData().currentPage).toBe(4);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A31');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A40');
    expect(stringifyPageCounterSection()).toBe('31 - 40 of 45');
    expect(stringifyPageNavigationSection()).toBe('[|<] [<] Page 4 of 5 [>] [>|]');

    plugin.setPage(5);

    expect(plugin.getPaginationData().currentPage).toBe(5);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A41');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A45');
    expect(stringifyPageCounterSection()).toBe('41 - 45 of 45');
    expect(stringifyPageNavigationSection()).toBe('[|<] [<] Page 5 of 5 > >|');

    plugin.setPage(6);

    expect(plugin.getPaginationData().currentPage).toBe(5);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A41');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A45');
    expect(stringifyPageCounterSection()).toBe('41 - 45 of 45');
    expect(stringifyPageNavigationSection()).toBe('[|<] [<] Page 5 of 5 > >|');

    plugin.setPage(10);

    expect(plugin.getPaginationData().currentPage).toBe(5);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A41');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A45');
    expect(stringifyPageCounterSection()).toBe('41 - 45 of 45');
    expect(stringifyPageNavigationSection()).toBe('[|<] [<] Page 5 of 5 > >|');
  });
});
