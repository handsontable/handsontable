describe('Pagination `afterPageChange` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be fired after page change', async() => {
    const afterPageChange = jasmine.createSpy('afterPageChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPage(3);

    expect(afterPageChange).toHaveBeenCalledTimes(1);
    expect(afterPageChange).toHaveBeenCalledWith(1, 3);
  });

  it('should be fired after page change triggered by method aliases', async() => {
    const afterPageChange = jasmine.createSpy('afterPageChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageChange,
    });

    const plugin = getPlugin('pagination');

    plugin.nextPage();

    expect(afterPageChange).toHaveBeenCalledTimes(1);
    expect(afterPageChange).toHaveBeenCalledWith(1, 2);

    afterPageChange.calls.reset();
    plugin.prevPage();

    expect(afterPageChange).toHaveBeenCalledTimes(1);
    expect(afterPageChange).toHaveBeenCalledWith(2, 1);

    afterPageChange.calls.reset();
    plugin.lastPage();

    expect(afterPageChange).toHaveBeenCalledTimes(1);
    expect(afterPageChange).toHaveBeenCalledWith(1, 5);

    afterPageChange.calls.reset();
    plugin.firstPage();

    expect(afterPageChange).toHaveBeenCalledTimes(1);
    expect(afterPageChange).toHaveBeenCalledWith(5, 1);
  });

  it('should be fired after the `beforePageChange` hook', async() => {
    const afterPageChange = jasmine.createSpy('afterPageChange');
    const beforePageChange = jasmine.createSpy('beforePageChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageChange,
      afterPageChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPage(3);

    expect(beforePageChange).toHaveBeenCalledBefore(afterPageChange);
  });

  it('should not be fired when the action was cancelled', async() => {
    const afterPageChange = jasmine.createSpy('afterPageChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageChange() {
        return false;
      },
      afterPageChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPage(3);

    expect(afterPageChange).not.toHaveBeenCalled();
  });
});
