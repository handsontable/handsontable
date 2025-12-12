describe('Dialog - isVisible method', () => {
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

  it('should return false when dialog is not shown', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    expect(dialogPlugin.isVisible()).toBe(false);
    expect(getDialogContainerElement()).not.toBeVisible();
  });

  it('should return true when dialog is shown', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toBeVisible();
  });

  it('should return false when dialog is hidden', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toBeVisible();

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
    expect(getDialogContainerElement()).not.toBeVisible();
  });

  it('should return false when plugin is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: false,
    });

    const dialogPlugin = getPlugin('dialog');

    expect(dialogPlugin.isVisible()).toBe(false);
    expect(getDialogContainerElement()).toBe(null);
  });
});
