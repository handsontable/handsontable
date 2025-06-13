describe('Pagination `beforePageSizeChange` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be fired before page size change (as a number)', async() => {
    const beforePageSizeChange = jasmine.createSpy('beforePageSizeChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageSizeChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(13);

    expect(beforePageSizeChange).toHaveBeenCalledTimes(1);
    expect(beforePageSizeChange).toHaveBeenCalledWith(10, 13);
  });

  it('should be fired before page size change (as `auto`)', async() => {
    const beforePageSizeChange = jasmine.createSpy('beforePageSizeChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageSizeChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize('auto');

    expect(beforePageSizeChange).toHaveBeenCalledTimes(1);
    expect(beforePageSizeChange).toHaveBeenCalledWith(10, 'auto');
  });

  it('should be possible to abort the action', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageSizeChange() {
        return false;
      },
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(13);

    expect(plugin.getPaginationData().pageSize).toBe(10);
  });
});
