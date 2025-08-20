describe('Dialog - contentDirections option', () => {
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

  it('should have row direction by default', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(false);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row-reverse')).toBe(false);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column-reverse')).toBe(false);
  });

  it('should apply row direction when specified', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentDirections: 'row',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(true);
  });

  it('should apply column direction when specified', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentDirections: 'column',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(false);
  });

  it('should apply row-reverse direction when specified', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentDirections: 'row-reverse',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row-reverse')).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(false);
  });

  it('should apply column-reverse direction when specified', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentDirections: 'column-reverse',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column-reverse')).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(false);
  });

  it('should update content directions when using show method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentDirections: 'row',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      contentDirections: 'column',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(false);
  });

  it('should update content directions when using update method', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentDirections: 'row',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(true);

    dialogPlugin.update({
      contentDirections: 'column',
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(true);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(false);
  });

  it('should switch between all direction options', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentDirections: 'row',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(true);

    dialogPlugin.update({
      contentDirections: 'column',
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(true);

    dialogPlugin.update({
      contentDirections: 'row-reverse',
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row-reverse')).toBe(true);

    dialogPlugin.update({
      contentDirections: 'column-reverse',
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column-reverse')).toBe(true);
  });

  it('should maintain content directions when changing other options', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        contentDirections: 'column',
        content: 'Initial content',
      },
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(true);

    dialogPlugin.update({
      content: 'Updated content',
      background: 'semi-transparent',
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(true);
    expect($('.ht-dialog .ht-dialog__content').text()).toEqual('Updated content');
  });
});
