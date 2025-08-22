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
    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-row');
    expect(getDialogContentContainerElement()).not.toHaveClass('ht-dialog__content--flex-column');
    expect(getDialogContentContainerElement()).not.toHaveClass('ht-dialog__content--flex-row-reverse');
    expect(getDialogContentContainerElement()).not.toHaveClass('ht-dialog__content--flex-column-reverse');
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
    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-row');
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
    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-column');
    expect(getDialogContentContainerElement()).not.toHaveClass('ht-dialog__content--flex-row');
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
    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-row-reverse');
    expect(getDialogContentContainerElement()).not.toHaveClass('ht-dialog__content--flex-row');
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
    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-column-reverse');
    expect(getDialogContentContainerElement()).not.toHaveClass('ht-dialog__content--flex-column');
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
    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-column');
    expect(getDialogContentContainerElement()).not.toHaveClass('ht-dialog__content--flex-row');
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

    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-row');

    dialogPlugin.update({
      contentDirections: 'column',
    });

    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-column');
    expect(getDialogContentContainerElement()).not.toHaveClass('ht-dialog__content--flex-row');
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

    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-row');

    dialogPlugin.update({
      contentDirections: 'column',
    });

    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-column');

    dialogPlugin.update({
      contentDirections: 'row-reverse',
    });

    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-row-reverse');

    dialogPlugin.update({
      contentDirections: 'column-reverse',
    });

    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-column-reverse');
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

    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-column');

    dialogPlugin.update({
      content: 'Updated content',
      background: 'semi-transparent',
    });

    expect(getDialogContentContainerElement()).toHaveClass('ht-dialog__content--flex-column');
    expect(getDialogContentHTML()).toEqual('Updated content');
  });
});
