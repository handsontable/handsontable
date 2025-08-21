describe('Dialog - show method', () => {
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

  it('should show dialog with default configuration', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement()).toBeDefined();
    expect(dialogPlugin.getSetting()).toEqual({
      content: '',
      customClassName: '',
      background: 'solid',
      contentBackground: false,
      contentDirections: 'row',
      animation: true,
      closable: false,
    });
  });

  it('should show dialog with custom content', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Custom dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual('Custom dialog content');
  });

  it('should show dialog with HTML content', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: '<h2>Title</h2><p>Paragraph</p>',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual('<h2>Title</h2><p>Paragraph</p>');
  });

  it('should not show dialog when plugin is disabled', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: false,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(dialogPlugin.isVisible()).toBe(false);
    expect(getDialogContainerElement()).toBe(null);
  });

  it('should update dialog configuration when show method is called with new options', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Initial content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual('Initial content');

    dialogPlugin.show({
      content: 'New content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContentHTML()).toEqual('New content');
  });

  it('should run beforeDialogShow and afterDialogShow hooks', async() => {
    const beforeDialogShowSpy = jasmine.createSpy('beforeDialogShow');
    const afterDialogShowSpy = jasmine.createSpy('afterDialogShow');

    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      beforeDialogShow: beforeDialogShowSpy,
      afterDialogShow: afterDialogShowSpy,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test content',
    });

    expect(beforeDialogShowSpy).toHaveBeenCalled();
    expect(afterDialogShowSpy).toHaveBeenCalled();
  });

  it('should update the width of the dialog container to the same size as the table', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      width: 300,
      height: 300,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement().offsetWidth).toBe(tableView().getWorkspaceWidth());
  });

  it('should update the height of the dialog container to the same size as the table', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
      width: 300,
      height: 300,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);
    expect(getDialogContainerElement().offsetHeight).toBe(tableView().getWorkspaceHeight());
  });

  it('should deselect all cells when dialog is shown', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: true,
    });

    await selectCell(0, 0);

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(getSelected()).toEqual(undefined);
  });
});
