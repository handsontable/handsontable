describe('Date editor theme handling', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
    }
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a config option)', async() => {
    handsontable({
      columns: [{ type: 'date' }],
      themeName: 'ht-theme-sth',
    });

    selectCell(0, 0);
    keyDownUp('enter');

    await sleep(50);

    const $editor = $(getActiveEditor().datePicker);

    expect($editor.parent().hasClass('ht-theme-sth')).toBe(true);
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', async() => {
    spec().$container.addClass('ht-theme-sth-else');

    handsontable({
      columns: [{ type: 'date' }],
    }, true);

    selectCell(0, 0);
    keyDownUp('enter');

    await sleep(50);

    const $editor = $(getActiveEditor().datePicker);

    expect($editor.parent().hasClass('ht-theme-sth-else')).toBe(true);
  });
});
