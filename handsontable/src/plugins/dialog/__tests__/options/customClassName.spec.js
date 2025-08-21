describe('Dialog - customClassName option', () => {
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

  it('should not have custom class by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).not.toHaveClass('custom-dialog');
  });

  it('should apply custom class name when specified', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        customClassName: 'my-custom-dialog',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('my-custom-dialog');
  });

  it('should apply multiple custom class names', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        customClassName: 'dialog-primary dialog-large',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('dialog-primary');
    expect(getDialogContainerElement()).toHaveClass('dialog-large');
  });

  it('should update custom class name when using show method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        customClassName: 'initial-class',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      customClassName: 'updated-class',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).not.toHaveClass('initial-class');
    expect(getDialogContainerElement()).toHaveClass('updated-class');
  });

  it('should update custom class name when using update method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        customClassName: 'initial-class',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement()).toHaveClass('initial-class');

    dialogPlugin.update({
      customClassName: 'updated-class',
    });

    expect(getDialogContainerElement()).not.toHaveClass('initial-class');
    expect(getDialogContainerElement()).toHaveClass('updated-class');
  });

  it('should remove custom class when updating to empty string', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        customClassName: 'initial-class',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getDialogContainerElement()).toHaveClass('initial-class');

    dialogPlugin.update({
      customClassName: '',
    });

    expect(getDialogContainerElement()).not.toHaveClass('initial-class');
  });

  it('should handle special characters in class names', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        customClassName: 'dialog-with-dash dialog_with_underscore',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('dialog-with-dash');
    expect(getDialogContainerElement()).toHaveClass('dialog_with_underscore');
  });

  it('should maintain base dialog classes when custom class is applied', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        customClassName: 'custom-dialog',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toHaveClass('ht-dialog');
    expect(getDialogContainerElement()).toHaveClass('custom-dialog');
  });
});
