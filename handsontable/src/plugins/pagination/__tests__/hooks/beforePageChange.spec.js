describe('Pagination `beforePageChange` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be fired before page change', async() => {
    const beforePageChange = jasmine.createSpy('beforePageChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageChange,
    });

    const plugin = getPlugin('pagination');

    plugin.setPage(3);

    expect(beforePageChange).toHaveBeenCalledTimes(1);
    expect(beforePageChange).toHaveBeenCalledWith(1, 3);
  });

  it('should be fired before page change triggered by method aliases', async() => {
    const beforePageChange = jasmine.createSpy('beforePageChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageChange,
    });

    const plugin = getPlugin('pagination');

    plugin.nextPage();

    expect(beforePageChange).toHaveBeenCalledTimes(1);
    expect(beforePageChange).toHaveBeenCalledWith(1, 2);

    beforePageChange.calls.reset();
    plugin.prevPage();

    expect(beforePageChange).toHaveBeenCalledTimes(1);
    expect(beforePageChange).toHaveBeenCalledWith(2, 1);

    beforePageChange.calls.reset();
    plugin.lastPage();

    expect(beforePageChange).toHaveBeenCalledTimes(1);
    expect(beforePageChange).toHaveBeenCalledWith(1, 5);

    beforePageChange.calls.reset();
    plugin.firstPage();

    expect(beforePageChange).toHaveBeenCalledTimes(1);
    expect(beforePageChange).toHaveBeenCalledWith(5, 1);
  });

  it('should be possible to abort the action', async() => {
    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      beforePageChange() {
        return false;
      },
    });

    const plugin = getPlugin('pagination');

    plugin.setPage(3);

    expect(plugin.getPaginationData().currentPage).toBe(1);
  });
});
