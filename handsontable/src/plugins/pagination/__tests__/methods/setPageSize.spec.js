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
      width: 300,
      height: 300,
      renderAllRows: true,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(5);

    expect(plugin.getPaginationData().pageSize).toBe(5);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A5');
    expect(visualizePageSections()).toEqual([
      'Page size: [[5], 10, 20, 50, 100]',
      '1 - 5 of 15',
      '|< < Page 1 of 3 [>] [>|]'
    ]);

    plugin.setPageSize(1);

    expect(plugin.getPaginationData().pageSize).toBe(1);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(visualizePageSections()).toEqual([
      'Page size: [[5], 10, 20, 50, 100]',
      '1 - 1 of 15',
      '|< < Page 1 of 15 [>] [>|]'
    ]);

    plugin.setPageSize(12);

    expect(plugin.getPaginationData().pageSize).toBe(12);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A12');
    expect(visualizePageSections()).toEqual([
      'Page size: [[5], 10, 20, 50, 100]',
      '1 - 12 of 15',
      '|< < Page 1 of 2 [>] [>|]'
    ]);

    plugin.setPageSize(15);

    expect(plugin.getPaginationData().pageSize).toBe(15);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A15');
    expect(visualizePageSections()).toEqual([
      'Page size: [[5], 10, 20, 50, 100]',
      '1 - 15 of 15',
      '|< < Page 1 of 1 > >|'
    ]);

    plugin.setPageSize('auto');

    expect(plugin.getPaginationData().pageSize).forThemes(({ classic, main, horizon }) => {
      classic.toBe(12);
      main.toBe(9);
      horizon.toBe(7);
    });
    expect(getHtCore().find('tr:first td:first').text()).forThemes(({ classic, main, horizon }) => {
      classic.toBe('A1');
      main.toBe('A1');
      horizon.toBe('A1');
    });
    expect(getHtCore().find('tr:last td:first').text()).forThemes(({ classic, main, horizon }) => {
      classic.toBe('A12');
      main.toBe('A9');
      horizon.toBe('A7');
    });
    expect(visualizePageSections()).forThemes(({ classic, main, horizon }) => {
      classic.toEqual([
        'Page size: [[5], 10, 20, 50, 100]',
        '1 - 12 of 15',
        '|< < Page 1 of 2 [>] [>|]'
      ]);
      main.toEqual([
        'Page size: [[5], 10, 20, 50, 100]',
        '1 - 9 of 15',
        '|< < Page 1 of 2 [>] [>|]'
      ]);
      horizon.toEqual([
        'Page size: [[5], 10, 20, 50, 100]',
        '1 - 7 of 15',
        '|< < Page 1 of 3 [>] [>|]'
      ]);
    });

    plugin.setPageSize(20);

    expect(plugin.getPaginationData().pageSize).toBe(20);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A15');
    expect(visualizePageSections()).toEqual([
      'Page size: [5, 10, [20], 50, 100]',
      '1 - 15 of 15',
      '|< < Page 1 of 1 > >|'
    ]);
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
