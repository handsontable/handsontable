describe('Dialog - update method', () => {
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

  it('should update dialog content', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Initial content',
    });

    expect($('.ht-dialog .ht-dialog__content').text()).toEqual('Initial content');

    dialogPlugin.update({
      content: 'Updated content',
    });

    expect($('.ht-dialog .ht-dialog__content').text()).toEqual('Updated content');
  });

  it('should update dialog custom class name', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
      customClassName: 'initial-class',
    });

    expect($('.ht-dialog').hasClass('initial-class')).toBe(true);

    dialogPlugin.update({
      customClassName: 'updated-class',
    });

    expect($('.ht-dialog').hasClass('initial-class')).toBe(false);
    expect($('.ht-dialog').hasClass('updated-class')).toBe(true);
  });

  it('should update dialog background', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
      background: 'solid',
    });

    expect($('.ht-dialog').hasClass('ht-dialog--background-solid')).toBe(true);

    dialogPlugin.update({
      background: 'semi-transparent',
    });

    expect($('.ht-dialog').hasClass('ht-dialog--background-solid')).toBe(false);
    expect($('.ht-dialog').hasClass('ht-dialog--background-semi-transparent')).toBe(true);
  });

  it('should update dialog content directions', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
      contentDirections: 'row',
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(true);

    dialogPlugin.update({
      contentDirections: 'column',
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-row')).toBe(false);
    expect($('.ht-dialog__content').hasClass('ht-dialog__content--flex-column')).toBe(true);
  });

  it('should update dialog content background', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
      contentBackground: false,
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(false);

    dialogPlugin.update({
      contentBackground: true,
    });

    expect($('.ht-dialog__content').hasClass('ht-dialog__content--background')).toBe(true);
  });

  it('should update dialog animation', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
      animation: true,
    });

    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(true);

    dialogPlugin.update({
      animation: false,
    });

    expect($('.ht-dialog').hasClass('ht-dialog--animation')).toBe(false);
  });

  it('should not update dialog when plugin is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: false,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.update({
      content: 'Updated content',
    });

    expect(dialogPlugin.isVisible()).toBe(false);
  });

  it('should maintain visibility when updating dialog', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.update({
      content: 'Updated content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog').hasClass('ht-dialog--show')).toBe(true);
  });
});
