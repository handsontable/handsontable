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

  it('should not open context menu when dialog is visible', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
      contextMenu: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.ht-dialog').is(':visible')).toBe(true);

    // Try to open context menu while dialog is visible
    await contextMenu();

    expect($('.htContextMenu').is(':visible')).toBe(false);
  });

  it('should open context menu when dialog is hidden', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
      contextMenu: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);

    // Hide the dialog
    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);

    // Now try to open context menu
    await contextMenu();

    expect($('.htContextMenu').is(':visible')).toBe(true);
  });

  it('should close context menu when dialog is shown', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
      contextMenu: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    // Open context menu first
    await contextMenu();

    expect($('.htContextMenu').is(':visible')).toBe(true);

    // Show dialog while context menu is open
    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.htContextMenu').is(':visible')).toBe(false);
  });

  it('should not open context menu on dialog element', async() => {
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
        content: 'Test dialog content',
      },
      contextMenu: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    // Try to open context menu on the dialog element
    const dialogElement = $('.ht-dialog')[0];
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
    const hot = handsontable({
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
      contextMenu: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);

    // Close dialog with escape key
    await keyDownUp('escape');

    expect(dialogPlugin.isVisible()).toBe(false);

    // Now try to open context menu
    await contextMenu();

    expect($('.htContextMenu').is(':visible')).toBe(true);
  });
});
