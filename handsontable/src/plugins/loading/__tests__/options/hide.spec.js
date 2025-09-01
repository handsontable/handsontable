describe('Loading - hide method', () => {
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

  it('should hide the loading dialog when dialog is visible', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      loading: true,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.show();

    loadingPlugin.hide();

    expect(loadingPlugin.isVisible()).toBe(false);
  });

  it('should not hide the loading dialog when dialog is not visible', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      loading: false,
    });

    const loadingPlugin = getPlugin('loading');

    loadingPlugin.hide();

    expect(loadingPlugin.isVisible()).toBe(false);
  });
});
