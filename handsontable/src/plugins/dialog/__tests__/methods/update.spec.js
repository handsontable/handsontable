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

    expect(getDialogContentHTML()).toEqual('Initial content');

    dialogPlugin.update({
      content: 'Updated content',
    });

    expect(getDialogContentHTML()).toEqual('Updated content');
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

    expect(getDialogContainerElement()).toHaveClass('initial-class');

    dialogPlugin.update({
      customClassName: 'updated-class',
    });

    expect(getDialogContainerElement()).not.toHaveClass('initial-class');
    expect(getDialogContainerElement()).toHaveClass('updated-class');
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

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-solid');

    dialogPlugin.update({
      background: 'semi-transparent',
    });

    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--background-solid');
    expect(getDialogContainerElement()).toHaveClass('ht-dialog--background-semi-transparent');
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

    expect(getDialogContentContainerElement()).not.toHaveClass('ht-dialog__content--background');

    dialogPlugin.update({
      contentBackground: true,
    });

    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--background');
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

    expect(getDialogContainerElement()).toHaveClass('ht-dialog--animation');

    dialogPlugin.update({
      animation: false,
    });

    expect(getDialogContainerElement()).not.toHaveClass('ht-dialog--animation');
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
    expect(getDialogContainerElement()).toHaveClass('ht-dialog--show');
  });
});
