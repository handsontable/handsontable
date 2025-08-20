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
    expect($('.ht-dialog').hasClass('custom-dialog')).toBe(false);
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
    expect($('.ht-dialog').hasClass('my-custom-dialog')).toBe(true);
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
    expect($('.ht-dialog').hasClass('dialog-primary')).toBe(true);
    expect($('.ht-dialog').hasClass('dialog-large')).toBe(true);
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
    expect($('.ht-dialog').hasClass('initial-class')).toBe(false);
    expect($('.ht-dialog').hasClass('updated-class')).toBe(true);
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

    expect($('.ht-dialog').hasClass('initial-class')).toBe(true);

    dialogPlugin.update({
      customClassName: 'updated-class',
    });

    expect($('.ht-dialog').hasClass('initial-class')).toBe(false);
    expect($('.ht-dialog').hasClass('updated-class')).toBe(true);
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

    expect($('.ht-dialog').hasClass('initial-class')).toBe(true);

    dialogPlugin.update({
      customClassName: '',
    });

    expect($('.ht-dialog').hasClass('initial-class')).toBe(false);
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
    expect($('.ht-dialog').hasClass('dialog-with-dash')).toBe(true);
    expect($('.ht-dialog').hasClass('dialog_with_underscore')).toBe(true);
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
    expect($('.ht-dialog').hasClass('ht-dialog')).toBe(true);
    expect($('.ht-dialog').hasClass('custom-dialog')).toBe(true);
  });
});
