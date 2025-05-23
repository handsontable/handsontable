describe('Pagination `setPageSize` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to change the page size', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(5);

    expect(plugin.getPaginationData().pageSize).toBe(5);
    expect(countVisibleRows()).toBe(5);
    expect(stringifyPageCounterSection()).toBe('1 - 5 of 15');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 3 [>] [>|]');

    plugin.setPageSize(1);

    expect(plugin.getPaginationData().pageSize).toBe(1);
    expect(countVisibleRows()).toBe(1);
    expect(stringifyPageCounterSection()).toBe('1 - 1 of 15');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 15 [>] [>|]');

    plugin.setPageSize(12);

    expect(plugin.getPaginationData().pageSize).toBe(12);
    expect(countVisibleRows()).toBe(12);
    expect(stringifyPageCounterSection()).toBe('1 - 12 of 15');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 2 [>] [>|]');

    plugin.setPageSize(15);

    expect(plugin.getPaginationData().pageSize).toBe(15);
    expect(countVisibleRows()).toBe(15);
    expect(stringifyPageCounterSection()).toBe('1 - 15 of 15');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 1 > >|');

    plugin.setPageSize(20);

    expect(plugin.getPaginationData().pageSize).toBe(20);
    expect(countVisibleRows()).toBe(15);
    expect(stringifyPageCounterSection()).toBe('1 - 15 of 15');
    expect(stringifyPageNavigationSection()).toBe('|< < Page 1 of 1 > >|');
  });

  it('should throw an error when page size is lower than `0`', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    expect(() => {
      plugin.setPageSize(0);
    }).toThrowError('The `pageSize` option must be greater than `0`.');
    expect(() => {
      plugin.setPageSize(-1);
    }).toThrowError('The `pageSize` option must be greater than `0`.');
  });
});
