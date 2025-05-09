describe('Date editor theme handling', () => {
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

  it('should have the same theme as the parent Handsontable instance (if originally passed as a config option)', async() => {
    simulateModernThemeStylesheet(spec().$container);
    handsontable({
      columns: [{ type: 'date' }],
      themeName: 'ht-theme-sth',
    });

    await selectCell(0, 0);
    await keyDownUp('enter');

    const $editor = $(getActiveEditor().datePicker);

    expect($editor.parent().hasClass('ht-theme-sth')).toBe(true);
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', async() => {
    simulateModernThemeStylesheet(spec().$container);
    spec().$container.addClass('ht-theme-sth-else');
    handsontable({
      columns: [{ type: 'date' }],
    }, true);

    await selectCell(0, 0);
    await keyDownUp('enter');

    const $editor = $(getActiveEditor().datePicker);

    expect($editor.parent().hasClass('ht-theme-sth-else')).toBe(true);
  });
});
