describe('Comments theme handling', () => {
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

  it('should have the same theme as the parent Handsontable instance (if originally passed as a config option)', () => {
    simulateModernThemeStylesheet(spec().$container);
    handsontable({
      data: createSpreadsheetData(4, 4),
      comments: true,
      cell: [
        { row: 1, col: 1, comment: { value: 'Test comment' } }
      ],
      themeName: 'ht-theme-sth',
    });

    selectCell(1, 1);
    const $editorElement = $(getPlugin('comments').getEditorInputElement().parentElement);

    expect($editorElement.hasClass('ht-theme-sth')).toBe(true);
  });

  it('should have the same theme as the parent Handsontable instance (if originally passed as a container class)', () => {
    simulateModernThemeStylesheet(spec().$container);
    spec().$container.addClass('ht-theme-sth-else');
    handsontable({
      comments: true,
      cell: [
        { row: 1, col: 1, comment: { value: 'Test comment' } }
      ],
    }, true);

    selectCell(1, 1);
    const $editorElement = $(getPlugin('comments').getEditorInputElement().parentElement);

    expect($editorElement.hasClass('ht-theme-sth-else')).toBe(true);
  });
});
