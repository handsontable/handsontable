describe('EmptyDataState', () => {
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

  it('should be disabled by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isEnabled()).toBe(false);
  });

  it('should be enabled when emptyDataState option is set to true', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isEnabled()).toBe(true);
  });

  it('should be enabled when emptyDataState option is set to object', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: {
        message: 'Test empty data state',
      },
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isEnabled()).toBe(true);
  });

  it('should destroy emptyDataState elements when plugin is destroyed', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    expect(getEmptyDataStateContainerElement()).toBeDefined();

    destroy();

    expect($('.ht-empty-data-state').length).toBe(0);
  });

  it('should update emptyDataState via updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    await updateSettings({
      emptyDataState: false,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isEnabled()).toBe(false);

    await updateSettings({
      emptyDataState: true,
    });

    expect(emptyDataStatePlugin.isEnabled()).toBe(true);
  });

  it('should show emptyDataState when data is updated to empty via updateSettings', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(false);

    // Add data
    hot().updateSettings({
      data: [],
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(true);
    expect(getEmptyDataStateContainerElement()).toBeDefined();
  });

  it('should hide emptyDataState when data is updated to non-empty via updateSettings', async() => {
    handsontable({
      data: [],
      emptyDataState: true,
    });

    const emptyDataStatePlugin = getPlugin('emptyDataState');

    expect(emptyDataStatePlugin.isVisible()).toBe(true);

    // Add data
    hot().updateSettings({
      data: createSpreadsheetData(2, 2),
    });

    expect(emptyDataStatePlugin.isVisible()).toBe(false);
    expect(getEmptyDataStateContainerElement().style.display).toBe('none');
  });
});
