describe('EmptyDataState - isVisible method', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return false when emptyDataState is not shown', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(false);
  });

  it('should return true when emptyDataState is shown', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    await updateSettings({
      data: [],
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
  });

  it('should return false when emptyDataState plugin is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: false,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(false);
  });
});
