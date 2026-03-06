describe('Dialog - background option', () => {
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

  it('should have solid background by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-solid');
    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--background-semi-transparent');
  });

  it('should apply semi-transparent background when specified', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        background: 'semi-transparent',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-semi-transparent');
    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--background-solid');
  });

  it('should update background when using show method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        background: 'solid',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      background: 'semi-transparent',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-semi-transparent');
    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--background-solid');
  });

  it('should update background when using update method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        background: 'solid',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-solid');

    dialogPlugin.update({
      background: 'semi-transparent',
    });

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-semi-transparent');
    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--background-solid');
  });

  it('should preserve background when showing dialog without specifying background', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        background: 'semi-transparent',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-semi-transparent');

    dialogPlugin.hide();
    dialogPlugin.show();

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-semi-transparent');
  });

  it('should switch from solid to semi-transparent background', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        background: 'solid',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-solid');

    dialogPlugin.update({
      background: 'semi-transparent',
    });

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-semi-transparent');
    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--background-solid');
  });

  it('should maintain other dialog classes when changing background', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        background: 'solid',
        customClassName: 'custom-dialog',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-solid');
    expect(getDialogContainerElement()).toHaveClass('custom-dialog');

    dialogPlugin.update({
      background: 'semi-transparent',
    });

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-semi-transparent');
    expect(getDialogContainerElement()).toHaveClass('custom-dialog');
  });
});
