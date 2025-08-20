describe('Dialog - contentBackground option', () => {
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

  it('should not have content background by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(false);
  });

  it('should apply content background when set to true', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentBackground: true,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(true);
  });

  it('should not apply content background when set to false', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentBackground: false,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(false);
  });

  it('should update content background when using show method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentBackground: false,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      contentBackground: true,
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(true);
  });

  it('should update content background when using update method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentBackground: false,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(false);

    dialogPlugin.update({
      contentBackground: true,
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(true);
  });

  it('should maintain content background when changing other options', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentBackground: true,
        content: 'Initial content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(true);

    dialogPlugin.update({
      content: 'Updated content',
      background: 'semi-transparent',
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(true);
    expect($('.ht-dialog .ht-dialog__content').text()).toEqual('Updated content');
  });
});
