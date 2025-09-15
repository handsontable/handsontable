describe('Pagination `afterPageCounterVisibilityChange` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be fired after showing the component using `updateSettings`', async() => {
    const afterPageCounterVisibilityChange = jasmine.createSpy('afterPageCounterVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageCounterVisibilityChange,
    });

    await updateSettings({
      pagination: {
        showCounter: true,
      },
    });

    expect(afterPageCounterVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageCounterVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('should be fired after showing the component using the plugins method', async() => {
    const afterPageCounterVisibilityChange = jasmine.createSpy('afterPageCounterVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageCounterVisibilityChange,
    });

    const plugin = getPlugin('pagination');

    plugin.showPageCounterSection();

    expect(afterPageCounterVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageCounterVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('should be fired after hiding the component using `updateSettings`', async() => {
    const afterPageCounterVisibilityChange = jasmine.createSpy('afterPageCounterVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageCounterVisibilityChange,
    });

    await updateSettings({
      pagination: {
        showCounter: false,
      },
    });

    expect(afterPageCounterVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageCounterVisibilityChange).toHaveBeenCalledWith(false);
  });

  it('should be fired after hiding the component using the plugins method', async() => {
    const afterPageCounterVisibilityChange = jasmine.createSpy('afterPageCounterVisibilityChange');

    handsontable({
      data: createSpreadsheetData(45, 10),
      pagination: true,
      afterPageCounterVisibilityChange,
    });

    const plugin = getPlugin('pagination');

    plugin.hidePageCounterSection();

    expect(afterPageCounterVisibilityChange).toHaveBeenCalledTimes(1);
    expect(afterPageCounterVisibilityChange).toHaveBeenCalledWith(false);
  });
});
