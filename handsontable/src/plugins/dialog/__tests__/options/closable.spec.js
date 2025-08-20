describe('Dialog - closable option', () => {
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

  it('should not be closable by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should be closable when set to true', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should update closable when using show method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: false,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      closable: true,
    });

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should update closable when using update method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: false,
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);

    dialogPlugin.update({
      closable: true,
    });

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should maintain closable when changing other options', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
        content: 'Initial content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.update({
      content: 'Updated content',
      background: 'semi-transparent',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog .ht-dialog__content').text()).toEqual('Updated content');

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);
  });
});
