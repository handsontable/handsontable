describe('Dialog - context menu integration', () => {
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

  it('should open context menu when dialog is hidden', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
      contextMenu: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);

    await contextMenu();

    expect($('.htContextMenu').is(':visible')).toBe(true);
  });

  it('should close context menu when dialog is shown', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
      contextMenu: true,
    });

    const dialogPlugin = getPlugin('dialog');

    await contextMenu();

    expect($('.htContextMenu').is(':visible')).toBe(true);

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.htContextMenu').is(':visible')).toBe(false);
  });

  it('should not open context menu on dialog element', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
        content: 'Test dialog content',
      },
      contextMenu: true,
    });

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    const dialogElement = getDialogContainerElement();
    const contextmenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100
    });

    dialogElement.dispatchEvent(contextmenuEvent);

    expect($('.htContextMenu').is(':visible')).toBe(false);
  });

  it('should allow context menu to open after dialog is closed via escape key', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      dialog: {
        closable: true,
      },
      contextMenu: true,
    });

    await selectCell(0, 0);

    const dialogPlugin = getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);

    await keyDownUp('escape');

    expect(dialogPlugin.isVisible()).toBe(false);

    await contextMenu();

    expect($('.htContextMenu').is(':visible')).toBe(true);
  });
});
