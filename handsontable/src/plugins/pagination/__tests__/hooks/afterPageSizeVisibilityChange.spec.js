describe('Pagination `afterPageSizeVisibilityChange` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be fired after showing the component', async() => {
    const afterPageSizeVisibilityChange = jasmine.createSpy('afterPageSizeVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageSizeVisibilityChange,
    });

    const plugin = getPlugin('pagination');

    plugin.showPageSizeSection();

    expect(afterPageSizeVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageSizeVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('should be fired after hiding the component', async() => {
    const afterPageSizeVisibilityChange = jasmine.createSpy('afterPageSizeVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageSizeVisibilityChange,
    });

    const plugin = getPlugin('pagination');

    plugin.hidePageSizeSection();

    expect(afterPageSizeVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageSizeVisibilityChange).toHaveBeenCalledWith(false);
  });
});
