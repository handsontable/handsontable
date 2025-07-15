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

  it('should warn when `autoRowSize` plugin is not enabled', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: true,
    });

    const warnSpy = spyOn(console, 'warn');
    const plugin = getPlugin('pagination');

    plugin.setPageSize('auto');

    expect(warnSpy).toHaveBeenCalledWith('The `auto` page size setting requires the `autoRowSize` ' +
      'plugin to be enabled. Set the `autoRowSize: true` in the configuration to ensure correct behavior.');
  });

  it('should be possible to change the page size', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: true,
      width: 550,
      height: (getDefaultRowHeight() * 8) + getPaginationContainerHeight(),
      renderAllRows: true,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(5);

    expect(plugin.getPaginationData().pageSize).toBe(5);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A5');
    expect(visualizePageSections()).toEqual([
      'Page size: [auto, [5], 10, 20, 50, 100]',
      '1 - 5 of 15',
      '|< < Page 1 of 3 [>] [>|]'
    ]);

    plugin.setPageSize(1);

    expect(plugin.getPaginationData().pageSize).toBe(1);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A1');
    expect(visualizePageSections()).toEqual([
      'Page size: [[auto], 5, 10, 20, 50, 100]',
      '1 - 1 of 15',
      '|< < Page 1 of 15 [>] [>|]'
    ]);

    plugin.setPageSize(12);

    expect(plugin.getPaginationData().pageSize).toBe(12);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A12');
    expect(visualizePageSections()).toEqual([
      'Page size: [[auto], 5, 10, 20, 50, 100]',
      '1 - 12 of 15',
      '|< < Page 1 of 2 [>] [>|]'
    ]);

    plugin.setPageSize(15);

    expect(plugin.getPaginationData().pageSize).toBe(15);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A15');
    expect(visualizePageSections()).toEqual([
      'Page size: [[auto], 5, 10, 20, 50, 100]',
      '1 - 15 of 15',
      '|< < Page 1 of 1 > >|'
    ]);

    plugin.setPageSize('auto');

    expect(plugin.getPaginationData().pageSize).toBe(7);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A7');
    expect(visualizePageSections()).toEqual([
      'Page size: [[auto], 5, 10, 20, 50, 100]',
      '1 - 7 of 15',
      '|< < Page 1 of 3 [>] [>|]'
    ]);

    plugin.setPageSize(20);

    expect(plugin.getPaginationData().pageSize).toBe(20);
    expect(getHtCore().find('tr:first td:first').text()).toBe('A1');
    expect(getHtCore().find('tr:last td:first').text()).toBe('A15');
    expect(visualizePageSections()).toEqual([
      'Page size: [auto, 5, 10, [20], 50, 100]',
      '1 - 15 of 15',
      '|< < Page 1 of 1 > >|'
    ]);
  });

  it('should not be possible to set page size to 0 or lower', async() => {
    handsontable({
      data: createSpreadsheetData(15, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(0);

    expect(plugin.getPaginationData().pageSize).toBe(1);

    plugin.setPageSize(-3);

    expect(plugin.getPaginationData().pageSize).toBe(1);
  });
});
