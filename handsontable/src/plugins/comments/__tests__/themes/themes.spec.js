describe('Comments theme handling', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
    }
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a config option)', () => {
    handsontable({
      data: createSpreadsheetData(4, 4),
      comments: true,
      cell: [
        { row: 1, col: 1, comment: { value: 'Test comment' } }
      ],
      themeName: 'ht-theme-sth',
    });

    selectCell(1, 1);

    const $editorElement = $(getPlugin('comments').getEditorInputElement());

    expect($editorElement.parent().parent().parent().hasClass('ht-theme-sth')).toBe(true);
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', () => {
    spec().$container.addClass('ht-theme-sth-else');

    handsontable({
      comments: true,
      cell: [
        { row: 1, col: 1, comment: { value: 'Test comment' } }
      ],
    }, true);

    selectCell(1, 1);

    const $editorElement = $(getPlugin('comments').getEditorInputElement());

    expect($editorElement.parent().parent().parent().hasClass('ht-theme-sth-else')).toBe(true);
  });
});
