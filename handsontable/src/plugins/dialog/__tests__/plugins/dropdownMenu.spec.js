describe('Dialog - dropdown menu integration', () => {
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

  it('should open dropdown menu when dialog is hidden', async() => {
    const hot = handsontable({
      colHeaders: true,
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
      dropdownMenu: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);

    dialogPlugin.hide();

    expect(dialogPlugin.isVisible()).toBe(false);

    await dropdownMenu();

    expect($('.htDropdownMenu').is(':visible')).toBe(true);
  });

  it('should close dropdown menu when dialog is shown', async() => {
    const hot = handsontable({
      colHeaders: true,
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
      dropdownMenu: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    await dropdownMenu();

    expect($('.htDropdownMenu').is(':visible')).toBe(true);

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);
    expect($('.htDropdownMenu').is(':visible')).toBe(false);
  });

  it('should not open dropdown menu on dialog element', async() => {
    const hot = handsontable({
      colHeaders: true,
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
        content: 'Test dialog content',
      },
      dropdownMenu: true,
    });

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show();

    expect(dialogPlugin.isVisible()).toBe(true);

    const dialogElement = $('.ht-dialog')[0];
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100
    });

    dialogElement.dispatchEvent(clickEvent);

    expect($('.htDropdownMenu').is(':visible')).toBe(false);
  });

  it('should allow dropdown menu to open after dialog is closed via escape key', async() => {
    const hot = handsontable({
      colHeaders: true,
      data: [['A1', 'B1'], ['A2', 'B2']],
      dialog: {
        closable: true,
      },
      dropdownMenu: true,
    });

    await selectCell(0, 0);

    const dialogPlugin = hot.getPlugin('dialog');

    dialogPlugin.show({
      content: 'Test dialog content',
    });

    expect(dialogPlugin.isVisible()).toBe(true);

    await keyDownUp('escape');

    expect(dialogPlugin.isVisible()).toBe(false);

    await dropdownMenu();

    expect($('.htDropdownMenu').is(':visible')).toBe(true);
  });
});
