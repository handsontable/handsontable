describe('Comments theme handling', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a config option)', async() => {
    simulateModernThemeStylesheet(spec().$container);
    handsontable({
      data: createSpreadsheetData(4, 4),
      comments: true,
      cell: [
        { row: 1, col: 1, comment: { value: 'Test comment' } }
      ],
      themeName: 'ht-theme-sth',
    });

    await selectCell(1, 1);
    const $editorElement = $(getPlugin('comments').getEditorInputElement().parentElement);

    expect($editorElement.parent().parent().hasClass('ht-theme-sth')).toBe(true);
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', async() => {
    simulateModernThemeStylesheet(spec().$container);
    spec().$container.addClass('ht-theme-sth-else');
    handsontable({
      comments: true,
      cell: [
        { row: 1, col: 1, comment: { value: 'Test comment' } }
      ],
    }, true);

    await selectCell(1, 1);
    const $editorElement = $(getPlugin('comments').getEditorInputElement().parentElement);

    expect($editorElement.parent().parent().hasClass('ht-theme-sth-else')).toBe(true);
  });
});
