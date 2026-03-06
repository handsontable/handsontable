describe('Pagination `afterPageSizeChange` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be fired after page size change (as a number)', async() => {
    const afterPageSizeChange = jasmine.createSpy('afterPageSizeChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageSizeChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(13);

    expect(afterPageSizeChange).toHaveBeenCalledTimes(1);
    expect(afterPageSizeChange).toHaveBeenCalledWith(10, 13);
  });

  it('should be fired after page size change (as `auto`)', async() => {
    const afterPageSizeChange = jasmine.createSpy('afterPageSizeChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageSizeChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize('auto');

    expect(afterPageSizeChange).toHaveBeenCalledTimes(1);
    expect(afterPageSizeChange).toHaveBeenCalledWith(10, 'auto');
  });

  it('should be fired after the `beforePageSizeChange` hook', async() => {
    const afterPageSizeChange = jasmine.createSpy('afterPageSizeChange');
    const beforePageSizeChange = jasmine.createSpy('beforePageSizeChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageSizeChange,
      afterPageSizeChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(13);

    expect(beforePageSizeChange).toHaveBeenCalledBefore(afterPageSizeChange);
  });

  it('should not be fired when the action was cancelled', async() => {
    const afterPageSizeChange = jasmine.createSpy('afterPageSizeChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageSizeChange() {
        return false;
      },
      afterPageSizeChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPageSize(13);

    expect(afterPageSizeChange).not.toHaveBeenCalled();
  });
});
